// ─── Client Health Summary (Dashboard Widget) ────────────
class CcClientHealthSummary extends HTMLElement {
  connectedCallback() { this._load(); }
  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  _escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try { this._data = await (await fetch(src)).json(); this._render(); } catch (e) { console.error('cc-client-health-summary:', e); }
  }

  _dotColor(health) {
    return health === 'green' ? 'var(--green)' : health === 'yellow' ? 'var(--yellow)' : 'var(--red)';
  }
  _trendArrow(trend) { return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'; }
  _trendColor(trend) { return trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--muted)'; }

  _render() {
    const data = this._data || [];
    const rows = data.map(c => `
      <div class="health-item">
        <span class="health-indicator ${c.health}"></span>
        <span class="health-client">${this._esc(c.client)}</span>
        <span class="health-score ${c.health}">${c.score}</span>
        <span class="health-trend ${c.trend === 'up' ? 'up' : c.trend === 'down' ? 'down' : 'flat'}">${this._trendArrow(c.trend)}</span>
      </div>
    `).join('');

    this.innerHTML = `
    <div class="panel">
      <div class="panel-header flex justify-between items-center">
        <span>🏥 Client Health</span>
        <a href="index.html" class="view-all-link">View all →</a>
      </div>
      ${rows || '<cc-empty-state message="No client health data" icon="💚" animation="none"></cc-empty-state>'}
    </div>`;
  }
}
customElements.define('cc-client-health-summary', CcClientHealthSummary);
