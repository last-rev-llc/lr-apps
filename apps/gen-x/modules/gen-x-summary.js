class GenXSummary extends HTMLElement {
  constructor() { super(); this.slang = []; } _esc(s) { if (!s) return ""; const d = document.createElement("div"); d.textContent = String(s); return d.innerHTML; }

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

    const catColors = { 'Approval': '#22c55e', 'Insult': '#ef4444', 'Reaction': '#eab308', 'Lifestyle': '#8b5cf6', 'Disapproval': '#f97316', 'Greeting': '#06b6d4', 'Internet Culture': '#ec4899' };

    this.innerHTML = `
      <style>
        .gxs-wrap{padding:4px 0;}
        .gxs-stats{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;}
        .gxs-stat{text-align:center;}
        .gxs-stat-num{font-size:1.8rem;font-weight:900;color:var(--accent);}
        .gxs-stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;}
        .gxs-top{display:flex;gap:8px;flex-wrap:wrap;}
        .gxs-chip{padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.2);}
        .gxs-cats{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;}
        .gxs-cat{font-size:11px;padding:3px 8px;border-radius:6px;}
      </style>
      <div class="gxs-wrap">
        <div class="gxs-stats">
          <div class="gxs-stat"><div class="gxs-stat-num">${this.slang.length}</div><div class="gxs-stat-label">Terms</div></div>
          <div class="gxs-stat"><div class="gxs-stat-num">${avgVibe}</div><div class="gxs-stat-label">Avg Vibe</div></div>
          <div class="gxs-stat"><div class="gxs-stat-num">${Object.keys(cats).length}</div><div class="gxs-stat-label">Categories</div></div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">🔥 Top Vibes</div>
        <div class="gxs-top">
          ${top5.map(s => `<span class="gxs-chip">${this._esc(s.term)} (${s.vibeScore})</span>`).join('')}
        </div>
        <div class="gxs-cats">
          ${Object.entries(cats).map(([c, n]) => `<span class="gxs-cat" style="background:${catColors[c] || '#6b7280'}22;color:${catColors[c] || '#6b7280'};">${c} (${n})</span>`).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('gen-x-summary', GenXSummary);
