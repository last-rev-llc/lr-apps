class GenZSummary extends HTMLElement {
  constructor() { super(); this.slang = []; }
  connectedCallback() { this.loadData(); }
  _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  async loadData() {
    try {
      // Try Supabase first (consistent with main gen-z.js component)
      if (window.supabase) {
        const rows = await window.supabase.select('slang', {
          filters: { generation: 'eq.genz' },
          order: 'vibe_score.desc'
        });
        if (rows && rows.length) {
          this.slang = rows.map(r => ({
            ...r,
            vibeScore: r.vibe_score ?? r.vibeScore ?? 0,
          }));
          this.render();
          return;
        }
      }
      // Fall back to JSON
      const src = this.getAttribute('src');
      if (!src) return;
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
    const catColors = { compliment: '#22c55e', insult: '#ef4444', reaction: '#eab308', lifestyle: '#e040fb', 'internet culture': '#06b6d4', dating: '#f472b6' };

    this.innerHTML = `
      <style>
        .gzs-wrap{padding:4px 0;}
        .gzs-stats{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;}
        .gzs-stat{text-align:center;}
        .gzs-stat-num{font-size:1.8rem;font-weight:900;color:#e040fb;}
        .gzs-stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;}
        .gzs-top{display:flex;gap:8px;flex-wrap:wrap;}
        .gzs-chip{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;background:rgba(224,64,251,.12);border:1px solid rgba(224,64,251,.2);}
        .gzs-cats{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;}
        .gzs-cat{font-size:11px;padding:3px 8px;border-radius:6px;}
      </style>
      <div class="gzs-wrap">
        <div class="gzs-stats">
          <div class="gzs-stat"><div class="gzs-stat-num">${this.slang.length}</div><div class="gzs-stat-label">Terms</div></div>
          <div class="gzs-stat"><div class="gzs-stat-num">${avgVibe}</div><div class="gzs-stat-label">Avg Vibe</div></div>
          <div class="gzs-stat"><div class="gzs-stat-num">${Object.keys(cats).length}</div><div class="gzs-stat-label">Categories</div></div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🔥 Top Vibes</div>
        <div class="gzs-top">
          ${top5.map(s => `<span class="gzs-chip">${this._esc(s.term)} (${s.vibeScore})</span>`).join('')}
        </div>
        <div class="gzs-cats">
          ${Object.entries(cats).map(([c, n]) => `<span class="gzs-cat" style="background:${catColors[c] || '#6b7280'}22;color:${catColors[c] || '#6b7280'};">${this._esc(c)} (${n})</span>`).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('gen-z-summary', GenZSummary);
