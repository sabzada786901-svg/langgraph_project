"""
Conversation memory (checkpointing).

LangGraph persists graph state via a "checkpointer", keyed by a thread_id.
The same thread_id continues a conversation; a new thread_id starts a fresh
one. This project uses an in-memory checkpointer, which is perfect for
learning and local development but is NOT persisted across process
restarts.

To make conversations survive a restart, swap MemorySaver for a durable
checkpointer, e.g.:

    from langgraph.checkpoint.sqlite import SqliteSaver
    with SqliteSaver.from_conn_string("checkpoints.sqlite") as checkpointer:
        ...

No other code in this project needs to change to support that swap.
"""

from langgraph.checkpoint.memory import MemorySaver


def get_checkpointer() -> MemorySaver:
    """Return a fresh in-memory checkpointer used for conversation memory
    and for pausing/resuming the graph during human-in-the-loop steps."""
    return MemorySaver()
