// ─── Contentful Content Pipeline Monitor ──────────────────
class CcContentful extends HTMLElement {
  connectedCallback() {
    this._sortCol = 'daysSinceUpdate';
    this._sortAsc = false;
    this.addEventListener('cc-search', e => { this._setFilter('q', e.detail.value); });
    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  _escAttr(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try { this._data = await (await fetch(src)).json(); this._applyParams(); this._render(); } catch (e) { console.error('cc-contentful:', e); window.showToast?.('Failed to load Contentful data', 4000); this.innerHTML = '<cc-empty-state icon="⚠️" message="Failed to load Contentful data"></cc-empty-state>'; }
  }

  _applyParams() {
    if (!window.CC) return;
    const p = CC.getParams();
    if (p.space) this._filterSpace = p.space;
    if (p.ct) this._filterCT = p.ct;
    if (p.status) this._filterStatus = p.status;
    if (p.q) this._search = p.q;
  }

  _setFilter(key, val) {
    this['_filter' + key.charAt(0).toUpperCase() + key.slice(1)] = val || undefined;
    if (key === 'space') this._filterSpace = val || undefined;
    if (key === 'ct') this._filterCT = val || undefined;
    if (key === 'status') this._filterStatus = val || undefined;
    if (key === 'q') this._search = val || undefined;
    if (window.CC) CC.setParams({ space: this._filterSpace || '', ct: this._filterCT || '', status: this._filterStatus || '', q: this._search || '' });
    this._render();
  }

  _toggleSort(col) {
    if (this._sortCol === col) this._sortAsc = !this._sortAsc;
    else { this._sortCol = col; this._sortAsc = true; }
    this._render();
  }

  _sortIcon(col) {
    if (this._sortCol !== col) return '';
    return this._sortAsc ? ' ↑' : ' ↓';
  }

  _trendIcon(trend) { return trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➖'; }
  _trendColor(trend) { return trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--muted)'; }

  _getAllEntries() {
    const d = this._data;
    if (!d) return [];
    // Combine stale drafts and recent publishes into a unified list isn't enough.
    // We'll show sections separately. This method is for filtering stale drafts.
    return d.staleDrafts || [];
  }

  _render() {
    const d = this._data;
    if (!d) { this.innerHTML = '<div style="color:var(--muted);padding:40px;text-align:center;">Loading...</div>'; return; }

    const s = d.summary || {};
    const v = d.publishVelocity || {};
    const space = this._filterSpace;
    const ct = this._filterCT;
    const status = this._filterStatus;
    const q = (this._search || '').toLowerCase();

    // Extract unique spaces from entries
    const allSpaces = [...new Set([
      ...(d.staleDrafts || []).map(e => e.space),
      ...(d.recentPublishes || []).map(e => e.space)
    ].filter(Boolean))].sort();

    // Content types for filter dropdown (filtered by space if set)
    const allEntries = [...(d.staleDrafts || []), ...(d.recentPublishes || [])];
    const contentTypes = [...new Set(allEntries.filter(e => !space || e.space === space).map(e => e.contentType))].sort();

    // Filter stale drafts
    let staleDrafts = (d.staleDrafts || []).filter(e => {
      if (space && e.space !== space) return false;
      if (ct && e.contentType !== ct) return false;
      if (q && !(e.title || '').toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
      return true;
    });

    // Sort stale drafts
    const sc = this._sortCol;
    staleDrafts.sort((a, b) => {
      let va = a[sc], vb = b[sc];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return this._sortAsc ? -1 : 1;
      if (va > vb) return this._sortAsc ? 1 : -1;
      return 0;
    });

    // Filter recent publishes
    let recentPubs = (d.recentPublishes || []).filter(e => {
      if (space && e.space !== space) return false;
      if (ct && e.contentType !== ct) return false;
      if (q && !(e.title || '').toLowerCase().includes(q)) return false;
      return true;
    });

    // By content type
    let ctData = Object.entries(d.byContentType || {}).map(([k, v]) => ({ name: k, ...v }));
    if (ct) ctData = ctData.filter(c => c.name === ct);
    ctData.sort((a, b) => b.total - a.total);

    // Status filter affects which sections show
    const showStale = !status || status === 'stale';
    const showRecent = !status || status === 'published';
    const showCT = !status;

    // Summary cards
    const cards = [
      { label: 'Total', value: s.total, icon: '📊', color: 'var(--text)' },
      { label: 'Published', value: s.published, icon: '✅', color: 'var(--green)' },
      { label: 'Drafts', value: s.draft, icon: '✏️', color: 'var(--blue)' },
      { label: 'Changed', value: s.changed, icon: '↻', color: 'var(--yellow)' },
      { label: 'Stale', value: s.stale, icon: '⚠️', color: s.stale > 0 ? 'var(--red)' : 'var(--muted)' },
    ].map(c => `
      <div style="background:var(--prompt-bg);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;flex:1;min-width:120px;">
        <span style="font-size:20px;color:${c.color};margin-bottom:6px;display:block;">${c.icon}</span>
        <div style="font-size:28px;font-weight:800;color:${c.color};">${c.value || 0}</div>
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;">${c.label}</div>
      </div>
    `).join('');

    // Stale drafts table
    const staleRows = staleDrafts.map(e => `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:var(--text);">${this._esc(e.title || e.id)}</td>
        <td style="padding:8px 12px;font-size:12px;color:var(--muted);">${this._esc(e.contentType)}</td>
        <td style="padding:8px 12px;font-size:12px;color:var(--muted);">${this._esc(e.space || '')}</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:600;color:${e.daysSinceUpdate > 30 ? 'var(--red)' : 'var(--yellow)'};">${e.daysSinceUpdate}d</td>
        <td style="padding:8px 12px;">
          <a href="https://app.contentful.com/spaces/${e.space ? '' : ''}entries/${e.id}" target="_blank" rel="noopener"
             style="font-size:11px;color:var(--accent);text-decoration:none;">Open ↗</a>
        </td>
      </tr>
    `).join('');

    // Recent publishes
    const pubRows = recentPubs.map(e => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--prompt-bg);">
        <span style="color:var(--green);flex-shrink:0;font-size:14px;">✅</span>
        <span style="flex:1;font-size:13px;color:var(--text);">${this._esc(e.title || e.id)}</span>
        <span style="font-size:11px;color:var(--muted);background:var(--bg);padding:2px 8px;border-radius:4px;">${this._esc(e.contentType)}</span>
        <span style="font-size:11px;color:var(--muted);background:var(--bg);padding:2px 8px;border-radius:4px;">${this._esc(e.space || '')}</span>
        <span style="font-size:12px;color:var(--muted);">${new Date(e.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    `).join('');

    // Content type breakdown
    const ctRows = ctData.map(c => `
      <tr>
        <td style="padding:6px 12px;font-size:13px;color:var(--text);cursor:pointer;text-decoration:underline;text-decoration-color:var(--border);"
            data-ct="${this._escAttr(c.name)}" onclick="this.closest('cc-contentful')._setFilter('ct',this.dataset.ct)">${this._esc(c.name)}</td>
        <td style="padding:6px 12px;text-align:center;font-size:13px;color:var(--muted);">${c.total}</td>
        <td style="padding:6px 12px;text-align:center;font-size:13px;color:var(--green);">${c.published}</td>
        <td style="padding:6px 12px;text-align:center;font-size:13px;color:var(--blue);">${c.draft}</td>
        <td style="padding:6px 12px;text-align:center;font-size:13px;color:var(--yellow);">${c.changed || 0}</td>
      </tr>
    `).join('');

    this.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;">
      <!-- Summary Cards -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">${cards}</div>

      <!-- Velocity -->
      <div style="background:var(--prompt-bg);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
        <span style="font-size:24px;color:${this._trendColor(v.trend)};">${this._trendIcon(v.trend)}</span>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--text);">Publish Velocity</div>
          <div style="font-size:13px;color:var(--muted);">${v.thisWeek || 0} this week · ${v.lastWeek || 0} last week
            <span style="color:${this._trendColor(v.trend)};font-weight:600;margin-left:8px;">${v.trend === 'up' ? '▲ Up' : v.trend === 'down' ? '▼ Down' : '— Flat'}</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">
        <cc-search placeholder="Search entries..." value="${this._escAttr(this._search || '')}" input-style="width:100%;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none;box-sizing:border-box;"></cc-search>
        <select onchange="this.closest('cc-contentful')._setFilter('space', this.value)"
          style="padding:8px 12px;background:var(--bg);border:1px solid ${space ? 'var(--accent)' : 'var(--border)'};border-radius:8px;color:var(--text);font-size:13px;outline:none;font-weight:${space ? '600' : '400'};">
          <option value="">⚠ Select a Space</option>
          ${allSpaces.map(s => `<option value="${this._escAttr(s)}" ${space === s ? 'selected' : ''}>${this._esc(s)}</option>`).join('')}
        </select>
        <select onchange="this.closest('cc-contentful')._setFilter('ct', this.value)"
          style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none;">
          <option value="">All Content Types</option>
          ${contentTypes.map(c => `<option value="${this._escAttr(c)}" ${ct === c ? 'selected' : ''}>${this._esc(c)}</option>`).join('')}
        </select>
        <select onchange="this.closest('cc-contentful')._setFilter('status', this.value)"
          style="padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none;">
          <option value="" ${!status ? 'selected' : ''}>All Statuses</option>
          <option value="published" ${status === 'published' ? 'selected' : ''}>Published</option>
          <option value="stale" ${status === 'stale' ? 'selected' : ''}>Stale</option>
        </select>
        ${(space || ct || status || q) ? `<button onclick="this.closest('cc-contentful')._filterSpace=undefined;this.closest('cc-contentful')._filterCT=undefined;this.closest('cc-contentful')._filterStatus=undefined;this.closest('cc-contentful')._search=undefined;if(window.CC)CC.setParams({});this.closest('cc-contentful')._render();"
          style="padding:8px 12px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:12px;cursor:pointer;">Clear filters</button>` : ''}
      </div>

      ${(space || ct || status || q) && !staleDrafts.length && !recentPubs.length && !ctData.length ? '<cc-empty-state icon="🔍" message="No entries match your filters"></cc-empty-state>' : ''}

      <!-- Stale Drafts -->
      ${showStale && staleDrafts.length ? `
      <div style="background:var(--prompt-bg);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px;">
          <span style="color:var(--yellow);font-size:14px;">⚠️</span> Stale Drafts (${staleDrafts.length})
        </h3>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="border-bottom:1px solid var(--border);">
              <th onclick="this.closest('cc-contentful')._toggleSort('title')" style="padding:8px 12px;text-align:left;font-size:11px;color:var(--muted);text-transform:uppercase;cursor:pointer;">Title${this._sortIcon('title')}</th>
              <th onclick="this.closest('cc-contentful')._toggleSort('contentType')" style="padding:8px 12px;text-align:left;font-size:11px;color:var(--muted);text-transform:uppercase;cursor:pointer;">Type${this._sortIcon('contentType')}</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:var(--muted);text-transform:uppercase;">Space</th>
              <th onclick="this.closest('cc-contentful')._toggleSort('daysSinceUpdate')" style="padding:8px 12px;text-align:left;font-size:11px;color:var(--muted);text-transform:uppercase;cursor:pointer;">Stale${this._sortIcon('daysSinceUpdate')}</th>
              <th style="padding:8px 12px;font-size:11px;color:var(--muted);"></th>
            </tr></thead>
            <tbody>${staleRows}</tbody>
          </table>
        </div>
      </div>` : ''}

      <!-- Recent Publishes -->
      ${showRecent && recentPubs.length ? `
      <div style="background:var(--prompt-bg);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px;">
          <span style="color:var(--green);font-size:14px;">✅</span> Recent Publishes (${recentPubs.length})
        </h3>
        ${pubRows}
      </div>` : ''}

      <!-- Content Type Breakdown -->
      ${showCT && ctData.length ? `
      <div style="background:var(--prompt-bg);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px;">
          <span style="color:var(--accent);font-size:14px;">📋</span> By Content Type (${ctData.length})
        </h3>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="border-bottom:1px solid var(--border);">
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:var(--muted);text-transform:uppercase;">Type</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:var(--muted);text-transform:uppercase;">Total</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:var(--muted);text-transform:uppercase;">Published</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:var(--muted);text-transform:uppercase;">Draft</th>
              <th style="padding:6px 12px;text-align:center;font-size:11px;color:var(--muted);text-transform:uppercase;">Changed</th>
            </tr></thead>
            <tbody>${ctRows}</tbody>
          </table>
        </div>
      </div>` : ''}

      <div style="text-align:center;font-size:11px;color:var(--border);padding:12px;">
        Last updated: ${d.lastUpdated ? new Date(d.lastUpdated).toLocaleString() : 'Unknown'}
      </div>
    </div>`;

    // Icons replaced with Unicode/emoji - no refreshIcons needed
  }
}
customElements.define('cc-contentful', CcContentful);
