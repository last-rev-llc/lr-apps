// ─── Client Health Summary (Dashboard Widget) ────────────
class CcClientHealthSummary extends HTMLElement {
  connectedCallback() { this._load(); }
  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try { this._data = await (await fetch(src)).json(); this._render(); } catch (e) { console.error('cc-client-health-summary:', e); }
  }

  _dotColor(health) {
    return health === 'green' ? '#22c55e' : health === 'yellow' ? '#eab308' : '#ef4444';
  }
  _trendArrow(trend) { return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'; }
  _trendColor(trend) { return trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#71717a'; }

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
        <a href="client-health.html" class="view-all-link">View all →</a>
      </div>
      ${rows || '<div class="text-muted text-sm">No data</div>'}
    </div>`;
  }
}
customElements.define('cc-client-health-summary', CcClientHealthSummary);
