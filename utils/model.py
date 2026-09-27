"""
Centralized LLM factory.

Call get_chat_model() anywhere in the codebase to get a ready-to-use chat
model. The actual provider (Groq or OpenRouter) is controlled entirely by the
LLM_PROVIDER environment variable -- no code changes needed to switch.
"""

from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from utils import config


def get_chat_model():
    """Return a configured chat model based on the LLM_PROVIDER setting.

    Raises:
        ValueError: if the configured provider is unknown, or if the
            required API key for that provider is missing.
    """
    provider = config.LLM_PROVIDER

    if provider == "groq":
        if not config.GROQ_API_KEY:
            raise ValueError(
                "GROQ_API_KEY is not set. Add it to your .env file to use "
                "the Groq provider (LLM_PROVIDER=groq)."
            )
        return ChatGroq(
            model=config.GROQ_MODEL,
            api_key=config.GROQ_API_KEY,
            temperature=0,
        )

    if provider == "openrouter":
        if not config.OPENROUTER_API_KEY:
            raise ValueError(
                "OPENROUTER_API_KEY is not set. Add it to your .env file to "
                "use the OpenRouter provider (LLM_PROVIDER=openrouter)."
            )
        return ChatOpenAI(
            model=config.OPENROUTER_MODEL,
            api_key=config.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
            temperature=0,
            default_headers={
                # Optional, but recommended by OpenRouter for attribution.
                "HTTP-Referer": "https://github.com/your-username/your-project",
                "X-Title": "LangGraph AI Agent",
            },
        )

    raise ValueError(
        f"Unknown LLM_PROVIDER '{provider}'. Valid values are 'groq' or "
        "'openrouter'. Check your .env file."
    )
