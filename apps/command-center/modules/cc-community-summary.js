// ─── Community Summary (dashboard widget) ──────────────────
class CcCommunitySummary extends HTMLElement {
  connectedCallback() { this._load(); }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json(); this._render();
      if (window.UserPrefs && UserPrefs.ready) UserPrefs.ready.then(() => this._render());
    } catch (e) { console.error('cc-community-summary:', e); }
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  _render() {
    const CAT_ICONS = { Skill: '🧩', App: '🚀', Automation: '⚙️', Integration: '🔗' };
    const CAT_COLORS = { Skill: '#7c3aed', App: '#3b82f6', Automation: '#eab308', Integration: 'var(--green)' };
    const P = window.UserPrefs;
    const hidden = P ? P.get('communityHidden', []) : (() => { try { return JSON.parse(localStorage.getItem('communityHidden') || '[]'); } catch { return []; } })();
    const ratings = P ? P.get('communityRatings', {}) : (() => { try { return JSON.parse(localStorage.getItem('communityRatings') || '{}'); } catch { return {}; } })();

    const visible = this._data.filter(x => !hidden.includes(x.id));
    const top = [...visible]
      .sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0) || (b.dateAdded || '').localeCompare(a.dateAdded || ''))
      .slice(0, 8);

    const byCat = {};
    visible.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + 1; });
    const esc = this._esc.bind(this);

    this.innerHTML = `
      <div class="panel full-width">
        <div class="panel-header">🌐 Community <span class="badge">${visible.length} projects</span>
          <a href="community.html" class="view-all-link">View all →</a>
        </div>
        <div class="flex gap-2" style="padding:4px 0 8px;flex-wrap:wrap">
          ${Object.entries(byCat).map(([cat, count]) =>
            `<span class="badge" style="background:${CAT_COLORS[cat]}22;color:${CAT_COLORS[cat]}">${cat}s: ${count}</span>`
          ).join('')}
        </div>
        <div class="scrollable-body">
          <ul style="list-style:none;padding:0;margin:0">
            ${top.map(x => {
              const r = ratings[x.id] || 0;
              return `
              <li class="entity-row">
                <span class="entity-icon" style="font-size:14px;width:20px">${CAT_ICONS[x.category] || '📦'}</span>
                <div class="entity-body">
                  <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.name)}</div>
                  <div class="entity-meta">by ${esc(x.author)}${x.dateAdded ? ` · ${x.dateAdded}` : ''}</div>
                </div>
                ${r > 0 ? `<span style="font-size:11px;color:#facc15">${'★'.repeat(r)}</span>` : ''}
              </li>`;
            }).join('')}
            ${top.length === 0 ? '<li class="empty-state" style="padding:16px">No community projects</li>' : ''}
          </ul>
        </div>
      </div>`;
  }
}
customElements.define('cc-community-summary', CcCommunitySummary);
