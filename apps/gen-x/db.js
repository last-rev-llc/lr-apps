/* gen-x — Supabase data layer */

class GenXDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new GenXDB(window.supabase);
  }

  /** Get all slang, optionally filtered by category */
  async getAll({ category, search, orderBy = 'vibe_score', desc = true } = {}) {
    const filters = {};
    if (category && category !== 'all') filters.category = `eq.${category}`;
    if (search) filters.or = `(term.ilike.*${search}*,definition.ilike.*${search}*)`;
    return this._sb.select('slang', {
      filters,
      order: `${orderBy}.${desc ? 'desc' : 'asc'}`
    });
  }

  /** Get one slang term by id */
  async get(id) {
    const rows = await this._sb.select('slang', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  /** Get distinct categories */
  async getCategories() {
    const rows = await this._sb.select('slang', { select: 'category' });
    return ['all', ...new Set(rows.map(r => r.category).filter(Boolean))];
  }

  /** Upsert a slang term */
  async upsert(row) {
    row.updated_at = new Date().toISOString();
    if (!row.created_at) row.created_at = new Date().toISOString();
    return this._sb.upsert('slang', row);
  }

  /** Delete a slang term */
  async remove(id) {
    return this._sb.delete('slang', { id: `eq.${id}` });
  }

  /** Get top N by vibe score */
  async getTrending(limit = 20) {
    return this._sb.select('slang', { order: 'vibe_score.desc', limit });
  }
}

window.GenXDB = GenXDB;
