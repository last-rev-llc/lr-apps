// ─── Multi-Agent Fleet Manager ─── Live Session Data ───────────
class CcAgents extends HTMLElement {
  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  _escAttr(s) {
    return (s ?? '').toString().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  connectedCallback() {
    this._agents = [];
    this._filter = 'all'; // all|main|cron|subagent|thread
    this._sort = 'newest';
    this._expandedId = null;
    this._layout = this.getAttribute('layout') || 'full';
    this._refreshInterval = null;
    this._load();
    
    // Auto-refresh every 30 seconds
    if (this._layout === 'full') {
      this._refreshInterval = setInterval(() => this._load(), 30000);
    }
  }

  disconnectedCallback() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }
  }

  async _load() {
    try {
      if (!window.supabase) {
        window.showToast?.('Supabase not available — loading cached data', 3000);
        this._loadFallback();
        return;
      }
      
      const { data, error } = await window.supabase.select('agent_sessions', { 
        order: 'updated_at.desc' 
      });
      
      if (error) {
        window.showToast?.('Failed to load agents — using cached data', 3000);
        this._loadFallback();
        return;
      }
      
      // Map Supabase data to expected format
      this._agents = data.map(session => ({
        id: session.id,
        name: session.label,
        icon: session.icon,
        status: session.status,
        task: session.last_message,
        startedAt: session.started_at,
        completedAt: session.updated_at,
        runtime: this._calculateRuntime(session.started_at, session.updated_at),
        tokens: { 
          input: Math.floor(session.total_tokens * 0.6), // Estimate
          output: Math.floor(session.total_tokens * 0.4), 
          total: session.total_tokens 
        },
        cost: session.cost,
        channel: session.channel,
        sessionKey: session.session_key,
        model: session.model,
        metadata: session.metadata,
        output: this._deriveOutput(session)
      }));
      
    } catch (e) {
      window.showToast?.('Error loading agents — using cached data', 3000);
      this._loadFallback();
    }
    this._render();
  }

  async _loadFallback() {
    // Fallback to static data if Supabase fails
    const base = this.getAttribute('src')?.replace(/\/[^/]+$/, '') || 'data';
    try {
      const agentsRes = await fetch(`${base}/agents.json`);
      this._agents = await agentsRes.json();
    } catch (e) {
      this._agents = [];
    }
  }

  _calculateRuntime(startedAt, updatedAt) {
    if (!startedAt || !updatedAt) return null;
    const start = new Date(startedAt);
    const end = new Date(updatedAt);
    return Math.floor((end - start) / 1000);
  }

  _deriveOutput(session) {
    // Create synthetic output based on session data
    if (session.status === 'main' && session.total_tokens > 0) {
      return {
        type: 'session',
        summary: `Active session processed ${session.total_tokens} tokens. Last updated ${this._timeAgo(session.updated_at)}.`,
        artifacts: []
      };
    }
    if (session.status === 'cron') {
      return {
        type: 'cron',
        summary: `Scheduled task running with ${session.total_tokens} tokens processed.`,
        artifacts: []
      };
    }
    if (session.status === 'subagent') {
      return {
        type: 'task',
        summary: `Subagent task in progress. ${session.total_tokens} tokens used so far.`,
        artifacts: []
      };
    }
    return null;
  }

  _timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
    const colors = { 
      main: 'var(--clr-ok)', 
      cron: 'var(--clr-info)', 
      subagent: 'var(--clr-warn)', 
      thread: 'var(--clr-accent)' 
    };
    return `<span class="agent-status-dot" style="background:${colors[status] || 'var(--clr-muted)'}" title="${this._escAttr(status)}"></span>`;
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
    if (!agents.length) return '<cc-empty-state message="No agents match the current filter." icon="🤖" animation="none"></cc-empty-state>';
    return agents.map(a => `
      <div class="agent-card ${this._escAttr(a.status)}" data-id="${this._escAttr(a.id)}">
        <div class="agent-card-header" data-id="${this._escAttr(a.id)}" data-toggle="true">
          <span class="agent-icon">${this._esc(a.icon)}</span>
          ${this._statusDot(a.status)}
          <strong class="agent-name">${this._esc(a.name)}</strong>
          <span class="agent-channel">${this._esc(a.channel)}</span>
          <span class="agent-meta">${this._formatTokens(a.tokens?.total)} tokens · $${(a.cost || 0).toFixed(3)} · ${this._timeAgo(a.completedAt || a.startedAt)}</span>
          <span class="agent-chevron">${this._expandedId === a.id ? '▲' : '▼'}</span>
        </div>
        <p class="agent-task">${this._esc(a.task)}</p>
        ${this._expandedId === a.id ? this._renderExpanded(a) : ''}
      </div>
    `).join('');
  }

  _renderExpanded(a) {
    return `
      <div class="agent-expanded">
        <div class="agent-details">
          <p><strong>Session Key:</strong> ${this._esc(a.sessionKey)}</p>
          <p><strong>Model:</strong> ${this._esc(a.model)}</p>
          <p><strong>Runtime:</strong> ${this._formatRuntime(a.runtime)}</p>
          <p><strong>Started:</strong> ${this._timeAgo(a.startedAt)}</p>
        </div>
        ${a.output ? `
          <div class="agent-output-type"><span class="badge">${this._esc(a.output.type)}</span></div>
          <p>${this._esc(a.output.summary)}</p>
        ` : '<p class="text-muted">Session is running...</p>'}
      </div>`;
  }

  _renderWidget() {
    const agents = this._agents.filter(a => a.status !== 'idle').slice(0, 6);
    return `<div class="cc-agents-widget">
      ${agents.map(a => `
        <div class="agent-row">
          ${this._statusDot(a.status)}
          <span class="agent-icon">${this._esc(a.icon)}</span>
          <span class="agent-name">${this._esc(a.name)}</span>
          <span class="agent-meta">${a.status} · ${this._formatTokens(a.tokens?.total)} tok</span>
        </div>
      `).join('')}
    </div>`;
  }

  _render() {
    if (this._layout === 'list') {
      this.innerHTML = `<style>${CcAgents.widgetStyles}</style><h3>🤖 Agent Fleet</h3>${this._renderList()}`;
      return;
    }

    const cost = this._costSummary();
    const counts = { all: this._agents.length };
    for (const a of this._agents) counts[a.status] = (counts[a.status] || 0) + 1;

    this.innerHTML = `
      <style>${CcAgents.styles}</style>
      <section class="cc-agents-page">
        <div class="agents-toolbar">
          <h2>🤖 Agent Fleet Manager <span class="live-indicator">● LIVE</span></h2>
          <button class="btn-refresh" onclick="this.closest('cc-agents')._load()" title="Refresh Now">↻</button>
        </div>

        <div class="cost-bar">
          <span>Today: <strong>${this._formatTokens(cost.dayTokens)}</strong> tokens · <strong>$${cost.dayCost.toFixed(2)}</strong></span>
          <span>This week: <strong>${this._formatTokens(cost.weekTokens)}</strong> tokens · <strong>$${cost.weekCost.toFixed(2)}</strong></span>
          <span class="refresh-status">Last refresh: ${new Date().toLocaleTimeString()}</span>
        </div>

        <div class="filter-row">
          <cc-pill-dropdown label="Status" items='${this._escAttr(JSON.stringify(['all', 'main', 'cron', 'subagent', 'thread'].map(f => ({value: f, label: `${f} ${counts[f] || 0}`}))))}' value="${this._escAttr(this._filter)}"></cc-pill-dropdown>
          <cc-pill-dropdown label="Sort" items='[{"value":"newest","label":"Newest"},{"value":"cost","label":"Cost"},{"value":"tokens","label":"Tokens"}]' value="${this._escAttr(this._sort)}"></cc-pill-dropdown>
        </div>

        <div class="agents-list">
          ${this._renderList()}
        </div>
      </section>
    `;
    // Bind shared component events
    const dropdowns = this.querySelectorAll('cc-pill-dropdown');
    if (dropdowns[0]) dropdowns[0].addEventListener('dropdown-change', e => { this._filter = e.detail.value; this._render(); });
    if (dropdowns[1]) dropdowns[1].addEventListener('dropdown-change', e => { this._sort = e.detail.value; this._render(); });

  }
  _toggle(id) { this._expandedId = this._expandedId === id ? null : id; this._render(); }

  static widgetStyles = `
    .cc-agents-widget { display:flex; flex-direction:column; gap:var(--sp-1); }
    .agent-row { display:flex; align-items:center; gap:var(--sp-2); padding:var(--sp-1) 0; }
    .agent-row .agent-meta { margin-left:auto; font-size:.8rem; color:var(--clr-muted); }
    .agent-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; display:inline-block; }
  `;

  static styles = `
    .cc-agents-page { max-width:960px; margin:0 auto; padding:var(--sp-4) var(--sp-3); }
    .agents-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--sp-3); }
    .agents-toolbar h2 { margin:0; display:flex; align-items:center; gap:var(--sp-2); }
    .live-indicator { font-size:.8rem; color:var(--clr-ok); animation:pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity:1; } 50% { opacity:0.5; } }
    .btn-refresh { background:none; border:1px solid var(--clr-border); border-radius:var(--radius); padding:var(--sp-1); cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .btn-refresh:hover { background:var(--clr-surface); }
    .cost-bar { display:flex; gap:var(--sp-4); padding:var(--sp-2) var(--sp-3); background:var(--clr-surface); border-radius:var(--radius); margin-bottom:var(--sp-3); font-size:.9rem; flex-wrap:wrap; }
    .cost-bar strong { color:var(--clr-accent); }
    .refresh-status { margin-left:auto; font-size:.8rem; color:var(--clr-muted); }
    .filter-row { display:flex; gap:var(--sp-2); flex-wrap:wrap; margin-bottom:var(--sp-3); align-items:center; }
    .agent-status-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; display:inline-block; }
    .agent-card { background:var(--clr-surface); border-radius:var(--radius); padding:var(--sp-3); margin-bottom:var(--sp-2); border-left:3px solid var(--clr-muted); }
    .agent-card.main { border-left-color:var(--clr-ok); }
    .agent-card.cron { border-left-color:var(--clr-info); }
    .agent-card.subagent { border-left-color:var(--clr-warn); }
    .agent-card.thread { border-left-color:var(--clr-accent); }
    .agent-card-header { display:flex; align-items:center; gap:var(--sp-2); cursor:pointer; flex-wrap:wrap; }
    .agent-icon { font-size:1.3rem; }
    .agent-name { flex:1; }
    .agent-channel { background:var(--clr-bg); padding:2px 8px; border-radius:var(--radius); font-size:.7rem; font-weight:500; text-transform:uppercase; color:var(--clr-muted); }
    .agent-meta { font-size:.8rem; color:var(--clr-muted); }
    .agent-chevron { font-size:.7rem; color:var(--clr-muted); }
    .agent-task { font-size:.85rem; color:var(--clr-muted); margin:var(--sp-1) 0 0 calc(10px + 1.3rem + var(--sp-2)*2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .agent-expanded { margin-top:var(--sp-2); padding-top:var(--sp-2); border-top:1px solid var(--clr-border); }
    .agent-expanded p { font-size:.9rem; margin:var(--sp-1) 0; }
    .agent-details { background:var(--clr-bg); padding:var(--sp-2); border-radius:var(--radius); margin:var(--sp-2) 0; }
    .agent-details p { margin:var(--sp-1) 0; font-size:.8rem; }
    .agent-output-type { margin:var(--sp-2) 0; }
    .text-muted { color:var(--clr-muted); }
    .empty-state { text-align:center; padding:var(--sp-4); color:var(--clr-muted); }
    @media(max-width:600px) {
      .cost-bar { flex-direction:column; gap:var(--sp-1); }
      .agent-card-header { flex-wrap:wrap; }
      .agent-meta { width:100%; margin-left:calc(10px + 1.3rem + var(--sp-2)*2); }
      .refresh-status { margin-left:0; width:100%; }
    }
  `;
}
customElements.define('cc-agents', CcAgents);