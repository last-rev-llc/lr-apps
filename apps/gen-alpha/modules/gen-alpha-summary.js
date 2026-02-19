class GenAlphaSummary extends HTMLElement {
  constructor() { super(); this.slang = []; }

  _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  connectedCallback() { this.loadData(); }

  async loadData() {
    try {
      // Try Supabase first for consistent data with main component
      if (window.supabase) {
        const rows = await window.supabase.select('slang', { order: 'vibe_score.desc' });
        if (rows && rows.length) {
          this.slang = rows.map(r => ({ ...r, vibeScore: r.vibe_score ?? r.vibeScore ?? 0 }));
          this.render();
          return;
        }
      }
    } catch (e) { /* fall through to JSON */ }
    // JSON fallback
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      const r = await fetch(src);
      this.slang = await r.json();
      this.render();
    } catch (e) {
      this.innerHTML = `<cc-empty-state message="Failed to load slang data" icon="😵"></cc-empty-state>`;
    }
  }

  render() {
    const cats = {};
    this.slang.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1; });
    const top5 = [...this.slang].sort((a, b) => b.vibeScore - a.vibeScore).slice(0, 5);
    const avgVibe = (this.slang.reduce((a, s) => a + s.vibeScore, 0) / this.slang.length).toFixed(1);

    const catColors = { compliment: '#22c55e', insult: '#ef4444', reaction: '#eab308', lifestyle: '#8b5cf6', 'internet culture': '#06b6d4' };

    this.innerHTML = `
      <style>
        .gas-wrap{padding:4px 0;}
        .gas-stats{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;}
        .gas-stat{text-align:center;}
        .gas-stat-num{font-size:1.8rem;font-weight:900;color:var(--accent);}
        .gas-stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;}
        .gas-top{display:flex;gap:8px;flex-wrap:wrap;}
        .gas-chip{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.2);}
        .gas-cats{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;}
        .gas-cat{font-size:11px;padding:3px 8px;border-radius:6px;}
      </style>
      <div class="gas-wrap">
        <div class="gas-stats">
          <div class="gas-stat"><div class="gas-stat-num">${this.slang.length}</div><div class="gas-stat-label">Terms</div></div>
          <div class="gas-stat"><div class="gas-stat-num">${avgVibe}</div><div class="gas-stat-label">Avg Vibe</div></div>
          <div class="gas-stat"><div class="gas-stat-num">${Object.keys(cats).length}</div><div class="gas-stat-label">Categories</div></div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🔥 Top Vibes</div>
        <div class="gas-top">
          ${top5.map(s => `<span class="gas-chip">${this._esc(s.term)} (${s.vibeScore})</span>`).join('')}
        </div>
        <div class="gas-cats">
          ${Object.entries(cats).map(([c, n]) => `<span class="gas-cat" style="background:${catColors[c] || '#6b7280'}22;color:${catColors[c] || '#6b7280'};">${this._esc(c)} (${n})</span>`).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('gen-alpha-summary', GenAlphaSummary);
