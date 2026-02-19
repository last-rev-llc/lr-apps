class GenYSummary extends HTMLElement {
  constructor() { super(); this.slang = []; }
  _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  connectedCallback() { this.loadData(); }

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
    const catColors = (typeof GenY !== 'undefined' && GenY.CAT_COLORS) || { 'Approval': '#22c55e', 'Insult': '#ef4444', 'Reaction': '#eab308', 'Lifestyle': '#1da1f2', 'Disapproval': '#f97316', 'Greeting': '#06b6d4', 'Internet Culture': '#ec4899', 'Relationships': '#8b5cf6' };

    this.innerHTML = `
      <style>
        .gys-wrap{padding:4px 0;}
        .gys-stats{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;}
        .gys-stat{text-align:center;}
        .gys-stat-num{font-size:1.8rem;font-weight:900;color:#1da1f2;}
        .gys-stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;}
        .gys-top{display:flex;gap:8px;flex-wrap:wrap;}
        .gys-chip{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;background:rgba(29,161,242,.12);border:1px solid rgba(29,161,242,.2);}
        .gys-cats{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;}
        .gys-cat{font-size:11px;padding:3px 8px;border-radius:6px;}
      </style>
      <div class="gys-wrap">
        <div class="gys-stats">
          <div class="gys-stat"><div class="gys-stat-num">${this.slang.length}</div><div class="gys-stat-label">Terms</div></div>
          <div class="gys-stat"><div class="gys-stat-num">${avgVibe}</div><div class="gys-stat-label">Avg Vibe</div></div>
          <div class="gys-stat"><div class="gys-stat-num">${Object.keys(cats).length}</div><div class="gys-stat-label">Categories</div></div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🔥 Top Vibes</div>
        <div class="gys-top">
          ${top5.map(s => `<span class="gys-chip">${this._esc(s.term)} (${s.vibeScore})</span>`).join('')}
        </div>
        <div class="gys-cats">
          ${Object.entries(cats).map(([c, n]) => `<span class="gys-cat" style="background:${catColors[c] || '#6b7280'}22;color:${catColors[c] || '#6b7280'};">${this._esc(c)} (${n})</span>`).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('gen-y-summary', GenYSummary);
