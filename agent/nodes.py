"""
Node and routing functions for the agent graph.

The ReAct loop is:

    START -> agent -> route_after_agent -> {end | tools | human_approval}
                                                          |
                                             route_after_approval -> {tools | reject_action}

    tools -> agent            (loop back so the agent can use the tool result)
    reject_action -> agent    (loop back so the agent can tell the user what happened)
"""

from typing import Any

from langchain_core.messages import SystemMessage, ToolMessage
from langgraph.graph import END
from langgraph.prebuilt import tools_condition
from langgraph.types import interrupt

from agent.prompts import SYSTEM_PROMPT

# Tool names that require a human to approve them before they actually run.
SENSITIVE_TOOLS = {"delete_local_file"}


def make_call_model_node(llm_with_tools):
    """Build the "agent" node: a closure over the tool-bound LLM.

    Kept as a factory function (instead of a bare module-level node) so that
    agent/graph.py stays in control of exactly which LLM and tools are used,
    while agent/nodes.py stays free of any provider-specific setup.
    """

    def call_model(state: dict) -> dict:
        messages = state["messages"]
        if not messages or not isinstance(messages[0], SystemMessage):
            messages = [SystemMessage(content=SYSTEM_PROMPT), *messages]

        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

    return call_model


def route_after_agent(state: dict) -> str:
    """Decide what happens right after the agent node runs.

    Uses LangGraph's built-in tools_condition to check whether the last
    AIMessage requested any tool calls at all, then adds one extra check on
    top: if any requested tool is sensitive, route to human approval first.
    """
    decision = tools_condition(state)
    if decision == END:
        return "end"

    last_message = state["messages"][-1]
    tool_calls = getattr(last_message, "tool_calls", None) or []

    if any(call["name"] in SENSITIVE_TOOLS for call in tool_calls):
        return "human_approval"
    return "tools"


def human_approval(state: dict) -> dict:
    """Pause the graph and ask a human to approve/reject the pending
    sensitive tool call(s).

    Calling interrupt() here halts execution and saves the graph state via
    the checkpointer. Execution resumes when the caller re-invokes the graph
    with Command(resume=<value>); at that point `interrupt()` returns
    <value> as if it had been a normal function call.
    """
    last_message = state["messages"][-1]
    tool_calls = last_message.tool_calls or []
    sensitive_calls = [call for call in tool_calls if call["name"] in SENSITIVE_TOOLS]

    decision: Any = interrupt(
        {
            "type": "approval_request",
            "message": "The agent wants to perform a sensitive action. Approve?",
            "pending_tool_calls": [
                {"name": call["name"], "args": call["args"]} for call in sensitive_calls
            ],
        }
    )

    if isinstance(decision, dict):
        approved = bool(decision.get("approved", False))
    else:
        approved = bool(decision)

    return {"approved": approved}


def route_after_approval(state: dict) -> str:
    """Send the flow to the real tool execution if approved, otherwise to
    the rejection handler."""
    return "tools" if state.get("approved") else "reject"


def reject_action(state: dict) -> dict:
    """Produce a ToolMessage for every pending tool call so the message
    history stays valid (every tool call must get a matching tool result),
    explaining that the action was rejected."""
    last_message = state["messages"][-1]
    tool_calls = last_message.tool_calls or []

    rejection_messages = [
        ToolMessage(
            content="This action was rejected by the user and was not executed.",
            tool_call_id=call["id"],
        )
        for call in tool_calls
    ]

    # Reset "approved" so it doesn't leak into a later, unrelated tool call.
    return {"messages": rejection_messages, "approved": None}
