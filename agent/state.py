"""
Graph state schema.

We extend LangGraph's built-in MessagesState (which already tracks the
conversation as a list of messages with the correct add_messages reducer)
with one extra, transient field used only for the human-in-the-loop step.
"""

from typing import Optional

from langgraph.graph import MessagesState


class AgentState(MessagesState):
    """Conversation state.

    Attributes:
        messages: inherited from MessagesState -- the running conversation.
        approved: set by the human_approval node after a human responds to
            an approval request. None most of the time; True/False only
            while a sensitive tool call is being decided on.
    """

    approved: Optional[bool]
