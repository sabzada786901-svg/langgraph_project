"""
A deliberately lightweight local retriever.

This keeps the project dependency-free (no vector database or embeddings
service required) while still demonstrating real retrieval: documents in
data/knowledge/ are split into paragraphs, and paragraphs are ranked by
keyword overlap with the query.

Swap `_score` out for an embeddings-based similarity search later if you
want semantic (rather than keyword) retrieval -- the rest of the project
does not need to change.
"""

import os
import re
from dataclasses import dataclass

from utils.config import KNOWLEDGE_DIR

_WORD_RE = re.compile(r"[a-zA-Z0-9']+")


@dataclass
class Chunk:
    source: str
    text: str


def _tokenize(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text)}


def _load_chunks() -> list[Chunk]:
    chunks: list[Chunk] = []
    if not os.path.isdir(KNOWLEDGE_DIR):
        return chunks

    for filename in sorted(os.listdir(KNOWLEDGE_DIR)):
        if not filename.lower().endswith((".txt", ".md")):
            continue
        path = os.path.join(KNOWLEDGE_DIR, filename)
        try:
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()
        except (OSError, UnicodeDecodeError):
            continue

        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        for paragraph in paragraphs:
            chunks.append(Chunk(source=filename, text=paragraph))

    return chunks


def search_knowledge_base(query: str, top_k: int = 3) -> list[Chunk]:
    """Return the top_k knowledge-base chunks most relevant to `query`,
    ranked by simple keyword overlap. Returns an empty list if nothing
    matches (or if the knowledge directory has no documents)."""
    query_words = _tokenize(query)
    if not query_words:
        return []

    scored: list[tuple[int, Chunk]] = []
    for chunk in _load_chunks():
        overlap = len(query_words & _tokenize(chunk.text))
        if overlap > 0:
            scored.append((overlap, chunk))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]
