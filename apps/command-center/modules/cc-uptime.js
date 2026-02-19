// ─── Uptime Status Widget ─────────────────────────────────
class CcUptime extends HTMLElement {
  connectedCallback() { this._load(); }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json();
      this._render();
    } catch (e) { console.error('cc-uptime:', e); }
  }

  _render() {
    const sites = this._data || [];
    const isWidget = this.getAttribute('layout') === 'list';
    const issues = sites.filter(s => s.status !== 'up');
    const sorted = [...issues, ...sites.filter(s => s.status === 'up')];

    const statusDot = (s) => {
      const cls = s === 'up' ? 'up' : s === 'down' ? 'down' : 'degraded';
      return `<span class="site-status ${cls}"></span>`;
    };

    const statusLabel = (s) => s === 'up' ? 'Up' : s === 'down' ? 'Down' : 'Degraded';

    const styles = `<style>
      cc-uptime .uptime-widget-list { list-style:none; padding:0; margin:0; }
      cc-uptime .uptime-widget-item { display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--glass-border, var(--border)); }
      cc-uptime .uptime-widget-item:last-child { border-bottom:none; }
      cc-uptime .uptime-widget-info { flex:1; min-width:0; }
      cc-uptime .uptime-widget-name { font-size:13px; font-weight:500; display:flex; align-items:center; gap:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      cc-uptime .uptime-widget-meta { font-size:11px; color:var(--muted); margin-top:2px; }
      cc-uptime .uptime-pct { font-size:12px; font-weight:600; white-space:nowrap; }
      cc-uptime .uptime-pct-good { color:var(--green,#10b981); }
      cc-uptime .uptime-pct-warn { color:var(--yellow,#f59e0b); }
      cc-uptime .uptime-pct-bad { color:var(--red,#ef4444); }
    </style>`;

    const pctClass = (p) => p >= 99.9 ? 'uptime-pct-good' : p >= 99 ? 'uptime-pct-warn' : 'uptime-pct-bad';
    const issueCount = issues.length;
    const badgeClass = issueCount > 0 ? 'badge-danger' : '';

    if (isWidget) {
      const allUpHtml = issueCount === 0 ? '<cc-empty-state message="All systems operational" icon="💚" animation="sparkle"></cc-empty-state>' : '';
      this.innerHTML = `${styles}
      <div class="panel">
        <div class="panel-header">📡 Uptime <span class="badge ${badgeClass}">${sites.length}</span>${issueCount > 0 ? ` <span class="badge badge-danger">${issueCount} issue${issueCount > 1 ? 's' : ''}</span>` : ''}</div>${allUpHtml}
        <div class="scrollable-body"><ul class="uptime-widget-list">${sorted.map(s => `
          <li class="uptime-widget-item">
            <div class="uptime-widget-info">
              <div class="uptime-widget-name">${statusDot(s.status)}${this._esc(s.name)}</div>
              <div class="uptime-widget-meta">${this._esc(s.url)} · ${s.responseTimeMs ? s.responseTimeMs + 'ms' : '—'}</div>
            </div>
            <div class="uptime-pct ${pctClass(s.uptimePercent)}">${s.uptimePercent}%</div>
          </li>`).join('')}</ul>
          <div class="p-2 text-center">
            <a href="https://uptime.adam-harris.alphaclaw.app" target="_blank" class="view-all-link">View Full Status →</a>
          </div>
        </div>
      </div>`;
      return;
    }

    // Full mode (not used currently but available)
    this.innerHTML = `${styles}<div class="panel"><div class="panel-header">📡 Uptime Status</div><div class="scrollable-body"><ul class="uptime-widget-list">${sorted.map(s => `
      <li class="uptime-widget-item">
        <div class="uptime-widget-info">
          <div class="uptime-widget-name">${statusDot(s.status)}${this._esc(s.name)} <span class="text-xs text-muted font-normal">${statusLabel(s.status)}</span></div>
          <div class="uptime-widget-meta">${this._esc(s.url)} · ${s.responseTimeMs ? s.responseTimeMs + 'ms' : '—'}</div>
        </div>
        <div class="uptime-pct ${pctClass(s.uptimePercent)}">${s.uptimePercent}%</div>
      </li>`).join('')}</ul></div></div>`;
  }
}
customElements.define('cc-uptime', CcUptime);
