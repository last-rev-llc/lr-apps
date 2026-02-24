/* Client Scorecard — SyncDB schema & helpers */

const CC_DB_CONFIG = {
  name: 'client-scorecard',
  tables: {
    clientHealth: {
      columns: `id TEXT PRIMARY KEY, name TEXT, score REAL, metrics TEXT, updatedAt TEXT`,
      jsonFields: ['metrics'],
      file: 'client-health.json'
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
