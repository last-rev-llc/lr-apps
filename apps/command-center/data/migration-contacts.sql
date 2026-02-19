-- ────────────────────────────────────────────────────────────────────────
-- Unified Contacts Table Migration
-- ────────────────────────────────────────────────────────────────────────
-- This creates a unified contacts table that consolidates:
-- - Supabase users table (46 records)
-- - leads.json people section (43 records) 
-- - Future contact imports
--
-- Run this in the Supabase SQL Editor if the automated creation fails

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  company TEXT,
  type TEXT DEFAULT 'other' CHECK (type IN ('team', 'client', 'lead', 'partner', 'contractor', 'personal', 'other')),
  avatar TEXT,
  location TEXT,
  timezone TEXT,
  
  -- Social & handles
  slack_id TEXT,
  slack_handle TEXT,
  github_handle TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  website TEXT,
  socials JSONB DEFAULT '{}',
  
  -- Professional context
  companies JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- Research & insights
  insights JSONB DEFAULT '{}',
  last_researched_at TIMESTAMPTZ,
  confidence INTEGER DEFAULT 0,
  
  -- Metadata
  source TEXT DEFAULT 'manual',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_public_read" ON contacts FOR SELECT USING (true);
CREATE POLICY "contacts_service_write" ON contacts FOR ALL USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE PROCEDURE update_contacts_updated_at();