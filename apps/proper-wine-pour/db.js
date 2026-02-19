/* proper-wine-pour — Supabase data layer */
class WinePourDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new WinePourDB(window.supabase);
  }

  async getPours({ rating, search, orderBy = 'created_at', desc = true } = {}) {
    const filters = {};
    if (rating && rating !== 'all') filters.pour_rating = `eq.${rating}`;
    if (search) filters.or = `(restaurant_name.ilike.*${search}*,wine_name.ilike.*${search}*)`;
    return this._sb.select('wine_pours', { filters, order: `${orderBy}.${desc ? 'desc' : 'asc'}` });
  }

  async addPour(pour) {
    pour.id = `pour-${Date.now()}`;
    pour.created_at = new Date().toISOString();
    return this._sb.upsert('wine_pours', pour);
  }

  async getWallPosts({ type, orderBy = 'created_at', desc = true } = {}) {
    const filters = {};
    if (type && type !== 'all') filters.pour_type = `eq.${type}`;
    return this._sb.select('pour_wall', { filters, order: `${orderBy}.${desc ? 'desc' : 'asc'}` });
  }

  async addWallPost(post) {
    post.id = `wall-${Date.now()}`;
    post.upvotes = 0;
    post.created_at = new Date().toISOString();
    return this._sb.upsert('pour_wall', post);
  }

  async upvoteWallPost(id, newCount) {
    return this._sb.update('pour_wall', { upvotes: newCount }, { id: `eq.${id}` });
  }
}
window.WinePourDB = WinePourDB;
