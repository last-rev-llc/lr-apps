// ─── Lighthouse Widget ─────────────────────────────────────
class CcLighthouse extends HTMLElement {
  connectedCallback() { this._load(); }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      const res = await fetch(src);
      this._data = await res.json();
      this._render();
    } catch (e) { console.error('cc-lighthouse:', e); }
  }

  _scoreColor(s) { return s >= 90 ? '#0cce6b' : s >= 50 ? '#ffa400' : '#ff4e42'; }
  _scoreClass(s) { return s >= 90 ? 'score-green' : s >= 50 ? 'score-yellow' : 'score-red'; }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  _getAlertCount() {
    const thresholds = { performance: 80, accessibility: 90, seo: 85, bestPractices: 85 };
    let count = 0;
    (this._data || []).forEach(site => {
      const last = site.audits?.[site.audits.length - 1];
      if (!last) return;
      for (const [k, t] of Object.entries(thresholds)) {
        if ((last[k] || 0) < t) { count++; break; }
      }
    });
    return count;
  }

  _render() {
    const sites = this._data || [];
    const thresholds = { performance: 80, accessibility: 90, seo: 85, bestPractices: 85 };
    const labels = { performance: 'Perf', accessibility: 'A11y', seo: 'SEO', bestPractices: 'BP' };
    const alertCount = this._getAlertCount();

    // Sort: sites with alerts first
    const sorted = [...sites].sort((a, b) => {
      const aLast = a.audits?.[a.audits.length - 1] || {};
      const bLast = b.audits?.[b.audits.length - 1] || {};
      const aAlert = Object.entries(thresholds).some(([k, t]) => (aLast[k] || 0) < t);
      const bAlert = Object.entries(thresholds).some(([k, t]) => (bLast[k] || 0) < t);
      if (aAlert && !bAlert) return -1;
      if (!aAlert && bAlert) return 1;
      return a.site.localeCompare(b.site);
    });

    const badge = alertCount > 0
      ? `<span class="badge badge-danger">${alertCount}</span>`
      : `<span class="badge">${sites.length}</span>`;

    this.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <span>🔦 Lighthouse ${badge}</span>
          <a href="https://lighthouse.adam-harris.alphaclaw.app" target="_blank" rel="noopener" class="panel-link">Open →</a>
        </div>
        <div class="scrollable-body">
          ${sorted.map(site => {
            const last = site.audits?.[site.audits.length - 1] || {};
            const hasAlert = Object.entries(thresholds).some(([k, t]) => (last[k] || 0) < t);
            return `<div class="lh-site-row${hasAlert ? ' lh-alert' : ''}">
              <div class="lh-site-name">${this._esc(site.site)}</div>
              <div class="lh-scores">
                ${Object.entries(labels).map(([k, label]) => {
                  const val = last[k] || 0;
                  return `<span class="lh-score ${this._scoreClass(val)}" title="${label}: ${val}">${val}</span>`;
                }).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <style>
        cc-lighthouse .panel-link { font-size: 12px; color: var(--accent); text-decoration: none; }
        cc-lighthouse .panel-link:hover { text-decoration: underline; }
        cc-lighthouse .lh-site-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--glass); }
        cc-lighthouse .lh-site-row:last-child { border-bottom: none; }
        cc-lighthouse .lh-alert { background: var(--danger-bg, rgba(239,68,68,0.06)); margin: 0 -12px; padding: 8px 12px; border-radius: 8px; }
        cc-lighthouse .lh-site-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%; }
        cc-lighthouse .lh-scores { display: flex; gap: 6px; }
        cc-lighthouse .lh-score { font-size: 12px; font-weight: 700; width: 32px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
        cc-lighthouse .score-green { color: #0cce6b; background: rgba(12,206,107,0.12); }
        cc-lighthouse .score-yellow { color: #ffa400; background: rgba(255,164,0,0.12); }
        cc-lighthouse .score-red { color: #ff4e42; background: rgba(255,78,66,0.12); }
      </style>
    `;
  }
}
customElements.define('cc-lighthouse', CcLighthouse);
