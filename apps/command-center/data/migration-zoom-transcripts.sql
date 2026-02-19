-- Migration: Zoom Transcripts + Incremental Research Insights
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════
-- ZOOM TRANSCRIPTS
-- Store processed transcripts to avoid re-downloading
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS zoom_transcripts (
  id TEXT PRIMARY KEY,                    -- zoom meeting ID
  topic TEXT,
  host_email TEXT,
  start_time TEXT,                        -- ISO timestamp
  duration INTEGER,                       -- minutes
  attendees JSONB DEFAULT '[]',           -- ["Adam Harris", "Jordan Barlow"]
  transcript_raw TEXT,                    -- cleaned VTT text
  summary TEXT,                           -- AI-generated summary
  decisions JSONB DEFAULT '[]',           -- extracted decisions
  action_items JSONB DEFAULT '[]',        -- [{action, owner, deadline, priority}]
  sentiment TEXT,                         -- productive/tense/neutral
  key_topics JSONB DEFAULT '[]',          -- topic tags for search
  client_id TEXT,                         -- FK to clients table (nullable)
  "createdAt" TEXT,
  "processedAt" TEXT                      -- when we ran the AI analysis
);

-- Index for finding transcripts by attendee or client
CREATE INDEX IF NOT EXISTS idx_zoom_transcripts_client ON zoom_transcripts(client_id);
CREATE INDEX IF NOT EXISTS idx_zoom_transcripts_start ON zoom_transcripts(start_time);

-- ═══════════════════════════════════════════════════════════
-- RESEARCH INSIGHTS
-- Per-user personality & communication profiles
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS research_insights (
  id TEXT PRIMARY KEY,                    -- matches users.id
  user_name TEXT,
  style JSONB DEFAULT '{}',              -- {formality, verbosity, tone, ...}
  interests JSONB DEFAULT '{}',          -- {professional, personal, sharedWithAdam}
  personality JSONB DEFAULT '{}',        -- {decisionStyle, detailOrientation, ...}
  conversation_starters JSONB DEFAULT '[]',
  best_approach TEXT,
  topics_to_avoid JSONB DEFAULT '[]',
  rapport_builders JSONB DEFAULT '[]',
  warning_signals JSONB DEFAULT '[]',
  summary TEXT,                          -- natural language overview
  confidence TEXT,                       -- high/medium/low
  sources_used JSONB DEFAULT '[]',       -- ["slack:127msgs", "zoom:5meetings"]
  "analyzedAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- ADD lastResearchedAt TO USERS TABLE
-- Tracks when we last pulled data for incremental processing
-- ═══════════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastResearchedAt" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastSlackPulledAt" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastZoomPulledAt" TEXT;

-- ═══════════════════════════════════════════════════════════
-- RLS (match existing pattern — open for now)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE zoom_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON zoom_transcripts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE research_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON research_insights FOR ALL USING (true) WITH CHECK (true);
