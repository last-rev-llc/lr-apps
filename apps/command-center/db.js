/* Command Center — SyncDB schema & helpers */

const CC_DB_CONFIG = {
  name: 'command-center',
  tables: {
    /* ── CRUD tables ── */
    ideas: {
      columns: `id TEXT PRIMARY KEY, title TEXT, description TEXT, category TEXT, status TEXT,
        source TEXT, feasibility REAL, impact REAL, effort REAL, compositeScore REAL,
        tags TEXT, similarSolutions TEXT, relatedIdeas TEXT, resources TEXT,
        author TEXT, sourceUrl TEXT, prompt TEXT, integrations TEXT,
        createdAt TEXT, updatedAt TEXT, completedAt TEXT`,
      jsonFields: ['tags', 'similarSolutions', 'relatedIdeas', 'resources', 'integrations'],
      file: 'ideas.json'
    },
    recipes: {
      columns: `id TEXT PRIMARY KEY, title TEXT, description TEXT, category TEXT, prompt TEXT,
        tags TEXT, createdAt TEXT`,
      jsonFields: ['tags'],
      file: 'recipes.json'
    },
    clients: {
      columns: `id TEXT PRIMARY KEY, name TEXT, status TEXT, contacts TEXT, repos TEXT, notes TEXT`,
      jsonFields: ['contacts', 'repos', 'notes'],
      file: 'clients.json'
    },
    contacts: {
      columns: `id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT,
        title TEXT, company TEXT, type TEXT DEFAULT 'other',
        avatar TEXT, location TEXT, timezone TEXT,
        slack_id TEXT, slack_handle TEXT, github_handle TEXT,
        linkedin_url TEXT, twitter_handle TEXT, website TEXT,
        socials TEXT, companies TEXT, tags TEXT, notes TEXT,
        insights TEXT, last_researched_at TEXT, confidence INTEGER DEFAULT 0,
        source TEXT DEFAULT 'manual', raw_data TEXT,
        created_at TEXT, updated_at TEXT`,
      jsonFields: ['socials', 'companies', 'tags', 'insights', 'raw_data'],
      file: 'contacts.json'
    },
    users: {
      // DEPRECATED: Legacy users table - kept for backward compatibility
      // New data should go in contacts table above
      columns: `id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT, company TEXT,
        title TEXT, type TEXT, avatar TEXT, location TEXT, timezone TEXT,
        slack_id TEXT, slack_handle TEXT, github_handle TEXT,
        socials TEXT, companies TEXT, tags TEXT, notes TEXT, insights TEXT,
        created_at TEXT, updated_at TEXT`,
      jsonFields: ['socials', 'companies', 'tags', 'insights'],
      file: 'users.json',
      deprecated: true
    },
    leads: {
      columns: `id TEXT PRIMARY KEY, name TEXT, company TEXT, email TEXT, status TEXT,
        source TEXT, notes TEXT, createdAt TEXT`,
      jsonFields: [],
      file: 'leads.json'
    },
    media: {
      columns: `id TEXT PRIMARY KEY, name TEXT, type TEXT, url TEXT, description TEXT,
        tags TEXT, createdAt TEXT`,
      jsonFields: ['tags'],
      file: 'media.json'
    },

    /* ── Read-only / cron-refreshed tables ── */
    calendar: {
      columns: `id TEXT PRIMARY KEY, title TEXT, start TEXT, end TEXT, location TEXT,
        attendees TEXT, status TEXT, description TEXT`,
      jsonFields: ['attendees'],
      file: 'calendar.json'
    },
    prs: {
      columns: `id TEXT PRIMARY KEY, title TEXT, repo TEXT, author TEXT, url TEXT,
        state TEXT, createdAt TEXT, updatedAt TEXT, labels TEXT`,
      jsonFields: ['labels'],
      file: 'prs.json'
    },
    slack: {
      columns: `id TEXT PRIMARY KEY, text TEXT, user TEXT, channel TEXT, timestamp TEXT,
        reactions TEXT`,
      jsonFields: ['reactions'],
      file: 'slack.json'
    },
    crons: {
      columns: `id TEXT PRIMARY KEY, name TEXT, schedule TEXT, scheduleHuman TEXT,
        enabled INTEGER, prompt TEXT, sessionTarget TEXT, lastStatus TEXT,
        lastRun TEXT, nextRun TEXT, category TEXT`,
      jsonFields: [],
      boolFields: ['enabled'],
      file: 'crons.json'
    },
    clientHealth: {
      columns: `id TEXT PRIMARY KEY, name TEXT, score REAL, metrics TEXT, updatedAt TEXT`,
      jsonFields: ['metrics'],
      file: 'client-health.json'
    },
    contentfulHealth: {
      columns: `id TEXT PRIMARY KEY, data TEXT`,
      jsonFields: ['data'],
      file: 'contentful-health.json'
    },
    ga4Alerts: {
      columns: `id TEXT PRIMARY KEY, data TEXT`,
      jsonFields: ['data'],
      file: 'ga4-alerts.json'
    },
    dryAudit: {
      columns: `id TEXT PRIMARY KEY, data TEXT`,
      jsonFields: ['data'],
      file: 'dry-audit.json'
    },
    community: {
      columns: `id TEXT PRIMARY KEY, data TEXT`,
      jsonFields: ['data'],
      file: 'community.json'
    }
  }
};

/* Singleton DB instance */
let ccDb = null;

async function getDb() {
  if (ccDb) return ccDb;
  ccDb = await SyncDB.init(CC_DB_CONFIG);
  return ccDb;
}

/* Expose globally */
window.CC_DB_CONFIG = CC_DB_CONFIG;
window.getDb = getDb;
