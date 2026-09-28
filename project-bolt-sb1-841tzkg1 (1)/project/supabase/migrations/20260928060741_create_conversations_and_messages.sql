/*
# Create conversations and messages tables for friendly_AI

1. New Tables
- `conversations`
  - `id` (uuid, primary key) — unique conversation identifier
  - `thread_id` (text, unique, not null) — the LangGraph thread/checkpoint ID used for memory persistence
  - `title` (text, not null) — human-readable conversation title shown in the sidebar
  - `created_at` (timestamptz) — when the conversation was created
  - `updated_at` (timestamptz) — last activity timestamp, updated on every new message
- `messages`
  - `id` (uuid, primary key) — unique message identifier
  - `thread_id` (text, not null, references conversations.thread_id) — links the message to its conversation
  - `role` (text, not null) — 'user', 'assistant', or 'system'
  - `content` (text, not null) — the message text (markdown for assistant)
  - `created_at` (timestamptz) — when the message was sent/received
  - `status` (text) — 'sending', 'streaming', 'completed', or 'error'
  - `attachments` (jsonb) — array of file attachments (name, size, type, url)
  - `tool_events` (jsonb) — array of agent tool activity events (thinking, tool_start, tool_end, etc.)
  - `approval_request` (jsonb) — human-in-the-loop approval payload

2. Indexes
- `conversations_updated_at_idx` — for sorting conversations by most recent
- `messages_thread_id_created_at_idx` — for fetching messages in order within a conversation

3. Security
- RLS enabled on both tables.
- Single-tenant app (no sign-in screen), so policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because all data is intentionally shared/public.
- Four separate policies per table (SELECT, INSERT, UPDATE, DELETE).

4. Important Notes
- The `thread_id` is the bridge between the frontend and the Python LangGraph backend's MemorySaver/checkpointing system.
- Messages are linked to conversations via `thread_id` (not a UUID FK) to match the LangGraph convention.
- `updated_at` on conversations is maintained by a trigger so it stays in sync whenever a message is inserted.
*/

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_updated_at_idx
  ON conversations (updated_at DESC);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id text NOT NULL REFERENCES conversations(thread_id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'completed',
  attachments jsonb,
  tool_events jsonb,
  approval_request jsonb
);

CREATE INDEX IF NOT EXISTS messages_thread_id_created_at_idx
  ON messages (thread_id, created_at ASC);

-- Trigger to auto-update conversations.updated_at when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE thread_id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_insert_update_conversation ON messages;
CREATE TRIGGER on_message_insert_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies (single-tenant, no auth — all data is shared)
DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations FOR DELETE
  TO anon, authenticated USING (true);

-- Messages policies (single-tenant, no auth — all data is shared)
DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);
