// ─── Community ────────────────────────────────────────────
class CcCommunity extends HTMLElement {
  connectedCallback() {
    this._activeCat = 'All';
    this._activeSort = 'name';
    this._sortAsc = false;
    this._minRating = 0;
    this._showHidden = false;
    // Uses trigger.js → Supabase trigger_queue for all actions
    this._viewMode = 'cards';
    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._render(); });
    this.addEventListener('cc-view-change', e => { this._viewMode = e.detail.view; this._render(); });
    this._load();
  }

  _getRatings() { return window.UserPrefs ? window.UserPrefs.get('communityRatings', {}) : (() => { try { return JSON.parse(localStorage.getItem('communityRatings') || '{}'); } catch { return {}; } })(); }
  _setRating(id, r) { const d = this._getRatings(); if (r === 0) delete d[id]; else d[id] = r; window.UserPrefs ? window.UserPrefs.set('communityRatings', d) : localStorage.setItem('communityRatings', JSON.stringify(d)); }
  _getRating(id) { return this._getRatings()[id] || 0; }
  _getHidden() { return window.UserPrefs ? window.UserPrefs.get('communityHidden', []) : (() => { try { return JSON.parse(localStorage.getItem('communityHidden') || '[]'); } catch { return []; } })(); }
  _toggleHide(id) { let h = this._getHidden(); const restoring = h.includes(id); if (restoring) h = h.filter(x => x !== id); else h.push(id); window.UserPrefs ? window.UserPrefs.set('communityHidden', h) : localStorage.setItem('communityHidden', JSON.stringify(h)); const x = this._data.find(i => i.id === id); window.showToast(restoring ? `Restored "${x?.name || id}"` : `Hidden "${x?.name || id}"`, 2000); this._render(); }
  _getCompleted() { return window.UserPrefs ? window.UserPrefs.get('communityCompleted', {}) : (() => { try { return JSON.parse(localStorage.getItem('communityCompleted') || '{}'); } catch { return {}; } })(); }
  _toggleComplete(id) { const c = this._getCompleted(); const undoing = !!c[id]; if (undoing) delete c[id]; else c[id] = new Date().toISOString(); window.UserPrefs ? window.UserPrefs.set('communityCompleted', c) : localStorage.setItem('communityCompleted', JSON.stringify(c)); const x = this._data.find(i => i.id === id); window.showToast(undoing ? `Unmarked "${x?.name || id}"` : `Completed "${x?.name || id}" ✓`, 2000); this._render(); }
  _moveToIdeas(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const idea = {
      id: 'community-' + x.id,
      title: x.name,
      description: x.description + (x.prompt ? '\n\nRecreation prompt: ' + x.prompt : ''),
      category: x.category === 'App' ? 'Product' : x.category === 'Skill' ? 'Technical' : x.category === 'Automation' ? 'Technical' : 'Product',
      status: 'new',
      feasibility: x.feasibility || 5,
      impact: x.impact || 5,
      effort: x.effort || 'Medium',
      compositeScore: x.compositeScore || 5,
      tags: [...(x.tags || []), 'from-community'],
      similarSolutions: [],
      source: 'community:' + x.id,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      completedAt: null
    };
    // Store in localStorage for pickup; also try API
    const pending = window.UserPrefs ? window.UserPrefs.get('pendingIdeas', []) : (() => { try { return JSON.parse(localStorage.getItem('pendingIdeas') || '[]'); } catch { return []; } })();
    pending.push(idea);
    window.UserPrefs ? window.UserPrefs.set('pendingIdeas', pending) : localStorage.setItem('pendingIdeas', JSON.stringify(pending));
    // Send via trigger queue
    const msg = `Add this community project as a new idea in ideas.json:\n${JSON.stringify(idea, null, 2)}`;
    if (window.trigger) window.trigger(msg, { context: 'cc-community', silent: true }).catch(() => {});
    window.showToast(`Moved "${x.name}" to Ideas pipeline!`, 3000);
    this._render();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json();
      this._render();
      if (window.UserPrefs && UserPrefs.ready) {
        UserPrefs.ready.then(() => this._render());
      }
    } catch (e) { console.error('cc-community:', e); }
  }

  _setCat(c) { this._activeCat = c; this._render(); }
  _setSort(s) { if (this._activeSort === s) { this._sortAsc = !this._sortAsc; } else { this._activeSort = s; this._sortAsc = false; } this._render(); }
  _setMinRating(r) { this._minRating = (r === this._minRating) ? 0 : r; this._render(); }
  _toggleShowHidden() { this._showHidden = !this._showHidden; this._render(); }
  _toggle(id) { this.querySelector('#card-' + id)?.classList.toggle('expanded'); }

  _rate(id, stars) {
    const current = this._getRating(id);
    this._setRating(id, current === stars ? 0 : stars);
    this._render();
  }

  _copyPrompt(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    navigator.clipboard.writeText(x.prompt).then(() => {
      window.showToast(`Copied prompt for "${x.name}"`, 2000);
    });
  }

  async _buildProject(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const btn = this.querySelector('#card-' + id + ' .build-btn');
    btn.classList.add('loading'); btn.innerHTML = '<i data-lucide="hammer"></i> Starting…'; window.refreshIcons && window.refreshIcons();
    const msg = `Build this community project for me: "${x.name}"\n\nHere's the recreation prompt:\n${x.prompt}`;
    try {
      if (!window.trigger) throw new Error('trigger.js not loaded');
      const ok = await window.trigger(msg, { context: 'cc-community', silent: true });
      if (!ok) throw new Error('trigger() returned false');
      btn.classList.remove('loading'); btn.textContent = '✅ Queued!';
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show(`⚡ Build request queued for "${x.name}"`, 'success');
      setTimeout(() => { btn.innerHTML = '<i data-lucide="hammer"></i> Build It'; window.refreshIcons && window.refreshIcons(); }, 3000);
    } catch (e) {
      console.error('_buildProject failed:', e);
      btn.classList.remove('loading'); btn.innerHTML = '<i data-lucide="hammer"></i> Build It'; window.refreshIcons && window.refreshIcons();
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Failed to queue build — try again', 'error');
    }
  }

  async _refreshCommunity() {
    const btn = this.querySelector('.refresh-community-btn');
    if (!btn) return;
    btn.classList.add('loading'); btn.innerHTML = '<i data-lucide="refresh-cw"></i> Refreshing…';
    const cronId = this.getAttribute('cron-id') || '87bba15d-c5ae-48fc-9297-155e1897cbaf';
    const msg = `Run the community discovery cron job now (id: ${cronId})`;
    try {
      if (!window.trigger) throw new Error('trigger.js not loaded');
      const ok = await window.trigger(msg, { context: 'cc-community', silent: true });
      if (!ok) throw new Error('trigger() returned false');
      btn.classList.remove('loading'); btn.innerHTML = '✅ Running!';
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Community refresh queued — new projects will appear shortly!', 'success');
      setTimeout(() => { btn.innerHTML = '<i data-lucide="refresh-cw"></i>'; window.refreshIcons && window.refreshIcons(); }, 3000);
    } catch (e) {
      console.error('_refreshCommunity failed:', e);
      btn.classList.remove('loading'); btn.innerHTML = '<i data-lucide="refresh-cw"></i>'; window.refreshIcons && window.refreshIcons();
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Failed to queue refresh — try again', 'error');
    }
  }

  async _discoverMore() {
    const btn = this.querySelector('.discover-btn');
    btn.classList.add('loading'); btn.textContent = '🔍 Searching…';
    const msg = 'Find more OpenClaw community projects for the Command Center';
    try {
      if (!window.trigger) throw new Error('trigger.js not loaded');
      const ok = await window.trigger(msg, { context: 'cc-community', silent: true });
      if (!ok) throw new Error('trigger() returned false');
      btn.classList.remove('loading'); btn.textContent = '✅ Queued!';
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Discovery request queued!', 'success');
      setTimeout(() => { btn.textContent = '🔍 Discover More'; }, 3000);
    } catch (e) {
      console.error('_discoverMore failed:', e);
      btn.classList.remove('loading'); btn.textContent = '🔍 Discover More';
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Failed to queue discovery — try again', 'error');
    }
  }

  _sort(arr) {
    const ratings = this._getRatings();
    const dir = this._sortAsc ? -1 : 1;
    return [...arr].sort((a, b) => {
      let cmp = 0;
      switch (this._activeSort) {
        case 'score': cmp = (b.compositeScore || 0) - (a.compositeScore || 0); break;
        case 'stars': cmp = (ratings[b.id] || 0) - (ratings[a.id] || 0); break;
        case 'dateAdded': cmp = (b.dateAdded || '').localeCompare(a.dateAdded || ''); break;
        case 'category': cmp = a.category.localeCompare(b.category); break;
        default: cmp = a.name.localeCompare(b.name); break;
      }
      return (cmp || a.name.localeCompare(b.name)) * dir;
    });
  }

  _render() {
    const hadFocus = this.querySelector('.search') === document.activeElement;
    const selStart = hadFocus ? this.querySelector('.search').selectionStart : 0;
    const selEnd = hadFocus ? this.querySelector('.search').selectionEnd : 0;
    const CAT_ICONS = { Skill: '<i data-lucide="puzzle"></i>', App: '<i data-lucide="rocket"></i>', Automation: '<i data-lucide="settings"></i>', Integration: '<i data-lucide="link"></i>' };
    const CAT_CLASSES = { Skill: 'badge-skill', App: 'badge-app', Automation: 'badge-automation', Integration: 'badge-integration' };
    const CATEGORIES = ['All', 'Skill', 'App', 'Automation', 'Integration'];
    const hidden = this._getHidden();
    const ratings = this._getRatings();
    const completed = this._getCompleted();
    const pendingIdeas = window.UserPrefs ? window.UserPrefs.get('pendingIdeas', []) : (() => { try { return JSON.parse(localStorage.getItem('pendingIdeas') || '[]'); } catch { return []; } })();
    const movedIds = new Set(pendingIdeas.map(i => i.source?.replace('community:', '')));
    const q = (this._searchQuery || '').toLowerCase().trim();

    let filtered = this._data;
    if (!this._showHidden) filtered = filtered.filter(x => !hidden.includes(x.id));
    if (this._activeCat !== 'All') filtered = filtered.filter(x => x.category === this._activeCat);
    if (this._minRating > 0) filtered = filtered.filter(x => (ratings[x.id] || 0) >= this._minRating);
    if (q) filtered = filtered.filter(x =>
      x.name.toLowerCase().includes(q) || x.description.toLowerCase().includes(q) ||
      x.author.toLowerCase().includes(q) || x.tags.some(t => t.toLowerCase().includes(q)) ||
      x.integrations.some(t => t.toLowerCase().includes(q))
    );
    filtered = this._sort(filtered);

    const hiddenCount = this._data.filter(x => hidden.includes(x.id)).length;
    const esc = this._esc.bind(this);

    this.innerHTML = `
      <div class="page-header" style="margin-bottom:8px;">
        <h1><i data-lucide="globe"></i> <span>Community Showcase</span></h1>
        <div class="header-right">
          <span class="count">${filtered.length} project${filtered.length !== 1 ? 's' : ''}</span>
          ${hiddenCount > 0 ? `<button class="hidden-toggle" onclick="this.closest('cc-community')._toggleShowHidden()">${this._showHidden ? `Hide ${hiddenCount} dismissed` : `Show ${hiddenCount} hidden`}</button>` : ''}
          <button class="refresh-community-btn" onclick="this.closest('cc-community')._refreshCommunity()" title="Refresh community projects" style="background:var(--surface-2,#1e293b);border:1px solid var(--border,#334155);color:var(--text,#e2e8f0);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:1.1rem;transition:transform .2s"><i data-lucide="refresh-cw"></i></button>
        </div>
      </div>
      <p class="subtitle">Real projects and automations built by the OpenClaw community. Click any card to see the full recreation prompt — copy it and build your own version. Rate your favorites with stars.</p>
      <div class="controls">
        <cc-search placeholder="Search projects, integrations, tags…" value="${q}"></cc-search>
        <cc-view-toggle app="community" value="${this._viewMode}"></cc-view-toggle>
        <div class="filters" style="margin-bottom:0">${CATEGORIES.map(c =>
          `<span class="pill${c === this._activeCat ? ' active' : ''}" onclick="this.closest('cc-community')._setCat('${c}')">${c === 'All' ? 'All' : c + 's'}</span>`
        ).join('')}</div>
      </div>
      <div class="sort-row">
        <span class="sort-label">Sort:</span>
        ${['name', 'score', 'stars', 'dateAdded', 'category'].map(s => {
          const active = s === this._activeSort;
          const arrow = active ? (this._sortAsc ? ' ↑' : ' ↓') : '';
          const label = { name:'Name', score:'Score', stars:'Stars', dateAdded:'Date', category:'Category' }[s];
          return `<span class="sort-btn${active ? ' active' : ''}" onclick="this.closest('cc-community')._setSort('${s}')">${label}${arrow}</span>`;
        }).join('')}
        <div class="rating-filter">
          <span class="rf-label">Min rating:</span>
          ${[1, 2, 3, 4, 5].map(i => `<span class="rf-star${i <= this._minRating ? ' on' : ''}" onclick="this.closest('cc-community')._setMinRating(${i})"><i data-lucide="star"${i <= this._minRating ? ' style="fill:currentColor"' : ''}></i></span>`).join('')}
          ${this._minRating > 0 ? `<span class="rf-clear" onclick="this.closest('cc-community')._setMinRating(0)"><i data-lucide="x"></i></span>` : ''}
        </div>
      </div>
      ${this._viewMode === 'list' ? `<div class="view-list">${filtered.map(x => {
        const r = ratings[x.id] || 0;
        const done = !!completed[x.id];
        return `<div class="list-row" onclick="this.closest('cc-community')._toggle('${x.id}')">
          <span class="row-icon">${CAT_ICONS[x.category] || '<i data-lucide="package"></i>'}</span>
          <span class="row-name">${esc(x.name)}</span>
          <span class="badge ${CAT_CLASSES[x.category]}" style="flex-shrink:0;">${x.category}</span>
          ${x.compositeScore != null ? `<span style="background:${x.compositeScore >= 7 ? 'var(--green)' : x.compositeScore >= 4 ? 'var(--yellow)' : '#ef4444'};color:#000;font-weight:800;font-size:11px;padding:1px 6px;border-radius:4px;">${x.compositeScore}</span>` : ''}
          <span class="row-desc">${esc(x.description)}</span>
          <span class="row-tags">${x.tags.slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span>
          ${done ? '<span style="color:var(--green);font-size:12px;">✓</span>' : ''}
        </div>`;
      }).join('')}</div>`
      : this._viewMode === 'expanded' ? `<div class="view-expanded">${filtered.map(x => {
        const r = ratings[x.id] || 0;
        const done = !!completed[x.id];
        return `<div class="expanded-card" onclick="this.closest('cc-community')._toggle('${x.id}')">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            ${CAT_ICONS[x.category] || '<i data-lucide="package"></i>'}
            <span style="font-size:16px;font-weight:700;">${esc(x.name)}</span>
            <span class="badge ${CAT_CLASSES[x.category]}">${x.category}</span>
            ${x.compositeScore != null ? `<span style="background:${x.compositeScore >= 7 ? 'var(--green)' : x.compositeScore >= 4 ? 'var(--yellow)' : '#ef4444'};color:#000;font-weight:800;font-size:13px;padding:2px 8px;border-radius:6px;">${x.compositeScore}</span>` : ''}
            ${done ? '<span style="color:var(--green);">✓ Complete</span>' : ''}
          </div>
          <div style="color:var(--muted);font-size:13px;margin-bottom:6px;">by <a href="${esc(x.sourceUrl)}" target="_blank" onclick="event.stopPropagation()">${esc(x.author)}</a> · ${x.dateAdded || 'Unknown'}</div>
          <div style="color:var(--text);line-height:1.6;margin-bottom:12px;">${esc(x.description)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            ${x.integrations.map(t => `<span class="int-badge">${esc(t)}</span>`).join('')}
            ${x.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
          ${x.prompt ? `<div class="prompt-block" style="max-height:80px;overflow:hidden;font-size:12px;color:var(--muted);">${esc(x.prompt).substring(0, 300)}…</div>` : ''}
        </div>`;
      }).join('')}</div>`
      : `<div class="grid grid-cards-wide">${filtered.map(x => {
        const r = ratings[x.id] || 0;
        const h = hidden.includes(x.id);
        const done = !!completed[x.id];
        const moved = movedIds.has(x.id);
        return `
        <div class="card${h ? ' hidden-card' : ''}${done ? ' completed-card' : ''}" id="card-${x.id}" onclick="this.closest('cc-community')._toggle('${x.id}')">
          <div class="card-top">
            <span class="card-icon">${CAT_ICONS[x.category] || '<i data-lucide="package"></i>'}</span>
            <span class="card-title">${esc(x.name)}</span>
            ${x.compositeScore != null ? `<span class="score-badge" style="margin-left:auto;background:${x.compositeScore >= 7 ? 'var(--green)' : x.compositeScore >= 4 ? 'var(--yellow)' : '#ef4444'};color:#000;font-weight:800;font-size:13px;padding:2px 8px;border-radius:6px;min-width:28px;text-align:center;">${x.compositeScore}</span>` : ''}
            <span class="badge ${CAT_CLASSES[x.category]}">${x.category}</span>
          </div>
          <div class="card-meta">
            <span class="card-author">by <a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(x.author)}</a></span>
            <span class="card-date"><i data-lucide="calendar"></i> ${x.dateAdded || 'Unknown'}</span>
          </div>
          <div class="card-desc">${esc(x.description)}</div>
          <div class="card-bottom">
            <div class="card-tags">
              ${x.integrations.map(t => `<span class="int-badge">${esc(t)}</span>`).join('')}
              ${x.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}
            </div>
            <div class="card-actions">
              <div class="stars" onclick="event.stopPropagation()">
                ${[1, 2, 3, 4, 5].map(s => `<span class="star${s <= r ? ' on' : ''}" onclick="this.closest('cc-community')._rate('${x.id}',${s})"><i data-lucide="star"${s <= r ? ' style="fill:currentColor"' : ''}></i></span>`).join('')}
              </div>
              <button class="action-btn" title="${done ? 'Undo complete' : 'Mark complete'}" onclick="event.stopPropagation();this.closest('cc-community')._toggleComplete('${x.id}')" style="background:none;border:1px solid ${done ? 'var(--green)' : 'var(--border)'};color:${done ? 'var(--green)' : 'var(--muted)'};border-radius:6px;padding:2px 6px;cursor:pointer;font-size:12px;"><i data-lucide="check" style="width:14px;height:14px"></i></button>
              <button class="action-btn" title="${moved ? 'Already in Ideas' : 'Move to Ideas'}" onclick="event.stopPropagation();this.closest('cc-community')._moveToIdeas('${x.id}')" style="background:none;border:1px solid ${moved ? 'var(--accent)' : 'var(--border)'};color:${moved ? 'var(--accent)' : 'var(--muted)'};border-radius:6px;padding:2px 6px;cursor:pointer;font-size:12px;${moved ? 'opacity:.5;pointer-events:none;' : ''}"><i data-lucide="lightbulb" style="width:14px;height:14px"></i></button>
              <button class="hide-btn" title="${h ? 'Restore' : 'Hide'}" onclick="event.stopPropagation();this.closest('cc-community')._toggleHide('${x.id}')">${h ? '<i data-lucide="eye"></i>' : '<i data-lucide="x"></i>'}</button>
            </div>
          </div>
          <div class="card-detail">
            ${x.integrations.length ? `<div class="detail-section"><div class="detail-label">Integrations Required</div><div class="detail-badges">${x.integrations.map(t => `<span class="int-badge">${esc(t)}</span>`).join('')}</div></div>` : ''}
            <div class="detail-section">
              <div class="detail-label">Recreation Prompt</div>
              <div class="prompt-block">${esc(x.prompt)}</div>
              <button class="copy-btn" onclick="event.stopPropagation();this.closest('cc-community')._copyPrompt('${x.id}')"><i data-lucide="clipboard"></i> Copy Prompt</button>
              <button class="copy-btn build-btn" onclick="event.stopPropagation();this.closest('cc-community')._buildProject('${x.id}')"><i data-lucide="hammer"></i> Build It</button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>`}
      <div class="empty-state" style="${filtered.length ? 'display:none' : ''}">No projects match that filter.</div>
      `;
    if (hadFocus) {
      const inp = this.querySelector('.search');
      if (inp) { inp.focus(); inp.setSelectionRange(selStart, selEnd); }
    }
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-community', CcCommunity);
