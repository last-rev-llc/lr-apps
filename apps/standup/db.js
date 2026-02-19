const STANDUP_DB_CONFIG = {
  name: 'standup',
  tables: {
    days: {
      columns: `id TEXT PRIMARY KEY, date TEXT NOT NULL, dayOfWeek TEXT,
        activities TEXT, createdAt TEXT, updatedAt TEXT`,
      jsonFields: ['activities'],
      file: 'days.json'
    }
  }
};
