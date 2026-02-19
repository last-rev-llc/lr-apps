class CcQueueSummary extends HTMLElement {
  connectedCallback() {
    this._items = [];
    this._loading = true;
    this._render();
    this._load();
    this._interval = setInterval(() => { if (document.hasFocus()) this._load(); }, 10000);
  }

  disconnectedCallback() {
    if (this._interval) clearInterval(this._interval);
  }

  async _load() {
    try {
      const sb = window.supabase;
      if (!sb) { setTimeout(() => this._load(), 500); return; }
      const data = await sb.select('trigger_queue', {
        order: 'created_at.asc',
        limit: 50,
        filters: { or: '(status.eq.pending,status.eq.processing)' }
      });
      // fallback: if filters not supported, filter client-side
      this._items = (data || []).filter(x => x.status === 'pending' || x.status === 'processing');
      this._loading = false;
      this._render();
    } catch (e) {
      console.error('Queue summary load error:', e);
      this._loading = false;
      this._render();
    }
  }

  _statusIcon(status) {
    if (status === 'processing') return `<span class="qs-dot qs-dot-processing" title="Processing"></span>`;
    return `<span class="qs-dot qs-dot-pending" title="Pending"></span>`;
  }

  _timeAgo(iso) {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60000) return 'now';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`;
    return `${Math.floor(ms / 86400000)}d`;
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  _truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : s || ''; }

  _render() {
    const items = this._items.slice(0, 5);
    const pendingCount = this._items.filter(x => x.status === 'pending').length;
    const processingCount = this._items.filter(x => x.status === 'processing').length;

    let body;
    if (this._loading) {
      body = '<div class="qs-empty">Loading…</div>';
    } else if (!items.length) {
      body = '<div class="qs-empty"><i data-lucide="check-circle" style="width:20px;height:20px;color:#4ade80;vertical-align:middle"></i> Queue clear</div>';
    } else {
      body = `<div class="qs-list">${items.map(x => `
        <div class="qs-row">
          ${this._statusIcon(x.status)}
          <span class="qs-msg">${this._esc(this._truncate(x.message, 80))}</span>
          <span class="qs-time">${this._timeAgo(x.created_at)}</span>
        </div>
      `).join('')}</div>`;
      if (this._items.length > 5) {
        body += `<div class="qs-more">+${this._items.length - 5} more</div>`;
      }
    }

    const badge = (pendingCount + processingCount) > 0
      ? `<span class="qs-badge">${pendingCount + processingCount}</span>`
      : '';

    this.innerHTML = `
      <style>
        cc-queue-summary { display:block; }
        .qs-list { display:flex; flex-direction:column; gap:4px; }
        .qs-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border); }
        .qs-row:last-child { border-bottom:none; }
        .qs-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .qs-dot-pending { background:#f59e0b; box-shadow:0 0 6px rgba(245,158,11,.4); }
        .qs-dot-processing { background:#38bdf8; box-shadow:0 0 6px rgba(56,189,248,.4); animation:qs-pulse 1.5s ease-in-out infinite; }
        @keyframes qs-pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        .qs-msg { flex:1; font-size:12px; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
        .qs-time { font-size:11px; color:var(--muted); flex-shrink:0; }
        .qs-empty { text-align:center; padding:16px 0; color:var(--muted); font-size:13px; }
        .qs-more { font-size:11px; color:var(--muted); text-align:center; padding:4px 0; }
        .qs-badge { background:var(--accent); color:#000; font-size:11px; font-weight:700; padding:1px 7px; border-radius:10px; margin-left:6px; }
      </style>
      <div class="panel">
        <div class="panel-header">
          <i data-lucide="list-ordered"></i> Queue ${badge}
          <a href="https://cc-crons.adam-harris.alphaclaw.app/queue.html" style="margin-left:auto;font-size:12px;color:var(--accent);text-decoration:none">View All →</a>
        </div>
        ${body}
      </div>
    `;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-queue-summary', CcQueueSummary);
