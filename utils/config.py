"""
Centralized configuration for the AI Agent project.

Everything that comes from environment variables (API keys, provider choice,
LangSmith settings, allowed-file directory, etc.) is loaded once here so the
rest of the codebase never touches os.getenv() directly.
"""

import os

from dotenv import load_dotenv

# Load variables from a .env file in the project root (if present).
load_dotenv()


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


# --------------------------------------------------------------------------
# LLM provider settings
# --------------------------------------------------------------------------
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").strip().lower()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini").strip()

# --------------------------------------------------------------------------
# LangSmith (optional tracing) settings
# --------------------------------------------------------------------------
LANGCHAIN_TRACING_V2 = _env_bool("LANGCHAIN_TRACING_V2", default=False)
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY", "").strip()
LANGCHAIN_PROJECT = os.getenv("LANGCHAIN_PROJECT", "my-agent").strip()

# Only actually enable tracing if BOTH the flag is on AND a key was provided.
# This keeps the app fully functional when LangSmith is not configured at all.
if LANGCHAIN_TRACING_V2 and LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
    os.environ["LANGCHAIN_PROJECT"] = LANGCHAIN_PROJECT
else:
    os.environ["LANGCHAIN_TRACING_V2"] = "false"

# --------------------------------------------------------------------------
# Filesystem sandbox for the file-reading / file-deleting tools
# --------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE_DIR = os.path.join(BASE_DIR, "data", "knowledge")

# The file tools are only ever allowed to touch files inside this directory.
ALLOWED_FILES_DIR = KNOWLEDGE_DIR
