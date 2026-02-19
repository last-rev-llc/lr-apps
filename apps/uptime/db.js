const UPTIME_DB_CONFIG = {
  name: 'uptime',
  tables: {
    sites: {
      columns: `id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT, description TEXT, status TEXT,
        responseTimeMs INTEGER, uptimePercent REAL, lastChecked TEXT,
        history TEXT, createdAt TEXT, updatedAt TEXT`,
      jsonFields: ['history'],
      file: 'sites.json'
    }
  }
};
