// Database module for Supabase interactions via shared client
// Uses window.supabase (SupabaseClient) for all queries

const DB = (() => {
  function getClient() {
    return window.supabase;
  }

  return {
    async init() {
      console.log('DB: Initialized with shared Supabase client');
    },

    // Zoom summaries
    async getZoomSummaries(filters = {}) {
      const opts = { order: 'created_at.desc' };
      const params = {};
      if (filters.from) params['created_at'] = `gte.${filters.from}`;
      if (filters.to) params['created_at'] = `lte.${filters.to}`;
      if (filters.search) params['or'] = `(meeting_topic.ilike.%${filters.search}%,short_summary.ilike.%${filters.search}%)`;
      opts.filters = params;
      return await getClient().select('summaries_zoom', opts) || [];
    },

    // Slack summaries
    async getSlackSummaries(filters = {}) {
      const opts = { order: 'created_at.desc' };
      const params = {};
      if (filters.from) params['created_at'] = `gte.${filters.from}`;
      if (filters.to) params['created_at'] = `lte.${filters.to}`;
      if (filters.search) params['or'] = `(short_summary.ilike.%${filters.search}%,long_summary.ilike.%${filters.search}%)`;
      if (filters.channel) params['channel_id'] = `eq.${filters.channel}`;
      opts.filters = params;
      return await getClient().select('summaries_slack', opts) || [];
    },

    // Jira summaries
    async getJiraSummaries(filters = {}) {
      const opts = { order: 'created_at.desc' };
      const params = {};
      if (filters.from) params['created_at'] = `gte.${filters.from}`;
      if (filters.to) params['created_at'] = `lte.${filters.to}`;
      if (filters.search) params['or'] = `(ticket_key.ilike.%${filters.search}%,short_summary.ilike.%${filters.search}%)`;
      if (filters.priority) params['priority'] = `eq.${filters.priority}`;
      if (filters.status) params['status'] = `eq.${filters.status}`;
      opts.filters = params;
      return await getClient().select('summaries_jira', opts) || [];
    },

    // Get all summaries combined
    async getAllSummaries(filters = {}) {
      const [zoom, slack, jira] = await Promise.all([
        this.getZoomSummaries(filters),
        this.getSlackSummaries(filters),
        this.getJiraSummaries(filters)
      ]);

      const all = [
        ...zoom.map(item => ({ ...item, source: 'zoom', title: item.meeting_topic })),
        ...slack.map(item => ({ ...item, source: 'slack', title: item.short_summary })),
        ...jira.map(item => ({ ...item, source: 'jira', title: item.ticket_key }))
      ];

      return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    // Seed data (kept for compatibility)
    async seedData(seedJson) {
      const client = getClient();
      if (seedJson.summaries_zoom?.length) await client.upsert('summaries_zoom', seedJson.summaries_zoom);
      if (seedJson.summaries_slack?.length) await client.upsert('summaries_slack', seedJson.summaries_slack);
      if (seedJson.summaries_jira?.length) await client.upsert('summaries_jira', seedJson.summaries_jira);
      console.log('DB: Seeding complete');
    }
  };
})();

window.DB = DB;
