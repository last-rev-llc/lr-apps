// ─── Top Bar — Utility strip above app nav ────────────────
// Usage: <cc-topbar></cc-topbar>
// Styles live in theme.css (.cc-topbar-strip)
// Does NOT reference or wrap other components — fully independent.
class CcTopbar extends HTMLElement {
  connectedCallback() {
    const KEY = 'cc_auth';
    const lock = () => { localStorage.removeItem(KEY); location.reload(); };
    const PORTAL = 'https://qhx4iqfw02.execute-api.us-east-1.amazonaws.com/portal';

    this.innerHTML = `
    <div class="cc-topbar-strip">
      <a href="${window.location.pathname.startsWith('/apps/') ? '/apps/command-center/' : 'https://adam-harris.alphaclaw.app/overview'}" title="Dashboard">🏠 Dashboard</a>
      <span class="separator">|</span>
      <span id="cc-topbar-status" class="cc-topbar-status" title="Checking integrations…">⏳</span>
      <span class="separator">|</span>
      <button id="cc-topbar-debug" class="cc-topbar-debug" title="Console logs">🐛</button>
      <span class="separator">|</span>
      <button id="cc-topbar-lock" title="Lock / Logout">🔒 Lock</button>
    </div>
`;

    this.querySelector('#cc-topbar-lock').onclick = lock;
    this._initDebugCapture();

    // Check integration health
    this._checkIntegrations();
  }

  _initDebugCapture() {
    // Capture console errors/warns into a buffer
    if (!window._ccDebugLogs) {
      window._ccDebugLogs = [];
      const MAX = 200;
      const orig = { error: console.error, warn: console.warn, log: console.log };

      const capture = (level, origFn) => (...args) => {
        const msg = args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
          catch { return String(a); }
        }).join(' ');
        window._ccDebugLogs.push({ level, msg, ts: new Date().toISOString() });
        if (window._ccDebugLogs.length > MAX) window._ccDebugLogs.shift();
        origFn.apply(console, args);
        // Update badge count
        const badge = document.querySelector('.cc-debug-badge');
        const errors = window._ccDebugLogs.filter(l => l.level === 'error').length;
        if (badge) { badge.textContent = errors; badge.style.display = errors > 0 ? 'inline-block' : 'none'; }
      };

      console.error = capture('error', orig.error);
      console.warn = capture('warn', orig.warn);

      // Also catch unhandled errors
      window.addEventListener('error', (e) => {
        window._ccDebugLogs.push({ level: 'error', msg: `${e.message} (${e.filename}:${e.lineno}:${e.colno})`, ts: new Date().toISOString() });
      });
      window.addEventListener('unhandledrejection', (e) => {
        window._ccDebugLogs.push({ level: 'error', msg: `Unhandled Promise: ${e.reason}`, ts: new Date().toISOString() });
      });
    }

    const debugBtn = this.querySelector('#cc-topbar-debug');
    // Add error count badge
    const badgeEl = document.createElement('span');
    badgeEl.className = 'cc-debug-badge';
    debugBtn.style.position = 'relative';
    debugBtn.appendChild(badgeEl);

    debugBtn.addEventListener('click', () => this._showDebugModal());
  }

  _showDebugModal() {
    const logs = window._ccDebugLogs || [];
    let modal = document.querySelector('#cc-debug-modal');
    if (!modal) {
      modal = document.createElement('cc-modal');
      modal.id = 'cc-debug-modal';
      modal.setAttribute('title', '🐛 Console Logs');
      modal.setAttribute('size', 'lg');
      document.body.appendChild(modal);
    }

    const levelColor = { error: '#ef4444', warn: '#fbbf24', log: '#94a3b8' };
    const levelIcon = { error: '🔴', warn: '🟡', log: '⚪' };

    const logHtml = logs.length ? logs.slice().reverse().map(l => {
      const time = l.ts.split('T')[1].split('.')[0];
      return `<div class="cc-debug-entry">
        <span class="cc-debug-level cc-debug-level-${l.level}">${levelIcon[l.level] || '⚪'} ${l.level.toUpperCase()}</span>
        <span class="cc-debug-time">${time}</span>
        <span class="cc-debug-msg">${this._escDebug(l.msg)}</span>
      </div>`;
    }).join('') : '<div class="cc-debug-empty">No logs captured yet</div>';

    const errorCount = logs.filter(l => l.level === 'error').length;
    const warnCount = logs.filter(l => l.level === 'warn').length;

    modal.innerHTML = `
      <div class="cc-debug-toolbar">
        <span class="cc-debug-stat">${logs.length} logs</span>
        ${errorCount ? `<span class="cc-debug-stat-error">🔴 ${errorCount} errors</span>` : ''}
        ${warnCount ? `<span class="cc-debug-stat-warn">🟡 ${warnCount} warnings</span>` : ''}
        <button onclick="navigator.clipboard.writeText(JSON.stringify(window._ccDebugLogs,null,2));window.showToast&&window.showToast('📋 Logs copied!',2000)" class="cc-debug-btn">📋 Copy All</button>
        <button onclick="window._ccDebugLogs=[];document.querySelector('#cc-debug-modal').innerHTML='<div class=cc-debug-empty>Cleared</div>';document.querySelector('.cc-debug-badge').style.display='none'" class="cc-debug-btn-muted">🗑 Clear</button>
      </div>
      <div class="cc-debug-scroll">${logHtml}</div>`;
    modal.open();
  }

  _escDebug(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  async _checkIntegrations() {
    const statusEl = this.querySelector('#cc-topbar-status');

    try {
      const statusUrl = window.location.pathname.startsWith('/apps/')
        ? '/apps/command-center/data/integration-status.json'
        : 'https://command-center.adam-harris.alphaclaw.app/data/integration-status.json';
      const res = await fetch(statusUrl);
      if (!res.ok) throw new Error('No status file');
      const integrations = await res.json();

      const issues = integrations.filter(i => i.status !== 'ok');
      if (issues.length === 0) {
        statusEl.textContent = '✅';
        statusEl.title = 'All integrations healthy';
        statusEl.style.cursor = 'default';
        return;
      }

      statusEl.textContent = '⚠️';
      statusEl.title = `${issues.length} integration${issues.length > 1 ? 's' : ''} need attention`;
      statusEl.classList.add('cc-topbar-status-warn');
      statusEl.style.cursor = 'pointer';

      const listHtml = integrations.map(i => {
        const dot = i.status === 'ok' ? '🟢' : i.status === 'expired' ? '🔴' : '🟡';
        const action = i.status !== 'ok' ? ` <a href="${PORTAL}" target="_blank" rel="noopener" class="cc-topbar-reconnect">Reconnect →</a>` : '';
        return `<div class="cc-topbar-integration">${dot} <strong>${i.name}</strong> <span class="cc-topbar-int-detail">${i.message || i.status}</span>${action}</div>`;
      }).join('');

      statusEl.addEventListener('click', () => {
        // Use cc-modal if available, otherwise fallback
        let modal = document.querySelector('#cc-topbar-int-modal');
        if (!modal) {
          modal = document.createElement('cc-modal');
          modal.id = 'cc-topbar-int-modal';
          modal.setAttribute('title', 'Integration Status');
          modal.setAttribute('size', 'sm');
          document.body.appendChild(modal);
        }
        modal.innerHTML = listHtml;
        modal.open();
      });
    } catch (e) {
      // No status file — show neutral
      statusEl.textContent = '🔗';
      statusEl.title = 'Integration status unavailable';
    }
  }
}
customElements.define('cc-topbar', CcTopbar);
