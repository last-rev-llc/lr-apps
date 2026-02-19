/* slang-translator — Supabase + JSON data layer */

class SlangTranslatorDB {
  constructor(sb) { this._sb = sb; this._genX = []; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    const db = new SlangTranslatorDB(window.supabase);
    await db._loadGenX();
    return db;
  }

  async _loadGenX() {
    try {
      const r = await fetch('data/gen-x-slang.json');
      const raw = await r.json();
      this._genX = raw.map(s => ({
        ...s,
        generation: 'gen-x',
        vibe_score: s.vibeScore ?? s.vibe_score ?? 0,
        vibeScore: s.vibeScore ?? s.vibe_score ?? 0
      }));
    } catch (e) { console.error('Failed to load Gen X data:', e); this._genX = []; }
  }

  async getAll({ category, search, generation, orderBy = 'vibe_score', desc = true } = {}) {
    const filters = {};
    if (category && category !== 'all') filters.category = `eq.${category}`;
    if (search) filters.or = `(term.ilike.*${search}*,definition.ilike.*${search}*)`;
    let genAlpha = await this._sb.select('slang', { filters, order: `${orderBy}.${desc ? 'desc' : 'asc'}` });
    genAlpha = genAlpha.map(r => ({
      ...r,
      generation: 'gen-alpha',
      vibeScore: r.vibe_score ?? r.vibeScore ?? 0
    }));

    let genX = [...this._genX];
    if (category && category !== 'all') genX = genX.filter(s => s.category === category);
    if (search) {
      const q = search.toLowerCase();
      genX = genX.filter(s => s.term.toLowerCase().includes(q) || s.definition.toLowerCase().includes(q));
    }
    if (desc) genX.sort((a, b) => (b.vibe_score || 0) - (a.vibe_score || 0));
    else genX.sort((a, b) => (a.vibe_score || 0) - (b.vibe_score || 0));

    let all;
    if (generation === 'gen-alpha') all = genAlpha;
    else if (generation === 'gen-x') all = genX;
    else all = [...genAlpha, ...genX];

    if (desc) all.sort((a, b) => (b.vibeScore || b.vibe_score || 0) - (a.vibeScore || a.vibe_score || 0));
    else all.sort((a, b) => (a.vibeScore || a.vibe_score || 0) - (b.vibeScore || b.vibe_score || 0));
    return all;
  }

  async getCategories() {
    const rows = await this._sb.select('slang', { select: 'category' });
    const genAlphaCats = rows.map(r => r.category).filter(Boolean);
    const genXCats = this._genX.map(s => s.category).filter(Boolean);
    return ['all', ...new Set([...genAlphaCats, ...genXCats])];
  }

  getGenX() { return this._genX; }

  async getGenAlpha() {
    const rows = await this._sb.select('slang', { order: 'vibe_score.desc' });
    return rows.map(r => ({ ...r, generation: 'gen-alpha', vibeScore: r.vibe_score ?? r.vibeScore ?? 0 }));
  }

  getPairs() {
    // Reuse the canonical map from SlangTranslator component to avoid duplication
    if (window.customElements.get('slang-translator')) {
      return window.SlangTranslator?.GEN_X_MAP || {};
    }
    // Fallback: import from the component's static property
    return typeof SlangTranslator !== 'undefined' ? SlangTranslator.GEN_X_MAP : {};
  }
}

window.SlangTranslatorDB = SlangTranslatorDB;
