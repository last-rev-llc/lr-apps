/* cc-pr-review — Supabase data layer */

class PrReviewDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new PrReviewDB(window.supabase);
  }

  async getAll({ app_name, status, review_type, search, orderBy = 'reviewed_at', desc = true } = {}) {
    const filters = {};
    if (app_name && app_name !== 'all') filters.app_name = `eq.${app_name}`;
    if (status && status !== 'all') filters.status = `eq.${status}`;
    if (review_type && review_type !== 'all') filters.review_type = `eq.${review_type}`;
    if (search) filters.or = `(summary.ilike.*${search}*,learnings.ilike.*${search}*)`;
    return this._sb.select('pr_reviews', {
      filters,
      order: `${orderBy}.${desc ? 'desc' : 'asc'}`
    });
  }

  async get(id) {
    const rows = await this._sb.select('pr_reviews', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async upsert(row) {
    row.updated_at = new Date().toISOString();
    if (!row.created_at) row.created_at = new Date().toISOString();
    return this._sb.upsert('pr_reviews', row);
  }

  async remove(id) {
    return this._sb.delete('pr_reviews', { id: `eq.${id}` });
  }
}

window.PrReviewDB = PrReviewDB;
