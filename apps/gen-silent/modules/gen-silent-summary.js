class GenSilentSummary extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute('src') || 'data/slang.json';
    fetch(src).then(r => r.json()).then(data => this.render(data)).catch(() => {
      this.innerHTML = '<cc-empty-state message="Could not load summary data" icon="📊" animation="none"></cc-empty-state>';
    });
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  render(data) {
    const total = data.length;
    const avgVibe = (data.reduce((s, d) => s + d.vibeScore, 0) / total).toFixed(1);
    const cats = {};
    data.forEach(d => { cats[d.category] = (cats[d.category] || 0) + 1; });
    const top5 = [...data].sort((a, b) => b.vibeScore - a.vibeScore).slice(0, 5);

    this.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;">
        <div class="card" style="text-align:center;padding:16px;">
          <div style="font-size:2rem;font-weight:900;color:#b8860b;">${total}</div>
          <div style="font-size:12px;color:var(--muted);">Total Terms</div>
        </div>
        <div class="card" style="text-align:center;padding:16px;">
          <div style="font-size:2rem;font-weight:900;color:#b8860b;">${avgVibe}</div>
          <div style="font-size:12px;color:var(--muted);">Avg Vibe</div>
        </div>
        <div class="card" style="text-align:center;padding:16px;">
          <div style="font-size:2rem;font-weight:900;color:#b8860b;">${Object.keys(cats).length}</div>
          <div style="font-size:12px;color:var(--muted);">Categories</div>
        </div>
      </div>
      <div class="card" style="padding:16px;">
        <h4 style="margin:0 0 8px;font-size:13px;color:var(--muted);">Top Terms</h4>
        ${top5.map((t, i) => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);">
          <span style="font-weight:600;">${i + 1}. ${this._esc(t.term)}</span>
          <span style="color:#b8860b;font-weight:700;">${t.vibeScore}/10</span>
        </div>`).join('')}
      </div>
    `;
  }
}
customElements.define('gen-silent-summary', GenSilentSummary);
