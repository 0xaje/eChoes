-- Echoes Database Schema
-- Run this in your Supabase SQL Editor to initialize tables

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  detected_mood TEXT,
  session_id TEXT NOT NULL
);

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);

-- 2. Create memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  memory_type TEXT NOT NULL, -- e.g., 'preference', 'struggle', 'fear', 'joy', 'core'
  memory_text TEXT NOT NULL,
  emotional_weight INTEGER DEFAULT 1 NOT NULL CHECK (emotional_weight BETWEEN 1 AND 5),
  session_id TEXT NOT NULL
);

-- Index for session-based queries and emotional weight ordering
CREATE INDEX IF NOT EXISTS idx_memories_session_id_weight ON memories(session_id, emotional_weight DESC);

-- Enable Row Level Security (RLS) if desired, or allow anonymous access for demo convenience
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Anonymous CRUD policies (for demo purposes)
CREATE POLICY "Allow anonymous read access to conversations" ON conversations
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert access to conversations" ON conversations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous read access to memories" ON memories
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert access to memories" ON memories
  FOR INSERT TO anon WITH CHECK (true);
