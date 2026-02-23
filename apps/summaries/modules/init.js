// Initialization module - creates tables if they don't exist
// This runs on app startup and creates the necessary Supabase tables

const Init = (() => {
  async function createTablesIfNeeded() {
    console.log('Init: Checking and creating tables...');
    
    try {
      const supabase = window.supabaseClient;
      
      // Check if tables exist by trying to query them
      const { error: zoomError } = await supabase.from('summaries_zoom').select('count(*)', { count: 'exact' }).limit(0);
      const { error: slackError } = await supabase.from('summaries_slack').select('count(*)', { count: 'exact' }).limit(0);
      const { error: jiraError } = await supabase.from('summaries_jira').select('count(*)', { count: 'exact' }).limit(0);

      if (zoomError || slackError || jiraError) {
        console.log('Init: Creating tables...');
        
        // Execute SQL migrations
        const migrations = `
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

          ALTER TABLE summaries_zoom ENABLE ROW LEVEL SECURITY;
          ALTER TABLE summaries_slack ENABLE ROW LEVEL SECURITY;
          ALTER TABLE summaries_jira ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Allow public read on summaries_zoom" ON summaries_zoom FOR SELECT TO PUBLIC USING (true);
          CREATE POLICY "Allow public read on summaries_slack" ON summaries_slack FOR SELECT TO PUBLIC USING (true);
          CREATE POLICY "Allow public read on summaries_jira" ON summaries_jira FOR SELECT TO PUBLIC USING (true);

          CREATE POLICY "Allow authenticated write on summaries_zoom" ON summaries_zoom FOR INSERT TO authenticated WITH CHECK (true);
          CREATE POLICY "Allow authenticated write on summaries_slack" ON summaries_slack FOR INSERT TO authenticated WITH CHECK (true);
          CREATE POLICY "Allow authenticated write on summaries_jira" ON summaries_jira FOR INSERT TO authenticated WITH CHECK (true);

          CREATE INDEX IF NOT EXISTS idx_summaries_zoom_created_at ON summaries_zoom(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_summaries_slack_created_at ON summaries_slack(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_summaries_jira_created_at ON summaries_jira(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_summaries_slack_channel ON summaries_slack(channel_id);
          CREATE INDEX IF NOT EXISTS idx_summaries_jira_priority ON summaries_jira(priority);
          CREATE INDEX IF NOT EXISTS idx_summaries_jira_status ON summaries_jira(status);
        `;

        // Try to execute via Supabase RPC or raw SQL
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: migrations });
          if (error) {
            console.warn('Init: Could not create tables via RPC:', error.message);
            console.log('Init: Tables may already exist or need manual creation');
          } else {
            console.log('Init: Tables created successfully');
          }
        } catch (err) {
          console.warn('Init: RPC execution not available, tables may be created manually');
        }
      } else {
        console.log('Init: Tables already exist');
      }

      // Seed data if needed
      await seedIfEmpty();

    } catch (err) {
      console.error('Init: Error during initialization', err);
    }
  }

  async function seedIfEmpty() {
    // Data is now seeded directly in Supabase - no need to fetch seed.json
    console.log('Init: Data loaded from Supabase');
  }

  return {
    createTablesIfNeeded
  };
})();

// Run initialization
window.addEventListener('load', () => {
  Init.createTablesIfNeeded();
});
