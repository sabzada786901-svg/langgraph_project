# friendly_AI

Your intelligent AI workspace — a professional AI agent chat frontend built to connect with Python LangGraph backends.

## Features

- **Professional chat interface** with a unique dark AI SaaS identity
- **Conversation management** — create, open, rename, delete, and search conversations
- **Persistent memory support** via `thread_id` for LangGraph `MemorySaver` / checkpointing
- **Agent activity display** — shows high-level tool status (thinking, searching, calculating, etc.)
- **Markdown rendering** with syntax highlighting and copy-to-clipboard for code blocks
- **File attachments** — PDF, TXT, DOCX, CSV, PNG, JPG, WebP with drag-and-drop
- **Voice input** using the Web Speech API
- **Quick Questions** for instant prompts
- **Settings** — theme (dark/light), AI provider (Groq/OpenRouter), model, temperature, language
- **Human-in-the-loop** approval workflow support
- **Responsive design** — desktop sidebar, mobile drawer, touch-friendly
- **Streaming-ready** — API layer designed for Server-Sent Events (SSE)

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- react-markdown + remark-gfm

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Environment

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=true
```

- `VITE_API_BASE_URL` — URL of your Python LangGraph backend
- `VITE_USE_MOCK` — set to `true` to use mock responses (no backend needed), `false` to connect to your real API

**Never put API keys (GROQ_API_KEY, OPENROUTER_API_KEY) in the frontend.** They belong only to the backend.

## Architecture

### Folder Structure

```
src/
├── components/
│   ├── Chat/          # ChatArea, MessageList, EmptyState, TypingIndicator
│   ├── common/        # Logo, Modal, ConfirmDialog, MarkdownRenderer, Tooltip
│   ├── Conversations/ # ConversationList
│   ├── Header/        # ChatHeader
│   ├── Input/         # ChatInput, FileChips, VoiceButton
│   ├── Settings/      # SettingsModal
│   ├── Sidebar/       # Sidebar, QuickQuestions, UserProfileArea
│   └── ToolStatus/    # ToolStatus (agent activity)
├── hooks/             # useChat, useConversations, useVoice
├── lib/               # utils (cn helper)
├── pages/             # ChatPage
├── services/          # api.ts, mockApi.ts
├── types/             # index.ts
├── App.tsx
├── main.tsx
└── index.css
```

### API Layer

`src/services/api.ts` is the single import surface for all backend calls:

- `createConversation(title)` → `POST /api/conversations`
- `getConversations()` → `GET /api/conversations`
- `getConversation(id)` → `GET /api/conversations/:id`
- `renameConversation(id, title)` → `PATCH /api/conversations/:id`
- `deleteConversation(id)` → `DELETE /api/conversations/:id`
- `sendMessage(req, callbacks)` → `POST /api/chat` (supports SSE streaming)
- `uploadFiles(files)` → `POST /api/chat/upload`
- `sendApproval(threadId, approvalId, decision)` → `POST /api/chat/approval`

When `VITE_USE_MOCK=true`, all calls route to `mockApi.ts` which uses localStorage for persistence.

### How `thread_id` Works

Each conversation has a unique `thread_id` (e.g. `thread-1700000000-abc123`). This ID is sent with every chat request so the LangGraph backend can persist and retrieve conversation state via `MemorySaver` / checkpointing. The frontend stores messages locally for snappy UI and reloads from the backend when available.

### Connecting Your Python LangGraph Backend

1. Set `VITE_USE_MOCK=false` in `.env`
2. Set `VITE_API_BASE_URL` to your backend URL (e.g. `http://localhost:8000`)
3. Implement these endpoints on your backend:

```python
POST   /api/conversations          # Create a conversation
GET    /api/conversations          # List conversations
GET    /api/conversations/:id      # Get a conversation
PATCH  /api/conversations/:id      # Rename
DELETE /api/conversations/:id      # Delete
POST   /api/chat                   # Send message (supports SSE streaming)
POST   /api/chat/upload            # Upload files
POST   /api/chat/approval          # Human-in-the-loop approval
```

4. For streaming, return `text/event-stream` with `data: {json}\n\n` lines. Event types:
   - `{ "type": "tool_event", "tool_event": {...} }` — agent activity
   - `{ "type": "content", "content": "chunk" }` — streamed text
   - `{ "type": "approval_request", "approval_request": {...} }` — pause for approval
   - `data: [DONE]` — end of stream

### File Uploads

Files are validated client-side (type and size, max 10MB) and can be sent with the chat message or uploaded separately via `POST /api/chat/upload`.

### Voice Input

Uses the browser Web Speech API where available. The `useVoice` hook is designed to be replaceable — swap the implementation to call a backend speech-to-text API if needed.

### Provider/Model Selection

Settings (provider, model, temperature, language) are sent with each chat request to the backend, which uses them to configure the LLM. API keys are never stored in the frontend.

### Adding New Agent Tools

Add new tool event types to `ToolEventType` in `src/types/index.ts`, then map the backend tool name to a friendly label in the `ToolStatus` component.

## Deployment

```bash
npm run build
```

The `dist/` folder is a static site deployable to any static host (Vercel, Netlify, Cloudflare Pages, etc.). Set the environment variables on your hosting platform.
