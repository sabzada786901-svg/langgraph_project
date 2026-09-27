"""
Terminal entry point.

Run with:  python main.py

Commands available at the "You:" prompt:
    exit | quit   -> close the application
    /new          -> start a brand-new conversation (fresh thread_id)
    /history      -> print the current conversation's message history
"""

import sys
import uuid

from langchain_core.messages import HumanMessage
from langgraph.types import Command

from agent.graph import build_graph
from utils import config


def print_banner(provider: str, thread_id: str) -> None:
    print("=" * 40)
    print("             AI AGENT")
    print("=" * 40)
    print(f"Provider:  {provider.capitalize()}")
    print(f"Thread ID: {thread_id}")
    print()
    print("Type 'exit' or 'quit' to leave.")
    print("Type '/new' to start a new conversation.")
    print("Type '/history' to inspect the current conversation state.")
    print()


def handle_interrupts(graph, result: dict, thread_config: dict) -> dict:
    """If the graph paused on a human-in-the-loop interrupt, prompt the
    user in the terminal and resume the graph with their decision. Loops in
    case of multiple sequential interrupts."""
    while isinstance(result, dict) and result.get("__interrupt__"):
        interrupt_obj = result["__interrupt__"][0]
        payload = interrupt_obj.value

        print("\n[Human approval needed]")
        print(payload.get("message", "The agent needs your approval."))
        for call in payload.get("pending_tool_calls", []):
            print(f"  - {call['name']}({call['args']})")

        answer = input("Approve this action? (yes/no): ").strip().lower()
        approved = answer in ("y", "yes")

        result = graph.invoke(Command(resume={"approved": approved}), config=thread_config)

    return result


def print_history(graph, thread_config: dict) -> None:
    state = graph.get_state(thread_config)
    messages = state.values.get("messages", [])
    if not messages:
        print("(no messages yet)\n")
        return
    for message in messages:
        role = message.__class__.__name__.replace("Message", "")
        content = message.content if message.content else "(tool call / empty)"
        print(f"  [{role}] {content}")
    print()


def main() -> None:
    try:
        graph = build_graph()
    except ValueError as exc:
        print(f"Configuration error: {exc}")
        sys.exit(1)

    thread_id = str(uuid.uuid4())
    thread_config = {"configurable": {"thread_id": thread_id}}

    print_banner(config.LLM_PROVIDER, thread_id)

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in ("exit", "quit"):
            print("Goodbye!")
            break

        if user_input == "/new":
            thread_id = str(uuid.uuid4())
            thread_config = {"configurable": {"thread_id": thread_id}}
            print(f"\n[Started a new conversation. Thread ID: {thread_id}]\n")
            continue

        if user_input == "/history":
            print_history(graph, thread_config)
            continue

        try:
            result = graph.invoke(
                {"messages": [HumanMessage(content=user_input)]},
                config=thread_config,
            )
            result = handle_interrupts(graph, result, thread_config)
            reply = result["messages"][-1].content
            print(f"Agent: {reply}\n")
        except Exception as exc:  # top-level safety net: never crash the CLI
            print(f"[Error] Something went wrong while processing that: {exc}\n")


if __name__ == "__main__":
    main()
