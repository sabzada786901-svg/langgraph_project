"""
Builds the LangGraph agent graph.

    START
      |
      v
    agent  <---------------------------+
      |                                |
      | route_after_agent              |
      |--- end -----------------> END  |
      |--- tools ----------------------+---> tools ------+
      |--- human_approval --> human_approval              |
                                  |                        |
                                  | route_after_approval    |
                                  |--- tools --------------+
                                  |--- reject --> reject_action --+
                                                                    |
                                                          (back to agent)
"""

from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from agent.nodes import (
    human_approval,
    make_call_model_node,
    reject_action,
    route_after_agent,
    route_after_approval,
)
from agent.state import AgentState
from memory.checkpoint import get_checkpointer
from tools.calculator import calculator
from tools.file_reader import delete_local_file, read_local_file
from tools.knowledge_base import knowledge_base_search
from utils.model import get_chat_model

ALL_TOOLS = [calculator, knowledge_base_search, read_local_file, delete_local_file]


def build_graph():
    """Construct and compile the agent graph, ready to .invoke()/.stream()."""
    llm = get_chat_model()
    llm_with_tools = llm.bind_tools(ALL_TOOLS)

    call_model = make_call_model_node(llm_with_tools)
    tool_node = ToolNode(ALL_TOOLS)

    builder = StateGraph(AgentState)

    builder.add_node("agent", call_model)
    builder.add_node("tools", tool_node)
    builder.add_node("human_approval", human_approval)
    builder.add_node("reject_action", reject_action)

    builder.add_edge(START, "agent")

    builder.add_conditional_edges(
        "agent",
        route_after_agent,
        {"tools": "tools", "human_approval": "human_approval", "end": END},
    )
    builder.add_conditional_edges(
        "human_approval",
        route_after_approval,
        {"tools": "tools", "reject": "reject_action"},
    )

    builder.add_edge("tools", "agent")
    builder.add_edge("reject_action", "agent")

    checkpointer = get_checkpointer()
    return builder.compile(checkpointer=checkpointer)
