# LangGraph AI Agent

A complete, beginner-friendly, general-purpose AI agent built with **LangChain**
and **LangGraph**, supporting **Groq** and **OpenRouter** as interchangeable
LLM providers.

## Features

- ReAct-style agent loop (Reason → Act → Observe → Reason ...) built on `StateGraph`
- Dynamic tool selection -- the model decides if/when/which tools to call
- Multi-tool use in a single turn (e.g. read a file, then calculate something from it)
- **Agentic RAG**: the agent decides for itself whether a knowledge-base search is needed
- Built-in **conversation memory** via LangGraph checkpointing (`thread_id`-based)
- **Human-in-the-loop** approval gate before any sensitive/irreversible tool runs
- Optional **LangSmith** tracing (fully functional without it)
- Centralized model factory: switch between Groq and OpenRouter with one env var
- Safe-by-design tools: no `eval()`, sandboxed file access, no path traversal

## Architecture

```
                 START
                   |
                   v
     +------- >  agent  < -----------------+
     |             |                        |
     |     route_after_agent                |
     |    /        |          \             |
     |  end      tools     human_approval   |
     |   |         |             |          |
     |  END        +-------------+--tools---+
     |                            \
     |                      route_after_approval
     |                            \
     |                          reject --> reject_action --+
     +---------------------------------------------------- +
```

- **agent**: calls the LLM (bound to all tools) with the running message history.
- **route_after_agent**: uses LangGraph's `tools_condition` to see if any tool
  was requested; if a *sensitive* tool was requested, routes to
  `human_approval` first instead of running it immediately.
- **tools**: a `ToolNode` that actually executes whichever tool(s) the model asked for.
- **human_approval**: calls `interrupt()`, pausing the graph and asking a human
  to approve/reject the sensitive action; resumes via `Command(resume=...)`.
- **reject_action**: if rejected, synthesizes tool-rejection messages and lets
  the agent explain that to the user instead of running the tool.

## Folder structure

```
langgraph-ai-agent/
│
├── .env                  # your real API keys (gitignored)
├── .env.example           # placeholders, safe to commit
├── .gitignore
├── requirements.txt
├── README.md
├── main.py                 # terminal CLI entry point
│
├── agent/
│   ├── graph.py            # builds & compiles the StateGraph
│   ├── state.py            # AgentState (extends MessagesState)
│   ├── nodes.py            # node functions + routing logic
│   └── prompts.py          # system prompt / Agentic RAG guidance
│
├── tools/
│   ├── calculator.py        # safe AST-based calculator
│   ├── knowledge_base.py    # Agentic RAG search tool
│   └── file_reader.py       # sandboxed read + sensitive delete tools
│
├── memory/
│   └── checkpoint.py        # MemorySaver factory (conversation memory)
│
├── rag/
│   └── retriever.py         # lightweight local keyword retriever
│
├── utils/
│   ├── model.py             # get_chat_model() provider factory
│   └── config.py            # loads and exposes all env vars
│
└── data/
    └── knowledge/            # sample.txt, ai_agents_notes.txt
```

## Installation

Starting from an **empty folder**:

### Windows (PowerShell)

```powershell
mkdir langgraph-ai-agent
cd langgraph-ai-agent
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Linux / macOS

```bash
mkdir langgraph-ai-agent
cd langgraph-ai-agent
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

(Then copy every file from this project into that folder, preserving the
folder structure shown above -- or simply extract the provided project
archive directly into an empty folder.)

Create the data folder if it does not already exist:

```bash
mkdir -p data/knowledge
```

Run the application:

```bash
python main.py
```

## Environment setup / API keys

1. Copy `.env.example` to `.env` (already done for you in this project).
2. Open `.env` and fill in the keys you have:

```
LLM_PROVIDER=groq          # or: openrouter

GROQ_API_KEY=your-groq-key-here
OPENROUTER_API_KEY=your-openrouter-key-here
```

You only need the key for whichever provider `LLM_PROVIDER` is set to.
Switching providers never requires touching any Python file -- just change
`LLM_PROVIDER` in `.env`.

### LangSmith (optional)

LangSmith tracing is entirely optional. To enable it:

```
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=my-agent
```

If `LANGCHAIN_TRACING_V2` is left `false` (or the API key is missing),
tracing is simply disabled and the application runs normally.

## Running the agent

```bash
python main.py
```

You'll see:

```
========================================
             AI AGENT
========================================
Provider:  Groq
Thread ID: <a generated uuid>

Type 'exit' or 'quit' to leave.
Type '/new' to start a new conversation.
Type '/history' to inspect the current conversation state.

You:
```

Type your questions at the `You:` prompt. Special commands:

- `exit` / `quit` -- close the application
- `/new` -- start a brand-new conversation (fresh `thread_id`, empty memory)
- `/history` -- print every message in the current conversation's state

## Available tools

| Tool | Purpose | Sensitive? |
|---|---|---|
| `calculator` | Safe arithmetic (`+ - * / // % **`), no `eval()` | No |
| `knowledge_base_search` | Agentic RAG search over `data/knowledge/` | No |
| `read_local_file` | Read a file from the sandboxed `data/knowledge/` folder | No |
| `delete_local_file` | Permanently delete a file from `data/knowledge/` | **Yes** -- requires approval |

## Memory (how it works)

Every call to the graph is made with a `thread_id` inside its config:

```python
config = {"configurable": {"thread_id": "user-001"}}
graph.invoke({"messages": [...]}, config=config)
```

- Reusing the same `thread_id` continues that exact conversation -- the
  checkpointer (`MemorySaver`) restores the previous messages automatically.
- Using a new `thread_id` (the CLI's `/new` command) starts a completely
  separate, empty conversation.
- `/history` calls `graph.get_state(config)` to inspect everything currently
  stored for the active thread.

Note: `MemorySaver` is **in-memory only** -- conversations are lost when the
process exits. Swap it for `SqliteSaver`/`PostgresSaver` in
`memory/checkpoint.py` for persistence across restarts.

## Agentic RAG (how it works)

The system prompt (`agent/prompts.py`) explicitly tells the model to only
call `knowledge_base_search` when the question is clearly about the local
knowledge base / internal documents -- not for general questions it can
already answer. This means:

- `"What is LangGraph?"` → the model typically answers directly.
- `"What does our knowledge base say about AI agents?"` → the model calls
  `knowledge_base_search`, reads the result, and grounds its answer in it.

The retrieval itself (`rag/retriever.py`) splits every `.txt`/`.md` file in
`data/knowledge/` into paragraphs and ranks them by keyword overlap with the
query -- no external vector database is required for this project to work.

## Human-in-the-loop (how it works)

1. The model decides it wants to call `delete_local_file`.
2. `route_after_agent` sees that this tool is in `SENSITIVE_TOOLS` and routes
   to the `human_approval` node **instead of** running the tool.
3. `human_approval` calls `interrupt(...)`. LangGraph pauses the graph and
   saves its exact state via the checkpointer, returning the interrupt
   payload to the caller (`main.py`).
4. `main.py` prints the pending action and asks: `Approve this action? (yes/no)`.
5. Your answer is sent back in with `graph.invoke(Command(resume={"approved": ...}), config=...)`.
6. If approved, the graph proceeds to actually run the tool. If rejected, a
   rejection message is synthesized and the agent explains this to the user
   instead.

## Testing the agent

Try these once the app is running:

```
Normal:      What is LangGraph?
Calculator:  Calculate 125 * 8
RAG:         Search the local knowledge base for information about AI agents.
File read:   Read the sample knowledge file.
Memory:      My name is Ali.
             (then, in the same conversation) What is my name?
Multi-tool:  Read the sample knowledge file and tell me how many words are in it.
Approval:    Delete the sample knowledge file.
```

For the approval example, you should see the graph pause and ask you to
type `yes` or `no` before anything is actually deleted.

## Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| `Configuration error: GROQ_API_KEY is not set...` | Add your key to `.env`, or switch `LLM_PROVIDER` to a provider you *do* have a key for. |
| `Unknown LLM_PROVIDER '...'` | `LLM_PROVIDER` in `.env` must be exactly `groq` or `openrouter`. |
| Agent never uses a tool you expect | Rephrase your question to make the need for that tool explicit -- the model decides on its own whether a tool is required. |
| `Error: access denied...` from a file tool | You're trying to read/delete something outside `data/knowledge/`; this is enforced deliberately. |
| Nothing happens after `Delete the sample knowledge file` besides a prompt | That's expected -- answer `yes` or `no` at the `Approve this action?` prompt to continue. |
| Import errors after `pip install -r requirements.txt` | Make sure your virtual environment is activated, then re-run the install command for your OS above. |

## Why `.env` and `.gitignore`?

- `.env` holds your **real** API keys. It must never be committed to version
  control, which is exactly what `.gitignore` enforces by excluding it.
- `.env.example` documents which variables exist (with empty placeholders)
  so anyone cloning the project knows what to configure, without ever
  exposing a real secret.
