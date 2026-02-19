/* <cc-dev-toolbar> — Floating developer toolbar with Edit Mode + Console Logs
   A shared component wrapping the edit-mode toggle and console-log viewer.
   Uses Lucide SVG icons. Logs button shows a live error count badge and
   opens a modal overlay (no page navigation).

   Usage: Automatically rendered by <cc-app-nav>. No manual placement needed.
   Can also be used standalone:
     <cc-dev-toolbar app="my-app"></cc-dev-toolbar>

   Attributes:
     app  — app slug for filtering console logs (required)
*/
(function () {
  // ── Lucide SVG icons (inline, no CDN dependency) ──
  const ICON_PENCIL = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`;
  const ICON_BUG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>`;
  const ICON_CHART = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`;
  const ICON_LIGHTBULB = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
  const ICON_GITHUB = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`;

  const SUPABASE_URL_FALLBACK = 'https://lregiwsovpmljxjvrrsc.supabase.co';
  const SUPABASE_KEY_FALLBACK = 'sb_publishable_HPinRWPrX97uxshGM0u1rw_UAsQsyFq';

  class CcDevToolbar extends HTMLElement {
    connectedCallback() {
      // Only show on alphaclaw.app domains (dev/staging) — never on production
      if (!location.hostname.endsWith('.alphaclaw.app') && !location.hostname.includes('localhost')) {
        this.style.display = 'none';
        return;
      }
      this.appSlug = this.getAttribute('app') || location.hostname.split('.')[0];
      this.errorCount = 0;
      this._modalOpen = false;
      this._logEntries = [];
      this._logFilter = 'all';
      this._logSearch = '';

      const sbUrlMeta = document.querySelector('meta[name="supabase-url"]');
      const sbKeyMeta = document.querySelector('meta[name="supabase-key"]');
      this._sbUrl = (sbUrlMeta?.content || SUPABASE_URL_FALLBACK).replace(/\/$/, '');
      this._sbKey = sbKeyMeta?.content || SUPABASE_KEY_FALLBACK;
      this._headers = { 'apikey': this._sbKey, 'Authorization': `Bearer ${this._sbKey}`, 'Content-Type': 'application/json' };

      this._injectStyles();
      this._render();
      this._pollErrors();
      this._errorPollInterval = setInterval(() => this._pollErrors(), 8000);
    }

    disconnectedCallback() {
      clearInterval(this._errorPollInterval);
    }

    _injectStyles() {
      if (document.getElementById('cc-dev-toolbar-styles')) return;
      const style = document.createElement('style');
      style.id = 'cc-dev-toolbar-styles';
      style.textContent = `
        cc-dev-toolbar {
          position: fixed; bottom: 20px; left: 20px; z-index: 1000;
          display: flex; flex-direction: column; gap: 12px;
        }
        .cc-dt-fab {
          width: 52px; height: 52px; border-radius: 16px; border: 1px solid var(--border, #333);
          background: var(--card-bg, #1e1e2e); color: var(--text, #e0e0e0);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,.4); transition: all .2s; text-decoration: none;
          position: relative;
        }
        .cc-dt-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(0,0,0,.5);
          background: var(--hover-bg, rgba(255,255,255,.08));
        }
        .cc-dt-fab.cc-dt-edit-active {
          background: linear-gradient(135deg, rgba(168,85,247,.35), rgba(99,102,241,.35)) !important;
          border-color: rgba(168,85,247,.5);
          box-shadow: 0 4px 20px rgba(168,85,247,.3);
        }
        .cc-dt-fab.cc-dt-logs-active {
          background: linear-gradient(135deg, rgba(239,68,68,.25), rgba(220,38,38,.25)) !important;
          border-color: rgba(239,68,68,.5);
          box-shadow: 0 4px 20px rgba(239,68,68,.3);
        }
        .cc-dt-badge {
          position: absolute; top: -6px; right: -6px;
          min-width: 20px; height: 20px; border-radius: 10px;
          background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 5px; box-shadow: 0 2px 8px rgba(239,68,68,.5);
          pointer-events: none; transition: transform .2s;
        }
        .cc-dt-badge.hidden { display: none; }
        .cc-dt-badge.pulse { animation: cc-dt-pulse .6s ease; }
        .cc-dt-gh-wrap { position: relative; }
        .cc-dt-gh-menu {
          display: none; position: absolute; bottom: 100%; left: 0; margin-bottom: 8px;
          background: var(--card-bg, #1e1e2e); border: 1px solid var(--border, #333);
          border-radius: 8px; padding: 4px 0; min-width: 120px; z-index: 10001;
          box-shadow: 0 8px 24px rgba(0,0,0,.5);
        }
        .cc-dt-gh-wrap.open .cc-dt-gh-menu { display: block; }
        .cc-dt-gh-menu a {
          display: block; padding: 8px 14px; color: var(--text, #e0e0e0);
          text-decoration: none; font-size: .8rem; white-space: nowrap;
        }
        .cc-dt-gh-menu a:hover { background: var(--hover-bg, rgba(255,255,255,.08)); }
        @keyframes cc-dt-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }

        /* ── Logs Modal ── */
        .cc-dt-modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 10000;
          opacity: 0; pointer-events: none; transition: opacity .25s;
        }
        .cc-dt-modal-backdrop.open { opacity: 1; pointer-events: auto; }
        .cc-dt-modal {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(.95);
          width: 800px; max-width: 92vw; max-height: 80vh;
          background: var(--card-bg, #1a1a2e); border: 1px solid var(--border, #333);
          border-radius: 16px; z-index: 10001; display: flex; flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,.6);
          opacity: 0; pointer-events: none; transition: all .25s cubic-bezier(.4,0,.2,1);
        }
        .cc-dt-modal.open { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
        .cc-dt-modal-header {
          padding: 16px 20px; border-bottom: 1px solid var(--border, #333);
          display: flex; align-items: center; justify-content: space-between;
        }
        .cc-dt-modal-header h3 { margin: 0; font-size: 1rem; color: var(--text, #e0e0e0); display: flex; align-items: center; gap: 8px; }
        .cc-dt-modal-close {
          background: none; border: none; color: var(--text-muted, #888);
          font-size: 1.3rem; cursor: pointer; padding: 4px 8px; border-radius: 6px;
          line-height: 1;
        }
        .cc-dt-modal-close:hover { background: rgba(255,255,255,.08); }
        .cc-dt-modal-toolbar {
          padding: 12px 20px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
          border-bottom: 1px solid var(--border, #333);
        }
        .cc-dt-modal-toolbar button {
          background: var(--card-bg, #1e1e2e); border: 1px solid var(--border, #333);
          color: var(--text, #e0e0e0); padding: 5px 12px; border-radius: 6px;
          cursor: pointer; font-size: 12px; transition: all .15s;
        }
        .cc-dt-modal-toolbar button:hover { border-color: var(--accent, #a855f7); }
        .cc-dt-modal-toolbar button.active { background: var(--accent, #a855f7); color: #000; border-color: var(--accent, #a855f7); }
        .cc-dt-modal-toolbar input {
          flex: 1; min-width: 120px; background: var(--input-bg, #12121e);
          border: 1px solid var(--border, #333); color: var(--text, #e0e0e0);
          padding: 5px 10px; border-radius: 6px; font-size: 12px;
        }
        .cc-dt-modal-feed {
          flex: 1; overflow-y: auto; font-family: 'SF Mono', Monaco, Consolas, monospace;
          font-size: 12px; padding: 0;
        }
        .cc-dt-log-entry {
          padding: 6px 14px; border-bottom: 1px solid rgba(255,255,255,.04);
          display: flex; gap: 8px; align-items: flex-start;
        }
        .cc-dt-log-entry:last-child { border-bottom: none; }
        .cc-dt-log-time { color: var(--text-muted, #666); white-space: nowrap; min-width: 72px; flex-shrink: 0; }
        .cc-dt-log-level { font-weight: 700; text-transform: uppercase; min-width: 44px; flex-shrink: 0; font-size: 11px; }
        .cc-dt-log-msg { white-space: pre-wrap; word-break: break-all; flex: 1; }
        .cc-dt-log-stack { color: var(--text-muted, #666); font-size: 11px; margin-top: 2px; white-space: pre-wrap; opacity: .7; }
        .cc-dt-log-entry.error .cc-dt-log-level { color: #f87171; }
        .cc-dt-log-entry.error .cc-dt-log-msg { color: #fca5a5; }
        .cc-dt-log-entry.warn .cc-dt-log-level { color: #fbbf24; }
        .cc-dt-log-entry.warn .cc-dt-log-msg { color: #fde68a; }
        .cc-dt-log-entry.info .cc-dt-log-level { color: #60a5fa; }
        .cc-dt-log-entry.info .cc-dt-log-msg { color: #93c5fd; }
        .cc-dt-log-entry.log .cc-dt-log-level { color: #8b8b8b; }
        .cc-dt-log-entry.log .cc-dt-log-msg { color: #c0c0c0; }
        .cc-dt-log-empty { padding: 40px; text-align: center; color: var(--text-muted, #888); }
        .cc-dt-modal-footer {
          padding: 8px 20px; border-top: 1px solid var(--border, #333);
          font-size: 11px; color: var(--text-muted, #666);
          display: flex; justify-content: space-between;
        }
        .cc-dt-fab.cc-dt-ideas-active {
          background: linear-gradient(135deg, rgba(250,204,21,.3), rgba(234,179,8,.3)) !important;
          border-color: rgba(250,204,21,.5);
          box-shadow: 0 4px 20px rgba(250,204,21,.3);
        }
        .cc-dt-fab.cc-dt-analytics-active {
          background: linear-gradient(135deg, rgba(59,130,246,.3), rgba(37,99,235,.3)) !important;
          border-color: rgba(59,130,246,.5);
          box-shadow: 0 4px 20px rgba(59,130,246,.3);
        }

        /* Analytics modal styles */
        .cc-analytics-tabs { display: flex; gap: 4px; padding: 12px 20px; border-bottom: 1px solid var(--border, #333); }
        .cc-analytics-tab {
          background: transparent; border: 1px solid var(--border, #333); color: var(--text-muted, #888);
          padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all .15s;
        }
        .cc-analytics-tab:hover { border-color: rgba(59,130,246,.5); color: var(--text, #e0e0e0); }
        .cc-analytics-tab.active { background: rgba(59,130,246,.15); border-color: rgba(59,130,246,.5); color: #60a5fa; }
        .cc-analytics-body { flex: 1; overflow-y: auto; padding: 20px; }
        .cc-analytics-loading { text-align: center; padding: 40px; color: var(--text-muted, #888); }

        .cc-stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .cc-stat-box {
          background: rgba(255,255,255,.04); border: 1px solid var(--border, #333); border-radius: 12px;
          padding: 14px; text-align: center; transition: border-color .15s;
        }
        .cc-stat-box:hover { border-color: rgba(59,130,246,.3); }
        .cc-stat-value { font-size: 24px; font-weight: 800; color: var(--text, #e0e0e0); }
        .cc-stat-value.positive { color: #4ade80; }
        .cc-stat-value.negative { color: #f87171; }
        .cc-stat-label { font-size: 11px; color: var(--text-muted, #888); text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }

        .cc-analytics-section { margin-bottom: 24px; }
        .cc-analytics-section h4 {
          font-size: 12px; color: var(--text-muted, #888); text-transform: uppercase;
          letter-spacing: 1px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border, #333);
        }
        .cc-page-row {
          display: flex; align-items: center; gap: 12px; padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,.03); font-size: 13px;
        }
        .cc-page-row:last-child { border-bottom: none; }
        .cc-page-path { flex: 1; color: var(--text, #e0e0e0); font-family: monospace; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cc-page-path.current { color: #60a5fa; font-weight: 600; }
        .cc-page-stat { color: var(--text-muted, #888); font-size: 12px; min-width: 60px; text-align: right; }
        .cc-page-bar { height: 4px; border-radius: 2px; background: rgba(59,130,246,.3); min-width: 20px; max-width: 120px; transition: width .3s; }

        .cc-channel-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; font-size: 13px; }
        .cc-channel-name { flex: 1; color: var(--text, #e0e0e0); }
        .cc-channel-val { color: var(--text-muted, #888); font-size: 12px; min-width: 50px; text-align: right; }

        .cc-analytics-empty { text-align: center; padding: 40px; color: var(--text-muted, #666); font-size: 13px; }
        .cc-wow-badge {
          display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600;
          padding: 2px 8px; border-radius: 10px;
        }
        .cc-wow-badge.up { background: rgba(74,222,128,.12); color: #4ade80; }
        .cc-wow-badge.down { background: rgba(248,113,113,.12); color: #f87171; }
      `;
      document.head.appendChild(style);
    }

    _render() {
      this.innerHTML = `
        <button class="cc-dt-fab cc-dt-edit" aria-label="Edit Mode" title="Toggle Edit Mode">${ICON_PENCIL}</button>
        <button class="cc-dt-fab cc-dt-ideas" aria-label="Ideas" title="Blog &amp; Site Ideas">${ICON_LIGHTBULB}</button>
        <button class="cc-dt-fab cc-dt-analytics" aria-label="Analytics" title="Page Analytics">${ICON_CHART}</button>
        <button class="cc-dt-fab cc-dt-logs" aria-label="Console Logs" title="Console Logs">
          ${ICON_BUG}
          <span class="cc-dt-badge hidden">0</span>
        </button>
        <div class="cc-dt-gh-wrap">
          <button class="cc-dt-fab cc-dt-github" aria-label="GitHub" title="GitHub">${ICON_GITHUB}</button>
          <div class="cc-dt-gh-menu">
            <a href="https://github.com/${this._getRepo()}" target="_blank" rel="noopener">Repo</a>
            <a href="https://github.com/${this._getRepo()}/pulls" target="_blank" rel="noopener">PRs</a>
            <a href="https://github.com/${this._getRepo()}/issues" target="_blank" rel="noopener">Issues</a>
            <a href="https://github.com/${this._getRepo()}/actions" target="_blank" rel="noopener">Actions</a>
          </div>
        </div>
      `;

      // Edit mode toggle — wait for cc-edit-mode.js if not loaded yet
      this.querySelector('.cc-dt-edit').addEventListener('click', () => {
        const btn = this.querySelector('.cc-dt-edit');
        const activate = () => {
          if (window.__ccEditMode) {
            window.__ccEditMode.toggle();
            btn.classList.toggle('cc-dt-edit-active', window.__ccEditMode.active);
          }
        };
        if (window.__ccEditMode) {
          activate();
        } else {
          // Poll briefly for cc-edit-mode to finish loading
          let attempts = 0;
          const poll = setInterval(() => {
            attempts++;
            if (window.__ccEditMode) { clearInterval(poll); activate(); }
            else if (attempts > 20) { clearInterval(poll); console.warn('cc-edit-mode not available'); }
          }, 100);
        }
      });

      // Ideas modal toggle
      this.querySelector('.cc-dt-ideas').addEventListener('click', () => {
        if (this._ideasOpen) this._closeIdeas();
        else this._openIdeas();
      });

      // Analytics modal toggle
      this.querySelector('.cc-dt-analytics').addEventListener('click', () => {
        if (this._analyticsOpen) {
          this._closeAnalytics();
        } else {
          this._openAnalytics();
        }
      });

      // Logs modal toggle
      this.querySelector('.cc-dt-logs').addEventListener('click', () => {
        if (this._modalOpen) {
          this._closeModal();
        } else {
          this._openModal();
        }
      });

      // GitHub dropdown toggle
      const ghWrap = this.querySelector('.cc-dt-gh-wrap');
      const ghBtn = this.querySelector('.cc-dt-github');
      if (ghBtn) {
        ghBtn.addEventListener('click', (e) => { e.stopPropagation(); ghWrap.classList.toggle('open'); });
        document.addEventListener('click', () => ghWrap.classList.remove('open'));
      }
    }

    // ── Error count polling ──
    async _pollErrors() {
      try {
        const url = `${this._sbUrl}/rest/v1/app_console_logs?app_slug=eq.${this.appSlug}&level=eq.error&select=id&limit=200`;
        const res = await fetch(url, { headers: this._headers });
        if (!res.ok) return;
        const rows = await res.json();
        const count = rows.length;
        const badge = this.querySelector('.cc-dt-badge');
        if (!badge) return;

        const prev = this.errorCount;
        this.errorCount = count;
        badge.textContent = count > 99 ? '99+' : count;

        if (count > 0) {
          badge.classList.remove('hidden');
          this.querySelector('.cc-dt-logs').classList.add('cc-dt-logs-active');
          if (count > prev) {
            badge.classList.remove('pulse');
            void badge.offsetWidth; // reflow
            badge.classList.add('pulse');
          }
        } else {
          badge.classList.add('hidden');
          this.querySelector('.cc-dt-logs').classList.remove('cc-dt-logs-active');
        }
      } catch (e) { /* silent */ }
    }

    // ── Modal ──
    _openModal() {
      this._modalOpen = true;
      this.querySelector('.cc-dt-logs').classList.add('cc-dt-logs-active');

      // Create modal elements
      const backdrop = document.createElement('div');
      backdrop.className = 'cc-dt-modal-backdrop';
      backdrop.addEventListener('click', () => this._closeModal());

      const modal = document.createElement('div');
      modal.className = 'cc-dt-modal';
      modal.innerHTML = `
        <div class="cc-dt-modal-header">
          <h3>${ICON_BUG} Console Logs — ${this.appSlug}</h3>
          <button class="cc-dt-modal-close" title="Close">✕</button>
        </div>
        <div class="cc-dt-modal-toolbar">
          <button data-f="all" class="active">All</button>
          <button data-f="error">🔴 Error</button>
          <button data-f="warn">🟡 Warn</button>
          <button data-f="info">🔵 Info</button>
          <button data-f="log">⚪ Log</button>
          <input type="text" placeholder="Search logs…" class="cc-dt-log-search">
        </div>
        <div class="cc-dt-modal-feed">
          <div class="cc-dt-log-empty">Loading…</div>
        </div>
        <div class="cc-dt-modal-footer">
          <span class="cc-dt-log-count">0 entries</span>
          <span>Auto-refreshes every 5s</span>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);
      this._backdrop = backdrop;
      this._modal = modal;

      // Animate in
      requestAnimationFrame(() => {
        backdrop.classList.add('open');
        modal.classList.add('open');
      });

      // Close button
      modal.querySelector('.cc-dt-modal-close').addEventListener('click', () => this._closeModal());

      // Escape key
      this._escHandler = (e) => { if (e.key === 'Escape') this._closeModal(); };
      document.addEventListener('keydown', this._escHandler);

      // Filter buttons
      modal.querySelectorAll('[data-f]').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('[data-f]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._logFilter = btn.dataset.f;
          this._renderLogEntries();
        });
      });

      // Search
      modal.querySelector('.cc-dt-log-search').addEventListener('input', (e) => {
        this._logSearch = e.target.value.toLowerCase();
        this._renderLogEntries();
      });

      // Load logs
      this._loadLogs();
      this._logPollInterval = setInterval(() => this._pollLogs(), 5000);
    }

    _closeModal() {
      this._modalOpen = false;
      if (this._backdrop) { this._backdrop.classList.remove('open'); setTimeout(() => this._backdrop?.remove(), 300); this._backdrop = null; }
      if (this._modal) { this._modal.classList.remove('open'); setTimeout(() => this._modal?.remove(), 300); this._modal = null; }
      if (this._escHandler) { document.removeEventListener('keydown', this._escHandler); this._escHandler = null; }
      clearInterval(this._logPollInterval);

      // Update logs button state based on error count
      if (this.errorCount === 0) {
        this.querySelector('.cc-dt-logs')?.classList.remove('cc-dt-logs-active');
      }
    }

    async _loadLogs() {
      try {
        const url = `${this._sbUrl}/rest/v1/app_console_logs?app_slug=eq.${this.appSlug}&order=created_at.asc&limit=500`;
        const res = await fetch(url, { headers: this._headers });
        if (!res.ok) throw new Error(res.statusText);
        this._logEntries = await res.json();
        this._renderLogEntries();
      } catch (e) {
        const feed = this._modal?.querySelector('.cc-dt-modal-feed');
        if (feed) feed.innerHTML = `<div class="cc-dt-log-empty">Error loading logs: ${this._esc(e.message)}</div>`;
      }
    }

    async _pollLogs() {
      if (!this._logEntries.length) return;
      try {
        const lastTime = this._logEntries[this._logEntries.length - 1].created_at;
        const url = `${this._sbUrl}/rest/v1/app_console_logs?app_slug=eq.${this.appSlug}&order=created_at.asc&limit=100&created_at=gt.${lastTime}`;
        const res = await fetch(url, { headers: this._headers });
        if (!res.ok) return;
        const rows = await res.json();
        if (rows.length) {
          this._logEntries.push(...rows);
          if (this._logEntries.length > 1000) this._logEntries = this._logEntries.slice(-1000);
          this._renderLogEntries();
        }
      } catch (e) { /* silent */ }
    }

    _filteredLogs() {
      return this._logEntries.filter(e =>
        (this._logFilter === 'all' || e.level === this._logFilter) &&
        (!this._logSearch || (e.message || '').toLowerCase().includes(this._logSearch) || (e.page_url || '').toLowerCase().includes(this._logSearch))
      );
    }

    _renderLogEntries() {
      const feed = this._modal?.querySelector('.cc-dt-modal-feed');
      if (!feed) return;
      const rows = this._filteredLogs();
      const countEl = this._modal?.querySelector('.cc-dt-log-count');
      if (countEl) countEl.textContent = `${rows.length} entries`;

      if (!rows.length) {
        feed.innerHTML = `<div class="cc-dt-log-empty">No console entries yet. Errors and logs from ${this._esc(this.appSlug)} will appear here.</div>`;
        return;
      }

      feed.innerHTML = rows.map(e => {
        const t = new Date(e.created_at);
        const ts = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `<div class="cc-dt-log-entry ${e.level}">
          <span class="cc-dt-log-time">${ts}</span>
          <span class="cc-dt-log-level">${this._esc(e.level)}</span>
          <span class="cc-dt-log-msg">${this._esc(e.message)}${e.stack ? `\n<span class="cc-dt-log-stack">${this._esc(e.stack)}</span>` : ''}</span>
        </div>`;
      }).join('');

      // Auto-scroll to bottom
      feed.scrollTop = feed.scrollHeight;
    }

    // ── Ideas Modal ──
    _getRepo() {
      return this.getAttribute('repo') || `last-rev-llc/ah-${this.appSlug}`;
    }

    _openIdeas() {
      this._ideasOpen = true;
      this.querySelector('.cc-dt-ideas').classList.add('cc-dt-ideas-active');

      // Ensure cc-ideas module + dependencies are loaded
      this._ensureIdeasDeps();

      const backdrop = document.createElement('div');
      backdrop.className = 'cc-dt-modal-backdrop';
      backdrop.addEventListener('click', () => this._closeIdeas());

      const modal = document.createElement('div');
      modal.className = 'cc-dt-modal';
      modal.style.cssText = 'width:960px;max-height:88vh;';
      modal.innerHTML = `
        <div class="cc-dt-modal-header">
          <h3>${ICON_LIGHTBULB} Blog & Site Ideas</h3>
          <button class="cc-dt-modal-close" title="Close">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:0;">
          <cc-ideas app="last-rev-marketing"></cc-ideas>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);
      this._iBackdrop = backdrop;
      this._iModal = modal;

      requestAnimationFrame(() => { backdrop.classList.add('open'); modal.classList.add('open'); });

      modal.querySelector('.cc-dt-modal-close').addEventListener('click', () => this._closeIdeas());
      this._iEscHandler = (e) => { if (e.key === 'Escape') this._closeIdeas(); };
      document.addEventListener('keydown', this._iEscHandler);
    }

    _closeIdeas() {
      this._ideasOpen = false;
      this.querySelector('.cc-dt-ideas')?.classList.remove('cc-dt-ideas-active');
      if (this._iBackdrop) { this._iBackdrop.classList.remove('open'); setTimeout(() => this._iBackdrop?.remove(), 300); this._iBackdrop = null; }
      if (this._iModal) { this._iModal.classList.remove('open'); setTimeout(() => this._iModal?.remove(), 300); this._iModal = null; }
      if (this._iEscHandler) { document.removeEventListener('keydown', this._iEscHandler); this._iEscHandler = null; }
    }

    _ensureIdeasDeps() {
      const shared = 'https://shared.adam-harris.alphaclaw.app';

      // Inject Supabase meta tags if missing (needed by supabase-client.js auto-init)
      if (!document.querySelector('meta[name="supabase-url"]')) {
        const m1 = document.createElement('meta'); m1.name = 'supabase-url'; m1.content = this._sbUrl;
        const m2 = document.createElement('meta'); m2.name = 'supabase-key'; m2.content = this._sbKey;
        document.head.append(m1, m2);
      }

      // Ensure lucide icons + refreshIcons helper (cc-ideas uses data-lucide icons)
      if (!window.lucide && !document.getElementById('cc-lucide')) {
        const ls = document.createElement('script');
        ls.id = 'cc-lucide';
        ls.src = 'https://unpkg.com/lucide@0.344.0/dist/umd/lucide.min.js';
        ls.onload = () => {
          window.refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };
          window.refreshIcons();
        };
        document.head.appendChild(ls);
      }
      if (!window.refreshIcons) {
        window.refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };
      }

      // Load scripts in order: supabase-client first, then trigger, then cc-ideas
      const deps = [
        { id: 'cc-sb-client', src: `${shared}/supabase-client.js` },
        { id: 'cc-trigger', src: `${shared}/trigger.js` },
        { id: 'cc-ideas-mod', src: `${shared}/modules/cc-ideas.js` },
      ];
      deps.forEach(({ id, src }) => {
        if (document.getElementById(id)) return;
        const s = document.createElement('script');
        s.id = id; s.src = src;
        document.head.appendChild(s);
      });
      // Ensure theme css
      if (!document.querySelector('link[href*="shared.adam-harris"][href*="theme.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = `${shared}/theme.css`;
        document.head.appendChild(link);
      }
    }

    // ── Analytics Modal ──
    _openAnalytics() {
      this._analyticsOpen = true;
      this._analyticsTab = 'site';
      this.querySelector('.cc-dt-analytics').classList.add('cc-dt-analytics-active');

      const backdrop = document.createElement('div');
      backdrop.className = 'cc-dt-modal-backdrop';
      backdrop.addEventListener('click', () => this._closeAnalytics());

      const modal = document.createElement('div');
      modal.className = 'cc-dt-modal';
      modal.innerHTML = `
        <div class="cc-dt-modal-header">
          <h3>${ICON_CHART} Analytics</h3>
          <button class="cc-dt-modal-close" title="Close">✕</button>
        </div>
        <div class="cc-analytics-tabs">
          <button class="cc-analytics-tab active" data-tab="site">Site Overview</button>
          <button class="cc-analytics-tab" data-tab="section">Section</button>
          <button class="cc-analytics-tab" data-tab="page">This Page</button>
        </div>
        <div class="cc-analytics-body">
          <div class="cc-analytics-loading">Loading analytics…</div>
        </div>
        <div class="cc-dt-modal-footer">
          <span>Source: GA4 via Supabase</span>
          <span class="cc-analytics-date"></span>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);
      this._aBackdrop = backdrop;
      this._aModal = modal;

      requestAnimationFrame(() => { backdrop.classList.add('open'); modal.classList.add('open'); });

      modal.querySelector('.cc-dt-modal-close').addEventListener('click', () => this._closeAnalytics());
      this._aEscHandler = (e) => { if (e.key === 'Escape') this._closeAnalytics(); };
      document.addEventListener('keydown', this._aEscHandler);

      modal.querySelectorAll('.cc-analytics-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          modal.querySelectorAll('.cc-analytics-tab').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._analyticsTab = btn.dataset.tab;
          this._renderAnalyticsTab();
        });
      });

      this._loadAnalytics();
    }

    _closeAnalytics() {
      this._analyticsOpen = false;
      this.querySelector('.cc-dt-analytics')?.classList.remove('cc-dt-analytics-active');
      if (this._aBackdrop) { this._aBackdrop.classList.remove('open'); setTimeout(() => this._aBackdrop?.remove(), 300); this._aBackdrop = null; }
      if (this._aModal) { this._aModal.classList.remove('open'); setTimeout(() => this._aModal?.remove(), 300); this._aModal = null; }
      if (this._aEscHandler) { document.removeEventListener('keydown', this._aEscHandler); this._aEscHandler = null; }
    }

    async _loadAnalytics() {
      try {
        const url = `${this._sbUrl}/rest/v1/ga4_daily_summary?order=date.desc&limit=7`;
        const res = await fetch(url, { headers: this._headers });
        if (!res.ok) throw new Error(res.statusText);
        this._analyticsData = await res.json();

        const dateEl = this._aModal?.querySelector('.cc-analytics-date');
        if (dateEl && this._analyticsData[0]) {
          dateEl.textContent = `Latest: ${this._analyticsData[0].date}`;
        }

        this._renderAnalyticsTab();
      } catch (e) {
        const body = this._aModal?.querySelector('.cc-analytics-body');
        if (body) body.innerHTML = `<div class="cc-analytics-empty">Error loading analytics: ${this._esc(e.message)}</div>`;
      }
    }

    _renderAnalyticsTab() {
      const body = this._aModal?.querySelector('.cc-analytics-body');
      if (!body || !this._analyticsData?.length) return;

      const tab = this._analyticsTab;
      if (tab === 'site') this._renderSiteTab(body);
      else if (tab === 'section') this._renderSectionTab(body);
      else if (tab === 'page') this._renderPageTab(body);
    }

    _renderSiteTab(body) {
      const today = this._analyticsData[0];
      const yesterday = this._analyticsData[1];
      if (!today) { body.innerHTML = '<div class="cc-analytics-empty">No data available</div>'; return; }

      const wowHtml = today.wow_sessions_change != null
        ? `<span class="cc-wow-badge ${today.wow_sessions_change >= 0 ? 'up' : 'down'}">${today.wow_sessions_change >= 0 ? '↑' : '↓'} ${Math.abs(today.wow_sessions_change).toFixed(1)}% WoW</span>`
        : '';

      const channels = (today.top_channels || []).slice(0, 6);
      const maxChannelSessions = Math.max(...channels.map(c => c.sessions || 0), 1);

      body.innerHTML = `
        <div class="cc-analytics-section">
          <h4>Site-Wide · ${today.date} ${wowHtml}</h4>
          <div class="cc-stat-grid">
            <div class="cc-stat-box"><div class="cc-stat-value">${this._fmt(today.sessions)}</div><div class="cc-stat-label">Sessions</div></div>
            <div class="cc-stat-box"><div class="cc-stat-value">${this._fmt(today.total_users)}</div><div class="cc-stat-label">Users</div></div>
            <div class="cc-stat-box"><div class="cc-stat-value">${this._fmt(today.new_users)}</div><div class="cc-stat-label">New Users</div></div>
            <div class="cc-stat-box"><div class="cc-stat-value">${this._fmt(today.page_views)}</div><div class="cc-stat-label">Page Views</div></div>
            <div class="cc-stat-box"><div class="cc-stat-value">${(today.engagement_rate || 0).toFixed(1)}%</div><div class="cc-stat-label">Engagement</div></div>
            <div class="cc-stat-box"><div class="cc-stat-value">${this._fmtDuration(today.avg_session_duration)}</div><div class="cc-stat-label">Avg Duration</div></div>
          </div>
        </div>

        <div class="cc-analytics-section">
          <h4>Traffic Sources</h4>
          ${channels.map(c => `
            <div class="cc-channel-row">
              <div class="cc-channel-name">${this._esc(c.channel)}</div>
              <div class="cc-page-bar" style="width:${Math.round((c.sessions / maxChannelSessions) * 120)}px;background:rgba(59,130,246,.4)"></div>
              <div class="cc-channel-val">${c.sessions} sessions</div>
              <div class="cc-channel-val">${c.users} users</div>
            </div>
          `).join('')}
        </div>

        <div class="cc-analytics-section">
          <h4>7-Day Trend</h4>
          <div class="cc-stat-grid">
            ${this._analyticsData.slice(0, 7).map(d => `
              <div class="cc-stat-box" style="padding:10px">
                <div style="font-size:11px;color:var(--text-muted)">${d.date?.slice(5)}</div>
                <div style="font-size:18px;font-weight:700;color:var(--text)">${this._fmt(d.sessions)}</div>
                <div style="font-size:10px;color:var(--text-muted)">${this._fmt(d.page_views)} pvs</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    _renderSectionTab(body) {
      const today = this._analyticsData[0];
      if (!today?.top_pages) { body.innerHTML = '<div class="cc-analytics-empty">No page data</div>'; return; }

      // Group pages by section
      const sections = { '/': { label: 'Homepage', sessions: 0, views: 0, pages: [] } };
      const sectionMap = { '/blog': 'Blog', '/apps': 'Apps', '/ai-': 'AI Offerings', '/web-': 'Web Development', '/client': 'Client Stories' };

      (today.top_pages || []).forEach(p => {
        let sectionKey = '/';
        let sectionLabel = 'Other';
        for (const [prefix, label] of Object.entries(sectionMap)) {
          if (p.path.startsWith(prefix)) { sectionKey = prefix; sectionLabel = label; break; }
        }
        if (p.path === '/') { sectionKey = '/'; sectionLabel = 'Homepage'; }
        if (!sections[sectionKey]) sections[sectionKey] = { label: sectionLabel, sessions: 0, views: 0, pages: [] };
        sections[sectionKey].sessions += p.sessions || 0;
        sections[sectionKey].views += p.page_views || 0;
        sections[sectionKey].pages.push(p);
      });

      const maxSessions = Math.max(...Object.values(sections).map(s => s.sessions), 1);

      body.innerHTML = `
        <div class="cc-analytics-section">
          <h4>Sections · ${today.date}</h4>
          ${Object.entries(sections).filter(([,s]) => s.sessions > 0).sort((a, b) => b[1].sessions - a[1].sessions).map(([key, s]) => `
            <div style="margin-bottom:16px;">
              <div class="cc-page-row" style="font-weight:600;">
                <div class="cc-page-path" style="font-family:inherit;font-size:14px;">${this._esc(s.label)}</div>
                <div class="cc-page-bar" style="width:${Math.round((s.sessions / maxSessions) * 120)}px"></div>
                <div class="cc-page-stat">${s.sessions} sess</div>
                <div class="cc-page-stat">${s.views} pvs</div>
              </div>
              ${s.pages.slice(0, 5).map(p => `
                <div class="cc-page-row" style="padding-left:16px;">
                  <div class="cc-page-path">${this._esc(p.path)}</div>
                  <div class="cc-page-stat">${p.sessions || 0}</div>
                  <div class="cc-page-stat">${p.page_views || 0}</div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `;
    }

    _renderPageTab(body) {
      const today = this._analyticsData[0];
      if (!today?.top_pages) { body.innerHTML = '<div class="cc-analytics-empty">No page data</div>'; return; }

      const currentPath = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');

      // Find current page in data (try exact match, then partial)
      let pageData = (today.top_pages || []).find(p => p.path === currentPath);
      if (!pageData) pageData = (today.top_pages || []).find(p => currentPath.includes(p.path) || p.path.includes(currentPath));

      // 7-day history for this page
      const history = this._analyticsData.map(d => {
        const pg = (d.top_pages || []).find(p => p.path === currentPath);
        return { date: d.date, sessions: pg?.sessions || 0, views: pg?.page_views || 0 };
      });

      const allPages = (today.top_pages || []).sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
      const rank = allPages.findIndex(p => p.path === currentPath) + 1;
      const maxSessions = Math.max(...allPages.map(p => p.sessions || 0), 1);

      body.innerHTML = `
        <div class="cc-analytics-section">
          <h4>This Page · <code style="color:#60a5fa">${this._esc(currentPath)}</code></h4>
          ${pageData ? `
            <div class="cc-stat-grid">
              <div class="cc-stat-box"><div class="cc-stat-value">${pageData.sessions || 0}</div><div class="cc-stat-label">Sessions</div></div>
              <div class="cc-stat-box"><div class="cc-stat-value">${pageData.page_views || 0}</div><div class="cc-stat-label">Page Views</div></div>
              <div class="cc-stat-box"><div class="cc-stat-value">#${rank || '—'}</div><div class="cc-stat-label">Rank</div></div>
              <div class="cc-stat-box"><div class="cc-stat-value">${((pageData.sessions / (today.sessions || 1)) * 100).toFixed(1)}%</div><div class="cc-stat-label">% of Traffic</div></div>
            </div>
          ` : `<div class="cc-analytics-empty" style="padding:20px">No traffic recorded for this page today</div>`}
        </div>

        <div class="cc-analytics-section">
          <h4>7-Day History</h4>
          <div class="cc-stat-grid">
            ${history.map(h => `
              <div class="cc-stat-box" style="padding:10px">
                <div style="font-size:11px;color:var(--text-muted)">${h.date?.slice(5)}</div>
                <div style="font-size:18px;font-weight:700;color:${h.sessions > 0 ? 'var(--text)' : 'var(--text-muted)'}">${h.sessions}</div>
                <div style="font-size:10px;color:var(--text-muted)">${h.views} pvs</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="cc-analytics-section">
          <h4>All Pages Today</h4>
          ${allPages.slice(0, 15).map(p => `
            <div class="cc-page-row">
              <div class="cc-page-path ${p.path === currentPath ? 'current' : ''}">${this._esc(p.path)}</div>
              <div class="cc-page-bar" style="width:${Math.round(((p.sessions || 0) / maxSessions) * 120)}px"></div>
              <div class="cc-page-stat">${p.sessions || 0} sess</div>
              <div class="cc-page-stat">${p.page_views || 0} pvs</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    _fmt(n) { return n != null ? Number(n).toLocaleString() : '—'; }
    _fmtDuration(s) {
      if (!s) return '0s';
      const m = Math.floor(s / 60);
      const sec = Math.round(s % 60);
      return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    }

    _esc(s) {
      if (!s) return '';
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }
  }

  customElements.define('cc-dev-toolbar', CcDevToolbar);

  // Ensure the element is out of document flow IMMEDIATELY (before connectedCallback),
  // so it never affects page layout while loading.
  const earlyStyle = document.createElement('style');
  earlyStyle.textContent = 'cc-dev-toolbar { position: fixed !important; bottom: 20px; left: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 12px; pointer-events: auto; }';
  document.head.appendChild(earlyStyle);
})();
