// ─── Recipes ──────────────────────────────────────────────
class CcRecipes extends HTMLElement {
  connectedCallback() {
    this._activeType = 'All';
    this._searchQuery = '';
    this._view = 'cards';
    // Build stable shell: search + view toggle + filters (never re-rendered) + content area
    this.innerHTML = `
      <div data-role="toolbar" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
        <cc-search placeholder="Search recipes…"></cc-search>
        <cc-view-toggle app="recipes"></cc-view-toggle>
      </div>
      <div data-role="filters"></div>
      <div data-role="content"></div>
      <cc-modal id="recipe-modal" title="" size="lg"></cc-modal>`;
    this.addEventListener('cc-search', e => {
      this._searchQuery = e.detail.value;
      this._renderContent();
    });
    this.addEventListener('cc-view-change', e => {
      this._view = e.detail.view;
      this._renderContent();
    });
    // Restore persisted view
    const vt = this.querySelector('cc-view-toggle');
    if (vt) setTimeout(() => { this._view = vt.value || 'cards'; this._renderContent(); }, 0);
    this._load();
  }

  async _load() {
    const sb = window.supabase;

    try {
      if (sb) {
        this._data = await sb.select('recipes', { order: 'createdAt.desc.nullslast' });
        this._source = 'supabase';
      } else {
        const src = this.getAttribute('src');
        if (!src) return;
        this._data = await (await fetch(src)).json();
        this._source = 'json';
      }
      // Normalize: ensure 'name' field exists (Supabase uses 'title')
      this._data.forEach(r => {
        if (!r.name && r.title) r.name = r.title;
        if (!r.icon) r.icon = '📄';
        if (!r.type) r.type = r.category || 'App';
        if (typeof r.tags === 'string') try { r.tags = JSON.parse(r.tags); } catch(e) { r.tags = []; }
        if (typeof r.integrations === 'string') try { r.integrations = JSON.parse(r.integrations); } catch(e) { r.integrations = []; }
        if (typeof r.skills === 'string') try { r.skills = JSON.parse(r.skills); } catch(e) { r.skills = []; }
        if (!r.integrations) r.integrations = [];
        if (!r.skills) r.skills = [];
        if (!r.tags) r.tags = [];
      });
      this._renderFilters();
      this._renderContent();
    } catch (e) {
      console.error('cc-recipes:', e);
      if (this._source !== 'json') {
        const src = this.getAttribute('src');
        if (src) {
          try {
            this._data = await (await fetch(src)).json();
            this._source = 'json-fallback';
            this._renderFilters();
            this._renderContent();
          } catch(e2) { console.error('cc-recipes fallback:', e2); }
        }
      }
    }
  }

  _setType(t) { this._activeType = t; this._renderFilters(); this._renderContent(); }

  _renderFilters() {
    const TYPES = ['All', 'App', 'Automation', 'Skill', 'Rule'];
    const el = this.querySelector('[data-role="filters"]');
    if (!el) return;
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="color:#71717a;font-size:12px;font-weight:600;min-width:64px;">Type</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">${TYPES.map(t =>
          `<span class="pill${t === this._activeType ? ' active' : ''}" onclick="this.closest('cc-recipes')._setType('${t}')">${t === 'All' ? 'All' : t + 's'}</span>`
        ).join('')}</div>
      </div>`;
  }

  _openDetail(id) {
    const r = this._data.find(x => x.id === id);
    if (!r) return;

    const TYPE_CLASSES = { App: 'badge-app', Automation: 'badge-automation', Skill: 'badge-skill', Rule: 'badge-rule' };

    const modal = this.querySelector('#recipe-modal');
    if (!modal) return;

    modal.setAttribute('title', `${r.icon} ${r.name}`);
    const h2 = modal.querySelector('.cc-modal-header h2');
    if (h2) h2.textContent = `${r.icon} ${r.name}`;

    const body = modal.querySelector('.cc-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
        <span class="badge ${TYPE_CLASSES[r.type] || ''}">${r.type}</span>
        ${(r.integrations || []).map(x => `<span class="int-badge">${x}</span>`).join('')}
        ${(r.tags || []).map(x => `<span class="tag">${x}</span>`).join('')}
      </div>
      <div style="line-height:1.7;margin-bottom:20px;color:var(--text);">${r.description}</div>
      ${(r.integrations || []).length ? `
        <div style="margin-bottom:16px;">
          <h4 style="color:var(--accent);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Integrations</h4>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">${r.integrations.map(x => `<span class="pill">${x}</span>`).join('')}</div>
        </div>` : ''}
      ${(r.skills || []).length ? `
        <div style="margin-bottom:16px;">
          <h4 style="color:var(--accent);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Skills</h4>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">${r.skills.map(x => `<span class="pill">${x}</span>`).join('')}</div>
        </div>` : ''}
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h4 style="color:var(--accent);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin:0;">Recreation Prompt</h4>
          <button class="btn btn-sm" id="modal-copy-btn" onclick="event.stopPropagation();this.closest('cc-recipes')._copyPromptModal('${r.id}')"><i data-lucide="clipboard"></i> Copy</button>
        </div>
        <div class="prompt-block" style="max-height:400px;overflow-y:auto;white-space:pre-wrap;line-height:1.6;font-size:13px;">${this._esc(r.prompt || '')}</div>
      </div>
    `;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
    modal.open();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  _copyPromptModal(id) {
    const r = this._data.find(x => x.id === id);
    if (!r) return;
    navigator.clipboard.writeText(r.prompt).then(() => {
      const btn = this.querySelector('#modal-copy-btn');
      if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => { btn.innerHTML = '<i data-lucide="clipboard"></i> Copy'; window.refreshIcons && window.refreshIcons(); }, 2000); }
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Prompt copied to clipboard!', 'success');
    });
  }

  // Alias for backward compat — old code calls _render()
  _render() { this._renderFilters(); this._renderContent(); }

  _renderContent() {
    const TYPE_CLASSES = { App: 'badge-app', Automation: 'badge-automation', Skill: 'badge-skill', Rule: 'badge-rule' };
    const q = this._searchQuery.toLowerCase();
    let filtered = this._activeType === 'All' ? this._data : this._data.filter(r => r.type === this._activeType);
    if (q) filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q)));

    const countElId = this.getAttribute('count-el');
    if (countElId) {
      const countEl = document.getElementById(countElId);
      if (countEl) countEl.textContent = filtered.length + ' recipe' + (filtered.length !== 1 ? 's' : '');
    }

    const el = this.querySelector('[data-role="content"]');
    if (!el) return;

    const view = this._view || 'cards';

    if (view === 'list') {
      el.innerHTML = `
        <div class="view-list">${filtered.map(r => `
          <div class="list-row" onclick="this.closest('cc-recipes')._openDetail('${r.id}')">
            <span class="row-icon">${r.icon}</span>
            <span class="row-name">${r.name}</span>
            <span class="badge ${TYPE_CLASSES[r.type]}" style="flex-shrink:0;">${r.type}</span>
            <span class="row-desc">${r.description}</span>
            <span class="row-tags">${(r.tags || []).slice(0, 3).map(x => `<span class="tag">${x}</span>`).join('')}</span>
          </div>
        `).join('')}</div>
        <div class="empty-state" style="${filtered.length ? 'display:none' : ''}">No recipes match that filter.</div>`;
    } else if (view === 'expanded') {
      el.innerHTML = `
        <div class="view-expanded">${filtered.map(r => `
          <div class="expanded-card" onclick="this.closest('cc-recipes')._openDetail('${r.id}')">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="font-size:24px;">${r.icon}</span>
              <span style="font-size:16px;font-weight:700;">${r.name}</span>
              <span class="badge ${TYPE_CLASSES[r.type]}">${r.type}</span>
            </div>
            <div style="color:var(--text);line-height:1.6;margin-bottom:12px;">${r.description}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
              ${(r.integrations || []).map(x => `<span class="int-badge">${x}</span>`).join('')}
              ${(r.skills || []).map(x => `<span class="pill">${x}</span>`).join('')}
              ${(r.tags || []).map(x => `<span class="tag">${x}</span>`).join('')}
            </div>
            ${r.prompt ? `<div class="prompt-block" style="max-height:80px;overflow:hidden;font-size:12px;color:var(--muted);">${this._esc(r.prompt).substring(0, 200)}…</div>` : ''}
          </div>
        `).join('')}</div>
        <div class="empty-state" style="${filtered.length ? 'display:none' : ''}">No recipes match that filter.</div>`;
    } else {
      el.innerHTML = `
        <div class="grid grid-cards">${filtered.map(r => `
          <div class="card" id="card-${r.id}" onclick="this.closest('cc-recipes')._openDetail('${r.id}')" style="cursor:pointer;">
            <div class="card-top">
              <span class="card-icon">${r.icon}</span>
              <span class="card-title">${r.name}</span>
              <span class="badge ${TYPE_CLASSES[r.type]}">${r.type}</span>
            </div>
            <div class="card-desc">${r.description}</div>
            <div class="card-tags">
              ${(r.integrations || []).map(x => `<span class="int-badge">${x}</span>`).join('')}
              ${(r.tags || []).map(x => `<span class="tag">${x}</span>`).join('')}
            </div>
          </div>
        `).join('')}</div>
        <div class="empty-state" style="${filtered.length ? 'display:none' : ''}">No recipes match that filter.</div>`;
    }
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-recipes', CcRecipes);
