// ─── Ideas (unified: generated + community + manual) ─────────
class CcIdeas extends HTMLElement {
  connectedCallback() {
    const p = (window.CC && CC.getParams) ? CC.getParams() : {};
    this._appAttr = this.getAttribute('app') || null; // fixed app filter (for per-app ideas pages)
    this._activeCat = p.category || 'All';
    this._activeStatus = p.status || 'All';
    this._activeSource = p.source || 'All';
    this._activeApp = this._appAttr || p.app || 'All'; // App filter (only shown when no app attribute)
    this._activeSort = p.sort || 'rating';
    this._sortAsc = p.asc === 'true';
    this._showHidden = p.hidden === 'true';
    this._showCompleted = p.completed === 'true';
    this._activeShow = p.show || 'active';
    this._searchQuery = p.q || '';
    this._viewMode = 'cards';
    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._syncUrl(); this._render(); });
    this.addEventListener('cc-view-change', e => { this._viewMode = e.detail.view; this._render(); });
    this._expandedId = p.expand || null;
    this._load();
  }

  _syncUrl() {
    if (window.CC && CC.setParams) CC.setParams({
      category: this._activeCat,
      status: this._activeStatus,
      source: this._activeSource,
      app: (!this._appAttr && this._activeApp !== 'All') ? this._activeApp : null,
      sort: this._activeSort === 'rating' ? null : this._activeSort,
      asc: this._sortAsc || null,
      hidden: this._showHidden || null,
      completed: this._showCompleted || null,
      show: this._activeShow === 'active' ? null : this._activeShow,
      q: this._searchQuery || null,
      expand: this._expandedId || null
    });
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Read state directly from idea rows (Supabase columns)
  _getHidden() {
    return (this._data || []).filter(x => x.hidden).map(x => x.id);
  }
  _isMobile() { return window.innerWidth <= 700; }

  _confirmAction(title, message, onConfirm) {
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', title);
    modal.setAttribute('size', 'sm');
    modal.innerHTML = `
      <p style="color:var(--text);font-size:14px;margin:0 0 16px;">${message}</p>
      <div class="flex gap-2 justify-end">
        <button class="btn btn-secondary btn-sm" onclick="this.closest('cc-modal').close()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="cc-ideas-confirm-btn">Confirm</button>
      </div>`;
    document.body.appendChild(modal);
    modal.open();
    modal.querySelector('#cc-ideas-confirm-btn').addEventListener('click', () => {
      modal.close();
      onConfirm();
    });
    modal.addEventListener('modal-close', () => setTimeout(() => modal.remove(), 300));
  }

  _toggleHide(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const isHidden = x.hidden;
    const doIt = () => {
      x.hidden = !x.hidden;
      if (window.supabase) window.supabase.upsert('ideas', { id, hidden: x.hidden }).catch(e => console.warn('Supabase:', e));
      this._render();
    };
    if (this._isMobile() && !isHidden) {
      this._confirmAction('Hide Idea', 'Dismiss this idea? You can restore it later from the Hidden filter.', doIt);
    } else {
      doIt();
    }
  }

  _getRatings() {
    const map = {};
    (this._data || []).forEach(x => { if (x.rating) map[x.id] = x.rating; });
    return map;
  }
  _rate(id, stars) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    x.rating = (x.rating === stars) ? 0 : stars;
    if (window.supabase) window.supabase.upsert('ideas', { id, rating: x.rating }).catch(e => console.warn('Supabase:', e));
    this._render();
  }

  // Snooze support — stored as snoozedUntil column on each idea
  _getSnoozed() {
    const map = {};
    (this._data || []).forEach(x => { if (x.snoozedUntil) map[x.id] = x.snoozedUntil; });
    return map;
  }
  _isSnoozed(id) {
    const x = this._data.find(i => i.id === id);
    if (!x || !x.snoozedUntil) return false;
    if (new Date(x.snoozedUntil) <= new Date()) {
      this._unsnooze(id);
      return false;
    }
    return true;
  }
  _snooze(id, duration) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    if (duration === 'show') {
      x.snoozedUntil = null;
    } else {
      const now = new Date();
      const ms = { '1d': 86400000, '1w': 604800000, '2w': 1209600000, '1mo': 2592000000 };
      x.snoozedUntil = new Date(now.getTime() + (ms[duration] || 86400000)).toISOString();
    }
    if (window.supabase) window.supabase.upsert('ideas', { id, snoozedUntil: x.snoozedUntil }).catch(e => console.warn('Supabase:', e));
    this._render();
  }
  _unsnooze(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    x.snoozedUntil = null;
    if (window.supabase) window.supabase.upsert('ideas', { id, snoozedUntil: null }).catch(e => console.warn('Supabase:', e));
  }
  _showSnoozeMenu(id, btn) {
    // Remove any existing snooze menu
    document.querySelectorAll('.snooze-menu').forEach(m => m.remove());
    const rect = btn.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'snooze-menu';
    menu.innerHTML = `
      <div class="snooze-option" data-dur="show">👁 Show Now</div>
      <div class="snooze-option" data-dur="1d">1 Day</div>
      <div class="snooze-option" data-dur="1w">1 Week</div>
      <div class="snooze-option" data-dur="2w">2 Weeks</div>
      <div class="snooze-option" data-dur="1mo">1 Month</div>
    `;
    menu.style.cssText = `position:fixed;top:${rect.bottom+4}px;left:${rect.left}px;z-index:9999;background:var(--surface,#1e1e2e);border:1px solid var(--border);border-radius:8px;padding:4px;min-width:120px;box-shadow:0 8px 24px rgba(0,0,0,0.4);`;
    menu.querySelectorAll('.snooze-option').forEach(opt => {
      opt.style.cssText = 'padding:6px 12px;font-size:13px;color:var(--text);cursor:pointer;border-radius:6px;';
      opt.addEventListener('mouseenter', () => opt.style.background = 'var(--glass-hover,rgba(255,255,255,0.12))');
      opt.addEventListener('mouseleave', () => opt.style.background = 'transparent');
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        this._snooze(id, opt.dataset.dur);
        menu.remove();
      });
    });
    document.body.appendChild(menu);
    const close = (e) => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 0);
  }

  _getCompleted() {
    const map = {};
    (this._data || []).forEach(x => { if (x.completedAt) map[x.id] = x.completedAt; });
    return map;
  }
  _toggleComplete(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const isCompleted = !!x.completedAt;
    const doIt = () => {
      x.completedAt = x.completedAt ? null : new Date().toISOString().slice(0, 10);
      if (window.supabase) window.supabase.upsert('ideas', { id, completedAt: x.completedAt }).catch(e => console.warn('Supabase:', e));
      this._render();
    };
    if (this._isMobile() && !isCompleted) {
      this._confirmAction('Mark Complete', 'Mark this idea as completed?', doIt);
    } else {
      doIt();
    }
  }

  async _load() {
    const sb = window.supabase;
    try {
      if (sb) {
        this._data = await sb.select('ideas', { order: 'createdAt.desc.nullslast' });
        this._source = 'supabase';
        // Parse JSON string fields from Supabase
        const jsonFields = ['tags','similarSolutions','relatedIdeas','resources','integrations'];
        this._data.forEach(r => {
          jsonFields.forEach(f => { if (typeof r[f] === 'string') try { r[f] = JSON.parse(r[f]); } catch(e) { r[f] = []; } });
          jsonFields.forEach(f => { if (!r[f]) r[f] = []; });
        });
        // Build list of unique app values for the App filter dropdown
        this._appList = [...new Set(this._data.map(r => r.app).filter(Boolean))].sort();
      } else {
        const src = this.getAttribute('src');
        if (!src) return;
        this._data = await (await fetch(src)).json();
        this._source = 'json';
      }
      this._render();
      if (window.UserPrefs && UserPrefs.ready) {
        UserPrefs.ready.then(() => this._render());
      }
    } catch (e) {
      console.error('cc-ideas:', e);
      // Fallback to JSON if Supabase fails
      if (this._source !== 'json') {
        const src = this.getAttribute('src');
        if (src) {
          try { this._data = await (await fetch(src)).json(); this._source = 'json-fallback'; this._render(); }
          catch(e2) { console.error('cc-ideas fallback:', e2); }
        }
      }
    }
  }

  _setCat(c) { this._activeCat = (this._activeCat === c) ? 'All' : c; this._syncUrl(); this._render(); }
  _setStatus(s) { this._activeStatus = (this._activeStatus === s) ? 'All' : s; this._syncUrl(); this._render(); }
  _setSource(s) { this._activeSource = (this._activeSource === s) ? 'All' : s; this._syncUrl(); this._render(); }
  _setSort(s) { if (this._activeSort === s) { this._sortAsc = !this._sortAsc; } else { this._activeSort = s; this._sortAsc = false; } this._syncUrl(); this._render(); }
  _toggleShowHidden() { this._showHidden = !this._showHidden; this._syncUrl(); this._render(); }
  _toggleShowCompleted() { this._showCompleted = !this._showCompleted; this._syncUrl(); this._render(); }
  _setShow(v) { this._activeShow = v; this._syncUrl(); this._render(); }
  _toggleExpand(id) { this._expandedId = this._expandedId === id ? null : id; this._syncUrl(); this._render(); }

  async _buildIdea(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const btn = this.querySelector(`#card-${CSS.escape(x.id)} .build-btn`);
    btn.classList.add('loading'); btn.disabled = true; btn.innerHTML = '<i data-lucide="loader"></i>'; window.refreshIcons && window.refreshIcons();
    const msg = x.prompt
      ? `Build this community project for me: "${x.title}"\n\nHere's the recreation prompt:\n${x.prompt}`
      : `Build this idea: "${x.title}"\n\nCategory: ${x.category} | Effort: ${x.effort}\n\n${x.description}\n\nTags: ${(x.tags||[]).join(', ')}`;
    try {
      const res = await window.trigger(msg); if (!res) throw new Error('trigger failed');
      btn.classList.remove('loading'); btn.textContent = '✅ Sent!';
      window.showToast?.(`⚡ Build request sent for "${x.title}"!`, 4000);
      const toast = document.querySelector('cc-toast'); if (toast && toast.show) toast.show(`⚡ Build request sent for "${x.title}"!`, 'success');
      setTimeout(() => { btn.innerHTML = '<i data-lucide="hammer"></i> Build It'; window.refreshIcons && window.refreshIcons(); }, 3000);
    } catch (e) {
      btn.classList.remove('loading'); btn.innerHTML = '<i data-lucide="hammer"></i> Build It'; window.refreshIcons && window.refreshIcons();
      const toast = document.querySelector('cc-toast'); if (toast && toast.show) toast.show('Failed to send — try again', 'error');
    }
  }

  _quickFilters = [
    { label: '⭐ Needs Rating', sort: 'rating', asc: true, show: 'active', cat: 'All', source: 'All', status: 'All' },
    { label: '🔥 Top Rated', sort: 'rating', asc: false, show: 'active', cat: 'All', source: 'All', status: 'All' },
    { label: '🚀 Quick Wins', sort: 'feasibility', asc: false, show: 'active', cat: 'All', source: 'All', status: 'All', effort: 'Low' },
    { label: '💡 New Today', sort: 'createdAt', asc: false, show: 'active', cat: 'All', source: 'All', status: 'new' },
    { label: '🛠️ Skills', sort: 'rating', asc: false, show: 'active', cat: 'Skills', source: 'All', status: 'All' },
    { label: '🌐 Community', sort: 'rating', asc: true, show: 'active', cat: 'All', source: 'community', status: 'All' },
  ];
  _activeQuickFilter = null;

  _applyQuickFilter(idx) {
    if (this._activeQuickFilter === idx) {
      // Toggle off — reset to defaults
      this._activeQuickFilter = null;
      this._activeSort = 'compositeScore';
      this._sortAsc = false;
      this._activeShow = 'active';
      this._activeCat = 'All';
      this._activeSource = 'All';
      this._activeStatus = 'All';
      this._activeEffort = null;
    } else {
      const f = this._quickFilters[idx];
      this._activeQuickFilter = idx;
      this._activeSort = f.sort;
      this._sortAsc = f.asc;
      this._activeShow = f.show;
      this._activeCat = f.cat;
      this._activeSource = f.source;
      this._activeStatus = f.status;
      this._activeEffort = f.effort || null;
    }
    this._syncUrl();
    this._render();
  }

  async _generateIdeas() {
    const btn = this.querySelector('#gen-btn');
    btn.innerHTML = '⏳ Generating…'; btn.disabled = true;
    const msg = 'Run the idea generation cron job now — review recipes, community, and recent work, then generate 1-3 new ideas and add them to ideas.json';
    try {
      const res = await window.trigger(msg); if (!res) throw new Error('trigger failed');
      if (!res.ok) throw new Error('API ' + res.status);
      // Also notify via Slack
      window.trigger('💡 Idea generation triggered from Command Center dashboard. Generating new ideas now...', { silent: true }).catch(() => {});
      btn.textContent = '✅ Sent!';
      const toast = document.querySelector('cc-toast'); if (toast && toast.show) toast.show('⚡ Generating ideas — refresh in a minute or two!', 'success');
      setTimeout(() => { btn.innerHTML = '<i data-lucide="refresh-cw"></i>'; btn.disabled = false; window.refreshIcons && window.refreshIcons(); }, 3000);
    } catch (e) {
      btn.innerHTML = '<i data-lucide="refresh-cw"></i>'; btn.disabled = false; window.refreshIcons && window.refreshIcons();
      const toast = document.querySelector('cc-toast'); if (toast && toast.show) toast.show('Failed to send — try again', 'error');
    }
  }

  _copyIdea(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const text = x.prompt
      ? `${x.title}\n\nCategory: ${x.category} | Source: ${x.source} | Effort: ${x.effort}\nFeasibility: ${x.feasibility}/10 | Impact: ${x.impact}/10 | Score: ${x.compositeScore}\n\n${x.description}\n\nPrompt:\n${x.prompt}`
      : `${x.title}\n\nCategory: ${x.category} | Status: ${x.status} | Effort: ${x.effort}\nFeasibility: ${x.feasibility}/10 | Impact: ${x.impact}/10 | Score: ${x.compositeScore}\n\n${x.description}\n\nTags: ${(x.tags||[]).join(', ')}\nSimilar: ${(x.similarSolutions||[]).join(', ')}\n${x.notes ? '\nNotes: ' + x.notes : ''}`;
    navigator.clipboard.writeText(text).then(() => {
      const btn = this.querySelector(`#card-${CSS.escape(id)} .copy-btn`);
      if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => { btn.innerHTML = '<i data-lucide="clipboard"></i> Copy'; window.refreshIcons && window.refreshIcons(); }, 2000); }
    });
  }

  _totalScore(x) {
    const r = x.rating || 0;
    return Math.round(((x.compositeScore || 0) + r) * 10) / 10;
  }

  _scoreHTML(x, big) {
    const score = x.compositeScore || 0;
    const rating = x.rating || 0;
    const total = this._totalScore(x);
    const sz = big ? 'font-size:1.5rem' : 'font-size:1.25rem';
    const w = big ? '3rem' : '2.5rem';
    return `<span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1;min-width:${w};">
      <span style="${sz};font-weight:800;color:var(--accent);">${total}</span>
      <span style="display:flex;justify-content:space-between;width:100%;line-height:1;margin-top:2px;">
        <span style="font-size:9px;color:var(--muted);font-weight:600;">${score}</span>
        <span style="font-size:9px;color:var(--muted);font-weight:600;">${rating}</span>
      </span>
    </span>`;
  }

  _sort(arr) {
    const dir = this._sortAsc ? -1 : 1;
    return [...arr].sort((a, b) => {
      let cmp = 0;
      switch (this._activeSort) {
        case 'rating': cmp = this._totalScore(b) - this._totalScore(a); break;
        case 'impact': cmp = b.impact - a.impact; break;
        case 'feasibility': cmp = b.feasibility - a.feasibility; break;
        case 'createdAt': cmp = (b.createdAt || '').localeCompare(a.createdAt || ''); break;
        case 'title': cmp = a.title.localeCompare(b.title); break;
        default: cmp = this._totalScore(b) - this._totalScore(a); break;
      }
      return (cmp || a.title.localeCompare(b.title)) * dir;
    });
  }

  _render() {
    const hadFocus = this.querySelector('.search') === document.activeElement;
    const selStart = hadFocus ? this.querySelector('.search').selectionStart : 0;
    const selEnd = hadFocus ? this.querySelector('.search').selectionEnd : 0;

    const CAT_COLORS = { Product: 'var(--accent)', Content: 'var(--blue)', Business: 'var(--yellow)', Technical: 'var(--green)', Creative: '#ec4899', Skills: 'var(--orange)' };
    const STATUS_COLORS = { new: 'var(--blue)', backlog: 'var(--muted)', 'in-progress': 'var(--orange)', completed: 'var(--green)', archived: 'var(--muted)' };
    const EFFORT_COLORS = { Low: 'var(--green)', Medium: 'var(--yellow)', High: 'var(--red)' };
    const SOURCE_COLORS = { generated: 'var(--accent)', community: 'var(--blue)', manual: 'var(--yellow)' };
    const CATEGORIES = ['All', 'Product', 'Content', 'Business', 'Technical', 'Creative', 'Skills'];
    const STATUSES = ['All', 'new', 'backlog', 'in-progress', 'completed', 'archived'];
    const SOURCES = ['All', 'generated', 'community', 'manual'];

    const hidden = this._getHidden();
    const completed = this._getCompleted();
    const ratings = this._getRatings();
    const q = (this._searchQuery || '').toLowerCase().trim();

    let filtered = this._data;
    const snoozed = this._getSnoozed();
    const now = new Date();
    // Show filter
    if (this._activeShow === 'active') {
      filtered = filtered.filter(x => !hidden.includes(x.id) && x.status !== 'completed' && !completed[x.id] && !this._isSnoozed(x.id));
    } else if (this._activeShow === 'completed') {
      filtered = filtered.filter(x => x.status === 'completed' || completed[x.id]);
    } else if (this._activeShow === 'hidden') {
      filtered = filtered.filter(x => hidden.includes(x.id));
    } else if (this._activeShow === 'snoozed') {
      filtered = filtered.filter(x => this._isSnoozed(x.id));
    }
    // 'all' = no filtering
    if (this._activeCat !== 'All') filtered = filtered.filter(x => x.category === this._activeCat);
    if (this._activeStatus !== 'All' && this._activeStatus !== 'completed') {
      filtered = filtered.filter(x => x.status === this._activeStatus);
    }
    if (this._activeSource !== 'All') filtered = filtered.filter(x => x.source === this._activeSource);
    if (this._activeApp && this._activeApp !== 'All') filtered = filtered.filter(x => x.app === this._activeApp);
    if (this._activeEffort) filtered = filtered.filter(x => x.effort === this._activeEffort);
    if (q) filtered = filtered.filter(x =>
      x.title.toLowerCase().includes(q) || x.description.toLowerCase().includes(q) ||
      (x.tags||[]).some(t => t.toLowerCase().includes(q)) ||
      (x.integrations||[]).some(t => t.toLowerCase().includes(q)) ||
      (x.author||'').toLowerCase().includes(q)
    );
    filtered = this._sort(filtered);

    const hiddenCount = this._data.filter(x => hidden.includes(x.id)).length;
    const completedCount = this._data.filter(x => x.status === 'completed' || completed[x.id]).length;
    const snoozedCount = this._data.filter(x => this._isSnoozed(x.id)).length;
    const esc = this._esc.bind(this);

    this.innerHTML = `
      <cc-page-header icon="💡" title="Ideas" description="Feature ideas & backlog" count="${filtered.length}" count-label="idea${filtered.length !== 1 ? 's' : ''}">
          <button class="btn-add" onclick="this.closest('cc-ideas')._openAddModal()" title="Add Idea"><i data-lucide="plus"></i></button>
          <button class="btn-refresh" onclick="this.closest('cc-ideas')._generateIdeas()" id="gen-btn" title="Generate Ideas"><i data-lucide="refresh-cw"></i></button>
      </cc-page-header>
      <p class="subtitle" style="color:var(--muted);font-size:14px;margin:0 0 8px;">Track and prioritize ideas by impact, feasibility, and effort. Includes community-sourced projects. Click a card to expand details.</p>
      <!-- Search -->
      <div style="margin-bottom:10px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <cc-search placeholder="Search ideas, tags, integrations…" value="${esc(this._searchQuery)}" input-style="width:100%;"></cc-search>
          <cc-view-toggle app="ideas" value="${this._viewMode}"></cc-view-toggle>
        </div>
      </div>
      <!-- Quick Filters -->
      <div class="flex gap-2 mb-2" style="flex-wrap:wrap;">
        ${this._quickFilters.map((f, i) => `<button class="pill${this._activeQuickFilter === i ? ' active' : ''}" onclick="this.closest('cc-ideas')._applyQuickFilter(${i})">${f.label}</button>`).join('')}
      </div>
      <!-- Filters: Sort + Category + Source + Show in responsive grid -->
      <div class="ideas-filter-grid">
        <cc-pill-dropdown label="Sort" items='${JSON.stringify(['Rating','Impact','Feasibility','Date','Title'])}' value="${{rating:'Rating',impact:'Impact',feasibility:'Feasibility',createdAt:'Date',title:'Title'}[this._activeSort] || 'Rating'}" direction="${this._sortAsc ? 'asc' : 'desc'}"></cc-pill-dropdown>
        <cc-pill-dropdown label="Category" items='${JSON.stringify(['All',...CATEGORIES.slice(1)])}' value="${this._activeCat}"></cc-pill-dropdown>
        <cc-pill-dropdown label="Source" items='${JSON.stringify(SOURCES.map(s => s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)))}' value="${this._activeSource === 'All' ? 'All' : this._activeSource.charAt(0).toUpperCase() + this._activeSource.slice(1)}"></cc-pill-dropdown>
        ${!this._appAttr && (this._appList||[]).length ? `<cc-pill-dropdown label="App" items='${JSON.stringify(['All',...(this._appList||[])])}' value="${this._activeApp}"></cc-pill-dropdown>` : ''}
        <cc-pill-dropdown label="Show" items='${JSON.stringify([
          {value:'active',label:`Active (${this._data.length - completedCount - hiddenCount - snoozedCount})`},
          {value:'snoozed',label:`Snoozed (${snoozedCount})`},
          {value:'completed',label:`Completed (${completedCount})`},
          {value:'hidden',label:`Hidden (${hiddenCount})`},
          {value:'all',label:'All'}
        ])}' value="${this._activeShow}"></cc-pill-dropdown>
      </div>
      ${this._viewMode === 'list' ? `<div class="view-list">${filtered.map(x => {
        const isCompleted = x.status === 'completed' || completed[x.id];
        return `<div class="list-row" onclick="this.closest('cc-ideas')._openIdeaDetail('${x.id}')">
          ${this._scoreHTML(x, false)}
          <span class="row-name">${esc(x.title)}</span>
          <span class="badge" style="color:${CAT_COLORS[x.category] || 'var(--muted)'};border-color:${CAT_COLORS[x.category] || 'var(--muted)'};flex-shrink:0;">${x.category}</span>
          <span class="badge" style="color:${EFFORT_COLORS[x.effort] || 'var(--muted)'};flex-shrink:0;">${x.effort || ''}</span>
          <span class="row-desc">${esc(x.description)}</span>
          <span class="row-tags">${(x.tags||[]).slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span>
          ${isCompleted ? '<span style="color:var(--green);font-size:12px;">✓</span>' : ''}
        </div>`;
      }).join('')}</div>`
      : this._viewMode === 'expanded' ? `<div class="view-expanded">${filtered.map(x => {
        const isCompleted = x.status === 'completed' || completed[x.id];
        return `<div class="expanded-card" onclick="this.closest('cc-ideas')._openIdeaDetail('${x.id}')">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            ${this._scoreHTML(x, false)}
            <span style="font-size:16px;font-weight:700;">${esc(x.title)}</span>
            <span class="badge" style="color:${CAT_COLORS[x.category] || 'var(--muted)'};">${x.category}</span>
            <span class="badge" style="color:${STATUS_COLORS[x.status] || 'var(--muted)'};">${x.status}</span>
            <span class="badge" style="color:${EFFORT_COLORS[x.effort] || 'var(--muted)'};">${x.effort || ''}</span>
            ${isCompleted ? '<span style="color:var(--green);">✓</span>' : ''}
          </div>
          <div style="color:var(--text);line-height:1.6;margin-bottom:12px;">${esc(x.description)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            ${(x.integrations||[]).map(t => `<span class="int-badge">${esc(t)}</span>`).join('')}
            ${(x.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
          ${(x.similarSolutions||[]).length ? `<div style="font-size:12px;color:var(--muted);">Similar: ${x.similarSolutions.slice(0, 3).map(s => esc(typeof s === 'string' ? s : s.name || '')).join(', ')}</div>` : ''}
        </div>`;
      }).join('')}</div>`
      : `<div class="idea-grid">${filtered.map(x => {
        const isHidden = hidden.includes(x.id);
        const isCompleted = x.status === 'completed' || completed[x.id];
        const completedDate = x.completedAt || completed[x.id] || '';
        const expanded = this._expandedId === x.id;
        const srcColor = SOURCE_COLORS[x.source] || 'var(--muted)';
        return `
        <div class="idea-card${isHidden ? ' hidden-card' : ''}" id="card-${x.id}" onclick="this.closest('cc-ideas')._openIdeaDetail('${x.id}')">
          <!-- Row 1: Score + Title + Badges -->
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div class="score-big" style="flex-shrink:0;line-height:1;">${this._scoreHTML(x, false)}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:8px;">${esc(x.title)}</div>
              <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                <span class="badge" style="background:${CAT_COLORS[x.category]}22;color:${CAT_COLORS[x.category]}">${x.category}</span>
                <span class="badge" style="background:${EFFORT_COLORS[x.effort]}22;color:${EFFORT_COLORS[x.effort]}">${x.effort}</span>
                <span class="source-pill" style="background:${srcColor}22;color:${srcColor}">${x.source}</span>
              </div>
            </div>
          </div>
          <!-- Row 2: Description -->
          <div style="color:var(--muted);font-size:13px;line-height:1.4;margin-top:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(x.description)}</div>
          ${x.author ? `<div style="font-size:11px;color:var(--muted);margin-top:4px;">by <a href="${esc(x.sourceUrl||'#')}" target="_blank" rel="noopener" style="color:var(--accent);" onclick="event.stopPropagation()">${esc(x.author)}</a></div>` : ''}
          <!-- Row 3: Impact + Feasibility (single row) -->
          <div style="display:flex;gap:16px;align-items:center;margin-top:10px;">
            <div style="display:flex;align-items:center;gap:6px;flex:1;">
              <span style="font-size:11px;color:var(--muted);white-space:nowrap;">Impact ${x.impact}/10</span>
              <div class="bar-track"><div class="bar-fill" style="width:${x.impact * 10}%;background:var(--blue);"></div></div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex:1;">
              <span style="font-size:11px;color:var(--muted);white-space:nowrap;">Feasibility ${x.feasibility}/10</span>
              <div class="bar-track"><div class="bar-fill" style="width:${x.feasibility * 10}%;background:var(--green);"></div></div>
            </div>
          </div>
          <!-- Row 4: Date left, Stars + Actions right -->
          <div style="display:flex;align-items:center;margin-top:10px;">
            <div style="flex:1;display:flex;gap:8px;align-items:center;">
              <span style="font-size:11px;color:var(--muted);"><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${x.createdAt || 'Unknown'}</span>
              ${isCompleted && completedDate ? `<span style="font-size:11px;color:#4ade80;"><i data-lucide="check" style="width:12px;height:12px;"></i> ${completedDate}</span>` : ''}
            </div>
            <div style="display:flex;gap:6px;align-items:center;" onclick="event.stopPropagation()">
              <div class="stars">${[1,2,3,4,5].map(s => `<span class="star${s <= (ratings[x.id]||0) ? ' on' : ''}" onclick="this.closest('cc-ideas')._rate('${x.id}',${s})"><i data-lucide="star"${s <= (ratings[x.id]||0) ? ' style="fill:currentColor"' : ''}></i></span>`).join('')}</div>
              <button class="snooze-btn${this._isSnoozed(x.id) ? ' snoozed' : ''}" title="${this._isSnoozed(x.id) ? 'Snoozed until ' + new Date(snoozed[x.id]).toLocaleDateString() : 'Snooze'}" onclick="this.closest('cc-ideas')._showSnoozeMenu('${x.id}', this)"><i data-lucide="alarm-clock" style="width:14px;height:14px;"></i></button>
              <button class="complete-btn" title="${isCompleted ? 'Undo complete' : 'Mark complete'}" onclick="this.closest('cc-ideas')._toggleComplete('${x.id}')">${isCompleted ? '<i data-lucide="check-circle" style="width:14px;height:14px;"></i>' : '<i data-lucide="check" style="width:14px;height:14px;"></i>'}</button>
              <button class="hide-btn" title="${isHidden ? 'Restore' : 'Dismiss'}" onclick="this.closest('cc-ideas')._toggleHide('${x.id}')">${isHidden ? '<i data-lucide="eye"></i>' : '<i data-lucide="x"></i>'}</button>
            </div>
          </div>
          <div class="card-detail" style="display:none;">
            <div style="margin-bottom:8px;">
              ${(x.integrations||[]).map(t => `<span class="int-badge">${esc(t)}</span>`).join('')}
              ${(x.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
            </div>
            <div class="detail-label">Full Description</div>
            <div class="detail-text">${esc(x.description)}</div>
            ${x.notes ? `<div class="detail-label">Notes</div><div class="detail-text">${esc(x.notes)}</div>` : ''}
            ${x.prompt ? `<div class="detail-label">Recreation Prompt</div><div class="prompt-block">${esc(x.prompt)}</div>` : ''}
            ${(x.similarSolutions||[]).length ? `<div class="detail-label">Similar Solutions</div><div class="detail-text">${(x.similarSolutions||[]).map(s => esc(s)).join(' · ')}</div>` : ''}
            ${(x.relatedIdeas||[]).length ? `<div class="detail-label">Related Ideas</div><div class="detail-text">${(x.relatedIdeas||[]).map(r => esc(r)).join(', ')}</div>` : ''}
            ${(x.resources||[]).length ? `<div class="detail-label">Resources</div><div class="detail-text">${(x.resources||[]).map(r => `<a href="${esc(r)}" target="_blank" rel="noopener" style="color:var(--accent);font-size:12px;display:block;" onclick="event.stopPropagation()">${esc(r)}</a>`).join('')}</div>` : ''}
            <div style="margin-top:8px;" onclick="event.stopPropagation()">
              <button class="copy-btn" onclick="this.closest('cc-ideas')._copyIdea('${x.id}')"><i data-lucide="clipboard"></i> Copy</button>
              <button class="build-btn" style="background:transparent;color:var(--green);border:1px solid var(--green);border-radius:6px;padding:4px 12px;cursor:pointer;font-size:12px;font-weight:600;margin-left:8px;" onclick="this.closest('cc-ideas')._buildIdea('${x.id}')"><i data-lucide="hammer"></i> Build It</button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>`}
      ${filtered.length ? '' : '<cc-empty-state message="No ideas match that filter." icon="🔍" animation="none"></cc-empty-state>'}
<!-- Add Idea Modal -->
<cc-modal id="idea-detail-modal" title="" size="lg"></cc-modal>
<cc-modal id="add-idea-modal" title="💡 Add New Idea" size="sm">
  <cc-field label="Title" name="idea-title" placeholder="What's the idea?" required></cc-field>
  <cc-field label="Quick Description" type="textarea" name="idea-desc" placeholder="Brief description — I'll flesh it out, categorize, score, and tag it for you." rows="3"></cc-field>
  <div slot="footer">
    <button class="btn btn-sm" onclick="this.closest('cc-modal').close()">Cancel</button>
    <button class="btn btn-primary btn-sm" onclick="this.closest('cc-ideas')._submitIdea()">Submit</button>
  </div>
</cc-modal>`;

    if (hadFocus) {
      const inp = this.querySelector('.search');
      if (inp) { inp.focus(); inp.setSelectionRange(selStart, selEnd); }
    }
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);

    // Wire up shared pill-dropdown events
    const SORT_MAP = { Rating:'rating', Impact:'impact', Feasibility:'feasibility', Date:'createdAt', Title:'title' };
    const SORT_MAP_REV = Object.fromEntries(Object.entries(SORT_MAP).map(([k,v])=>[v,k]));
    this.querySelectorAll('cc-pill-dropdown').forEach(dd => {
      const label = dd.getAttribute('label');
      dd.addEventListener('pill-change', e => {
        const v = e.detail.value;
        this._activeQuickFilter = null; this._activeEffort = null;
        if (label === 'Sort') { const s = SORT_MAP[v]; if (s) this._setSort(s); }
        else if (label === 'Category') { this._activeCat = v; this._syncUrl(); this._render(); }
        else if (label === 'Source') { this._activeSource = v === 'All' ? 'All' : v.toLowerCase(); this._syncUrl(); this._render(); }
        else if (label === 'App') { this._activeApp = v; this._syncUrl(); this._render(); }
        else if (label === 'Show') { this._setShow(v); }
      });
      if (label === 'Sort') {
        dd.addEventListener('direction-change', e => {
          this._sortAsc = e.detail.direction === 'asc';
          this._syncUrl(); this._render();
        });
      }
    });
  }

  _openIdeaDetail(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const esc = this._esc;
    const CAT_COLORS = { Technical:'var(--blue)', Product:'#a855f7', Business:'var(--yellow)', Creative:'#ec4899', Content:'#14b8a6', Skills:'#6366f1' };
    const EFFORT_COLORS = { Small:'var(--green)', Medium:'var(--yellow)', Large:'var(--red)' };
    const SOURCE_COLORS = { generated:'#6366f1', community:'#a855f7', manual:'var(--yellow)' };
    const ratings = this._getRatings();
    const srcColor = SOURCE_COLORS[x.source] || 'var(--muted)';

    const modal = this.querySelector('#idea-detail-modal');
    if (!modal) return;
    modal.setAttribute('title', x.title);
    const h2 = modal.querySelector('.cc-modal-header h2');
    if (h2) h2.textContent = x.title;

    const body = modal.querySelector('.cc-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
        ${this._scoreHTML(x, true)}
        <span class="badge" style="background:${CAT_COLORS[x.category]||'var(--muted)'}22;color:${CAT_COLORS[x.category]||'var(--muted)'}">${x.category || 'Uncategorized'}</span>
        ${x.effort ? `<span class="badge" style="background:${EFFORT_COLORS[x.effort]||'var(--muted)'}22;color:${EFFORT_COLORS[x.effort]||'var(--muted)'}">${x.effort}</span>` : ''}
        <span class="source-pill" style="background:${srcColor}22;color:${srcColor};display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">${x.source || 'unknown'}</span>
        ${x.author ? `<span style="font-size:12px;color:var(--muted);">by <a href="${esc(x.sourceUrl||'#')}" target="_blank" style="color:var(--accent);">${esc(x.author)}</a></span>` : ''}
      </div>

      <div style="line-height:1.7;margin-bottom:16px;">${esc(x.description)}</div>

      ${x.impact || x.feasibility ? `
      <div style="display:flex;gap:24px;margin-bottom:16px;">
        ${x.impact ? `<div style="flex:1;"><span style="font-size:12px;color:var(--muted);">Impact ${x.impact}/10</span><div class="bar-track" style="margin-top:4px;"><div class="bar-fill" style="width:${x.impact*10}%;background:var(--blue);"></div></div></div>` : ''}
        ${x.feasibility ? `<div style="flex:1;"><span style="font-size:12px;color:var(--muted);">Feasibility ${x.feasibility}/10</span><div class="bar-track" style="margin-top:4px;"><div class="bar-fill" style="width:${x.feasibility*10}%;background:var(--green);"></div></div></div>` : ''}
      </div>` : ''}

      ${(x.integrations||[]).length || (x.tags||[]).length ? `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
        ${(x.integrations||[]).map(t => `<span class="pill">${esc(t)}</span>`).join('')}
        ${(x.tags||[]).map(t => `<span class="pill" style="opacity:0.7;">${esc(t)}</span>`).join('')}
      </div>` : ''}

      ${(x.similarSolutions||[]).length ? `<div style="margin-bottom:12px;"><h4 style="color:var(--accent);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Similar Solutions</h4><div style="font-size:13px;color:var(--muted);line-height:1.6;">${(x.similarSolutions||[]).map(s => esc(s)).join(' · ')}</div></div>` : ''}

      ${(x.relatedIdeas||[]).length ? `<div style="margin-bottom:12px;"><h4 style="color:var(--accent);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Related Ideas</h4><div style="font-size:13px;color:var(--muted);">${(x.relatedIdeas||[]).map(r => esc(r)).join(', ')}</div></div>` : ''}

      ${(x.resources||[]).length ? `<div style="margin-bottom:12px;"><h4 style="color:var(--accent);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Resources</h4>${(x.resources||[]).map(r => `<a href="${esc(r)}" target="_blank" style="color:var(--accent);font-size:12px;display:block;margin-bottom:2px;">${esc(r)}</a>`).join('')}</div>` : ''}

      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h4 style="color:var(--accent);font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;margin:0;">Prompt</h4>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm" onclick="this.closest('cc-ideas')._saveIdeaPrompt('${x.id}')"><i data-lucide="save"></i> Save</button>
          </div>
        </div>
        <textarea id="idea-prompt-edit" style="width:100%;min-height:160px;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--glass,rgba(255,255,255,0.08));color:var(--text);font-size:13px;font-family:monospace;line-height:1.6;box-sizing:border-box;resize:vertical;">${esc(x.prompt || '')}</textarea>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:12px;border-top:1px solid var(--border);">
        <button class="btn btn-sm" onclick="this.closest('cc-ideas')._copyIdea('${x.id}')"><i data-lucide="clipboard"></i> Copy</button>
        <button class="btn btn-sm" style="color:var(--green);border-color:var(--green);" onclick="this.closest('cc-ideas')._buildIdeaWithPrompt('${x.id}')"><i data-lucide="hammer"></i> Build It</button>
      </div>

      <div style="font-size:11px;color:var(--muted);margin-top:12px;">
        Created: ${x.createdAt || 'Unknown'}${x.updatedAt && x.updatedAt !== x.createdAt ? ` · Updated: ${x.updatedAt}` : ''}${x.completedAt ? ` · Completed: ${x.completedAt}` : ''}
      </div>
    `;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
    modal.open();
  }

  _saveIdeaPrompt(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const textarea = this.querySelector('#idea-prompt-edit');
    if (!textarea) return;
    x.prompt = textarea.value;
    x.updatedAt = new Date().toISOString();

    // Persist to Supabase (primary) + SyncDB (local cache)
    if (window.supabase) {
      window.supabase.upsert('ideas', { id: x.id, prompt: x.prompt, updatedAt: x.updatedAt })
        .catch(e => console.warn('Supabase save failed:', e));
    }
    if (window.db && db.upsert) {
      try { db.upsert('ideas', x); } catch(e) { console.warn('SyncDB save failed:', e); }
    }

    const toast = document.querySelector('cc-toast');
    if (toast && toast.show) toast.show('✅ Prompt saved!', 'success');
  }

  async _buildIdeaWithPrompt(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    // Save any edits first
    this._saveIdeaPrompt(id);

    const prompt = this.querySelector('#idea-prompt-edit')?.value || x.prompt || '';
    const msg = x.source === 'community'
      ? `Build this community project for me: "${x.title}"\n\nHere's the recreation prompt:\n${prompt}`
      : `Build this idea: "${x.title}"\n\nCategory: ${x.category} | Effort: ${x.effort}\n\n${x.description}\n\nPrompt:\n${prompt}\n\nTags: ${(x.tags||[]).join(', ')}`;

    try {
      const res = await window.trigger(msg); if (!res) throw new Error('trigger failed');
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show(`⚡ Build request sent for "${x.title}"!`, 'success');
      const modal = this.querySelector('#idea-detail-modal');
      if (modal) modal.close();
    } catch(e) {
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Failed to send build request', 'error');
    }
  }

  _openAddModal() {
    const modal = this.querySelector('#add-idea-modal');
    if (!modal) return;
    this.querySelectorAll('cc-field').forEach(f => f.clear());
    modal.open();
  }

  async _submitIdea() {
    const getField = (name) => { const f = this.querySelector(`cc-field[name="${name}"]`); return f ? f.getValue() : ''; };
    const title = getField('idea-title').trim();
    const desc = getField('idea-desc').trim();
    if (!title) { alert('Title is required'); return; }

    const now = new Date().toISOString();
    const ideaId = 'manual-' + Date.now();

    // Save minimal stub locally
    const newIdea = {
      id: ideaId, title, description: desc || title,
      category: 'Uncategorized', status: 'new', source: 'manual',
      feasibility: null, impact: null, effort: null, compositeScore: null,
      tags: [], similarSolutions: [], relatedIdeas: [], resources: [],
      author: null, sourceUrl: null, prompt: null, integrations: [],
      app: this._appAttr || (this._activeApp !== 'All' ? this._activeApp : null),
      createdAt: now, updatedAt: now, completedAt: null
    };

    this._data.push(newIdea);
    this._render();
    const modal = this.querySelector('#add-idea-modal');
    if (modal) modal.close();

    // Persist to Supabase (primary) + SyncDB (local cache)
    if (window.supabase) {
      window.supabase.upsert('ideas', newIdea)
        .catch(e => console.warn('Supabase upsert failed:', e));
    }
    if (window.db && db.upsert) {
      try { db.upsert('ideas', newIdea); } catch(e) { console.warn('SyncDB upsert failed:', e); }
    }

    // Send to agent to enrich — categorize, score, tag, flesh out description
    const msg = `💡 New manual idea submitted — please enrich it:\n\nID: ${ideaId}\nTitle: ${title}\nDescription: ${desc || '(none provided)'}\n\nPlease:\n1. Write a better, detailed description\n2. Assign a category (Technical/Product/Business/Creative/Content/Skills)\n3. Score it (feasibility, impact, effort, compositeScore)\n4. Add relevant tags\n5. Add similarSolutions, relatedIdeas, resources if applicable\n6. Update the idea in ideas.json and git commit\n7. Confirm in Slack when done`;
    try {
      await window.trigger(msg);
    } catch(e) {}

    const toast = document.querySelector('cc-toast');
    if (toast && toast.show) toast.show(`✅ "${title}" submitted — I'll enrich it shortly!`, 'success');
  }
}
customElements.define('cc-ideas', CcIdeas);
