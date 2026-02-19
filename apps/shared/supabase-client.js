/* ── Shared Supabase Client ──────────────────────────────────
   Lightweight REST client for Supabase PostgREST API.
   Usage:
     const sb = new SupabaseClient(url, anonKey);
     const rows = await sb.select('ideas');
     await sb.upsert('ideas', { id: 'x', title: 'Hello' });
     await sb.update('ideas', { status: 'done' }, { id: 'eq.x' });
     await sb.delete('ideas', { id: 'eq.x' });
*/

class SupabaseClient {
  constructor(url, key) {
    this.url = url.replace(/\/$/, '');
    this.key = key;
    this._headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  /** SELECT rows. filters = { col: 'eq.value', ... } or query string */
  async select(table, { filters = {}, order, limit, offset, select = '*' } = {}) {
    let qs = `select=${select}`;
    for (const [k, v] of Object.entries(filters)) qs += `&${k}=${v}`;
    if (order) qs += `&order=${order}`;
    if (limit) qs += `&limit=${limit}`;
    if (offset) qs += `&offset=${offset}`;
    const res = await fetch(`${this.url}/rest/v1/${table}?${qs}`, { headers: this._headers });
    if (!res.ok) throw new Error(`Supabase SELECT ${table}: ${res.status}`);
    return res.json();
  }

  /** UPSERT (insert or update on conflict). rows = object or array */
  async upsert(table, rows) {
    const body = Array.isArray(rows) ? rows : [rows];
    const headers = { ...this._headers, 'Prefer': 'return=representation,resolution=merge-duplicates' };
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST', headers, body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase UPSERT ${table}: ${res.status} ${err}`);
    }
    return res.json();
  }

  /** UPDATE rows matching filters. filters = { col: 'eq.value' } */
  async update(table, data, filters = {}) {
    let qs = '';
    for (const [k, v] of Object.entries(filters)) qs += `${qs ? '&' : '?'}${k}=${v}`;
    const res = await fetch(`${this.url}/rest/v1/${table}${qs}`, {
      method: 'PATCH', headers: this._headers, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Supabase UPDATE ${table}: ${res.status}`);
    return res.json();
  }

  /** DELETE rows matching filters */
  async delete(table, filters = {}) {
    let qs = '';
    for (const [k, v] of Object.entries(filters)) qs += `${qs ? '&' : '?'}${k}=${v}`;
    const res = await fetch(`${this.url}/rest/v1/${table}${qs}`, {
      method: 'DELETE', headers: this._headers
    });
    if (!res.ok) throw new Error(`Supabase DELETE ${table}: ${res.status}`);
    return res.json();
  }
}

/* ── Global singleton ── */
window.SupabaseClient = SupabaseClient;

/* Auto-init if config is on the page */
(function() {
  const meta = document.querySelector('meta[name="supabase-url"]');
  const key = document.querySelector('meta[name="supabase-key"]');
  if (meta && key) {
    window.supabase = new SupabaseClient(meta.content, key.content);
  }
})();
