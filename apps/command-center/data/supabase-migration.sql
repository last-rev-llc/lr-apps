-- StatusPulse / AlphaClaw Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ═══════════════════════════════════════════════════════════
-- COMMAND CENTER
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  category TEXT,
  status TEXT,
  source TEXT,
  feasibility REAL,
  impact REAL,
  effort TEXT,
  "compositeScore" REAL,
  tags JSONB DEFAULT '[]',
  "similarSolutions" JSONB DEFAULT '[]',
  "relatedIdeas" JSONB DEFAULT '[]',
  resources JSONB DEFAULT '[]',
  author TEXT,
  "sourceUrl" TEXT,
  prompt TEXT,
  integrations JSONB DEFAULT '[]',
  rating INTEGER DEFAULT 0,
  hidden BOOLEAN DEFAULT false,
  "snoozedUntil" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "completedAt" TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  category TEXT,
  prompt TEXT,
  tags JSONB DEFAULT '[]',
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  url TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]',
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS crons (
  id TEXT PRIMARY KEY,
  name TEXT,
  schedule TEXT,
  "scheduleHuman" TEXT,
  enabled BOOLEAN DEFAULT true,
  prompt TEXT,
  "sessionTarget" TEXT,
  "lastStatus" TEXT,
  "lastRun" TEXT,
  "nextRun" TEXT
);

CREATE TABLE IF NOT EXISTS prs (
  id TEXT PRIMARY KEY,
  title TEXT,
  repo TEXT,
  author TEXT,
  url TEXT,
  state TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  labels JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS slack_messages (
  id TEXT PRIMARY KEY,
  text TEXT,
  "user" TEXT,
  channel TEXT,
  "timestamp" TEXT,
  reactions JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT,
  start TEXT,
  "end" TEXT,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  status TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS dry_audit (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS community (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'
);

-- ═══════════════════════════════════════════════════════════
-- ACCOUNTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT,
  health TEXT,
  industry TEXT,
  urls JSONB DEFAULT '[]',
  contacts JSONB DEFAULT '[]',
  repos JSONB DEFAULT '[]',
  meetings JSONB DEFAULT '[]',
  standup JSONB DEFAULT '[]',
  notes JSONB DEFAULT '[]',
  links JSONB DEFAULT '[]',
  github JSONB,
  jira JSONB,
  netlify JSONB,
  contracts JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  challenges JSONB DEFAULT '[]',
  "upcomingFocus" JSONB DEFAULT '[]',
  "upcomingMeetings" JSONB DEFAULT '[]',
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- CRM / USERS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar TEXT,
  title TEXT,
  company TEXT,
  "companyHistory" JSONB DEFAULT '[]',
  location TEXT,
  timezone TEXT,
  handles JSONB DEFAULT '[]',
  phone TEXT,
  type TEXT,
  confidence TEXT,
  notes TEXT,
  "slackMsgCount" INTEGER DEFAULT 0,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- SALES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  company TEXT,
  email TEXT,
  status TEXT,
  source TEXT,
  notes TEXT,
  score REAL,
  "fitScore" REAL,
  "intentScore" REAL,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- UPTIME
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS uptime_sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  status TEXT,
  "responseTimeMs" INTEGER,
  "uptimePercent" REAL,
  "lastChecked" TEXT,
  history JSONB DEFAULT '[]',
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- STANDUP
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS standup_days (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "dayOfWeek" TEXT,
  activities JSONB DEFAULT '[]',
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- SENTIMENT
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sentiment_days (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  member TEXT NOT NULL,
  sentiment INTEGER,
  mood TEXT,
  summary TEXT,
  blockers JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- LIGHTHOUSE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lighthouse_audits (
  id TEXT PRIMARY KEY,
  site TEXT NOT NULL,
  url TEXT,
  audits JSONB DEFAULT '[]',
  "createdAt" TEXT,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- TRAVEL COLLECTION
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS travel_properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  region TEXT,
  category TEXT,
  type TEXT,
  website TEXT,
  description TEXT,
  photos JSONB DEFAULT '[]',
  pricing TEXT,
  amenities JSONB DEFAULT '[]',
  rating REAL,
  highlights JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  researched BOOLEAN DEFAULT false,
  "createdAt" TEXT,
  "updatedAt" TEXT
);

CREATE TABLE IF NOT EXISTS travel_contacts (
  id TEXT PRIMARY KEY,
  "firstName" TEXT,
  "lastName" TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  context TEXT,
  tags JSONB DEFAULT '[]',
  "associatedProperties" JSONB DEFAULT '[]',
  notes JSONB DEFAULT '[]',
  "createdAt" TEXT,
  "updatedAt" TEXT
);

CREATE TABLE IF NOT EXISTS travel_dmcs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT,
  description TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  specialties JSONB DEFAULT '[]',
  services JSONB DEFAULT '[]',
  rating REAL,
  highlights JSONB DEFAULT '[]',
  reviews JSONB DEFAULT '[]',
  "associatedProperties" JSONB DEFAULT '[]',
  "researchedAt" TEXT
);

CREATE TABLE IF NOT EXISTS travel_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "contactId" TEXT,
  dates TEXT,
  "groupSize" TEXT,
  budget TEXT,
  styles JSONB DEFAULT '[]',
  regions JSONB DEFAULT '[]',
  types JSONB DEFAULT '[]',
  notes TEXT,
  matches JSONB DEFAULT '[]',
  "createdAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- ROBLOX DANCES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  code TEXT,
  difficulty TEXT,
  tags JSONB DEFAULT '[]',
  rating REAL,
  "ratingCount" INTEGER DEFAULT 0,
  "createdAt" TEXT
);

CREATE TABLE IF NOT EXISTS dance_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  difficulty TEXT,
  tags JSONB DEFAULT '[]',
  "submittedBy" TEXT,
  "createdAt" TEXT,
  status TEXT
);

-- ═══════════════════════════════════════════════════════════
-- USER PREFERENCES (synced across devices)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_prefs (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  value JSONB,
  "updatedAt" TEXT
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

-- For now, enable RLS but allow all authenticated + anon access
-- (single-user app — tighten later for multi-user)

DO $$ 
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Allow all access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
