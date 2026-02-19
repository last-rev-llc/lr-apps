// ─── Client Health Scorecard ──────────────────────────────
class CcClientHealth extends HTMLElement {
  connectedCallback() {
    this._expandedClient = null;
    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try { this._data = await (await fetch(src)).json(); this._render(); } catch (e) { console.error('cc-client-health:', e); }
  }

  _toggle(client) { this._expandedClient = this._expandedClient === client ? null : client; this._render(); }

  _scoreColor(health) {
    return health === 'green' ? 'var(--green)' : health === 'yellow' ? 'var(--yellow)' : 'var(--red)';
  }

  _trendArrow(trend) {
    return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  }

  _trendColor(trend) {
    return trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--muted)';
  }

  _render() {
    const data = this._data || [];
    const cards = data.map(c => {
      const color = this._scoreColor(c.health);
      const expanded = this._expandedClient === c.client;
      const deploy = c.metrics.lastDeploy ? new Date(c.metrics.lastDeploy).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

      const alertsHtml = (c.alerts || []).map(a =>
        `<div class="alert-box">${this._esc(a)}</div>`
      ).join('');

      const repoRows = (c.repoDetails || []).map(r =>
        `<tr><td class="muted" style="padding:4px 8px;font-size:12px;color:var(--text)">${this._esc(r.name)}</td>
         <td class="center muted" style="padding:4px 8px;font-size:12px">${r.commits}</td>
         <td class="center muted" style="padding:4px 8px;font-size:12px">${r.openPRs}</td>
         <td class="center muted" style="padding:4px 8px;font-size:12px">${r.openIssues}</td></tr>`
      ).join('');

      const repoSection = expanded ? `
        <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
          <table class="data-table">
            <thead><tr>
              <th>Repo</th>
              <th class="center">Commits</th>
              <th class="center">PRs</th>
              <th class="center">Issues</th>
            </tr></thead>
            <tbody>${repoRows}</tbody>
          </table>
        </div>` : '';

      return `
      <div class="card" style="cursor:pointer"
           data-client="${this._esc(c.client)}" onclick="this.closest('cc-client-health')._toggle(this.dataset.client)">
        <div class="health-card-top">
          <div class="health-card-score" style="color:${color}">${c.score}</div>
          <div style="flex:1">
            <div class="health-card-name">${this._esc(c.client)}</div>
            <div class="health-card-repos">${c.repos?.length || 0} repos</div>
          </div>
          <div class="health-card-trend" style="color:${this._trendColor(c.trend)}">${this._trendArrow(c.trend)}</div>
        </div>
        <div class="health-stats" style="margin-bottom:${(c.alerts||[]).length ? '12' : '0'}px">
          <div class="stat-box">
            <div class="stat-box-value">${c.metrics.commitsLast7d}</div>
            <div class="stat-box-label">Commits 7d</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${c.metrics.openPRs}</div>
            <div class="stat-box-label">Open PRs</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${c.metrics.openIssues}</div>
            <div class="stat-box-label">Open Issues</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${deploy}</div>
            <div class="stat-box-label">Last Deploy</div>
          </div>
        </div>
        ${alertsHtml ? `<div class="flex flex-col gap-2">${alertsHtml}</div>` : ''}
        ${repoSection}
        <div style="text-align:center;margin-top:8px;font-size:11px;color:var(--muted)">${expanded ? '▲ collapse' : '▼ click to expand'}</div>
      </div>`;
    }).join('');

    this.innerHTML = cards
      ? `<div class="health-grid">${cards}</div>`
      : '<cc-empty-state message="No client health data available" icon="💚" animation="none"></cc-empty-state>';
  }
}
customElements.define('cc-client-health', CcClientHealth);
