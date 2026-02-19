/* gen-z — Supabase data layer */

class GenZDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new GenZDB(window.supabase);
  }

  async getAll({ category, search, orderBy = 'vibe_score', desc = true } = {}) {
    const filters = { generation: 'eq.genz' };
    if (category && category !== 'all') filters.category = `eq.${category}`;
    if (search) filters.or = `(term.ilike.*${search}*,definition.ilike.*${search}*)`;
    return this._sb.select('slang', {
      filters,
      order: `${orderBy}.${desc ? 'desc' : 'asc'}`
    });
  }

  async get(id) {
    const rows = await this._sb.select('slang', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async getCategories() {
    const rows = await this._sb.select('slang', { select: 'category', filters: { generation: 'eq.genz' } });
    return ['all', ...new Set(rows.map(r => r.category).filter(Boolean))];
  }

  async upsert(row) {
    row.updated_at = new Date().toISOString();
    if (!row.created_at) row.created_at = new Date().toISOString();
    if (!row.generation) row.generation = 'genz';
    return this._sb.upsert('slang', row);
  }

  async remove(id) {
    return this._sb.delete('slang', { id: `eq.${id}` });
  }

  async getTrending(limit = 20) {
    return this._sb.select('slang', { filters: { generation: 'eq.genz' }, order: 'vibe_score.desc', limit });
  }
}

window.GenZDB = GenZDB;
