/* cc-ideas — SyncDB schema */

const CC_DB_CONFIG = {
  name: 'cc-ideas',
  tables: {
    ideas: {
      columns: `id TEXT PRIMARY KEY, title TEXT, description TEXT, category TEXT, status TEXT,
        source TEXT, feasibility REAL, impact REAL, effort REAL, compositeScore REAL,
        tags TEXT, similarSolutions TEXT, relatedIdeas TEXT, resources TEXT,
        author TEXT, sourceUrl TEXT, prompt TEXT, integrations TEXT,
        app TEXT, createdAt TEXT, updatedAt TEXT, completedAt TEXT`,
      jsonFields: ['tags', 'similarSolutions', 'relatedIdeas', 'resources', 'integrations'],
      file: 'ideas.json'
    }
  }
};

let ccDb = null;
async function getDb() {
  if (ccDb) return ccDb;
  ccDb = await SyncDB.init(CC_DB_CONFIG);
  return ccDb;
}
window.CC_DB_CONFIG = CC_DB_CONFIG;
window.getDb = getDb;
