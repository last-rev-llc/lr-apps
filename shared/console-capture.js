/* ── Console Capture ─────────────────────────────────────────
   Tiny script that hooks console.log/warn/error/info and
   window.onerror / unhandledrejection, then posts entries
   to the app_console_logs Supabase table.

   Usage:
     <script src="https://shared.adam-harris.alphaclaw.app/console-capture.js"
             data-app="my-app-slug"></script>

   Reads supabase-url and supabase-key from <meta> tags.
*/
(function () {
  if (window.__ccCapture) return;
  window.__ccCapture = true;

  const tag = document.currentScript;
  const appSlug = tag?.getAttribute('data-app') ||
    location.hostname.split('.')[0] || 'unknown';

  const sbUrl = document.querySelector('meta[name="supabase-url"]')?.content;
  const sbKey = document.querySelector('meta[name="supabase-key"]')?.content;
  if (!sbUrl || !sbKey) return;

  const endpoint = sbUrl.replace(/\/$/, '') + '/rest/v1/app_console_logs';
  const headers = {
    'apikey': sbKey,
    'Authorization': 'Bearer ' + sbKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  const queue = [];
  let flushing = false;

  function send(level, message, stack) {
    if (!message || message.length === 0) return;
    // Don't capture our own fetch errors
    if (typeof message === 'string' && message.includes('app_console_logs')) return;
    queue.push({
      app_slug: appSlug,
      page_url: location.pathname,
      level: level,
      message: String(message).slice(0, 4000),
      stack: stack ? String(stack).slice(0, 4000) : null,
      user_agent: navigator.userAgent
    });
    flush();
  }

  function flush() {
    if (flushing || !queue.length) return;
    flushing = true;
    const batch = queue.splice(0, 20);
    fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(batch)
    }).catch(() => {}).finally(() => { flushing = false; if (queue.length) flush(); });
  }

  // Hook console methods
  ['log', 'info', 'warn', 'error'].forEach(level => {
    const orig = console[level];
    console[level] = function (...args) {
      orig.apply(console, args);
      const msg = args.map(a =>
        typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
      ).join(' ');
      const stack = (level === 'error' && args[0] instanceof Error) ? args[0].stack : null;
      send(level, msg, stack);
    };
  });

  // Global error handler
  window.addEventListener('error', e => {
    send('error', e.message || String(e), e.error?.stack || `${e.filename}:${e.lineno}:${e.colno}`);
  });

  window.addEventListener('unhandledrejection', e => {
    const reason = e.reason;
    const msg = reason?.message || String(reason);
    send('error', 'Unhandled Promise: ' + msg, reason?.stack);
  });
})();
