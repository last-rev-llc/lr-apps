// ─── Gallery ──────────────────────────────────────────────
class CcGallery extends HTMLElement {
  connectedCallback() {
    const p = (window.CC && CC.getParams) ? CC.getParams() : {};
    this._activeType = p.type || 'All';
    this._activeTags = new Set(p.tags ? p.tags.split(',') : []);
    this._searchQuery = p.q || '';
    // Stable shell: search + filters + content never clobber each other
    this.innerHTML = `
      <div data-role="toolbar" style="margin-bottom:12px;">
        <cc-search placeholder="Search by name…" value="${this._esc(this._searchQuery)}" input-class="search-input" input-style="width:100%;max-width:400px;"></cc-search>
      </div>
      <div data-role="filters"></div>
      <div data-role="content"></div>`;
    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._syncUrl(); this._renderContent(); });
    this._load();
  }
  _syncUrl() {
    if (window.CC && CC.setParams) CC.setParams({
      type: this._activeType,
      tags: this._activeTags.size ? [...this._activeTags].join(',') : null,
      q: this._searchQuery || null
    });
  }

  static TAG_COLORS = ['#7c3aed', '#2563eb', '#22c55e', '#eab308', '#ef4444', '#f97316', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6'];
  _tagColor(tag) { let h = 0; for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h); return CcGallery.TAG_COLORS[Math.abs(h) % CcGallery.TAG_COLORS.length]; }
  _typeIcon(type) { if (type === 'Image') return null; if (type === 'PDF') return '<i data-lucide="file-text"></i>'; if (type === 'Presentation') return '<i data-lucide="presentation"></i>'; return '<i data-lucide="folder"></i>'; }

  _setType(t) { this._activeType = t; this._syncUrl(); this._renderFilters(); this._renderContent(); }
  _toggleTag(t) { this._activeTags.has(t) ? this._activeTags.delete(t) : this._activeTags.add(t); this._syncUrl(); this._renderFilters(); this._renderContent(); }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json();
      this._renderFilters();
      this._renderContent();
    } catch (e) { console.error('cc-gallery:', e); }
  }

  // Alias for backward compat
  _render() { this._renderFilters(); this._renderContent(); }

  _renderFilters() {
    const items = this._data || [];
    const types = ['All', ...new Set(items.map(i => i.type))];
    const allTags = [...new Set(items.flatMap(i => i.tags))].sort();
    const el = this.querySelector('[data-role="filters"]');
    if (!el) return;
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#71717a;font-size:12px;font-weight:600;min-width:64px;">Type</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">${types.map(t =>
            `<span class="type-pill${t === this._activeType ? ' active' : ''}" onclick="this.closest('cc-gallery')._setType('${t}')">${t}</span>`
          ).join('')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#71717a;font-size:12px;font-weight:600;min-width:64px;">Tags</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">${allTags.map(t => {
        const active = this._activeTags.has(t);
        const style = active ? `background:${this._tagColor(t)};color:white;border-color:${this._tagColor(t)}` : `color:${this._tagColor(t)};border-color:${this._tagColor(t)}44`;
        return `<span class="tag-pill${active ? ' active' : ''}" style="${style}" onclick="this.closest('cc-gallery')._toggleTag('${t}')">${t}</span>`;
      }).join('')}</div>
        </div>
      </div>`;
  }

  _renderContent() {
    const items = this._data || [];
    const q = this._searchQuery.toLowerCase();
    const filtered = items.filter(item => {
      if (this._activeType !== 'All' && item.type !== this._activeType) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      if (this._activeTags.size > 0 && ![...this._activeTags].some(t => item.tags.includes(t))) return false;
      return true;
    });

    const countEl = document.getElementById('item-count');
    if (countEl) countEl.textContent = filtered.length;

    const el = this.querySelector('[data-role="content"]');
    if (!el) return;
    el.innerHTML = `
      <div class="grid grid-auto">${filtered.map(item => {
        const thumbHtml = item.thumbnail
          ? `<img src="${item.thumbnail}" alt="${item.name}">`
          : `<span class="icon">${this._typeIcon(item.type) || '<i data-lucide="folder"></i>'}</span>`;
        const date = new Date(item.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const tags = item.tags.map(t => `<span class="card-tag" style="background:${this._tagColor(t)}22;color:${this._tagColor(t)}">${t}</span>`).join('');
        return `<div class="card" style="padding:0;overflow:hidden;" onclick="window.open('${item.file}','_blank')">
          <div class="card-thumb">${thumbHtml}</div>
          <div class="card-body">
            <div class="card-name" title="${item.name}">${item.name}</div>
            <div class="card-meta-text">${item.type} · ${date}</div>
            <div class="card-tags">${tags}</div>
          </div>
        </div>`;
      }).join('')}</div>
      ${!filtered.length ? '<cc-empty-state message="No items match your filters" icon="🔍"></cc-empty-state>' : ''}`;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-gallery', CcGallery);
