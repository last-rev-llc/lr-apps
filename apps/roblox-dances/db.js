const ROBLOX_DANCES_DB_CONFIG = {
  name: 'roblox-dances',
  tables: {
    dances: {
      columns: `id TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT,
        description TEXT, code TEXT, difficulty TEXT, tags TEXT,
        rating REAL, ratingCount INTEGER, createdAt TEXT`,
      jsonFields: ['tags'],
      file: 'dances.json'
    },
    submissions: {
      columns: `id TEXT PRIMARY KEY, name TEXT NOT NULL, emoji TEXT,
        description TEXT, difficulty TEXT, tags TEXT,
        submittedBy TEXT, createdAt TEXT, status TEXT`,
      jsonFields: ['tags'],
      file: 'submissions.json'
    }
  }
};
