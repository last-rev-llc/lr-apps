/* ── cc-health: Task Effectiveness Dashboard ──────────────────
   Displays self-rating data from task_effectiveness Supabase table.
   Uses shared components: cc-search, cc-view-toggle, cc-pill-dropdown,
   cc-empty-state, cc-fade-in, cc-stagger, cc-stat-counter.
   CSS: theme.css classes (.card, .panel, .badge, .grid, .stat-box, etc.)
*/
class CcHealth extends HTMLElement {
  connectedCallback() {
    this._items = [];
    this._allItems = [];
    this._filter = 'all';
    this._modelFilter = 'all';
    this._typeFilter = 'all';
    this._sort = 'created_at';
    this._sortDir = 'desc';
    this._search = '';
    this._view = 'cards';
    this._loading = true;
    this._stats = {};

    this._restoreParams();
    this._render();
    this._load();

    // Delegated events
    this.addEventListener('cc-view-change', e => {
      this._view = e.detail.view;
      this._renderContent();
    });
    this.addEventListener('cc-search', e => {
      this._search = e.detail.value;
      this._saveParams();
      this._applyFilters();
    });
    this.addEventListener('pill-change', e => {
      const el = e.target;
      if (el.getAttribute('data-filter-key') === 'outcome') this._filter = e.detail.value;
      else if (el.getAttribute('data-filter-key') === 'model') this._modelFilter = e.detail.value;
      else if (el.getAttribute('data-filter-key') === 'type') this._typeFilter = e.detail.value;
      else if (el.getAttribute('data-filter-key') === 'sort') this._sort = e.detail.value;
      this._saveParams();
      this._applyFilters();
    });
    this.addEventListener('direction-change', e => {
      this._sortDir = e.detail.direction;
      this._saveParams();
      this._applyFilters();
    });
    this.addEventListener('click', e => {
      const del = e.target.closest('[data-delete]');
      if (del) { e.stopPropagation(); this._deleteItem(del.dataset.delete); return; }
      const card = e.target.closest('[data-item-id]');
      if (card && !del) { this._openDetail(card.dataset.itemId); }
    });
  }

  _esc(s) { const d = document.createElement('span'); d.textContent = s || ''; return d.innerHTML; }

  _restoreParams() {
    const p = (typeof CC !== 'undefined' && CC.getParams) ? CC.getParams() : {};
    if (p.outcome) this._filter = p.outcome;
    if (p.model) this._modelFilter = p.model;
    if (p.type) this._typeFilter = p.type;
    if (p.sort) this._sort = p.sort;
    if (p.dir) this._sortDir = p.dir;
    if (p.q) this._search = p.q;
  }

  _saveParams() {
    if (typeof CC !== 'undefined' && CC.setParams) {
      CC.setParams({
        outcome: this._filter === 'all' ? null : this._filter,
        model: this._modelFilter === 'all' ? null : this._modelFilter,
        type: this._typeFilter === 'all' ? null : this._typeFilter,
        sort: this._sort === 'created_at' ? null : this._sort,
        dir: this._sortDir === 'desc' ? null : this._sortDir,
        q: this._search || null
      });
    }
  }

  async _load() {
    const sb = window.supabase;
    if (!sb) { setTimeout(() => this._load(), 500); return; }
    try {
      this._allItems = await sb.select('task_effectiveness', {
        order: 'created_at.desc', limit: 1000
      });
      this._loading = false;
      this._calcStats();
      this._render();
    } catch (e) {
      console.error('cc-health load error:', e);
      this._loading = false;
      this._allItems = [];
      this._render();
    }
  }

  _calcStats() {
    const items = this._allItems || [];
    const total = items.length;
    const success = items.filter(i => i.outcome === 'success').length;
    const partial = items.filter(i => i.outcome === 'partial').length;
    const failure = items.filter(i => i.outcome === 'failure').length;
    const rework = items.filter(i => i.outcome === 'rework_needed').length;
    const corrected = items.filter(i => i.corrected_by_adam).length;
    const scored = items.filter(i => i.effectiveness_score);
    const avgScore = scored.length ? (scored.reduce((s, i) => s + i.effectiveness_score, 0) / scored.length).toFixed(1) : '—';
    const totalCost = items.reduce((s, i) => s + (parseFloat(i.cost_estimate) || 0), 0);

    // Per-model
    const models = {};
    items.forEach(i => {
      const m = i.model_used || 'unknown';
      if (!models[m]) models[m] = { total: 0, success: 0, failure: 0, cost: 0, scores: [] };
      models[m].total++;
      if (i.outcome === 'success') models[m].success++;
      if (i.outcome === 'failure' || i.outcome === 'rework_needed') models[m].failure++;
      models[m].cost += parseFloat(i.cost_estimate) || 0;
      if (i.effectiveness_score) models[m].scores.push(i.effectiveness_score);
    });

    // Per-type
    const types = {};
    items.forEach(i => {
      const t = i.task_type || 'unknown';
      if (!types[t]) types[t] = { total: 0, success: 0, failure: 0, scores: [] };
      types[t].total++;
      if (i.outcome === 'success') types[t].success++;
      if (i.outcome === 'failure' || i.outcome === 'rework_needed') types[t].failure++;
      if (i.effectiveness_score) types[t].scores.push(i.effectiveness_score);
    });

    this._stats = { total, success, partial, failure, rework, corrected, avgScore, totalCost, models, types };
  }

  _filtered() {
    let items = [...(this._allItems || [])];
    const q = this._search.toLowerCase();

    if (this._filter !== 'all') items = items.filter(i => i.outcome === this._filter);
    if (this._modelFilter !== 'all') items = items.filter(i => (i.model_used || '') === this._modelFilter);
    if (this._typeFilter !== 'all') items = items.filter(i => i.task_type === this._typeFilter);
    if (q) items = items.filter(i =>
      (i.task_type || '').toLowerCase().includes(q) ||
      (i.task_description || '').toLowerCase().includes(q) ||
      (i.notes || '').toLowerCase().includes(q) ||
      (i.model_used || '').toLowerCase().includes(q)
    );

    // Sort
    const dir = this._sortDir === 'asc' ? 1 : -1;
    if (this._sort === 'created_at') items.sort((a, b) => dir * (new Date(a.created_at) - new Date(b.created_at)));
    else if (this._sort === 'score') items.sort((a, b) => dir * ((a.effectiveness_score || 0) - (b.effectiveness_score || 0)));
    else if (this._sort === 'cost') items.sort((a, b) => dir * ((parseFloat(a.cost_estimate) || 0) - (parseFloat(b.cost_estimate) || 0)));
    else if (this._sort === 'type') items.sort((a, b) => dir * (a.task_type || '').localeCompare(b.task_type || ''));

    return items;
  }

  _applyFilters() {
    this._renderContent();
    this._renderFilterState();
  }

  async _deleteItem(id) {
    if (!confirm('Delete this record?')) return;
    try {
      await window.supabase.delete('task_effectiveness', { id: `eq.${id}` });
      this._allItems = this._allItems.filter(i => i.id !== id);
      this._calcStats();
      this._render();
      if (window.showToast) window.showToast('Record deleted ✅');
    } catch (e) { console.error(e); }
  }

  _openDetail(id) {
    const item = this._allItems.find(i => i.id === id);
    if (!item) return;
    const esc = this._esc.bind(this);
    let modal = this.querySelector('cc-modal.health-detail');
    if (!modal) { modal = document.createElement('cc-modal'); modal.className = 'health-detail'; modal.setAttribute('size', 'md'); this.appendChild(modal); }
    modal.setAttribute('title', esc(item.task_type || 'Task Detail'));
    modal.innerHTML = `
      <div class="flex flex-col gap-4">
        <div class="grid grid-2 gap-3">
          ${this._detailField('Outcome', this._outcomeBadge(item.outcome))}
          ${this._detailField('Score', item.effectiveness_score ? '⭐'.repeat(item.effectiveness_score) + ` (${item.effectiveness_score}/5)` : '—')}
          ${this._detailField('Model', `<span class="text-accent">${esc(this._shortModel(item.model_used))}</span>`)}
          ${this._detailField('Cost', item.cost_estimate ? '$' + parseFloat(item.cost_estimate).toFixed(4) : '—')}
          ${this._detailField('Tokens', item.tokens_used ? this._fmtNum(item.tokens_used) : '—')}
          ${this._detailField('Duration', item.duration_seconds ? item.duration_seconds + 's' : '—')}
          ${this._detailField('Corrected', item.corrected_by_adam ? '<span class="badge bg-red text-white">Yes</span>' : 'No')}
          ${this._detailField('Date', this._fmtDateFull(item.created_at))}
        </div>
        ${item.task_description ? `<div><div class="text-xs text-muted font-semibold uppercase mb-1">Description</div><div class="text-sm">${esc(item.task_description)}</div></div>` : ''}
        ${item.notes ? `<div><div class="text-xs text-muted font-semibold uppercase mb-1">Notes</div><div class="text-sm">${esc(item.notes)}</div></div>` : ''}
        ${item.session_key ? `<div><div class="text-xs text-muted font-semibold uppercase mb-1">Session</div><div class="text-xs text-muted font-mono">${esc(item.session_key)}</div></div>` : ''}
      </div>
      <div slot="footer">
        <button class="btn btn-danger btn-sm" data-delete="${item.id}">Delete</button>
      </div>`;
    modal.open();
    window.refreshIcons && window.refreshIcons();
  }

  _detailField(label, valueHtml) {
    return `<div><div class="text-xs text-muted font-semibold uppercase">${label}</div><div class="text-sm mt-1">${valueHtml}</div></div>`;
  }

  _render() {
    const s = this._stats;
    const esc = this._esc.bind(this);
    const uniqueModels = [...new Set((this._allItems || []).map(i => i.model_used).filter(Boolean))];
    const uniqueTypes = [...new Set((this._allItems || []).map(i => i.task_type).filter(Boolean))].sort();

    const outcomeItems = [
      { value: 'all', label: 'All' },
      { value: 'success', label: `Success${s.success ? ` (${s.success})` : ''}` },
      { value: 'partial', label: `Partial${s.partial ? ` (${s.partial})` : ''}` },
      { value: 'failure', label: `Failed${s.failure ? ` (${s.failure})` : ''}` },
      { value: 'rework_needed', label: `Rework${s.rework ? ` (${s.rework})` : ''}` }
    ];
    const modelItems = [{ value: 'all', label: 'All Models' }, ...uniqueModels.map(m => ({ value: m, label: this._shortModel(m) }))];
    const typeItems = [{ value: 'all', label: 'All Types' }, ...uniqueTypes.map(t => ({ value: t, label: t }))];
    const sortItems = [
      { value: 'created_at', label: 'Date' },
      { value: 'score', label: 'Score' },
      { value: 'cost', label: 'Cost' },
      { value: 'type', label: 'Type' }
    ];

    this.innerHTML = `
      <div class="container" style="padding:24px 16px;">
        <!-- Page Header -->
        <cc-fade-in>
          <div class="page-header">
            <h1>🩺 AI Health</h1>
            <div class="header-right">
              <span class="text-sm text-muted">${s.total || 0} tasks tracked</span>
            </div>
          </div>
        </cc-fade-in>

        <!-- Summary Stats -->
        <cc-fade-in delay="100">
          <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px;">
            <div class="stat-box"><div class="stat-box-value">${s.total || 0}</div><div class="stat-box-label">Total Tasks</div></div>
            <div class="stat-box"><div class="stat-box-value" style="color:var(--green);">${s.total ? Math.round(s.success / s.total * 100) + '%' : '—'}</div><div class="stat-box-label">Success Rate</div></div>
            <div class="stat-box"><div class="stat-box-value">${s.avgScore || '—'}</div><div class="stat-box-label">Avg Score</div></div>
            <div class="stat-box"><div class="stat-box-value" style="color:var(--red);">${(s.failure || 0) + (s.rework || 0)}</div><div class="stat-box-label">Failures</div></div>
            <div class="stat-box"><div class="stat-box-value" style="color:var(--orange);">${s.corrected || 0}</div><div class="stat-box-label">Corrections</div></div>
            <div class="stat-box"><div class="stat-box-value">$${(s.totalCost || 0).toFixed(2)}</div><div class="stat-box-label">Total Cost</div></div>
          </div>
        </cc-fade-in>

        <!-- Model Performance Cards -->
        ${Object.keys(s.models || {}).length ? `
        <cc-fade-in delay="200">
          <div class="panel mb-4">
            <div class="panel-header">📈 Model Performance</div>
            <cc-stagger animation="fade-up" delay="60">
              <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;padding:12px 0;">
                ${Object.entries(s.models).map(([model, d]) => {
                  const rate = d.total ? Math.round(d.success / d.total * 100) : 0;
                  const avgS = d.scores.length ? (d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(1) : '—';
                  const rateColor = rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : 'var(--red)';
                  return `<div class="card" style="cursor:default;">
                    <div class="card-title" style="color:var(--accent);font-size:14px;">${esc(this._shortModel(model))}</div>
                    <div class="grid grid-2 gap-2 mt-2 text-sm">
                      <span class="text-muted">Tasks</span><span class="font-semibold">${d.total}</span>
                      <span class="text-muted">Success</span><span class="font-semibold" style="color:${rateColor};">${rate}%</span>
                      <span class="text-muted">Avg Score</span><span class="font-semibold">${avgS}</span>
                      <span class="text-muted">Cost</span><span class="font-semibold">$${d.cost.toFixed(2)}</span>
                    </div>
                    <!-- Progress bar -->
                    <div style="margin-top:8px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
                      <div style="height:100%;width:${rate}%;background:${rateColor};border-radius:2px;transition:width .3s;"></div>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </cc-stagger>
          </div>
        </cc-fade-in>` : ''}

        <!-- Task Type Breakdown -->
        ${Object.keys(s.types || {}).length ? `
        <cc-fade-in delay="300">
          <div class="panel mb-4">
            <div class="panel-header">🏷️ Task Type Breakdown</div>
            <cc-stagger animation="fade-up" delay="40">
              <div style="padding:12px 0;">
                ${Object.entries(s.types).sort((a, b) => b[1].total - a[1].total).map(([type, d]) => {
                  const rate = d.total ? Math.round(d.success / d.total * 100) : 0;
                  const rateColor = rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : 'var(--red)';
                  return `<div class="entity-row" style="align-items:center;">
                    <div class="entity-body">
                      <span class="text-sm font-semibold">${esc(type)}</span>
                    </div>
                    <div class="entity-meta" style="gap:12px;">
                      <span>${d.total} task${d.total !== 1 ? 's' : ''}</span>
                      <span style="color:${rateColor};font-weight:600;">${rate}%</span>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </cc-stagger>
          </div>
        </cc-fade-in>` : ''}

        <!-- Filters & Controls -->
        <cc-fade-in delay="350">
          <div class="controls mb-3" style="gap:10px;">
            <cc-search placeholder="Search tasks, notes, models…" value="${esc(this._search)}"></cc-search>
            <cc-pill-dropdown data-filter-key="outcome" label="Outcome" items='${JSON.stringify(outcomeItems)}' value="${this._filter}"></cc-pill-dropdown>
            ${uniqueModels.length > 1 ? `<cc-pill-dropdown data-filter-key="model" label="Model" items='${JSON.stringify(modelItems)}' value="${this._modelFilter}"></cc-pill-dropdown>` : ''}
            ${uniqueTypes.length > 1 ? `<cc-pill-dropdown data-filter-key="type" label="Type" items='${JSON.stringify(typeItems)}' value="${this._typeFilter}"></cc-pill-dropdown>` : ''}
            <cc-pill-dropdown data-filter-key="sort" label="Sort" items='${JSON.stringify(sortItems)}' value="${this._sort}" direction="${this._sortDir}"></cc-pill-dropdown>
            <cc-view-toggle app="health"></cc-view-toggle>
          </div>
        </cc-fade-in>

        <!-- Content Area -->
        <div data-role="content"></div>

        ${this._loading ? '<div class="text-center p-6 text-muted">Loading…</div>' : ''}
      </div>`;

    // Restore view from toggle
    const vt = this.querySelector('cc-view-toggle');
    if (vt) setTimeout(() => { this._view = vt.value || 'cards'; this._renderContent(); }, 0);
    else this._renderContent();

    window.refreshIcons && window.refreshIcons();
  }

  _renderContent() {
    const el = this.querySelector('[data-role="content"]');
    if (!el) return;
    const items = this._filtered();

    if (!items.length && !this._loading) {
      el.innerHTML = '<cc-empty-state message="No task data yet — tasks will appear here as Claudia logs outcomes." icon="🩺" animation="sparkle"></cc-empty-state>';
      return;
    }

    if (this._view === 'list') {
      el.innerHTML = `<div class="view-list">${items.map(i => `
        <div class="list-row" data-item-id="${i.id}" style="cursor:pointer;">
          <span class="row-icon">${this._outcomeIcon(i.outcome)}</span>
          <span class="row-name">${this._esc(i.task_type || 'Unknown')}</span>
          ${this._outcomeBadge(i.outcome)}
          <span class="row-desc">${this._esc(i.task_description || i.notes || '')}</span>
          <span class="text-xs text-muted" style="white-space:nowrap;">${this._esc(this._shortModel(i.model_used))}</span>
          <span class="text-xs text-muted" style="white-space:nowrap;">${this._fmtDate(i.created_at)}</span>
          ${i.corrected_by_adam ? '<span class="badge bg-red text-white">Corrected</span>' : ''}
        </div>
      `).join('')}</div>`;
    } else if (this._view === 'expanded') {
      el.innerHTML = `<div class="view-expanded">${items.map(i => `
        <div class="expanded-card" data-item-id="${i.id}" style="cursor:pointer;">
          <div class="flex items-center gap-3 mb-2">
            <span style="font-size:20px;">${this._outcomeIcon(i.outcome)}</span>
            <span class="text-lg font-bold">${this._esc(i.task_type || 'Unknown')}</span>
            ${this._outcomeBadge(i.outcome)}
            ${i.corrected_by_adam ? '<span class="badge bg-red text-white">Corrected</span>' : ''}
            <span class="text-xs text-muted ml-auto">${this._fmtDateFull(i.created_at)}</span>
          </div>
          ${i.task_description ? `<div class="text-sm mb-2">${this._esc(i.task_description)}</div>` : ''}
          <div class="flex gap-3 flex-wrap text-sm">
            <span class="text-accent font-semibold">${this._esc(this._shortModel(i.model_used))}</span>
            ${i.effectiveness_score ? `<span>${'⭐'.repeat(i.effectiveness_score)} (${i.effectiveness_score}/5)</span>` : ''}
            ${i.cost_estimate ? `<span class="text-muted">$${parseFloat(i.cost_estimate).toFixed(4)}</span>` : ''}
            ${i.tokens_used ? `<span class="text-muted">${this._fmtNum(i.tokens_used)} tokens</span>` : ''}
            ${i.duration_seconds ? `<span class="text-muted">${i.duration_seconds}s</span>` : ''}
          </div>
          ${i.notes ? `<div class="text-sm text-muted mt-2 pt-2" style="border-top:1px solid var(--border);">${this._esc(i.notes)}</div>` : ''}
        </div>
      `).join('')}</div>`;
    } else {
      // Cards view
      el.innerHTML = `<cc-stagger animation="fade-up" delay="40"><div class="grid grid-cards">${items.map(i => `
        <div class="card" data-item-id="${i.id}" style="cursor:pointer;">
          <div class="card-top">
            <span class="card-icon">${this._outcomeIcon(i.outcome)}</span>
            <div>
              <div class="card-title">${this._esc(i.task_type || 'Unknown')}</div>
              <div class="card-meta">${this._fmtDate(i.created_at)}</div>
            </div>
          </div>
          ${i.task_description ? `<div class="card-desc">${this._esc(i.task_description)}</div>` : ''}
          <div class="card-bottom">
            <div class="card-tags">
              ${this._outcomeBadge(i.outcome)}
              <span class="tag" style="color:var(--accent);">${this._esc(this._shortModel(i.model_used))}</span>
              ${i.effectiveness_score ? `<span class="tag">${'⭐'.repeat(i.effectiveness_score)}</span>` : ''}
              ${i.cost_estimate ? `<span class="tag">$${parseFloat(i.cost_estimate).toFixed(3)}</span>` : ''}
              ${i.corrected_by_adam ? '<span class="badge bg-red text-white">Corrected</span>' : ''}
            </div>
          </div>
          ${i.notes ? `<div class="card-detail text-sm text-muted mt-2 pt-2" style="display:block;border-top:1px solid var(--border);">${this._esc(i.notes)}</div>` : ''}
        </div>
      `).join('')}</div></cc-stagger>`;
    }

    window.refreshIcons && window.refreshIcons();
  }

  _renderFilterState() {
    // Update pill dropdowns to reflect current state
    const outcomes = this.querySelector('[data-filter-key="outcome"]');
    if (outcomes) outcomes.setAttribute('value', this._filter);
    const models = this.querySelector('[data-filter-key="model"]');
    if (models) models.setAttribute('value', this._modelFilter);
    const types = this.querySelector('[data-filter-key="type"]');
    if (types) types.setAttribute('value', this._typeFilter);
    this._renderContent();
  }

  _outcomeBadge(outcome) {
    const map = {
      success: { cls: 'badge-automation', label: 'Success' },
      partial: { cls: 'badge-integration', label: 'Partial' },
      failure: { cls: 'badge', label: 'Failed', style: 'background:rgba(239,68,68,0.15);color:var(--red);' },
      rework_needed: { cls: 'badge', label: 'Rework', style: 'background:rgba(249,115,22,0.15);color:var(--orange);' }
    };
    const m = map[outcome] || { cls: 'badge', label: outcome || '—' };
    return `<span class="${m.cls}"${m.style ? ` style="${m.style}"` : ''}>${m.label}</span>`;
  }

  _outcomeIcon(outcome) {
    const map = { success: '✅', partial: '⚠️', failure: '❌', rework_needed: '🔄' };
    return map[outcome] || '📊';
  }

  _shortModel(m) {
    if (!m) return '—';
    return m.replace('anthropic/', '').replace('openai/', '')
      .replace('claude-opus-4-6', 'Opus 4')
      .replace('claude-sonnet-4-6', 'Sonnet 4')
      .replace('claude-haiku-3-5', 'Haiku 3.5')
      .replace('claude-', 'Claude ')
      .replace('-latest', '');
  }

  _fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  _fmtDateFull(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  _fmtNum(n) {
    if (!n) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }
}

customElements.define('cc-health', CcHealth);
