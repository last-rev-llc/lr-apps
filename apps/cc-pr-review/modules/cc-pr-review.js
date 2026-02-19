/* cc-pr-review — PR Review Dashboard */
class CcPrReview extends HTMLElement {
  connectedCallback() {
    const p = (window.CC && CC.getParams) ? CC.getParams() : {};
    this._app = p.app || 'all';
    this._status = p.status || 'all';
    this._type = p.type || 'all';
    this._search = p.q || '';
    this._view = 'cards';
    this._data = [];
    this._db = null;
    this.addEventListener('cc-search', e => { this._search = e.detail.value; this._syncUrl(); this._renderContent(); });
    this.addEventListener('cc-view-change', e => { this._view = e.detail.view; this._renderContent(); });
    this.addEventListener('pill-change', e => {
      const el = e.target;
      if (el.getAttribute('label') === 'App') { this._app = e.detail.value; }
      else if (el.getAttribute('label') === 'Status') { this._status = e.detail.value; }
      else if (el.getAttribute('label') === 'Type') { this._type = e.detail.value; }
      this._syncUrl();
      this._renderContent();
    });
    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  _escAttr(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  _syncUrl() {
    if (window.CC && CC.setParams) CC.setParams({
      app: this._app !== 'all' ? this._app : null,
      status: this._status !== 'all' ? this._status : null,
      type: this._type !== 'all' ? this._type : null,
      q: this._search || null
    });
  }

  async _load() {
    this.innerHTML = '<div style="text-align:center;padding:60px;color:var(--muted);">Loading reviews…</div>';
    try {
      this._db = await PrReviewDB.init();
      this._data = await this._db.getAll();
      this._render();
    } catch (e) {
      this.innerHTML = `<div style="text-align:center;padding:60px;color:var(--danger);">Error: ${this._esc(e.message)}</div>`;
    }
  }

  _getFiltered() {
    let items = this._data || [];
    if (this._app !== 'all') items = items.filter(r => r.app_name === this._app);
    if (this._status !== 'all') items = items.filter(r => r.status === this._status);
    if (this._type !== 'all') items = items.filter(r => r.review_type === this._type);
    if (this._search) {
      const q = this._search.toLowerCase();
      items = items.filter(r => (r.summary || '').toLowerCase().includes(q) || (r.learnings || '').toLowerCase().includes(q));
    }
    return items;
  }

  _getStats(items) {
    const totalFindings = items.reduce((s, r) => s + (Array.isArray(r.findings) ? r.findings.length : 0), 0);
    const appCounts = {};
    items.forEach(r => { appCounts[r.app_name] = (appCounts[r.app_name] || 0) + 1; });
    const mostReviewed = Object.entries(appCounts).sort((a, b) => b[1] - a[1])[0];
    const avgFiles = items.length ? Math.round(items.reduce((s, r) => s + (r.files_changed || 0), 0) / items.length) : 0;
    return { total: items.length, totalFindings, mostReviewed: mostReviewed ? mostReviewed[0] : '—', avgFiles };
  }

  _render() {
    const apps = [...new Set(this._data.map(r => r.app_name))].sort();
    const statuses = [...new Set(this._data.map(r => r.status))].sort();
    const types = [...new Set(this._data.map(r => r.review_type))].sort();

    const appItems = JSON.stringify([{ value: 'all', label: 'All' }, ...apps.map(a => ({ value: a, label: a }))]);
    const statusItems = JSON.stringify([{ value: 'all', label: 'All' }, ...statuses.map(s => ({ value: s, label: s }))]);
    const typeItems = JSON.stringify([{ value: 'all', label: 'All' }, ...types.map(t => ({ value: t, label: t }))]);

    this.innerHTML = `
      <div style="max-width:1200px;margin:0 auto;padding:24px 16px;">
        <div data-role="stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px;"></div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
          <cc-search placeholder="Search reviews…" value="${this._escAttr(this._search)}"></cc-search>
          <cc-view-toggle app="cc-pr-review" default="cards"></cc-view-toggle>
          <cc-filter-drawer title="Filters" ${this._app !== 'all' || this._status !== 'all' || this._type !== 'all' ? 'active' : ''}>
            <cc-pill-dropdown label="App" items='${this._escAttr(appItems)}' value="${this._escAttr(this._app)}"></cc-pill-dropdown>
            <cc-pill-dropdown label="Status" items='${this._escAttr(statusItems)}' value="${this._escAttr(this._status)}"></cc-pill-dropdown>
            <cc-pill-dropdown label="Type" items='${this._escAttr(typeItems)}' value="${this._escAttr(this._type)}"></cc-pill-dropdown>
          </cc-filter-drawer>
        </div>
        <div data-role="content"></div>
      </div>`;

    const vt = this.querySelector('cc-view-toggle');
    if (vt) setTimeout(() => { this._view = vt.value || 'cards'; this._renderContent(); }, 0);
    else this._renderContent();
  }

  _renderContent() {
    const items = this._getFiltered();
    const stats = this._getStats(items);
    const statsEl = this.querySelector('[data-role="stats"]');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--heading);">${stats.total}</div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Reviews</div>
        </div>
        <div class="card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--heading);">${stats.totalFindings}</div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Findings</div>
        </div>
        <div class="card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--heading);">${this._esc(stats.mostReviewed)}</div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Most Reviewed</div>
        </div>
        <div class="card" style="padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--heading);">${stats.avgFiles}</div>
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">Avg Files Changed</div>
        </div>`;
    }

    const el = this.querySelector('[data-role="content"]');
    if (!items.length) {
      el.innerHTML = '<cc-empty-state message="No reviews match your filters" icon="🔍" animation="none"></cc-empty-state>';
      return;
    }

    if (this._view === 'list') {
      el.innerHTML = `<div class="view-list">${items.map(r => `
        <div class="list-row" data-id="${this._escAttr(r.id)}" style="cursor:pointer;">
          <span class="row-name" style="min-width:120px;">${this._esc(r.app_name)}</span>
          <span class="row-desc">${this._esc(r.summary)}</span>
          <span class="pill pill-${this._statusColor(r.status)}" style="font-size:11px;">${this._esc(r.status)}</span>
          <span style="color:var(--muted);font-size:12px;white-space:nowrap;">${this._fmtDate(r.reviewed_at)}</span>
        </div>`).join('')}</div>`;
    } else if (this._view === 'expanded') {
      el.innerHTML = `<div class="view-expanded">${items.map(r => this._renderExpanded(r)).join('')}</div>`;
    } else {
      el.innerHTML = `<div class="grid grid-cards">${items.map(r => `
        <div class="card" data-id="${this._escAttr(r.id)}" style="cursor:pointer;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-weight:700;color:var(--heading);">${this._esc(r.app_name)}</span>
            <span class="pill pill-${this._statusColor(r.status)}" style="font-size:11px;">${this._esc(r.status)}</span>
          </div>
          <p style="color:var(--text);font-size:13px;line-height:1.5;margin:0 0 12px;">${this._esc(r.summary)}</p>
          <div style="display:flex;gap:12px;font-size:12px;color:var(--muted);">
            <span>${r.files_changed || 0} files</span>
            <span style="color:var(--green);">+${r.lines_added || 0}</span>
            <span style="color:var(--red);">-${r.lines_removed || 0}</span>
            <span style="margin-left:auto;">${this._fmtDate(r.reviewed_at)}</span>
          </div>
        </div>`).join('')}</div>`;
    }

    el.querySelectorAll('[data-id]').forEach(card => {
      card.addEventListener('click', () => this._showDetail(card.dataset.id));
    });
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }

  _renderExpanded(r) {
    const findings = Array.isArray(r.findings) ? r.findings : [];
    return `
      <div class="expanded-card" data-id="${this._escAttr(r.id)}" style="cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:16px;font-weight:700;color:var(--heading);">${this._esc(r.app_name)}</span>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="badge">${this._esc(r.review_type)}</span>
            <span class="pill pill-${this._statusColor(r.status)}">${this._esc(r.status)}</span>
          </div>
        </div>
        <p style="color:var(--text);margin:0 0 12px;">${this._esc(r.summary)}</p>
        ${findings.length ? `<div style="margin-bottom:12px;"><strong style="font-size:12px;color:var(--muted);">Findings (${findings.length}):</strong>
          ${findings.slice(0, 3).map(f => `<div style="font-size:12px;padding:4px 0;color:var(--text);">
            <span class="pill pill-${f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'info'}" style="font-size:10px;">${this._esc(f.severity)}</span>
            ${this._esc(f.description)}${f.fixed ? ' ✓' : ''}</div>`).join('')}
          ${findings.length > 3 ? `<div style="font-size:11px;color:var(--muted);">+${findings.length - 3} more</div>` : ''}
        </div>` : ''}
        ${r.learnings ? `<div style="font-size:12px;color:var(--muted);"><strong>Learnings:</strong> ${this._esc(r.learnings)}</div>` : ''}
        <div style="display:flex;gap:12px;font-size:12px;color:var(--muted);margin-top:8px;">
          <span>${r.files_changed || 0} files</span>
          <span style="color:var(--green);">+${r.lines_added || 0}</span>
          <span style="color:var(--red);">-${r.lines_removed || 0}</span>
          <span style="margin-left:auto;">${this._fmtDate(r.reviewed_at)}</span>
        </div>
      </div>`;
  }

  _showDetail(id) {
    const r = this._data.find(x => x.id === id);
    if (!r) return;
    const findings = Array.isArray(r.findings) ? r.findings : [];
    const existing = document.querySelector('#pr-detail-modal');
    if (existing) existing.remove();

    const modal = document.createElement('cc-modal');
    modal.id = 'pr-detail-modal';
    modal.setAttribute('title', `${r.app_name} — Review Detail`);
    modal.setAttribute('size', 'lg');
    modal.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
        <span class="pill pill-${this._statusColor(r.status)}">${this._esc(r.status)}</span>
        <span class="badge">${this._esc(r.review_type)}</span>
        ${r.pr_url ? `<a href="${this._escAttr(r.pr_url)}" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent);">PR #${r.pr_number || ''} ↗</a>` : ''}
        <span style="margin-left:auto;font-size:12px;color:var(--muted);">${this._fmtDate(r.reviewed_at)}</span>
      </div>
      <p style="color:var(--text);line-height:1.6;margin:0 0 16px;">${this._esc(r.summary)}</p>
      <div style="display:flex;gap:16px;margin-bottom:20px;font-size:13px;">
        <span>${r.files_changed || 0} files changed</span>
        <span style="color:var(--green);">+${r.lines_added || 0} added</span>
        <span style="color:var(--red);">-${r.lines_removed || 0} removed</span>
      </div>
      ${findings.length ? `
        <h3 style="font-size:14px;margin:0 0 8px;color:var(--heading);">Findings (${findings.length})</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left;padding:6px 8px;color:var(--muted);">Severity</th>
            <th style="text-align:left;padding:6px 8px;color:var(--muted);">Category</th>
            <th style="text-align:left;padding:6px 8px;color:var(--muted);">Description</th>
            <th style="text-align:left;padding:6px 8px;color:var(--muted);">File</th>
            <th style="text-align:left;padding:6px 8px;color:var(--muted);">Fixed</th>
          </tr></thead>
          <tbody>${findings.map(f => `<tr style="border-bottom:1px solid var(--border);">
            <td style="padding:6px 8px;"><span class="pill pill-${f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'info'}" style="font-size:10px;">${this._esc(f.severity)}</span></td>
            <td style="padding:6px 8px;">${this._esc(f.category)}</td>
            <td style="padding:6px 8px;">${this._esc(f.description)}</td>
            <td style="padding:6px 8px;font-family:monospace;font-size:11px;">${this._esc(f.file)}</td>
            <td style="padding:6px 8px;">${f.fixed ? '✓' : '—'}</td>
          </tr>`).join('')}</tbody>
        </table>` : ''}
      ${r.learnings ? `
        <h3 style="font-size:14px;margin:0 0 8px;color:var(--heading);">Key Learnings</h3>
        <div style="color:var(--text);font-size:13px;line-height:1.6;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;">${this._esc(r.learnings)}</div>` : ''}`;
    document.body.appendChild(modal);
    modal.open();
    modal.addEventListener('modal-close', () => setTimeout(() => modal.remove(), 300));
  }

  _statusColor(s) {
    const map = { merged: 'success', open: 'info', closed: 'danger', draft: 'warning' };
    return map[s] || 'default';
  }

  _fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
customElements.define('cc-pr-review', CcPrReview);
