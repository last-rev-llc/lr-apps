// ─── Gallery (v1 card layout) ─────────────────────────────
class CcGallery extends HTMLElement {
  connectedCallback() {
    const p = (window.CC && CC.getParams) ? CC.getParams() : {};
    this._activeType = p.type || 'All';
    this._activeTags = new Set(p.tags ? p.tags.split(',') : []);
    this._searchQuery = p.q || '';

    this._injectStyles();

    this.innerHTML = `
      <cc-fade-in delay="100">
        <div data-role="toolbar" style="max-width:1100px;margin:20px auto 0;padding:0 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <cc-search placeholder="Search by name…" value="${this._esc(this._searchQuery)}" input-class="search-input" input-style="width:100%;max-width:400px;" style="flex:1;min-width:200px;"></cc-search>
          <cc-view-toggle app="gallery" default="cards"></cc-view-toggle>
        </div>
      </cc-fade-in>
      <cc-fade-in delay="150">
        <div data-role="filters" style="max-width:1100px;margin:12px auto 0;padding:0 20px;"></div>
      </cc-fade-in>
      <div data-role="content" class="gallery-grid"></div>`;

    this._view = 'cards';
    const vt = this.querySelector('cc-view-toggle');
    if (vt) { requestAnimationFrame(() => { this._view = vt.value || 'cards'; }); }
    this.addEventListener('cc-view-change', e => { this._view = e.detail.view; this._renderContent(); });
    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._syncUrl(); this._renderContent(); });
    this.addEventListener('pill-change', e => {
      const filter = e.target;
      const label = (filter.getAttribute('label') || '').toLowerCase();
      if (label === 'type') {
        this._activeType = e.detail.value;
      } else if (label === 'tags') {
        const val = e.detail.value;
        this._activeTags.clear();
        if (val !== 'All') this._activeTags.add(val);
      }
      this._syncUrl();
      this._renderFilters();
      this._renderContent();
    });
    this._load();
  }

  _syncUrl() {
    if (window.CC && CC.setParams) CC.setParams({
      type: this._activeType,
      tags: this._activeTags.size ? [...this._activeTags].join(',') : null,
      q: this._searchQuery || null
    });
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  _typeIcon(type) {
    const map = { Image: '🖼️', Video: '🎬', GIF: '🎨', Audio: '🎵', PDF: '📄', Presentation: '📊' };
    return map[type] || '📁';
  }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json();
      this._renderFilters();
      this._renderContent();
    } catch (e) { console.error('cc-gallery:', e); }
  }

  _renderFilters() {
    const items = this._data || [];
    const types = ['All', ...new Set(items.map(i => i.type))];
    const allTags = ['All', ...[...new Set(items.flatMap(i => i.tags))].sort()];
    const el = this.querySelector('[data-role="filters"]');
    if (!el) return;

    const tagItems = allTags.map(t => ({value: t, label: t}));
    el.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <cc-pill-dropdown label="Type" items='${JSON.stringify(types.map(t => ({value:t, label:t})))}' value="${this._esc(this._activeType)}"></cc-pill-dropdown>
        <cc-pill-dropdown label="Tags" items='${JSON.stringify(tagItems)}' value="${this._activeTags.size ? [...this._activeTags][this._activeTags.size - 1] : 'All'}"></cc-pill-dropdown>
      </div>
      <div style="text-align:right;font-size:12px;color:var(--muted);margin-top:4px;"><span id="gallery-count"></span> items</div>`;
  }

  _filtered() {
    const items = this._data || [];
    const q = this._searchQuery.toLowerCase();
    return items.filter(item => {
      if (this._activeType !== 'All' && item.type !== this._activeType) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      if (this._activeTags.size > 0 && ![...this._activeTags].some(t => item.tags.includes(t))) return false;
      return true;
    });
  }

  _renderContent() {
    const filtered = this._filtered();
    const countEl = this.querySelector('#gallery-count');
    if (countEl) countEl.textContent = filtered.length;

    const el = this.querySelector('[data-role="content"]');
    if (!el) return;

    if (!filtered.length) {
      el.innerHTML = '<cc-empty-state message="No items match your filters" icon="🔍" style="grid-column:1/-1;"></cc-empty-state>';
      return;
    }

    const view = this._view || 'cards';

    if (view === 'list') {
      el.className = 'gallery-list';
      el.innerHTML = `<cc-stagger animation="scale" delay="30">${filtered.map(item => {
        const eName = this._esc(item.name);
        const eType = this._esc(item.type);
        const eFile = this._esc(item.file || '');
        const typeCls = eType.toLowerCase();
        const date = item.created ? new Date(item.created).toLocaleDateString('en-US', {month:'short',day:'numeric'}) : '';
        return `<div class="gallery-list-row" onclick="window.open('${eFile}','_blank')">
          <span class="gallery-type-badge ${typeCls}">${eType}</span>
          <span class="gallery-list-name">${eName}</span>
          <span class="gallery-list-tags">${(item.tags||[]).map(t => `<cc-pill variant="tag">${this._esc(t)}</cc-pill>`).join('')}</span>
          <span class="gallery-list-date">${date}</span>
        </div>`;
      }).join('')}</cc-stagger>`;
    } else if (view === 'expanded') {
      el.className = 'gallery-expanded';
      el.innerHTML = `<cc-stagger animation="scale" delay="50">${filtered.map(item => {
        const eName = this._esc(item.name);
        const eFile = this._esc(item.file || '');
        const eThumbnail = this._esc(item.thumbnail || '');
        const eType = this._esc(item.type);
        const eTags = JSON.stringify(item.tags || []);
        return `<cc-media-card
          title="${eName}"
          type="${eType}"
          src="${eFile}"
          thumbnail="${eThumbnail}"
          date="${item.created || ''}"
          tags='${eTags}'
          media-id="${this._esc(item.id || eName)}"
          expanded
        ></cc-media-card>`;
      }).join('')}</cc-stagger>`;
    } else {
      el.className = 'gallery-grid';
      el.innerHTML = `<cc-stagger animation="scale" delay="50">${filtered.map(item => {
        const eName = this._esc(item.name);
        const eFile = this._esc(item.file || '');
        const eThumbnail = this._esc(item.thumbnail || '');
        const eType = this._esc(item.type);
        const eTags = JSON.stringify(item.tags || []);
        return `<cc-media-card
          title="${eName}"
          type="${eType}"
          src="${eFile}"
          thumbnail="${eThumbnail}"
          date="${item.created || ''}"
          tags='${eTags}'
          media-id="${this._esc(item.id || eName)}"
        ></cc-media-card>`;
      }).join('')}</cc-stagger>`;
    }
  }

  _injectStyles() {
    if (document.getElementById('cc-gallery-styles')) return;
    const s = document.createElement('style');
    s.id = 'cc-gallery-styles';
    s.textContent = `
      .gallery-hero {
        max-width: 1100px;
        margin: 0 auto;
        padding: 32px 20px 0;
      }
      .gallery-hero h1 {
        font-size: 28px;
        font-weight: 800;
        margin: 0 0 4px;
      }
      .gallery-hero p {
        color: var(--muted);
        font-size: 14px;
        margin: 0;
      }
      .gallery-grid {
        max-width: 1100px;
        margin: 20px auto 0;
        padding: 0 20px 40px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .gallery-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        transition: transform .2s, border-color .2s, box-shadow .2s;
        cursor: pointer;
      }
      .gallery-card:hover {
        transform: translateY(-4px);
        border-color: var(--accent);
        box-shadow: 0 8px 32px rgba(245,158,11,.12);
      }
      .gallery-thumb {
        width: 100%;
        aspect-ratio: 16/10;
        object-fit: cover;
        display: block;
        background: rgba(255,255,255,.05);
      }
      .gallery-card-body {
        padding: 12px 16px 16px;
      }
      .gallery-card-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--text);
        margin: 0 0 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .gallery-card-meta {
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 11px;
        color: var(--muted);
      }
      .gallery-card-tags {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      /* ── List view ── */
      .gallery-list {
        max-width: 1100px;
        margin: 20px auto 0;
        padding: 0 20px 40px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .gallery-list-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        transition: border-color .15s, background .15s;
      }
      .gallery-list-row:hover {
        border-color: var(--accent);
        background: rgba(255,255,255,.04);
      }
      .gallery-list-name {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .gallery-list-tags {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }
      .gallery-list-date {
        font-size: 11px;
        color: var(--muted);
        flex-shrink: 0;
        min-width: 50px;
        text-align: right;
      }
      .gallery-type-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        flex-shrink: 0;
        text-transform: uppercase;
        letter-spacing: .3px;
      }
      .gallery-type-badge.image { background: rgba(59,130,246,.15); color: #3b82f6; }
      .gallery-type-badge.video { background: rgba(139,92,246,.15); color: #8b5cf6; }
      .gallery-type-badge.gif { background: rgba(245,158,11,.15); color: var(--accent); }
      .gallery-type-badge.audio { background: rgba(34,197,94,.15); color: #22c55e; }
      .gallery-type-badge.pdf { background: rgba(239,68,68,.15); color: #ef4444; }
      .gallery-type-badge.presentation { background: rgba(234,179,8,.15); color: #facc15; }

      /* ── Expanded view ── */
      .gallery-expanded {
        max-width: 1100px;
        margin: 20px auto 0;
        padding: 0 20px 40px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      @media (max-width: 600px) {
        .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .gallery-card-body { padding: 10px 12px 12px; }
        .gallery-card-title { font-size: 13px; }
        .gallery-list-tags { display: none; }
      }
    `;
    document.head.appendChild(s);
  }
}
customElements.define('cc-gallery', CcGallery);
