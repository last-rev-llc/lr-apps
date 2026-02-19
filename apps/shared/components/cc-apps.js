// ─── Shared Apps Grid Component ──────────────────────────
// Displays app cards from the app_registry Supabase table.
// Supports filtering by category, search, and status.
//
// Usage:
//   <cc-apps></cc-apps>                     — all active apps
//   <cc-apps category="business"></cc-apps>  — pre-filtered
//   <cc-apps show-filters="false"></cc-apps> — hide filter pills
//   <cc-apps columns="4"></cc-apps>          — custom column count
//
// Requires: supabase-client.js loaded (window.supabase)

(function () {
  if (customElements.get('cc-apps')) return;

  /* ── Lucide icon subset (SVG paths) ── */
  const LUCIDE = {
    'building-2':'<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    'trophy':'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    'bot':'<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    'heart-pulse':'<path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 0 1 8.205 5.125a5 5 0 0 1 3.795 1.71a5 5 0 0 1 3.795-1.71a5 5 0 0 1 3.705 7.447Z"/><path d="M12 6l-1 4h4l-1 4"/>',
    'file-text':'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    'clock':'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'image':'<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'lightbulb':'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'target':'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'test-tube':'<path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/><path d="M14.5 16h-5"/>',
    'users':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'bar-chart-3':'<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
    'layout-dashboard':'<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="5" x="14" y="12" rx="1"/><rect width="7" height="9" x="3" y="16" rx="1"/>',
    'laugh':'<circle cx="12" cy="12" r="10"/><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    'zap':'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    'graduation-cap':'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    'book-open':'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'palette':'<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    'gauge':'<path d="m12 14 4-8"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    'video':'<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>',
    'music':'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    'dollar-sign':'<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    'smile':'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    'dumbbell':'<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',
    'kanban':'<path d="M6 5v11"/><path d="M12 5v6"/><path d="M18 5v14"/>',
    'clipboard-list':'<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    'star':'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'plane':'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    'activity':'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    'eye':'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'package':'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'
  };

  function lucideIcon(name, size = 20) {
    const paths = LUCIDE[name];
    if (!paths) return `<span style="font-size:${size}px">📦</span>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }

  const CATEGORY_LABELS = {
    all: 'All',
    ops: 'Ops',
    business: 'Business',
    productivity: 'Productivity',
    creative: 'Creative',
    education: 'Education',
    fun: 'Fun',
    team: 'Team',
    travel: 'Travel',
    fitness: 'Fitness',
    content: 'Content',
    showcase: 'Showcase',
    infrastructure: 'Infrastructure'
  };

  class CcApps extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this._apps = [];
      this._activeCat = this.getAttribute('category') || 'all';
      this._query = '';
      this._showFilters = this.getAttribute('show-filters') !== 'false';
      this._columns = parseInt(this.getAttribute('columns')) || 3;
      this._buildShell();
      this._load();
    }

    _buildShell() {
      const cols = this._columns;
      this.innerHTML = `
        <style>
          .cc-apps-header { display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
          .cc-apps-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
          .cc-apps-pill { padding:6px 16px; border-radius:20px; border:1px solid var(--border); background:transparent; color:var(--muted); font-size:13px; cursor:pointer; transition:all .2s; font-family:inherit; }
          .cc-apps-pill:hover,.cc-apps-pill.active { background:var(--accent); color:#fff; border-color:var(--accent); }
          .cc-apps-count { font-size:13px; color:var(--muted); margin-bottom:16px; }
          .cc-apps-group-header { display:flex; align-items:center; gap:10px; margin:28px 0 14px; padding-bottom:8px; border-bottom:1px solid var(--border); }
          .cc-apps-group-header:first-child { margin-top:0; }
          .cc-apps-group-title { font-size:17px; font-weight:700; color:var(--text); }
          .cc-apps-group-count { font-size:12px; color:var(--muted); background:var(--border); padding:2px 8px; border-radius:10px; }
          .cc-apps-grid { display:grid; grid-template-columns:repeat(${cols},1fr); gap:16px; margin-bottom:8px; }
          @media(max-width:900px){ .cc-apps-grid { grid-template-columns:repeat(2,1fr); } }
          @media(max-width:560px){ .cc-apps-grid { grid-template-columns:1fr; } }
          .cc-app-card { display:flex; align-items:flex-start; gap:16px; padding:20px; text-decoration:none; border-radius:var(--radius,12px); background:var(--surface); border:1px solid var(--border); transition:transform .2s,box-shadow .2s,border-color .2s; }
          .cc-app-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.25); border-color:var(--accent); }
          .cc-app-card .cc-app-icon { width:40px; height:40px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border-radius:10px; background:rgba(var(--accent-rgb,99,102,241),.12); color:var(--accent); }
          .cc-app-card .cc-app-info { flex:1; min-width:0; }
          .cc-app-card .cc-app-name { font-weight:600; font-size:15px; color:var(--text); margin-bottom:4px; }
          .cc-app-card .cc-app-desc { font-size:12px; color:var(--muted); margin-bottom:8px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
          .cc-app-card .cc-app-tag { display:inline-block; font-size:10px; padding:2px 8px; border-radius:10px; background:var(--border); color:var(--muted); text-transform:capitalize; }
          .cc-apps-empty { text-align:center; padding:48px 20px; color:var(--muted); }
          .cc-app-card-wrap { position:relative; }
          .cc-app-star { position:absolute; top:8px; right:8px; background:none; border:none; cursor:pointer; font-size:18px; color:var(--muted); opacity:0.5; transition:all .2s; z-index:2; padding:4px; line-height:1; }
          .cc-app-star:hover,.cc-app-star.active { opacity:1; color:#f59e0b; transform:scale(1.2); }
        </style>
        <div class="cc-apps-header">
          <cc-search placeholder="Search apps…" input-class="cc-apps-search"></cc-search>
        </div>
        ${this._showFilters ? '<div class="cc-apps-filters" id="ccAppsFilters"></div>' : ''}
        <div class="cc-apps-count" id="ccAppsCount"></div>
        <div class="cc-apps-grid" id="ccAppsGrid"></div>
      `;

      // Search
      const search = this.querySelector('cc-search');
      if (search) search.addEventListener('cc-search', e => { this._query = e.detail.value; this._render(); });

      // Filter clicks
      const filters = this.querySelector('#ccAppsFilters');
      if (filters) filters.addEventListener('click', e => {
        const btn = e.target.closest('.cc-apps-pill');
        if (!btn) return;
        this._activeCat = btn.dataset.cat;
        filters.querySelectorAll('.cc-apps-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === this._activeCat));
        this._render();
      });
    }

    async _load() {
      try {
        if (!window.supabase) {
          // Wait briefly for supabase init
          await new Promise(r => setTimeout(r, 500));
        }
        if (!window.supabase) {
          console.warn('cc-apps: Supabase client not available, cannot load apps');
          return;
        }
        this._apps = await window.supabase.select('app_registry', {
          filters: { status: 'eq.active' },
          order: 'sort_order.asc'
        });
      } catch (err) {
        console.error('cc-apps: Failed to load from Supabase', err);
        this._apps = [];
      }
      this._buildFilters();
      this._render();
    }

    _buildFilters() {
      const filtersEl = this.querySelector('#ccAppsFilters');
      if (!filtersEl) return;
      // Collect unique categories present in data
      const cats = [...new Set(this._apps.map(a => a.category).filter(Boolean))].sort();
      let html = `<button class="cc-apps-pill ${this._activeCat === 'all' ? 'active' : ''}" data-cat="all">All</button>`;
      for (const cat of cats) {
        const label = CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
        html += `<button class="cc-apps-pill ${this._activeCat === cat ? 'active' : ''}" data-cat="${cat}">${label}</button>`;
      }
      filtersEl.innerHTML = html;
    }

    async _toggleStar(id) {
      const app = this._apps.find(a => a.id === id);
      if (!app || !window.supabase) return;
      const newVal = !app.starred;
      try {
        await window.supabase.update('app_registry', { starred: newVal }, { id: `eq.${id}` });
        app.starred = newVal;
        this._render();
        if (window.showToast) window.showToast(newVal ? '⭐ Starred!' : 'Unstarred', 1500);
      } catch(e) { console.error('Star toggle failed', e); }
    }

    _renderCard(a) {
      const iconHtml = a.icon ? lucideIcon(a.icon, 20) : '📦';
      const catLabel = CATEGORY_LABELS[a.category] || a.category || '';
      const starClass = a.starred ? 'cc-app-star active' : 'cc-app-star';
      return `<div class="cc-app-card-wrap">
        <a href="${a.url}" target="_blank" rel="noopener" class="cc-app-card">
          <div class="cc-app-icon">${iconHtml}</div>
          <div class="cc-app-info">
            <div class="cc-app-name">${a.name}</div>
            <div class="cc-app-desc">${a.short_description || ''}</div>
            <span class="cc-app-tag">${catLabel}</span>
          </div>
        </a>
        <button class="${starClass}" data-star-id="${a.id}" title="${a.starred ? 'Unstar' : 'Star'}">${a.starred ? '★' : '☆'}</button>
      </div>`;
    }

    _renderSection(title, apps) {
      if (!apps.length) return '';
      let html = `<div style="grid-column:1/-1" class="cc-apps-group-header">
        <span class="cc-apps-group-title">${title}</span>
        <span class="cc-apps-group-count">${apps.length}</span>
      </div>`;
      html += apps.map(a => this._renderCard(a)).join('');
      return html;
    }

    _render() {
      const grid = this.querySelector('#ccAppsGrid');
      const countEl = this.querySelector('#ccAppsCount');
      if (!grid) return;

      const q = this._query.toLowerCase();
      const filtered = this._apps.filter(a => {
        if (this._activeCat !== 'all' && a.category !== this._activeCat) return false;
        if (q) {
          const haystack = `${a.name} ${a.short_description || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });

      if (countEl) countEl.textContent = `${filtered.length} app${filtered.length !== 1 ? 's' : ''}`;

      if (!filtered.length) {
        grid.innerHTML = `<div class="cc-apps-empty" style="grid-column:1/-1">No apps found</div>`;
        this._bindStars();
        return;
      }

      let html = '';

      // Smart sections only when showing all (no search, no category filter)
      if (this._activeCat === 'all' && !q) {
        // ⭐ Starred
        const starred = this._apps.filter(a => a.starred && a.status === 'active');
        html += this._renderSection('⭐ Starred', starred);
        const shown = new Set(starred.map(a => a.name));

        // 🔥 Recently Used (exclude starred)
        const recent = [...this._apps]
          .filter(a => a.last_accessed && a.status === 'active' && !shown.has(a.name))
          .sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed))
          .slice(0, 8);
        html += this._renderSection('🔥 Recently Used', recent);
        recent.forEach(a => shown.add(a.name));

        // 📊 Most Popular (exclude starred + recently used)
        const popular = [...this._apps]
          .filter(a => (a.pageview_count || 0) > 0 && a.status === 'active' && !shown.has(a.name))
          .sort((a, b) => (b.pageview_count || 0) - (a.pageview_count || 0))
          .slice(0, 8);
        html += this._renderSection('📊 Most Popular', popular);

        // Divider before alphabetical list
        if (starred.length || recent.length || popular.length) {
          html += `<div style="grid-column:1/-1;border-top:2px solid var(--border);margin:16px 0;"></div>`;
        }
      }

      // Group by category, sort alphabetically within each group
      const GROUP_ORDER = ['ops', 'business', 'productivity', 'infrastructure', 'creative', 'content', 'team', 'education', 'travel', 'fitness', 'fun', 'showcase'];
      const groups = {};
      for (const a of filtered) {
        const cat = a.category || 'other';
        (groups[cat] = groups[cat] || []).push(a);
      }
      for (const cat of Object.keys(groups)) {
        groups[cat].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }
      const orderedCats = GROUP_ORDER.filter(c => groups[c]);
      const remaining = Object.keys(groups).filter(c => !GROUP_ORDER.includes(c)).sort();
      const allCats = [...orderedCats, ...remaining];

      if (this._activeCat !== 'all') {
        html += filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(a => this._renderCard(a)).join('');
      } else {
        for (const cat of allCats) {
          const apps = groups[cat];
          const label = CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
          html += this._renderSection(label, apps);
        }
      }
      grid.innerHTML = html;
      this._bindStars();
    }

    _bindStars() {
      this.querySelectorAll('[data-star-id]').forEach(btn => {
        btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this._toggleStar(btn.dataset.starId); };
      });
    }
  }

  customElements.define('cc-apps', CcApps);
})();
