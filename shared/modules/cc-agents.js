// ─── Multi-Agent Fleet Manager ───────────────────────────────
class CcAgents extends HTMLElement {
  connectedCallback() {
    this._agents = [];
    this._templates = [];
    this._filter = 'all'; // all|running|completed|failed|idle
    this._sort = 'newest';
    this._expandedId = null;
    this._layout = this.getAttribute('layout') || 'full';
    this._load();
  }

  async _load() {
    const base = this.getAttribute('src')?.replace(/\/[^/]+$/, '') || 'data';
    try {
      const [agentsRes, templatesRes] = await Promise.all([
        fetch(`${base}/agents.json`),
        fetch(`${base}/agent-templates.json`)
      ]);
      this._agents = await agentsRes.json();
      this._templates = await templatesRes.json();
    } catch (e) {
      this._agents = [];
      this._templates = [];
    }
    this._render();
  }

  _filtered() {
    let list = [...this._agents];
    if (this._filter !== 'all') list = list.filter(a => a.status === this._filter);
    list.sort((a, b) => {
      if (this._sort === 'newest') return (b.startedAt || '') > (a.startedAt || '') ? 1 : -1;
      if (this._sort === 'cost') return (b.cost || 0) - (a.cost || 0);
      if (this._sort === 'tokens') return (b.tokens?.total || 0) - (a.tokens?.total || 0);
      return 0;
    });
    return list;
  }

  _statusDot(status) {
    const colors = { running: 'var(--clr-ok)', completed: 'var(--clr-info)', failed: 'var(--clr-error)', idle: 'var(--clr-muted)' };
    return `<span class="agent-status-dot" style="background:${colors[status] || colors.idle}" title="${status}"></span>`;
  }

  _formatRuntime(secs) {
    if (!secs) return '—';
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}m ${s}s`;
  }

  _formatTokens(n) {
    if (!n) return '0';
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }

  _costSummary() {
    const now = new Date();
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let dayTokens = 0, dayCost = 0, weekTokens = 0, weekCost = 0;
    for (const a of this._agents) {
      const t = a.startedAt ? new Date(a.startedAt) : null;
      if (t && t >= weekStart) { weekTokens += a.tokens?.total || 0; weekCost += a.cost || 0; }
      if (t && t >= dayStart) { dayTokens += a.tokens?.total || 0; dayCost += a.cost || 0; }
    }
    return { dayTokens, dayCost, weekTokens, weekCost };
  }

  _renderList() {
    if (this._layout === 'list') return this._renderWidget();
    const agents = this._filtered();
    if (!agents.length) return '<div class="empty-state"><p>No agents match the current filter.</p></div>';
    return agents.map(a => `
      <div class="agent-card ${a.status}" data-id="${a.id}">
        <div class="agent-card-header" onclick="this.closest('cc-agents')._toggle('${a.id}')">
          <span class="agent-icon">${a.icon}</span>
          ${this._statusDot(a.status)}
          <strong class="agent-name">${a.name}</strong>
          <span class="agent-meta">${this._formatRuntime(a.runtime)} · ${this._formatTokens(a.tokens?.total)} tokens · $${(a.cost || 0).toFixed(3)}</span>
          <i data-lucide="${this._expandedId === a.id ? 'chevron-up' : 'chevron-down'}" class="agent-chevron"></i>
        </div>
        <p class="agent-task">${a.task}</p>
        ${this._expandedId === a.id ? this._renderExpanded(a) : ''}
      </div>
    `).join('');
  }

  _renderExpanded(a) {
    if (!a.output) return '<div class="agent-expanded"><p class="text-muted">No output yet.</p></div>';
    return `
      <div class="agent-expanded">
        <div class="agent-output-type"><span class="sort-pill"><span class="sort-pill-trigger">${a.output.type}</span></span></div>
        <p>${a.output.summary || ''}</p>
        ${a.output.artifacts?.length ? `<div class="agent-artifacts">${a.output.artifacts.map(f => `<span class="tag">📄 ${f}</span>`).join(' ')}</div>` : ''}
        <div class="agent-actions">
          <button class="btn-sm btn-ok" onclick="this.closest('cc-agents')._action('approve','${a.id}')">✓ Approve</button>
          <button class="btn-sm btn-muted" onclick="this.closest('cc-agents')._action('dismiss','${a.id}')">✕ Dismiss</button>
          <button class="btn-sm btn-info" onclick="this.closest('cc-agents')._action('rerun','${a.id}')">↻ Re-run</button>
        </div>
      </div>`;
  }

  _renderWidget() {
    const agents = this._agents.filter(a => a.status !== 'idle').slice(0, 4);
    return `<div class="cc-agents-widget">
      ${agents.map(a => `
        <div class="agent-row">
          ${this._statusDot(a.status)}
          <span class="agent-icon">${a.icon}</span>
          <span class="agent-name">${a.name}</span>
          <span class="agent-meta">${a.status} · ${this._formatTokens(a.tokens?.total)} tok</span>
        </div>
      `).join('')}
    </div>`;
  }

  _render() {
    if (this._layout === 'list') {
      this.innerHTML = `<style>${CcAgents.widgetStyles}</style><h3>🤖 Agent Fleet</h3>${this._renderList()}`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const cost = this._costSummary();
    const counts = { all: this._agents.length };
    for (const a of this._agents) counts[a.status] = (counts[a.status] || 0) + 1;

    this.innerHTML = `
      <style>${CcAgents.styles}</style>
      <section class="cc-agents-page">
        <div class="agents-toolbar">
          <h2>🤖 Agent Fleet Manager</h2>
          <button class="btn-add" onclick="this.closest('cc-agents')._openSpawn()" title="Spawn Agent"><i data-lucide="plus"></i></button>
        </div>

        <div class="cost-bar">
          <span>Today: <strong>${this._formatTokens(cost.dayTokens)}</strong> tokens · <strong>$${cost.dayCost.toFixed(2)}</strong></span>
          <span>This week: <strong>${this._formatTokens(cost.weekTokens)}</strong> tokens · <strong>$${cost.weekCost.toFixed(2)}</strong></span>
        </div>

        <div class="filter-row">
          ${['all', 'running', 'completed', 'failed', 'idle'].map(f =>
            `<button class="sort-pill${this._filter === f ? ' active' : ''}" onclick="this.closest('cc-agents')._setFilter('${f}')">${f} ${counts[f] || 0}</button>`
          ).join('')}
          <div class="sort-pill">
            <span class="sort-pill-trigger" onclick="this.closest('.sort-pill').classList.toggle('open')">Sort: ${this._sort} ▾</span>
            <div class="sort-pill-menu">
              ${['newest', 'cost', 'tokens'].map(s =>
                `<button class="sort-option${this._sort === s ? ' active' : ''}" onclick="this.closest('cc-agents')._setSort('${s}');this.closest('.sort-pill').classList.remove('open')">${s}</button>`
              ).join('')}
            </div>
          </div>
        </div>

        <div class="agents-list">
          ${this._renderList()}
        </div>
      </section>
    `;
    if (window.lucide) lucide.createIcons();
  }

  _setFilter(f) { this._filter = f; this._render(); }
  _setSort(s) { this._sort = s; this._render(); }
  _toggle(id) { this._expandedId = this._expandedId === id ? null : id; this._render(); }

  _action(action, id) {
    const a = this._agents.find(x => x.id === id);
    if (!a) return;
    if (action === 'dismiss') {
      this._agents = this._agents.filter(x => x.id !== id);
      this._render();
      if (window.CC?.toast) CC.toast(`Dismissed ${a.name}`);
    } else if (action === 'approve') {
      a.status = 'completed';
      this._render();
      if (window.CC?.toast) CC.toast(`Approved ${a.name} output`);
    } else if (action === 'rerun') {
      this._spawnAgent(this._templates.find(t => t.id === a.templateId), a.task);
    }
  }

  _openSpawn() {
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', 'Spawn Agent');
    modal.innerHTML = `
      <div class="spawn-templates">
        <p style="margin-bottom:var(--sp-3)">Choose a template:</p>
        ${this._templates.map(t => `
          <div class="spawn-template-card" onclick="this.closest('cc-modal').querySelector('.spawn-step2').style.display='block';this.closest('.spawn-templates').querySelectorAll('.spawn-template-card').forEach(c=>c.classList.remove('selected'));this.classList.add('selected');this.closest('cc-modal')._selectedTemplate='${t.id}'">
            <span class="agent-icon">${t.icon}</span>
            <div>
              <strong>${t.name}</strong>
              <p class="text-muted">${t.description}</p>
              <span class="text-muted">~${this._formatTokens(t.estimatedTokens)} tokens</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="spawn-step2" style="display:none;margin-top:var(--sp-3)">
        <cc-field label="Task Description" type="textarea" name="task" placeholder="Describe what the agent should do..."></cc-field>
        <button class="btn-add" style="margin-top:var(--sp-2);width:100%" onclick="this.closest('cc-agents')._submitSpawn(this.closest('cc-modal'))">🚀 Launch Agent</button>
      </div>
    `;
    this.appendChild(modal);
    modal.open();
  }

  _submitSpawn(modal) {
    const templateId = modal._selectedTemplate;
    const task = modal.querySelector('cc-field[name=task]')?.value || '';
    if (!templateId || !task) return;
    const template = this._templates.find(t => t.id === templateId);
    this._spawnAgent(template, task);
    modal.close();
  }

  _spawnAgent(template, task) {
    if (!template) return;
    const agent = {
      id: `agent-${Date.now()}`,
      name: template.name,
      icon: template.icon,
      templateId: template.id,
      status: 'running',
      task,
      startedAt: new Date().toISOString(),
      completedAt: null,
      runtime: null,
      tokens: { input: 0, output: 0, total: 0 },
      cost: 0,
      output: null
    };
    this._agents.unshift(agent);
    this._render();
    if (window.CC?.toast) CC.toast(`Spawned ${template.icon} ${template.name}`);

    // Fire trigger (best-effort)
    if (window.trigger) window.trigger(task, { context: 'cc-agents', silent: true }).catch(() => {});
  }

  static widgetStyles = `
    .cc-agents-widget { display:flex; flex-direction:column; gap:var(--sp-1); }
    .agent-row { display:flex; align-items:center; gap:var(--sp-2); padding:var(--sp-1) 0; }
    .agent-row .agent-meta { margin-left:auto; font-size:.8rem; color:var(--clr-muted); }
    .agent-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; display:inline-block; }
  `;

  static styles = `
    .cc-agents-page { max-width:960px; margin:0 auto; padding:var(--sp-4) var(--sp-3); }
    .agents-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--sp-3); }
    .agents-toolbar h2 { margin:0; }
    .cost-bar { display:flex; gap:var(--sp-4); padding:var(--sp-2) var(--sp-3); background:var(--clr-surface); border-radius:var(--radius); margin-bottom:var(--sp-3); font-size:.9rem; flex-wrap:wrap; }
    .cost-bar strong { color:var(--clr-accent); }
    .filter-row { display:flex; gap:var(--sp-1); flex-wrap:wrap; margin-bottom:var(--sp-3); align-items:center; }
    .filter-row .sort-pill { cursor:pointer; }
    .filter-row .sort-pill.active { background:var(--clr-accent); color:var(--clr-bg); }
    .agent-status-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; display:inline-block; }
    .agent-card { background:var(--clr-surface); border-radius:var(--radius); padding:var(--sp-3); margin-bottom:var(--sp-2); border-left:3px solid var(--clr-muted); }
    .agent-card.running { border-left-color:var(--clr-ok); }
    .agent-card.completed { border-left-color:var(--clr-info); }
    .agent-card.failed { border-left-color:var(--clr-error); }
    .agent-card-header { display:flex; align-items:center; gap:var(--sp-2); cursor:pointer; flex-wrap:wrap; }
    .agent-icon { font-size:1.3rem; }
    .agent-name { flex:1; }
    .agent-meta { font-size:.8rem; color:var(--clr-muted); }
    .agent-chevron { width:16px; height:16px; color:var(--clr-muted); }
    .agent-task { font-size:.85rem; color:var(--clr-muted); margin:var(--sp-1) 0 0 calc(10px + 1.3rem + var(--sp-2)*2); }
    .agent-expanded { margin-top:var(--sp-2); padding-top:var(--sp-2); border-top:1px solid var(--clr-border); }
    .agent-expanded p { font-size:.9rem; margin:var(--sp-1) 0; }
    .agent-artifacts { display:flex; gap:var(--sp-1); flex-wrap:wrap; margin:var(--sp-2) 0; }
    .agent-artifacts .tag { background:var(--clr-bg); padding:2px 8px; border-radius:var(--radius); font-size:.8rem; }
    .agent-actions { display:flex; gap:var(--sp-2); margin-top:var(--sp-2); }
    .btn-sm { padding:4px 12px; border:none; border-radius:var(--radius); cursor:pointer; font-size:.8rem; }
    .btn-ok { background:var(--clr-ok); color:#fff; }
    .btn-muted { background:var(--clr-surface); color:var(--clr-fg); border:1px solid var(--clr-border); }
    .btn-info { background:var(--clr-info); color:#fff; }
    .spawn-template-card { display:flex; gap:var(--sp-2); padding:var(--sp-2); border:1px solid var(--clr-border); border-radius:var(--radius); cursor:pointer; margin-bottom:var(--sp-2); transition:border-color .2s; }
    .spawn-template-card:hover, .spawn-template-card.selected { border-color:var(--clr-accent); background:var(--clr-bg); }
    .spawn-template-card .agent-icon { font-size:1.5rem; }
    .spawn-template-card p { margin:var(--sp-1) 0 0; font-size:.8rem; }
    .text-muted { color:var(--clr-muted); }
    .empty-state { text-align:center; padding:var(--sp-4); color:var(--clr-muted); }
    @media(max-width:600px) {
      .cost-bar { flex-direction:column; gap:var(--sp-1); }
      .agent-card-header { flex-wrap:wrap; }
      .agent-meta { width:100%; margin-left:calc(10px + 1.3rem + var(--sp-2)*2); }
    }
  `;
}
customElements.define('cc-agents', CcAgents);
