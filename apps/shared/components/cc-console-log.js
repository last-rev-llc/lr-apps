/* ── <cc-console-log> ────────────────────────────────────────
   Real-time console log viewer component.
   Displays entries from app_console_logs Supabase table.

   Usage:
     <cc-console-log app="daily-updates"></cc-console-log>

   Attributes:
     app   — app_slug to filter by (required)
     poll  — polling interval in ms (default 4000)
*/
class CcConsoleLog extends HTMLElement {
  connectedCallback() {
    this.appSlug = this.getAttribute('app') || location.hostname.split('.')[0];
    this.pollMs = parseInt(this.getAttribute('poll')) || 4000;
    this.entries = [];
    this.filter = 'all';
    this.search = '';
    this.autoScroll = true;
    this.lastId = null;

    const sbUrl = document.querySelector('meta[name="supabase-url"]')?.content;
    const sbKey = document.querySelector('meta[name="supabase-key"]')?.content;
    if (!sbUrl || !sbKey) { this.innerHTML = '<p style="color:var(--muted)">Supabase not configured.</p>'; return; }
    this.endpoint = sbUrl.replace(/\/$/, '') + '/rest/v1/app_console_logs';
    this.headers = { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey, 'Content-Type': 'application/json' };

    this.render();
    this.load();
    this._interval = setInterval(() => this.poll(), this.pollMs);
  }

  disconnectedCallback() { clearInterval(this._interval); }

  render() {
    this.innerHTML = `
      <style>
        cc-console-log { display:block; }
        .ccl-toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
        .ccl-toolbar button, .ccl-toolbar select { background:var(--card); border:1px solid var(--border);
          color:var(--heading); padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px; }
        .ccl-toolbar button:hover { border-color:var(--accent); }
        .ccl-toolbar button.active { background:var(--accent); color:#000; }
        .ccl-toolbar input { flex:1; min-width:140px; background:var(--card); border:1px solid var(--border);
          color:var(--heading); padding:6px 10px; border-radius:6px; font-size:13px; }
        .ccl-feed { background:var(--card); border:1px solid var(--border); border-radius:8px;
          max-height:70vh; overflow-y:auto; font-family:'SF Mono',Monaco,Consolas,monospace; font-size:12px;
          padding:0; }
        .ccl-entry { padding:6px 12px; border-bottom:1px solid var(--border); display:flex; gap:8px; align-items:flex-start; }
        .ccl-entry:last-child { border-bottom:none; }
        .ccl-time { color:var(--muted); white-space:nowrap; min-width:70px; flex-shrink:0; }
        .ccl-level { font-weight:700; text-transform:uppercase; min-width:44px; flex-shrink:0; font-size:11px; }
        .ccl-msg { white-space:pre-wrap; word-break:break-all; flex:1; }
        .ccl-page { color:var(--muted); font-size:10px; margin-left:auto; flex-shrink:0; }
        .ccl-stack { color:var(--muted); font-size:11px; margin-top:2px; white-space:pre-wrap; opacity:.7; }
        .ccl-entry.log .ccl-level { color:#8b8b8b; } .ccl-entry.log .ccl-msg { color:#c0c0c0; }
        .ccl-entry.info .ccl-level { color:#60a5fa; } .ccl-entry.info .ccl-msg { color:#93c5fd; }
        .ccl-entry.warn .ccl-level { color:#fbbf24; } .ccl-entry.warn .ccl-msg { color:#fde68a; }
        .ccl-entry.error .ccl-level { color:#f87171; } .ccl-entry.error .ccl-msg { color:#fca5a5; }
        .ccl-empty { padding:40px; text-align:center; color:var(--muted); }
        .ccl-status { font-size:11px; color:var(--muted); margin-top:6px; display:flex; justify-content:space-between; }
      </style>
      <div class="ccl-toolbar">
        <button data-f="all" class="active">All</button>
        <button data-f="error">🔴 Error</button>
        <button data-f="warn">🟡 Warn</button>
        <button data-f="info">🔵 Info</button>
        <button data-f="log">⚪ Log</button>
        <input type="text" placeholder="Search logs…" class="ccl-search">
        <button class="ccl-clear">🗑 Clear</button>
      </div>
      <div class="ccl-feed"></div>
      <div class="ccl-status"><span class="ccl-count"></span><span class="ccl-scroll-status"></span></div>
    `;

    // Filter buttons
    this.querySelectorAll('[data-f]').forEach(btn => {
      btn.onclick = () => {
        this.querySelectorAll('[data-f]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.f;
        this.renderEntries();
      };
    });

    // Search
    this.querySelector('.ccl-search').oninput = e => { this.search = e.target.value.toLowerCase(); this.renderEntries(); };

    // Clear
    this.querySelector('.ccl-clear').onclick = () => this.clearLogs();

    // Auto-scroll pause
    const feed = this.querySelector('.ccl-feed');
    feed.onscroll = () => {
      this.autoScroll = (feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 40;
      this.querySelector('.ccl-scroll-status').textContent = this.autoScroll ? '' : '⏸ scroll paused';
    };
  }

  filtered() {
    return this.entries.filter(e =>
      (this.filter === 'all' || e.level === this.filter) &&
      (!this.search || e.message.toLowerCase().includes(this.search) || (e.page_url || '').toLowerCase().includes(this.search))
    );
  }

  renderEntries() {
    const feed = this.querySelector('.ccl-feed');
    const rows = this.filtered();
    if (!rows.length) {
      feed.innerHTML = '<div class="ccl-empty">No console entries yet. Errors and logs from ' + this.appSlug + ' will appear here in real-time.</div>';
    } else {
      feed.innerHTML = rows.map(e => {
        const t = new Date(e.created_at);
        const ts = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `<div class="ccl-entry ${e.level}">
          <span class="ccl-time">${ts}</span>
          <span class="ccl-level">${e.level}</span>
          <span class="ccl-msg">${this.esc(e.message)}${e.stack ? '\n<span class="ccl-stack">' + this.esc(e.stack) + '</span>' : ''}</span>
          <span class="ccl-page">${this.esc(e.page_url || '')}</span>
        </div>`;
      }).join('');
    }
    this.querySelector('.ccl-count').textContent = rows.length + ' entries';
    if (this.autoScroll) feed.scrollTop = feed.scrollHeight;
  }

  esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async load() {
    try {
      const url = `${this.endpoint}?app_slug=eq.${this.appSlug}&order=created_at.asc&limit=500`;
      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) throw new Error(res.statusText);
      this.entries = await res.json();
      if (this.entries.length) this.lastId = this.entries[this.entries.length - 1].id;
      this.renderEntries();
    } catch (e) {
      this.querySelector('.ccl-feed').innerHTML = '<div class="ccl-empty">Error loading logs: ' + e.message + '</div>';
    }
  }

  async poll() {
    try {
      let url = `${this.endpoint}?app_slug=eq.${this.appSlug}&order=created_at.asc&limit=100`;
      if (this.entries.length) {
        const lastTime = this.entries[this.entries.length - 1].created_at;
        url += `&created_at=gt.${lastTime}`;
      }
      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return;
      const rows = await res.json();
      if (rows.length) {
        this.entries.push(...rows);
        // Keep max 1000 entries in memory
        if (this.entries.length > 1000) this.entries = this.entries.slice(-1000);
        this.renderEntries();
      }
    } catch (e) { /* silent */ }
  }

  async clearLogs() {
    if (!confirm('Clear all logs for ' + this.appSlug + '?')) return;
    try {
      await fetch(`${this.endpoint}?app_slug=eq.${this.appSlug}`, {
        method: 'DELETE', headers: this.headers
      });
      this.entries = [];
      this.renderEntries();
    } catch (e) { alert('Failed to clear: ' + e.message); }
  }
}

customElements.define('cc-console-log', CcConsoleLog);
