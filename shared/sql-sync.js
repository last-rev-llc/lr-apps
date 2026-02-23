/**
 * sql-sync.js — Shared SQLite + Server Sync Module
 * 
 * In-browser SQLite (sql.js) with IndexedDB caching and server-side JSON persistence.
 * Works with any app on *.adam-harris.alphaclaw.app via the /api/sync/ endpoint.
 *
 * Usage:
 *   <script src="https://shared.adam-harris.alphaclaw.app/sql-sync.js"></script>
 *   <script>
 *     const db = await SyncDB.init({
 *       name: 'my-app',           // IndexedDB database name
 *       tables: {
 *         items: {
 *           columns: 'id TEXT PRIMARY KEY, name TEXT, data TEXT',
 *           jsonFields: ['data'],  // columns that store JSON arrays/objects
 *           file: 'items.json'     // server sync filename (in data/)
 *         }
 *       }
 *     });
 *
 *     // CRUD
 *     db.all('items');                                  // SELECT * from items
 *     db.get('items', 'item-1');                        // get by id
 *     db.upsert('items', { id: 'item-1', name: 'Hi', data: ['a'] });
 *     db.remove('items', 'item-1');
 *
 *     // Filtered queries
 *     db.query('SELECT * FROM items WHERE name LIKE ?', ['%search%']);
 *
 *     // Manual sync
 *     await db.pushAll();   // push all tables to server
 *     await db.pullAll();   // pull all tables from server
 *   </script>
 *
 * Server endpoint (built into dashboard):
 *   GET  /api/sync/:file.json  → read data
 *   PUT  /api/sync/:file.json  → write data (auto git-commits)
 */

const _SQL_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
const _SQL_WASM_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm';

class SyncDB {
  constructor(sqlDb, config) {
    this._db = sqlDb;
    this._config = config;
    this._dirty = false;
    this._syncQueue = new Set();
  }

  // ═══════════════════════════════════════════════════════════════
  // Init
  // ═══════════════════════════════════════════════════════════════
  static async init(config) {
    if (!config || !config.name || !config.tables) {
      throw new Error('SyncDB.init requires { name, tables }');
    }

    // Load sql.js
    if (!window.initSqlJs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = _SQL_JS_CDN;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const SQL = await window.initSqlJs({ locateFile: () => _SQL_WASM_CDN });

    // Try loading from IndexedDB
    const saved = await SyncDB._idbLoad(config.name);
    const sqlDb = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();

    const db = new SyncDB(sqlDb, config);
    db._createTables();

    // First load → import from server/JSON seed files
    // Subsequent → refresh from server
    const firstTable = Object.keys(config.tables)[0];
    const count = db._scalar(`SELECT COUNT(*) FROM ${firstTable}`);
    if (count === 0) {
      await db._importAll();
    } else {
      await db.pullAll();
    }

    // Background auto-save (safety net; mutations also flush immediately)
    db._saveInterval = setInterval(() => {
      if (db._dirty) { db._persist(); db._pushDirty(); db._dirty = false; }
    }, 5000);

    return db;
  }

  // ═══════════════════════════════════════════════════════════════
  // Schema
  // ═══════════════════════════════════════════════════════════════
  _createTables() {
    for (const [name, def] of Object.entries(this._config.tables)) {
      this._db.run(`CREATE TABLE IF NOT EXISTS ${name} (${def.columns})`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════
  
  /** Get all rows from a table */
  all(table, where = '', params = []) {
    const def = this._config.tables[table];
    if (!def) throw new Error(`Unknown table: ${table}`);
    let sql = `SELECT * FROM ${table}`;
    if (where) sql += ` WHERE ${where}`;
    return this._query(sql, params).map(r => this._hydrate(r, def));
  }

  /** Get one row by id */
  get(table, id) {
    const def = this._config.tables[table];
    if (!def) throw new Error(`Unknown table: ${table}`);
    const pk = def.columns.trim().split(/\s+/)[0];
    const rows = this._query(`SELECT * FROM ${table} WHERE ${pk} = ?`, [id]);
    return rows.length ? this._hydrate(rows[0], def) : null;
  }

  /** Insert or replace a row. JSON fields are auto-stringified. */
  upsert(table, row) {
    const def = this._config.tables[table];
    if (!def) throw new Error(`Unknown table: ${table}`);

    const cols = def.columns.split(',').map(c => c.trim().split(/\s+/)[0]);
    const values = cols.map(col => {
      const val = row[col];
      if ((def.jsonFields || []).includes(col) && val !== undefined && typeof val !== 'string') {
        return JSON.stringify(val);
      }
      if (typeof val === 'boolean') return val ? 1 : 0;
      return val !== undefined ? val : null;
    });

    const placeholders = cols.map(() => '?').join(',');
    this._db.run(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, values);
    this._markDirty(table);
    this._flushSync();
  }

  /** Delete a row by primary key */
  remove(table, id) {
    const def = this._config.tables[table];
    if (!def) throw new Error(`Unknown table: ${table}`);
    const pk = def.columns.trim().split(/\s+/)[0];
    this._db.run(`DELETE FROM ${table} WHERE ${pk} = ?`, [id]);
    this._markDirty(table);
    this._flushSync();
  }

  /** Run a raw SELECT query */
  query(sql, params = []) {
    return this._query(sql, params);
  }

  /** Run a raw write query */
  run(sql, params = []) {
    this._db.run(sql, params);
    // Try to detect table
    const match = sql.match(/(?:INSERT|UPDATE|DELETE|REPLACE).*?(?:INTO|FROM|UPDATE)\s+(\w+)/i);
    if (match) this._markDirty(match[1]);
  }

  /** Get a scalar value */
  scalar(sql, params = []) {
    return this._scalar(sql, params);
  }

  // ═══════════════════════════════════════════════════════════════
  // Server Sync
  // ═══════════════════════════════════════════════════════════════

  /** Pull all tables from server (overwrites local) */
  async pullAll() {
    try {
      this._db.run('BEGIN TRANSACTION');
      for (const [table, def] of Object.entries(this._config.tables)) {
        if (!def.file) continue;
        const data = await this._fetchFile(def.file);
        if (data && data.length > 0) {
          this._db.run(`DELETE FROM ${table}`);
          const cols = def.columns.split(',').map(c => c.trim().split(/\s+/)[0]);
          const placeholders = cols.map(() => '?').join(',');
          for (const row of data) {
            const values = cols.map(col => {
              const val = row[col];
              if ((def.jsonFields || []).includes(col) && val !== undefined && typeof val !== 'string') {
                return JSON.stringify(val);
              }
              if (typeof val === 'boolean') return val ? 1 : 0;
              return val !== undefined ? val : null;
            });
            this._db.run(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, values);
          }
        }
      }
      this._db.run('COMMIT');
      this._dirty = false;
      this._syncQueue.clear();
      await this._persist();
      console.log('[SyncDB] Pulled from server');
    } catch(e) {
      console.warn('[SyncDB] Pull failed:', e);
      try { this._db.run('ROLLBACK'); } catch(e2) {}
    }
  }

  /** Push all tables to server */
  async pushAll() {
    for (const [table, def] of Object.entries(this._config.tables)) {
      if (!def.file) continue;
      await this._pushTable(table, def);
    }
  }

  /** Push only dirty tables */
  async _pushDirty() {
    if (this._syncQueue.size === 0) return;
    const tables = [...this._syncQueue];
    this._syncQueue.clear();
    for (const table of tables) {
      const def = this._config.tables[table];
      if (def && def.file) await this._pushTable(table, def);
    }
  }

  async _pushTable(table, def) {
    try {
      const rows = this.all(table);
      await fetch(`/api/sync/${def.file}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows, null, 2)
      });
      console.log(`[SyncDB] Pushed ${table} → server (${rows.length} rows)`);
    } catch(e) {
      console.warn(`[SyncDB] Push failed for ${table}:`, e);
      this._syncQueue.add(table);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Import (first load from seed JSON files)
  // ═══════════════════════════════════════════════════════════════
  async _importAll() {
    try {
      this._db.run('BEGIN TRANSACTION');
      for (const [table, def] of Object.entries(this._config.tables)) {
        if (!def.file) continue;
        const data = await this._fetchFile(def.file);
        if (!data || data.length === 0) continue;
        const cols = def.columns.split(',').map(c => c.trim().split(/\s+/)[0]);
        const placeholders = cols.map(() => '?').join(',');
        for (const row of data) {
          const values = cols.map(col => {
            const val = row[col];
            if ((def.jsonFields || []).includes(col) && val !== undefined && typeof val !== 'string') {
              return JSON.stringify(val);
            }
            if (typeof val === 'boolean') return val ? 1 : 0;
            return val !== undefined ? val : null;
          });
          this._db.run(`INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, values);
        }
        console.log(`[SyncDB] Imported ${data.length} rows into ${table}`);
      }
      this._db.run('COMMIT');
      this._dirty = false;
      await this._persist();
    } catch(e) {
      console.error('[SyncDB] Import failed:', e);
      try { this._db.run('ROLLBACK'); } catch(e2) {}
    }
  }

  async _fetchFile(name) {
    // Try sync API first (has latest data), fall back to static file
    try {
      const res = await fetch(`/api/sync/${name}`);
      if (res.ok) return await res.json();
    } catch(e) {}
    try {
      const res = await fetch(`./data/${name}`);
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  }

  // ═══════════════════════════════════════════════════════════════
  // IndexedDB Persistence
  // ═══════════════════════════════════════════════════════════════
  async _persist() {
    const data = this._db.export();
    await SyncDB._idbSave(this._config.name, data.buffer);
  }

  static _idbOpen(name) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(`syncdb-${name}`, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('db');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  static async _idbSave(name, buffer) {
    const idb = await SyncDB._idbOpen(name);
    return new Promise((resolve, reject) => {
      const tx = idb.transaction('db', 'readwrite');
      tx.objectStore('db').put(buffer, 'sqlite');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  static async _idbLoad(name) {
    try {
      const idb = await SyncDB._idbOpen(name);
      return new Promise((resolve) => {
        const tx = idb.transaction('db', 'readonly');
        const req = tx.objectStore('db').get('sqlite');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch(e) { return null; }
  }

  // ═══════════════════════════════════════════════════════════════
  // Internal Helpers
  // ═══════════════════════════════════════════════════════════════
  _query(sql, params = []) {
    const stmt = this._db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  _scalar(sql, params = []) {
    const rows = this._query(sql, params);
    return rows.length ? Object.values(rows[0])[0] : null;
  }

  _hydrate(row, def) {
    const obj = { ...row };
    for (const f of (def.jsonFields || [])) {
      if (f in obj && typeof obj[f] === 'string') {
        try { obj[f] = JSON.parse(obj[f]); } catch(e) { obj[f] = []; }
      }
    }
    // Convert integer booleans back if column name suggests boolean
    for (const f of (def.boolFields || [])) {
      if (f in obj) obj[f] = !!obj[f];
    }
    return obj;
  }

  _markDirty(table) {
    this._dirty = true;
    if (this._syncQueue) this._syncQueue.add(table);
  }

  _flushSync() {
    this._persist();
    this._pushDirty();
    this._dirty = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════════════════════════

  /** Export all tables as { tableName: [...rows] } */
  exportJSON() {
    const result = {};
    for (const table of Object.keys(this._config.tables)) {
      result[table] = this.all(table);
    }
    return result;
  }

  /** Get row counts per table */
  stats() {
    const result = {};
    for (const table of Object.keys(this._config.tables)) {
      result[table] = this._scalar(`SELECT COUNT(*) FROM ${table}`);
    }
    return result;
  }

  /** Reset: wipe local DB and reimport from server */
  async reset() {
    for (const table of Object.keys(this._config.tables)) {
      this._db.run(`DELETE FROM ${table}`);
    }
    await this._importAll();
    await this._persist();
  }
}

window.SyncDB = SyncDB;
