class CcQueue extends HTMLElement {
  connectedCallback() {
    this._filter = 'all';
    this._view = localStorage.getItem('cc-queue-view') || 'cards';
    this._items = [];
    this._loading = true;
    this._loadingMore = false;
    this._hasMore = true;
    this._pageSize = 50;
    this._selectedItem = null;
    this._counts = { pending: 0, processing: 0, done: 0, failed: 0 };
    this._render();
    this._loadCounts();
    this._loadPage(true);
    this._interval = setInterval(() => { if (document.hasFocus()) this._refresh(); }, 8000);
    window.addEventListener('focus', this._onFocus = () => this._refresh());

    // Delegated event handling
    this.addEventListener('click', e => {
      const filterBtn = e.target.closest('[data-filter]');
      if (filterBtn) { this._setFilter(filterBtn.dataset.filter); return; }

      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) { this._setView(viewBtn.dataset.view); return; }

      const idChip = e.target.closest('[data-copy-id]');
      if (idChip) { e.stopPropagation(); this._copyId(e, idChip.dataset.copyId); return; }

      const revertBtn = e.target.closest('[data-revert-id]');
      if (revertBtn) { e.stopPropagation(); this._revertItem(revertBtn.dataset.revertId); return; }

      const modalClose = e.target.closest('.q-modal-close-btn');
      if (modalClose) { this._closeModal(); return; }

      const loadMore = e.target.closest('.q-load-more');
      if (loadMore) { this._loadPage(false); return; }

      const card = e.target.closest('[data-queue-id]');
      if (card) { this._openModal(card.dataset.queueId); return; }
    });

    // Infinite scroll via IntersectionObserver
    this._setupScrollObserver();
  }

  disconnectedCallback() {
    if (this._interval) clearInterval(this._interval);
    if (this._onFocus) window.removeEventListener('focus', this._onFocus);
    if (this._scrollObs) this._scrollObs.disconnect();
  }

  _setupScrollObserver() {
    this._scrollObs = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && this._hasMore && !this._loadingMore && !this._loading) {
        this._loadPage(false);
      }
    }, { rootMargin: '200px' });
  }

  _observeSentinel() {
    if (this._scrollObs) this._scrollObs.disconnect();
    const sentinel = this.querySelector('.q-scroll-sentinel');
    if (sentinel) this._scrollObs.observe(sentinel);
  }

  _statusFilters() {
    if (this._filter === 'all') return {};
    if (this._filter === 'active') return { status: 'in.(pending,processing)' };
    if (this._filter === 'failed') return { status: 'in.(failed,error)' };
    return { status: `eq.${this._filter}` };
  }

  _sortOrder() {
    const asc = ['active', 'pending', 'processing'].includes(this._filter);
    return asc ? 'created_at.asc' : 'created_at.desc';
  }

  async _loadCounts() {
    try {
      const sb = window.supabase;
      if (!sb) { setTimeout(() => this._loadCounts(), 500); return; }
      const all = await sb.select('trigger_queue', { select: 'status', limit: 10000 });
      const c = { pending: 0, processing: 0, done: 0, failed: 0 };
      (all || []).forEach(x => {
        const k = x.status === 'error' ? 'failed' : x.status;
        if (c[k] !== undefined) c[k]++;
      });
      this._counts = c;
      this._totalCount = (all || []).length;
      this._renderCounts();
    } catch (e) { console.error('Count load error:', e); }
  }

  async _loadPage(reset) {
    const sb = window.supabase;
    if (!sb) { setTimeout(() => this._loadPage(reset), 500); return; }

    if (reset) {
      this._items = [];
      this._hasMore = true;
      this._loading = true;
      this._render();
    } else {
      this._loadingMore = true;
      this._renderLoadMore();
    }

    try {
      const data = await sb.select('trigger_queue', {
        filters: this._statusFilters(),
        order: this._sortOrder(),
        limit: this._pageSize,
        offset: this._items.length
      });
      const rows = data || [];
      this._items = reset ? rows : [...this._items, ...rows];
      this._hasMore = rows.length === this._pageSize;
      this._loading = false;
      this._loadingMore = false;
      this._render();
      requestAnimationFrame(() => this._observeSentinel());
    } catch (e) {
      console.error('Queue load error:', e);
      this._loading = false;
      this._loadingMore = false;
      this._render();
    }
  }

  // Soft refresh: reload counts + first page without scroll reset
  async _refresh() {
    this._loadCounts();
    const sb = window.supabase;
    if (!sb) return;
    try {
      const data = await sb.select('trigger_queue', {
        filters: this._statusFilters(),
        order: this._sortOrder(),
        limit: Math.max(this._items.length, this._pageSize)
      });
      this._items = data || [];
      this._renderContent();
    } catch (e) { /* silent */ }
  }

  _setFilter(f) {
    this._filter = f;
    this._loadPage(true);
  }
  _setView(v) { this._view = v; localStorage.setItem('cc-queue-view', v); this._render(); }

  _statusIcon(status) {
    const map = {
      pending:    { icon: 'clock',        color: 'var(--amber, #f59e0b)' },
      processing: { icon: 'loader',       color: 'var(--blue, #38bdf8)' },
      done:       { icon: 'check-circle', color: 'var(--green, #4ade80)' },
      failed:     { icon: 'x-circle',     color: 'var(--red, #f87171)' },
      error:      { icon: 'x-circle',     color: 'var(--red, #f87171)' },
    };
    const s = map[status] || { icon: 'help-circle', color: 'var(--muted)' };
    return `<i data-lucide="${s.icon}" style="width:16px;height:16px;color:${s.color};flex-shrink:0"></i>`;
  }

  _statusLabel(status) {
    const map = { pending: 'Pending', processing: 'Processing', done: 'Done', failed: 'Failed', error: 'Error' };
    return map[status] || status;
  }

  _statusBadge(status) {
    const clsMap = { pending: 'badge-warning', processing: 'badge-info', done: 'badge-success', failed: 'badge-error', error: 'badge-error' };
    return `<span class="q-badge ${clsMap[status] || ''}">${this._statusIcon(status)} ${this._statusLabel(status)}</span>`;
  }

  _statusDot(status) {
    const colors = { pending: 'var(--amber, #f59e0b)', processing: 'var(--blue, #38bdf8)', done: 'var(--green, #4ade80)', failed: 'var(--red, #f87171)', error: 'var(--red, #f87171)' };
    return colors[status] || 'var(--muted)';
  }

  _timeAgo(iso) {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60000) return 'just now';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  }

  _fmtFull(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  _fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  _fmtDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  _escAttr(s) { return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  _truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : s || ''; }
  _shortId(id) { return id ? id.slice(0, 8) : '—'; }

  _copyId(e, id) {
    e.stopPropagation();
    navigator.clipboard.writeText(`supabase trigger_queue id: ${id}`).then(() => {
      const el = e.target.closest('[data-copy-id]');
      if (!el) return;
      const orig = el.textContent;
      el.textContent = 'copied!';
      el.classList.add('q-id-copied');
      setTimeout(() => { el.textContent = orig; el.classList.remove('q-id-copied'); }, 1200);
    });
  }

  _openModal(id) {
    this._selectedItem = this._items.find(x => x.id === id) || null;
    if (!this._selectedItem) return;

    const old = this.querySelector('cc-modal.queue-detail-modal');
    if (old) old.remove();

    const x = this._selectedItem;
    const modal = document.createElement('cc-modal');
    modal.className = 'queue-detail-modal';
    modal.setAttribute('title', 'Queue Item');
    modal.setAttribute('size', 'md');

    modal.innerHTML = `
      <div class="q-modal-body">
        <div class="q-modal-row">
          <span class="q-modal-label">Status</span>
          <span>${this._statusBadge(x.status)}</span>
        </div>
        <div class="q-modal-row">
          <span class="q-modal-label">Source</span>
          <span class="q-source">${this._esc(x.source || '—')}</span>
        </div>
        <div class="q-modal-row">
          <span class="q-modal-label">Created</span>
          <span class="q-modal-value">${this._fmtFull(x.created_at)}</span>
        </div>
        <div class="q-modal-row">
          <span class="q-modal-label">Processed</span>
          <span class="q-modal-value">${x.processed_at ? this._fmtFull(x.processed_at) : '—'}</span>
        </div>
        <div class="q-modal-row">
          <span class="q-modal-label">ID</span>
          <span class="q-id" style="font-size:12px;padding:3px 10px" title="Click to copy" data-copy-id="${this._escAttr(x.id)}">${this._esc(x.id)}</span>
        </div>
        <div class="q-modal-msg-section">
          <span class="q-modal-label">Message</span>
          <div class="q-modal-msg">${this._esc(x.message || '(empty)')}</div>
        </div>
        ${x.status === 'done' ? `
        <div class="q-modal-actions">
          <button class="q-revert-btn" data-revert-id="${this._escAttr(x.id)}">
            <i data-lucide="undo-2" style="width:14px;height:14px"></i> Revert
          </button>
        </div>` : ''}
      </div>
    `;

    this.appendChild(modal);
    requestAnimationFrame(() => {
      modal.open();
      modal.addEventListener('modal-close', () => { this._selectedItem = null; });
    });
    setTimeout(() => window.refreshIcons?.(), 0);
  }

  _closeModal() {
    this._selectedItem = null;
    const modal = this.querySelector('cc-modal.queue-detail-modal');
    if (modal) modal.close();
  }

  async _revertItem(id) {
    const item = this._items.find(x => x.id === id);
    if (!item) return;
    if (!confirm('Create a revert job for this queue item?')) return;
    const revertMsg = `We recently made the following change, but I need to revert it without breaking anything else done since then. Here is the original change that was made:\n\n${item.message}\n\nPlease carefully undo only this specific change while preserving all other work.`;
    const source = (item.source || 'unknown') + '-revert';
    try {
      const sb = window.supabase;
      await sb.insert('trigger_queue', { message: revertMsg, source, status: 'pending' });
      this._closeModal();
      this._refresh();
      window.showToast?.('Revert job queued', 2500);
    } catch (e) {
      console.error('Revert error:', e);
      window.showToast?.('Failed to create revert job', 2000);
    }
  }

  _renderViewToggle() {
    const views = [
      { id: 'cards', icon: 'layout-list', label: 'Cards' },
      { id: 'vtimeline', icon: 'git-commit-vertical', label: 'Vertical Timeline' },
      { id: 'htimeline', icon: 'git-branch', label: 'Horizontal Timeline' },
    ];
    return `<div class="q-views">${views.map(v =>
      `<button class="q-view-btn ${v.id === this._view ? 'active' : ''}" data-view="${this._escAttr(v.id)}" title="${this._escAttr(v.label)}">
        <i data-lucide="${v.icon}" style="width:14px;height:14px"></i>
      </button>`
    ).join('')}</div>`;
  }

  _renderScrollSentinel() {
    if (!this._hasMore) return '';
    return `<div class="q-scroll-sentinel" style="height:1px"></div>`;
  }

  _renderLoadMoreBtn() {
    if (!this._hasMore) return '';
    return `<div style="text-align:center;padding:20px">
      <button class="q-load-more" style="padding:8px 24px;border-radius:8px;background:var(--card);border:1px solid var(--border);color:var(--text);cursor:pointer;font-size:13px;transition:all .15s">
        ${this._loadingMore ? 'Loading…' : 'Load more'}
      </button>
    </div>`;
  }

  _renderCards(items) {
    if (!items.length && !this._hasMore) return '<cc-empty-state message="No items in queue" icon="📭"></cc-empty-state>';
    return `<div class="q-cards">${items.map(x => `
      <div class="q-card" data-queue-id="${this._escAttr(x.id)}">
        <div class="q-card-status">${this._statusIcon(x.status)}</div>
        <span class="q-id" title="Click to copy full ID" data-copy-id="${this._escAttr(x.id)}">${this._shortId(x.id)}</span>
        <div class="q-card-msg">${this._esc(this._truncate(x.message, 120))}</div>
        <div class="q-card-meta">
          <span class="q-source">${this._esc(x.source || '—')}</span>
        </div>
        <div class="q-card-time">${this._timeAgo(x.created_at)}</div>
      </div>
    `).join('')}</div>${this._renderScrollSentinel()}${this._renderLoadMoreBtn()}`;
  }

  _renderVTimeline(items) {
    if (!items.length && !this._hasMore) return '<cc-empty-state message="No items in queue" icon="📭"></cc-empty-state>';
    const groups = {};
    items.forEach(x => {
      const key = this._fmtDate(x.created_at) || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(x);
    });

    return `<div class="q-vtl">${Object.entries(groups).map(([date, list]) => `
      <div class="q-vtl-group">
        <div class="q-vtl-date">${date}</div>
        ${list.map(x => `
          <div class="q-vtl-item" data-queue-id="${this._escAttr(x.id)}" style="cursor:pointer">
            <div class="q-vtl-line">
              <div class="q-vtl-dot" style="background:${this._statusDot(x.status)};box-shadow:0 0 8px ${this._statusDot(x.status)}44"></div>
              <div class="q-vtl-connector"></div>
            </div>
            <div class="q-vtl-card">
              <div class="q-vtl-card-header">
                ${this._statusBadge(x.status)}
                <span class="q-vtl-time">${this._fmtTime(x.created_at)}</span>
                <span class="q-source">${this._esc(x.source || '—')}</span>
              </div>
              <div class="q-vtl-card-body">${this._esc(this._truncate(x.message, 200))}</div>
              ${x.processed_at ? `<div class="q-vtl-card-footer">Processed ${this._timeAgo(x.processed_at)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `).join('')}</div>${this._renderScrollSentinel()}${this._renderLoadMoreBtn()}`;
  }

  _renderHTimeline(items) {
    if (!items.length && !this._hasMore) return '<cc-empty-state message="No items in queue" icon="📭"></cc-empty-state>';
    const sorted = [...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const lanes = { pending: [], processing: [], done: [], error: [] };
    sorted.forEach(x => {
      const key = x.status === 'failed' ? 'error' : x.status;
      if (lanes[key]) lanes[key].push(x);
      else lanes.done.push(x);
    });

    const laneLabels = { pending: 'Pending', processing: 'Processing', done: 'Done', error: 'Error' };
    const laneColors = { pending: 'var(--amber, #f59e0b)', processing: 'var(--blue, #38bdf8)', done: 'var(--green, #4ade80)', error: 'var(--red, #f87171)' };

    return `<div class="q-htl">
      ${Object.entries(lanes).map(([lane, list]) => `
        <div class="q-htl-lane">
          <div class="q-htl-lane-label" style="border-left:3px solid ${laneColors[lane]}">
            <span class="q-htl-lane-name">${laneLabels[lane]}</span>
            <span class="q-htl-lane-count">${list.length}</span>
          </div>
          <div class="q-htl-lane-items">
            ${list.length === 0 ? '<div class="q-htl-empty-lane">—</div>' :
              list.map(x => `
                <div class="q-htl-card" style="border-top:2px solid ${laneColors[lane]};cursor:pointer" data-queue-id="${this._escAttr(x.id)}">
                  <div class="q-htl-card-time">${this._fmtTime(x.created_at)} · ${this._fmtDate(x.created_at)}</div>
                  <div class="q-htl-card-msg">${this._esc(this._truncate(x.message, 80))}</div>
                  <div class="q-htl-card-source">${this._esc(x.source || '—')}</div>
                </div>
              `).join('')}
          </div>
        </div>
      `).join('')}
    </div>${this._renderScrollSentinel()}${this._renderLoadMoreBtn()}`;
  }

  // Partial re-render: just the counts
  _renderCounts() {
    const el = this.querySelector('.q-count');
    if (el) el.textContent = `${this._totalCount || this._items.length} total`;
    const stats = this.querySelectorAll('.q-stat[data-filter]');
    const c = this._counts;
    stats.forEach(s => {
      const f = s.dataset.filter;
      const numEl = s.querySelector('.q-stat-num');
      if (!numEl) return;
      if (f === 'active') numEl.textContent = c.pending + c.processing;
      else if (f === 'all') return;
      else if (c[f] !== undefined) numEl.textContent = c[f];
    });
  }

  // Partial re-render: just the content area
  _renderContent() {
    const container = this.querySelector('.q-content-area');
    if (!container) return;
    let content;
    if (this._view === 'vtimeline') content = this._renderVTimeline(this._items);
    else if (this._view === 'htimeline') content = this._renderHTimeline(this._items);
    else content = this._renderCards(this._items);
    container.innerHTML = content;
    setTimeout(() => window.refreshIcons?.(), 0);
    requestAnimationFrame(() => this._observeSentinel());
  }

  // Partial re-render: just the load more area
  _renderLoadMore() {
    const btn = this.querySelector('.q-load-more');
    if (btn) btn.textContent = 'Loading…';
  }

  _render() {
    const c = this._counts;
    const filters = ['active','pending','processing','done','failed','all'];
    const filterLabels = { active: 'Active', pending: 'Pending', processing: 'Processing', done: 'Done', failed: 'Failed', all: 'All' };

    let content;
    if (this._loading) {
      content = '<div class="q-loading">Loading queue…</div>';
    } else if (this._view === 'vtimeline') {
      content = this._renderVTimeline(this._items);
    } else if (this._view === 'htimeline') {
      content = this._renderHTimeline(this._items);
    } else {
      content = this._renderCards(this._items);
    }

    this.innerHTML = `
      <style>
        cc-queue { display:block; max-width:1200px; margin:0 auto; padding:2rem 1rem; }
        .q-header { display:flex; align-items:center; gap:12px; margin-bottom:4px; flex-wrap:wrap; }
        .q-header h1 { font-family:var(--serif); margin:0; display:flex; align-items:center; gap:8px; }
        .q-header h1 i { color:var(--accent); }
        .q-count { font-size:13px; color:var(--muted); background:var(--card); padding:2px 10px; border-radius:12px; }
        .q-subtitle { color:var(--muted); font-size:14px; margin:0 0 1.5rem; }

        .q-views { display:inline-flex; gap:2px; background:var(--glass, rgba(255,255,255,0.08)); border:1px solid var(--glass-border, rgba(255,255,255,0.15)); border-radius:8px; padding:2px; margin-left:auto; }
        .q-view-btn { display:flex; align-items:center; justify-content:center; width:32px; height:28px; border:none; border-radius:6px; background:transparent; color:var(--muted); cursor:pointer; transition:all .15s; }
        .q-view-btn:hover { background:rgba(255,255,255,.08); color:var(--text); }
        .q-view-btn.active { background:var(--accent); color:#000; }

        .q-stats { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:1.5rem; }
        .q-stat { padding:6px 14px; border-radius:8px; background:var(--card); border:1px solid var(--border); cursor:pointer; transition:all .2s; font-size:13px; display:flex; align-items:center; gap:6px; }
        .q-stat:hover { border-color:var(--accent); }
        .q-stat.active { border-color:var(--accent); background:rgba(245,158,11,.1); color:var(--accent); }
        .q-stat .q-stat-num { font-weight:700; font-size:16px; }

        .q-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; }
        .badge-warning { background:rgba(245,158,11,.15); color:var(--amber, #f59e0b); }
        .badge-info { background:rgba(56,189,248,.15); color:var(--blue, #38bdf8); }
        .badge-success { background:rgba(74,222,128,.15); color:var(--green, #4ade80); }
        .badge-error { background:rgba(248,113,113,.15); color:var(--red, #f87171); }
        .q-source { font-size:11px; color:var(--muted); background:var(--card); padding:2px 8px; border-radius:4px; white-space:nowrap; border:1px solid var(--border); }

        .q-cards { display:flex; flex-direction:column; gap:6px; }
        .q-card {
          display:grid;
          grid-template-columns: 24px auto 1fr auto auto;
          align-items:center;
          gap:12px;
          padding:12px 16px;
          background:var(--card);
          border:1px solid var(--border);
          border-radius:10px;
          cursor:pointer;
          transition:all .15s;
        }
        .q-card:hover { border-color:var(--accent); background:rgba(245,158,11,.03); }
        .q-card-status { display:flex; align-items:center; justify-content:center; }
        .q-card-msg { font-size:13px; color:var(--text); line-height:1.4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
        .q-card-meta { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .q-card-time { font-size:12px; color:var(--muted); white-space:nowrap; flex-shrink:0; min-width:60px; text-align:right; }

        .q-id { font-family:monospace; font-size:11px; color:var(--accent); background:rgba(245,158,11,.08); padding:2px 7px; border-radius:4px; cursor:pointer; white-space:nowrap; transition:all .15s; border:1px solid transparent; user-select:none; }
        .q-id:hover { background:rgba(245,158,11,.18); border-color:var(--accent); }
        .q-id-copied { color:#4ade80 !important; background:rgba(74,222,128,.12) !important; }

        .q-loading { text-align:center; padding:60px; color:var(--muted); }

        .q-vtl { padding:0 0 2rem; }
        .q-vtl-group { margin-bottom:1.5rem; }
        .q-vtl-date { font-size:12px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; padding-left:28px; }
        .q-vtl-item { display:flex; gap:0; margin-bottom:0; }
        .q-vtl-line { display:flex; flex-direction:column; align-items:center; width:28px; flex-shrink:0; }
        .q-vtl-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:14px; z-index:1; }
        .q-vtl-connector { width:2px; flex:1; background:var(--border); min-height:12px; }
        .q-vtl-item:last-child .q-vtl-connector { background:transparent; }
        .q-vtl-card { flex:1; background:var(--card); border:1px solid var(--border); border-radius:10px; padding:12px 16px; margin-bottom:8px; transition:border-color .2s; }
        .q-vtl-card:hover { border-color:var(--accent); }
        .q-vtl-card-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
        .q-vtl-time { font-size:12px; color:var(--muted); }
        .q-vtl-card-body { font-size:13px; color:var(--text); line-height:1.5; }
        .q-vtl-card-footer { font-size:11px; color:var(--muted); margin-top:6px; }

        .q-htl { display:flex; flex-direction:column; gap:16px; overflow:hidden; }
        .q-htl-lane { display:flex; gap:12px; align-items:flex-start; }
        .q-htl-lane-label { padding:8px 12px; min-width:110px; flex-shrink:0; border-radius:6px; background:var(--card); }
        .q-htl-lane-name { font-size:12px; font-weight:700; display:block; }
        .q-htl-lane-count { font-size:20px; font-weight:800; color:var(--text); }
        .q-htl-lane-items { display:flex; gap:10px; overflow-x:auto; padding:4px 0 12px; flex:1; min-width:0; }
        .q-htl-lane-items::-webkit-scrollbar { height:4px; }
        .q-htl-lane-items::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
        .q-htl-card { min-width:180px; max-width:240px; flex-shrink:0; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:10px 12px; transition:border-color .2s; }
        .q-htl-card:hover { border-color:var(--accent); }
        .q-htl-card-time { font-size:11px; color:var(--muted); margin-bottom:4px; }
        .q-htl-card-msg { font-size:12px; color:var(--text); line-height:1.4; margin-bottom:6px; }
        .q-htl-card-source { font-size:10px; color:var(--muted); }
        .q-htl-empty-lane { font-size:12px; color:var(--muted); padding:10px; }

        .q-load-more:hover { border-color:var(--accent); background:rgba(245,158,11,.05); }

        /* Modal detail styles */
        .q-modal-body { padding:4px 0; }
        .q-modal-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border); }
        .q-modal-row:last-of-type { border-bottom:none; }
        .q-modal-label { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; font-weight:600; }
        .q-modal-value { font-size:13px; color:var(--text); }
        .q-modal-msg-section { margin-top:16px; }
        .q-modal-msg-section .q-modal-label { display:block; margin-bottom:8px; }
        .q-modal-msg {
          font-size:13px; color:var(--text); line-height:1.6;
          white-space:pre-wrap; word-break:break-word;
          background:var(--card); border:1px solid var(--border); border-radius:8px;
          padding:14px 16px; max-height:300px; overflow-y:auto;
        }
        .q-modal-actions { margin-top:20px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; }
        .q-revert-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600;
          background:rgba(248,113,113,.1); color:#f87171; border:1px solid rgba(248,113,113,.3);
          cursor:pointer; transition:all .15s;
        }
        .q-revert-btn:hover { background:rgba(248,113,113,.2); border-color:#f87171; }

        @media(max-width:640px) {
          .q-card { grid-template-columns:24px auto 1fr; gap:8px; }
          .q-card-meta, .q-card-time { grid-column: 2 / -1; }
          .q-card-meta { order:3; }
          .q-card-time { order:4; font-size:11px; }
          .q-htl-lane { flex-direction:column; }
          .q-htl-lane-label { min-width:auto; }
        }
      </style>

      <div class="q-header">
        <h1><i data-lucide="list-ordered"></i> Queue</h1>
        <span class="q-count">${this._totalCount || this._items.length} total</span>
        ${this._renderViewToggle()}
      </div>
      <p class="q-subtitle">Trigger queue — click any item for full details. Loads 50 at a time with infinite scroll.</p>

      <div class="q-stats">
        ${filters.map(f => {
          const num = f === 'active' ? c.pending + c.processing
            : f === 'all' ? '' : c[f] ?? 0;
          return `<div class="q-stat ${this._filter === f ? 'active' : ''}" data-filter="${f}">
            ${num !== '' ? `<span class="q-stat-num">${num}</span>` : ''} ${filterLabels[f]}
          </div>`;
        }).join('')}
      </div>

      <div class="q-content-area">${content}</div>
    `;
    setTimeout(() => window.refreshIcons?.(), 0);
    requestAnimationFrame(() => this._observeSentinel());
  }
}
customElements.define('cc-queue', CcQueue);
