/* cc-concerts — Supabase data layer */

class ConcertsDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new ConcertsDB(window.supabase);
  }

  async getConcerts({ genre, search, orderBy = 'date', desc = false } = {}) {
    const filters = {};
    if (genre && genre !== 'all') filters.genre = `eq.${genre}`;
    if (search) filters.or = `(artist.ilike.*${search}*,venue.ilike.*${search}*,city.ilike.*${search}*)`;
    return this._sb.select('concerts', { filters, order: `${orderBy}.${desc ? 'desc' : 'asc'}` });
  }

  async getConcert(id) {
    const rows = await this._sb.select('concerts', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async upsertConcert(row) {
    row.updated_at = new Date().toISOString();
    if (!row.created_at) row.created_at = new Date().toISOString();
    if (!row.id) row.id = 'c-' + Date.now();
    return this._sb.upsert('concerts', row);
  }

  async deleteConcert(id) {
    return this._sb.delete('concerts', { id: `eq.${id}` });
  }

  async getRsvps(concertId) {
    const filters = {};
    if (concertId) filters.concert_id = `eq.${concertId}`;
    return this._sb.select('concert_rsvps', { filters });
  }

  async getAllRsvps() {
    return this._sb.select('concert_rsvps', {});
  }

  async toggleRsvp(concertId, userName, userInitials) {
    // Check if RSVP exists
    const existing = await this._sb.select('concert_rsvps', {
      filters: { concert_id: `eq.${concertId}`, user_name: `eq.${userName}` },
      limit: 1
    });
    if (existing.length) {
      // Toggle: if going, remove; if not, set to going
      if (existing[0].status === 'going') {
        await this._sb.delete('concert_rsvps', { id: `eq.${existing[0].id}` });
        return null;
      } else {
        await this._sb.update('concert_rsvps', { status: 'going' }, { id: `eq.${existing[0].id}` });
        return 'going';
      }
    } else {
      await this._sb.upsert('concert_rsvps', {
        id: 'r-' + Date.now(),
        concert_id: concertId,
        user_name: userName,
        user_initials: userInitials,
        status: 'going',
        created_at: new Date().toISOString()
      });
      return 'going';
    }
  }
}

window.ConcertsDB = ConcertsDB;
