-- summaries_zoom table
CREATE TABLE IF NOT EXISTS summaries_zoom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id TEXT UNIQUE NOT NULL,
  meeting_topic TEXT NOT NULL,
  short_summary TEXT,
  long_summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  key_decisions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- summaries_slack table
CREATE TABLE IF NOT EXISTS summaries_slack (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_ts TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  participants JSONB DEFAULT '[]'::jsonb,
  short_summary TEXT,
  long_summary TEXT,
  tone TEXT CHECK (tone IN ('positive', 'neutral', 'negative')) DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_ts, channel_id)
);

-- summaries_jira table
CREATE TABLE IF NOT EXISTS summaries_jira (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_key TEXT UNIQUE NOT NULL,
  short_summary TEXT,
  long_summary TEXT,
  priority TEXT CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('to_do', 'in_progress', 'in_review', 'done')) DEFAULT 'to_do',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE summaries_zoom ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries_slack ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries_jira ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for now
CREATE POLICY "Allow public read on summaries_zoom" ON summaries_zoom
  FOR SELECT TO PUBLIC
  USING (true);

CREATE POLICY "Allow public read on summaries_slack" ON summaries_slack
  FOR SELECT TO PUBLIC
  USING (true);

CREATE POLICY "Allow public read on summaries_jira" ON summaries_jira
  FOR SELECT TO PUBLIC
  USING (true);

-- Auth write policies (for later)
CREATE POLICY "Allow authenticated write on summaries_zoom" ON summaries_zoom
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated write on summaries_slack" ON summaries_slack
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated write on summaries_jira" ON summaries_jira
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_summaries_zoom_created_at ON summaries_zoom(created_at DESC);
CREATE INDEX idx_summaries_slack_created_at ON summaries_slack(created_at DESC);
CREATE INDEX idx_summaries_jira_created_at ON summaries_jira(created_at DESC);
CREATE INDEX idx_summaries_slack_channel ON summaries_slack(channel_id);
CREATE INDEX idx_summaries_jira_priority ON summaries_jira(priority);
CREATE INDEX idx_summaries_jira_status ON summaries_jira(status);
