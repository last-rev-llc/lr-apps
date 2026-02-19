-- Daily per-service digests (raw findings from each source)
CREATE TABLE IF NOT EXISTS daily_digests (
  id TEXT PRIMARY KEY,              -- e.g. "2026-02-13:slack"
  date DATE NOT NULL,
  service TEXT NOT NULL,            -- slack | jira | zoom | github | calendar
  summary TEXT,                     -- narrative summary of findings
  items JSONB DEFAULT '[]',         -- structured findings array
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily overviews combining all service digests
CREATE TABLE IF NOT EXISTS daily_overviews (
  id TEXT PRIMARY KEY,              -- e.g. "2026-02-13"
  date DATE NOT NULL,
  summary TEXT,
  highlights JSONB DEFAULT '[]',
  blockers JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly rollup summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id TEXT PRIMARY KEY,              -- e.g. "2026-W07"
  week TEXT NOT NULL,               -- ISO week
  start_date DATE,
  end_date DATE,
  summary TEXT,
  themes JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  blockers JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow anon read/write for now
ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_overviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_daily_digests" ON daily_digests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_daily_overviews" ON daily_overviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_weekly_summaries" ON weekly_summaries FOR ALL USING (true) WITH CHECK (true);
