const LIGHTHOUSE_DB_CONFIG = {
  name: 'lighthouse',
  tables: {
    audits: {
      columns: `id TEXT PRIMARY KEY, site TEXT NOT NULL, url TEXT,
        audits TEXT, createdAt TEXT, updatedAt TEXT`,
      jsonFields: ['audits'],
      file: 'audits.json'
    }
  }
};
