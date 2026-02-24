# Sentiment App v2.0 Migration Guide

## Overview
The sentiment app has been refactored from a single-page app with inline JS to a modular, production-ready architecture with Supabase backend.

## ✅ Completed Changes

### Priority 1: Page Structure
- ✅ Created `app.html` — main application (extracted from old index.html)
- ✅ Created new `index.html` — marketing landing page
- ✅ Created `docs.html` — module documentation with `<cc-docs>` component
- ✅ Created `logs.html` — change log tracking

### Priority 2: Modular JavaScript
- ✅ Created `modules/sentiment.js` — `<team-sentiment>` custom element (all dashboard logic)
- ✅ Created `modules/sentiment-summary.js` — `<sentiment-summary>` dashboard widget
- ✅ Extracted all inline JS from HTML files into reusable modules

### Priority 3: Supabase Migration (REQUIRES MANUAL SETUP)
- ⚠️ **Action Required:** Run SQL migration in Supabase Dashboard
- ⚠️ **Action Required:** Seed data from `data/sentiment.json`

### Priority 4: Navigation Updates
- ✅ Added `<cc-app-topnav>` to all pages (landing, app, docs, logs, admin, ads, apps, ideas, prompts)
- ✅ Updated `<cc-app-nav position="bottom">` on all authenticated pages
- ✅ Proper navigation hierarchy: topnav (public) + bottom nav (internal)

## 🔴 Manual Setup Required

### Step 1: Create Supabase Table

Open Supabase SQL Editor and run:

```sql
-- Create sentiment_entries table
CREATE TABLE IF NOT EXISTS sentiment_entries (
  id text PRIMARY KEY,
  date date NOT NULL,
  member_name text NOT NULL,
  sentiment_score int4 NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 10),
  mood text NOT NULL,
  work_summary text NOT NULL,
  blockers jsonb DEFAULT '[]'::jsonb,
  highlights jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sentiment_entries ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read all entries
CREATE POLICY "Allow authenticated read access"
  ON sentiment_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: Allow authenticated users to insert/update their own entries
CREATE POLICY "Allow authenticated insert/update"
  ON sentiment_entries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS sentiment_entries_date_idx ON sentiment_entries(date DESC);
CREATE INDEX IF NOT EXISTS sentiment_entries_member_idx ON sentiment_entries(member_name);
```

### Step 2: Seed Data

Run this SQL to import existing data from `data/sentiment.json`:

```sql
-- Copy and paste the output of the following command:
-- jq -r '.[] | "INSERT INTO sentiment_entries (id, date, member_name, sentiment_score, mood, work_summary, blockers, highlights) VALUES (\(.id | @json), \(.date | @json), \(.member | @json), \(.sentiment), \(.mood | @json), \(.summary | @json), \(.blockers | @json)::jsonb, \(.highlights | @json)::jsonb) ON CONFLICT (id) DO NOTHING;"' data/sentiment.json
```

Or manually run:

```bash
cd ~/workspace/adam-harris/apps/sentiment
bash /tmp/seed_sentiment_manual.sh
```

### Step 3: Verify Migration

After creating the table and seeding data, visit:
- https://sentiment.adam-harris.alphaclaw.app/app.html

You should see:
- ✅ All team members loaded
- ✅ Stats cards populated
- ✅ Trend chart rendered
- ✅ Timeline showing all entries

## Architecture Changes

### Before (v1.0)
```
index.html
├── Inline HTML structure
├── Inline CSS (180 lines)
└── Inline JavaScript (150 lines)
    ├── Data loading from JSON
    ├── Filtering logic
    ├── Chart rendering
    └── Component rendering
```

### After (v2.0)
```
index.html (landing page)
app.html (main app)
├── <team-sentiment> web component
└── modules/sentiment.js
    ├── Data loading from Supabase
    ├── Filtering logic
    ├── Chart rendering
    └── Component rendering

docs.html (documentation)
logs.html (change log)
modules/
├── sentiment.js (main component)
└── sentiment-summary.js (dashboard widget)
```

## Breaking Changes

### URL Changes
- Old: `https://sentiment.adam-harris.alphaclaw.app/` (app + landing mixed)
- New: `https://sentiment.adam-harris.alphaclaw.app/` (landing page only)
- New: `https://sentiment.adam-harris.alphaclaw.app/app.html` (main app)

### Data Source Changes
- Old: `fetch('data/sentiment.json')`
- New: `supabase.from('sentiment_entries').select('*')`

### Navigation Changes
- Added topnav (public pages: Home, App, Apps, Docs)
- Bottom nav (internal pages: App, Admin, Ideas, Prompts, Ads)

## Rollback Plan

If issues arise, revert to v1.0:

```bash
cd ~/workspace/adam-harris/apps/sentiment
git checkout HEAD~1 index.html
rm -rf modules/
rm app.html docs.html logs.html MIGRATION.md
```

## Next Steps

1. ✅ Test landing page → https://sentiment.adam-harris.alphaclaw.app/
2. ⚠️ Create Supabase table (Step 1 above)
3. ⚠️ Seed data (Step 2 above)
4. ✅ Test app page → https://sentiment.adam-harris.alphaclaw.app/app.html
5. ✅ Test docs page → https://sentiment.adam-harris.alphaclaw.app/docs.html
6. ✅ Merge PR #7

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection (Network tab)
3. Confirm RLS policies allow authenticated access
4. Check #alphaclaw-queue in Slack for details
