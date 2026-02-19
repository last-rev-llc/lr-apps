// ─── Gallery (v1 card layout) ─────────────────────────────
class CcGallery extends HTMLElement {
  connectedCallback() {
    const p = (window.CC && CC.getParams) ? CC.getParams() : {};
    this._activeType = p.type || 'All';
    this._activeTags = new Set(p.tags ? p.tags.split(',') : []);
    this._searchQuery = p.q || '';

    this._injectStyles();

    this.innerHTML = `
      <cc-fade-in>
        <cc-page-header icon="🖼️" title="Media Gallery" description="Generated images, memes & media"></cc-page-header>
      </cc-fade-in>
      <cc-fade-in delay="100">
        <div data-role="toolbar" style="max-width:1100px;margin:20px auto 0;padding:0 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <cc-search placeholder="Search by name…" value="${this._escAttr(this._searchQuery)}" input-class="search-input" input-style="width:100%;max-width:400px;" style="flex:1;min-width:200px;"></cc-search>
          <cc-view-toggle app="gallery" default="cards"></cc-view-toggle>
        </div>
      </cc-fade-in>
      <cc-fade-in delay="150">
        <div data-role="filters" style="max-width:1100px;margin:12px auto 0;padding:0 20px;"></div>
      </cc-fade-in>
      <div data-role="content" class="gallery-grid"></div>`;

    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._syncUrl(); this._renderContent(); });
    this.addEventListener('cc-view-change', e => { this._view = e.detail.view; this._renderContent(); });
    const vt = this.querySelector('cc-view-toggle');
    if (vt) setTimeout(() => { this._view = vt.value || 'cards'; }, 0);
    this.addEventListener('dropdown-change', e => {
      const label = (e.target.getAttribute('label') || '').toLowerCase();
      if (label === 'type') { this._activeType = e.detail.value; this._syncUrl(); this._renderFilters(); this._renderContent(); }
    });
    this.addEventListener('pill-change', e => {
      const filter = e.target;
      const label = (filter.getAttribute('label') || '').toLowerCase();
      if (label === 'type') {
        this._activeType = e.detail.value;
      } else if (label === 'tags') {
        // For tags, toggle behavior: if "All" selected, clear tags; otherwise toggle
        const val = e.detail.value;
        if (val === 'All') {
          this._activeTags.clear();
        } else {
          this._activeTags.has(val) ? this._activeTags.delete(val) : this._activeTags.add(val);
        }
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
  _escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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

    const typeItems = types.map(t => ({value: t, label: t}));
    el.innerHTML = `
      <cc-filter-drawer title="Filters" ${this._activeType !== 'All' || this._activeTags.size > 0 ? 'active' : ''}>
        <cc-pill-dropdown label="Type" items='${this._escAttr(JSON.stringify(typeItems))}' value="${this._escAttr(this._activeType)}"></cc-pill-dropdown>
        <cc-pill-filter label="Tags" items='${this._escAttr(JSON.stringify(allTags))}' value="${this._activeTags.size ? this._escAttr([...this._activeTags][this._activeTags.size - 1]) : 'All'}" colored></cc-pill-filter>
      </cc-filter-drawer>
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
    const view = this._view || 'cards';
    const countEl = this.querySelector('#gallery-count');
    if (countEl) countEl.textContent = filtered.length;

    const el = this.querySelector('[data-role="content"]');
    if (!el) return;

    if (!filtered.length) {
      el.innerHTML = '<cc-empty-state message="No items match your filters" icon="🔍" style="grid-column:1/-1;"></cc-empty-state>';
      return;
    }

    if (view === 'list') {
      el.className = 'gallery-list-container';
      el.innerHTML = filtered.map(item => {
        const eName = this._esc(item.name);
        const eFile = this._escAttr(item.file || '');
        const eThumbnail = item.thumbnail || '';
        const date = item.created ? new Date(item.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        const thumbHtml = eThumbnail
          ? `<img src="${this._escAttr(eThumbnail)}" class="list-thumb" alt="">`
          : `<span class="list-thumb list-thumb-icon">${this._typeIcon(item.type)}</span>`;
        const tags = (item.tags || []).slice(0, 3).map(t => `<span class="list-tag">${this._esc(t)}</span>`).join('');
        return `<div class="gallery-list-row" data-href="${eFile}" onclick="window.open(this.dataset.href,'_blank','noopener')">
          ${thumbHtml}
          <div class="list-info">
            <div class="list-name">${eName}</div>
            <div class="list-meta">${this._esc(item.type)} · ${date}${tags ? ' · ' + tags : ''}</div>
          </div>
        </div>`;
      }).join('');
    } else if (view === 'expanded') {
      el.className = 'gallery-expanded-container';
      el.innerHTML = filtered.map(item => {
        const eName = this._esc(item.name);
        const eFile = this._escAttr(item.file || '');
        const eThumbnail = item.thumbnail || '';
        const date = item.created ? new Date(item.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const thumbHtml = eThumbnail
          ? `<img src="${this._escAttr(eThumbnail)}" class="expanded-thumb" alt="">`
          : `<div class="expanded-thumb expanded-thumb-icon">${this._typeIcon(item.type)}</div>`;
        const tags = (item.tags || []).map(t => `<span class="card-tag" style="font-size:11px;">${this._esc(t)}</span>`).join('');
        return `<div class="gallery-expanded-card" data-href="${eFile}" onclick="window.open(this.dataset.href,'_blank','noopener')">
          ${thumbHtml}
          <div class="expanded-body">
            <div style="font-weight:600;font-size:15px;color:var(--text);">${eName}</div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;">${this._esc(item.type)} · ${date}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;">${tags}</div>
          </div>
        </div>`;
      }).join('');
    } else {
      // Cards (default)
      el.className = 'gallery-grid';
      el.innerHTML = `<cc-stagger animation="scale" delay="50">${filtered.map(item => {
        const eTags = this._escAttr(JSON.stringify(item.tags || []));
        return `<cc-media-card
          title="${this._escAttr(item.name)}"
          type="${this._escAttr(item.type)}"
          src="${this._escAttr(item.file || '')}"
          thumbnail="${this._escAttr(item.thumbnail || '')}"
          date="${this._escAttr(item.created || '')}"
          tags='${eTags}'
          media-id="${this._escAttr(item.id || item.name)}"
        ></cc-media-card>`;
      }).join('')}</cc-stagger>`;
    }
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
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
      .gallery-grid > cc-stagger {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        grid-column: 1 / -1;
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
        background: var(--glass-bg, rgba(255,255,255,.05));
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
      /* List view */
      .gallery-list-container {
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
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background .15s;
      }
      .gallery-list-row:hover {
        background: var(--glass-hover, rgba(255,255,255,0.08));
      }
      .list-thumb {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        object-fit: cover;
        flex-shrink: 0;
        background: var(--glass-bg, rgba(255,255,255,.05));
      }
      .list-thumb-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 1px solid var(--accent, #f59e0b);
        background: var(--accent-bg, rgba(245,158,11,0.08));
        color: var(--accent, #f59e0b);
      }
      .list-info {
        flex: 1;
        min-width: 0;
      }
      .list-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .list-meta {
        font-size: 12px;
        color: var(--muted);
        margin-top: 2px;
      }
      .list-tag {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        background: var(--glass-bg, rgba(255,255,255,.08));
      }
      /* Expanded view */
      .gallery-expanded-container {
        max-width: 1100px;
        margin: 20px auto 0;
        padding: 0 20px 40px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .gallery-expanded-card {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        cursor: pointer;
        transition: border-color .2s, box-shadow .2s;
      }
      .gallery-expanded-card:hover {
        border-color: var(--accent);
        box-shadow: 0 4px 20px rgba(245,158,11,.1);
      }
      .expanded-thumb {
        width: 120px;
        height: 80px;
        border-radius: 8px;
        object-fit: cover;
        flex-shrink: 0;
        background: var(--glass-bg, rgba(255,255,255,.05));
      }
      .expanded-thumb-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        border: 1px solid var(--accent, #f59e0b);
        background: var(--accent-bg, rgba(245,158,11,0.08));
        color: var(--accent, #f59e0b);
      }
      .expanded-body {
        flex: 1;
        min-width: 0;
      }
      @media (max-width: 600px) {
        .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .gallery-grid > cc-stagger { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .gallery-card-body { padding: 10px 12px 12px; }
        .gallery-card-title { font-size: 13px; }
        .expanded-thumb { width: 80px; height: 56px; }
      }
    `;
    document.head.appendChild(s);
  }
}
customElements.define('cc-gallery', CcGallery);
