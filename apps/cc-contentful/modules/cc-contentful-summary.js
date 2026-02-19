// ─── Contentful Summary (Dashboard Widget) ────────────────
class CcContentfulSummary extends HTMLElement {
  connectedCallback() { this._load(); }
  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  _escAttr(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try { this._data = await (await fetch(src)).json(); this._render(); } catch (e) { console.error('cc-contentful-summary:', e); window.showToast?.('Failed to load summary data', 4000); }
  }

  _trendIcon(trend) { return trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➖'; }
  _trendColor(trend) { return trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--muted)'; }

  _render() {
    const d = this._data;
    if (!d) return;
    const s = d.summary || {};
    const v = d.publishVelocity || {};
    const stale = (d.staleDrafts || []).slice(0, 3);

    const staleRows = stale.map(e => `
      <div class="entity-row" style="padding:4px 0">
        <span style="color:var(--yellow);flex-shrink:0;font-size:12px;">⚠️</span>
        <span class="entity-body" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._esc(e.title || e.id)}</span>
        <span style="color:var(--muted);flex-shrink:0;font-size:12px">${e.daysSinceUpdate}d</span>
      </div>
    `).join('');

    this.innerHTML = `
    <div class="panel">
      <div class="panel-header" style="margin-bottom:12px">
        <span style="display:flex;align-items:center;gap:6px"><span style="color:var(--accent);font-size:14px;">📋</span> Contentful</span>
        <a href="index.html" class="view-all-link">View all →</a>
      </div>

      <div class="content-stats">
        <div class="stat-box">
          <div class="stat-box-value" style="color:var(--green)">${s.published || 0}</div>
          <div class="stat-box-label">Published</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-value" style="color:var(--blue)">${s.draft || 0}</div>
          <div class="stat-box-label">Drafts</div>
        </div>
        <div class="stat-box">
          <div class="stat-box-value" style="color:${s.stale > 0 ? 'var(--yellow)' : 'var(--muted)'}">${s.stale || 0}</div>
          <div class="stat-box-label">Stale</div>
        </div>
      </div>

      <div class="entity-meta" style="margin-bottom:${stale.length ? '10' : '0'}px">
        <span style="font-size:12px;color:${this._trendColor(v.trend)};">${this._trendIcon(v.trend)}</span>
        <span>${v.thisWeek || 0} published this week</span>
        <span style="opacity:.5">vs ${v.lastWeek || 0} last week</span>
      </div>

      ${stale.length ? `<div style="border-top:1px solid var(--border);padding-top:8px">${staleRows}</div>` : ''}
    </div>`;

    // Icons replaced with Unicode/emoji - no refreshIcons needed
  }
}
customElements.define('cc-contentful-summary', CcContentfulSummary);
