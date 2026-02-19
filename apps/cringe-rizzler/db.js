/* cringe-rizzler — Supabase data layer */

class CringeRizzlerDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new CringeRizzlerDB(window.supabase);
  }

  async getAll({ type, search, orderBy = 'created_at', desc = true } = {}) {
    const filters = {};
    if (type && type !== 'all') filters.type = `eq.${type}`;
    if (search) filters.or = `(content.ilike.*${search}*,scenario.ilike.*${search}*)`;
    return this._sb.select('cringe_rizzler', {
      filters,
      order: `${orderBy}.${desc ? 'desc' : 'asc'}`
    });
  }

  async get(id) {
    const rows = await this._sb.select('cringe_rizzler', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async upsert(row) {
    row.updated_at = new Date().toISOString();
    if (!row.created_at) row.created_at = new Date().toISOString();
    return this._sb.upsert('cringe_rizzler', row);
  }

  async remove(id) {
    return this._sb.delete('cringe_rizzler', { id: `eq.${id}` });
  }
}

window.CringeRizzlerDB = CringeRizzlerDB;
