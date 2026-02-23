/* cc-prefs.js — Shared user preferences backed by Supabase with localStorage cache
   
   Usage:
     UserPrefs.get('hiddenIdeas')          → array/object (parsed JSON, from cache)
     UserPrefs.set('hiddenIdeas', [...])   → saves to Supabase + localStorage
     UserPrefs.ready                       → Promise that resolves when Supabase prefs are loaded

   Supabase table: user_prefs { id TEXT PK, key TEXT, value JSONB, updatedAt TEXT }
   Falls back to localStorage if Supabase is unavailable.
*/
(function() {
  let _cache = {};       // In-memory cache: key → parsed value
  let _loaded = false;
  let _readyResolve;
  const _ready = new Promise(r => { _readyResolve = r; });

  const KNOWN_KEYS = [
    'hiddenIdeas', 'ideaRatings', 'completedIdeas',
    'communityHidden', 'communityRatings', 'communityCompleted', 'pendingIdeas',
    'excludedPRs', 'excludedSlack', 'idea-ratings',
    'cc-dashboard-layout', 'travel-contacts', 'travel-reports'
  ];

  function _sb() { return window.supabase; }

  /** Load all prefs from Supabase into cache + localStorage */
  async function _loadFromSupabase() {
    const sb = _sb();
    if (!sb) return false;
    try {
      const rows = await sb.select('user_prefs');
      rows.forEach(r => {
        const val = r.value;
        _cache[r.key] = val;
        // Keep localStorage in sync as offline cache
        try { localStorage.setItem(r.key, typeof val === 'string' ? val : JSON.stringify(val)); } catch(e) {}
      });
      return true;
    } catch(e) {
      console.warn('cc-prefs: Supabase load failed, using localStorage', e);
      return false;
    }
  }

  /** Migrate existing localStorage prefs to Supabase (one-time) */
  async function _migrateToSupabase() {
    const sb = _sb();
    if (!sb) return;
    const migrated = localStorage.getItem('_prefs_migrated_sb');
    if (migrated) return;

    const rows = [];
    KNOWN_KEYS.forEach(key => {
      const lsVal = localStorage.getItem(key);
      if (lsVal === null) return;
      // Skip if already in Supabase (loaded into cache)
      if (_cache.hasOwnProperty(key)) return;
      let parsed;
      try { parsed = JSON.parse(lsVal); } catch { parsed = lsVal; }
      rows.push({ id: key, key, value: parsed, updatedAt: new Date().toISOString() });
    });

    if (rows.length > 0) {
      try {
        await sb.upsert('user_prefs', rows);
        rows.forEach(r => { _cache[r.key] = r.value; });
      } catch(e) { console.warn('cc-prefs: migration failed', e); return; }
    }
    localStorage.setItem('_prefs_migrated_sb', '1');
  }

  async function _init() {
    const ok = await _loadFromSupabase();
    if (ok) await _migrateToSupabase();
    // Populate cache from localStorage for any keys not in Supabase
    KNOWN_KEYS.forEach(key => {
      if (_cache.hasOwnProperty(key)) return;
      const v = localStorage.getItem(key);
      if (v !== null) { try { _cache[key] = JSON.parse(v); } catch { _cache[key] = v; } }
    });
    _loaded = true;
    _readyResolve(true);
  }

  const UserPrefs = {
    ready: _ready,

    get(key, defaultVal) {
      if (_cache.hasOwnProperty(key)) return _cache[key];
      // Fallback to localStorage if cache miss
      const val = localStorage.getItem(key);
      if (val === null) return defaultVal !== undefined ? defaultVal : null;
      try { return JSON.parse(val); } catch { return val; }
    },

    set(key, value) {
      _cache[key] = value;
      // Write to localStorage as cache
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      try { localStorage.setItem(key, str); } catch(e) {}
      // Write to Supabase (fire-and-forget)
      const sb = _sb();
      if (sb) {
        sb.upsert('user_prefs', { id: key, key, value, updatedAt: new Date().toISOString() })
          .catch(e => console.warn('cc-prefs: Supabase write failed for', key, e));
      }
    },

    remove(key) {
      delete _cache[key];
      localStorage.removeItem(key);
      const sb = _sb();
      if (sb) {
        sb.delete('user_prefs', { id: `eq.${key}` })
          .catch(e => console.warn('cc-prefs: Supabase delete failed for', key, e));
      }
    },

    async init() {
      await _init();
    }
  };

  window.UserPrefs = UserPrefs;

  // Auto-init — wait a tick for supabase client to be ready
  function _autoInit() { setTimeout(_init, 100); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _autoInit);
  } else {
    _autoInit();
  }
})();
