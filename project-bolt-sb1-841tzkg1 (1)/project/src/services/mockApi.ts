import type {
  ChatRequest,
  ChatResponse,
  Conversation,
  ToolEvent,
} from '@/types';

const STORAGE_KEY = 'friendly_ai_conversations';
const MESSAGES_KEY = 'friendly_ai_messages';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(list: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadMessages(threadId: string): import('@/types').ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${MESSAGES_KEY}_${threadId}`);
    return raw ? (JSON.parse(raw) as import('@/types').ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(threadId: string, msgs: import('@/types').ChatMessage[]) {
  localStorage.setItem(`${MESSAGES_KEY}_${threadId}`, JSON.stringify(msgs));
}

export async function createConversation(title = 'New Chat'): Promise<Conversation> {
  await delay(150);
  const conv: Conversation = {
    id: uid('conv'),
    thread_id: `thread-${uid('t')}`,
    title,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  const list = loadConversations();
  list.unshift(conv);
  saveConversations(list);
  return conv;
}

export async function getConversations(): Promise<Conversation[]> {
  await delay(100);
  return loadConversations().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export async function getConversation(id: string): Promise<Conversation | null> {
  await delay(80);
  return loadConversations().find((c) => c.id === id) ?? null;
}

export async function getMessages(threadId: string): Promise<import('@/types').ChatMessage[]> {
  await delay(80);
  return loadMessages(threadId);
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  await delay(100);
  const list = loadConversations();
  const conv = list.find((c) => c.id === id);
  if (!conv) throw new Error('Conversation not found');
  conv.title = title;
  conv.updated_at = nowISO();
  saveConversations(list);
  return conv;
}

export async function deleteConversation(id: string): Promise<void> {
  await delay(100);
  const list = loadConversations();
  const conv = list.find((c) => c.id === id);
  if (conv) {
    localStorage.removeItem(`${MESSAGES_KEY}_${conv.thread_id}`);
  }
  saveConversations(list.filter((c) => c.id !== id));
}

function generateMockReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('langgraph')) {
    return `## LangGraph

LangGraph is a framework built on top of LangChain for creating **stateful, multi-actor applications** with LLMs using graphs.

### Key concepts

- **State Graph**: Defines the flow as a graph of nodes and edges
- **Nodes**: Python functions that receive and update state
- **Edges**: Determine which node to execute next
- **Checkpointing**: Persist state via \`MemorySaver\` for conversation memory
- **Human-in-the-loop**: Pause execution and wait for user approval

\`\`\`python
from langgraph.graph import StateGraph, END

graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tools", call_tools)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {
    "continue": "tools",
    "end": END,
})
app = graph.compile(checkpointer=MemorySaver())
\`\`\`

This lets you build reliable, controllable agent workflows.`;
  }
  if (lower.match(/calculate|calc|\d+\s*[×x*]\s*\d+/)) {
    const match = message.match(/(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)/);
    if (match) {
      const a = parseFloat(match[1]);
      const b = parseFloat(match[2]);
      return `**Calculation Result**

${a} × ${b} = **${(a * b).toLocaleString()}**`;
    }
    return `I can help with calculations. Try asking something like "Calculate 25 × 40".`;
  }
  if (lower.includes('rag')) {
    return `## RAG (Retrieval-Augmented Generation)

RAG combines **retrieval** of relevant documents with **generation** of answers by an LLM.

1. **Index**: Split documents into chunks and embed them
2. **Retrieve**: Find the most relevant chunks for a query
3. **Generate**: Pass the retrieved context to the LLM to answer

This grounds responses in your data and reduces hallucinations.`;
  }
  if (lower.includes('python')) {
    return `Here's a clean Python example:

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Return the first n Fibonacci numbers."""
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print(fibonacci(10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

Let me know what you'd like to build!`;
  }
  if (lower.includes('what can you do')) {
    return `I'm **friendly_AI** — here's what I can help with:

| Capability | Description |
|---|---|
| **Answer questions** | General knowledge and explanations |
| **Calculate** | Math and computations |
| **Search knowledge base** | RAG-powered document search |
| **Read files** | PDF, TXT, DOCX, CSV analysis |
| **Write code** | Python, JavaScript, and more |
| **Agent workflows** | Multi-step tool use with approval |

Just type your question or pick a suggestion!`;
  }
  if (lower.includes('ai agent')) {
    return `## AI Agents

An AI agent is an LLM-powered system that can **perceive, reason, and act** autonomously.

- **Planning**: Break down tasks into steps
- **Tool use**: Call external functions/APIs
- **Memory**: Maintain context across interactions
- **Reflection**: Evaluate and retry on failure

Frameworks like **LangGraph** make it possible to build agents with controllable, predictable workflows.`;
  }
  if (lower.includes('search') && lower.includes('knowledge')) {
    return `Searching the knowledge base...

I found **3 relevant documents**. Here's a summary of the top match:

> The knowledge base contains your uploaded documents. Results are ranked by semantic similarity to your query.

Would you like me to dive deeper into any specific document?`;
  }
  return `That's a great question! Here's what I think:

${message}

I'm running in **mock mode** right now — connect your Python LangGraph backend by setting \`VITE_USE_MOCK=false\` and \`VITE_API_BASE_URL\` in your \`.env\` file to get real responses.`;
}

function generateToolEvents(message: string): ToolEvent[] {
  const lower = message.toLowerCase();
  const events: ToolEvent[] = [];
  const baseTime = Date.now();

  if (lower.includes('search') && lower.includes('knowledge')) {
    events.push(
      { id: uid('evt'), type: 'thinking', label: 'Thinking...', timestamp: new Date(baseTime).toISOString() },
      { id: uid('evt'), type: 'tool_start', tool: 'search_knowledge_base', label: 'Searching knowledge base...', timestamp: new Date(baseTime + 500).toISOString() },
      { id: uid('evt'), type: 'tool_end', tool: 'search_knowledge_base', label: 'Found 3 relevant documents', timestamp: new Date(baseTime + 1500).toISOString() },
    );
  } else if (lower.match(/calculate|calc|\d+\s*[×x*]\s*\d+/)) {
    events.push(
      { id: uid('evt'), type: 'tool_start', tool: 'calculator', label: 'Using calculator...', timestamp: new Date(baseTime).toISOString() },
      { id: uid('evt'), type: 'tool_end', tool: 'calculator', label: 'Calculation complete', timestamp: new Date(baseTime + 600).toISOString() },
    );
  } else if (lower.includes('read') && lower.includes('file')) {
    events.push(
      { id: uid('evt'), type: 'tool_start', tool: 'file_reader', label: 'Reading file...', timestamp: new Date(baseTime).toISOString() },
      { id: uid('evt'), type: 'tool_end', tool: 'file_reader', label: 'File parsed successfully', timestamp: new Date(baseTime + 800).toISOString() },
    );
  } else {
    events.push(
      { id: uid('evt'), type: 'thinking', label: 'Thinking...', timestamp: new Date(baseTime).toISOString() },
    );
  }
  events.push({ id: uid('evt'), type: 'generating', label: 'Generating answer...', timestamp: new Date(baseTime + 1800).toISOString() });
  return events;
}

export async function sendMessage(
  req: ChatRequest,
  onEvent?: (event: ToolEvent) => void,
): Promise<ChatResponse> {
  const events = generateToolEvents(req.message);
  for (const evt of events) {
    await delay(400);
    onEvent?.(evt);
  }
  await delay(500);
  const reply = generateMockReply(req.message);
  return {
    thread_id: req.thread_id,
    message: reply,
    status: 'completed',
  };
}

export async function uploadFiles(
  files: File[],
): Promise<import('@/types').Attachment[]> {
  await delay(800);
  return files.map((f) => ({
    id: uid('file'),
    name: f.name,
    size: f.size,
    type: f.type,
    uploadProgress: 100,
  }));
}
