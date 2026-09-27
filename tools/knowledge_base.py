"""
Knowledge-base search tool.

This is the tool the agent calls for "Agentic RAG": retrieval only happens
when the AGENT decides it is needed (by choosing to call this tool), not on
every single message. See agent/prompts.py for the guidance that tells the
model when it should reach for this tool.
"""

from langchain_core.tools import tool

from rag.retriever import search_knowledge_base


@tool
def knowledge_base_search(query: str) -> str:
    """Search the local knowledge base (data/knowledge/) for information
    relevant to the query.

    Only use this tool when the user is asking about the local knowledge
    base, internal notes, or company documents specifically -- not for
    general knowledge questions you can already answer directly.
    """
    query = (query or "").strip()
    if not query:
        return "Error: the search query was empty."

    results = search_knowledge_base(query, top_k=3)
    if not results:
        return "No relevant information was found in the local knowledge base."

    formatted = [f"[Source: {chunk.source}]\n{chunk.text}" for chunk in results]
    return "\n\n---\n\n".join(formatted)
