/* cc-recipes — SyncDB schema */

const CC_DB_CONFIG = {
  name: 'cc-recipes',
  tables: {
    recipes: {
      columns: `id TEXT PRIMARY KEY, title TEXT, description TEXT, category TEXT, prompt TEXT,
        tags TEXT, icon TEXT, type TEXT, integrations TEXT, skills TEXT, createdAt TEXT`,
      jsonFields: ['tags', 'integrations', 'skills'],
      file: 'recipes.json'
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
