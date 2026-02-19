class GenBoomersSummary extends HTMLElement {
  constructor() { super(); this.slang = []; }
  connectedCallback() { this.loadData(); }

  _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }

  async loadData() {
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
    const catColors = { 'Approval': '#22c55e', 'Disapproval': '#ef4444', 'Reaction': '#eab308', 'Lifestyle': '#ff6347', 'Compliment': '#ec4899', 'Greeting': '#06b6d4' };

    this.innerHTML = `
      <style>
        .gbs-wrap{--app-accent:#ff6347;padding:4px 0;}
        .gbs-stats{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;}
        .gbs-stat{text-align:center;}
        .gbs-stat-num{font-size:1.8rem;font-weight:900;color:var(--app-accent,#ff6347);}
        .gbs-stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;}
        .gbs-top{display:flex;gap:8px;flex-wrap:wrap;}
        .gbs-chip{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;background:color-mix(in srgb,var(--app-accent,#ff6347) 12%,transparent);border:1px solid color-mix(in srgb,var(--app-accent,#ff6347) 20%,transparent);}
        .gbs-cats{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;}
        .gbs-cat{font-size:11px;padding:3px 8px;border-radius:6px;}
      </style>
      <div class="gbs-wrap">
        <div class="gbs-stats">
          <div class="gbs-stat"><div class="gbs-stat-num">${this.slang.length}</div><div class="gbs-stat-label">Terms</div></div>
          <div class="gbs-stat"><div class="gbs-stat-num">${avgVibe}</div><div class="gbs-stat-label">Avg Vibe</div></div>
          <div class="gbs-stat"><div class="gbs-stat-num">${Object.keys(cats).length}</div><div class="gbs-stat-label">Categories</div></div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🔥 Top Vibes</div>
        <div class="gbs-top">
          ${top5.map(s => `<span class="gbs-chip">${this._esc(s.term)} (${s.vibeScore})</span>`).join('')}
        </div>
        <div class="gbs-cats">
          ${Object.entries(cats).map(([c, n]) => `<span class="gbs-cat" style="background:${catColors[c] || '#6b7280'}22;color:${catColors[c] || '#6b7280'};">${this._esc(c)} (${n})</span>`).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('gen-boomers-summary', GenBoomersSummary);
