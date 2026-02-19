// ─── Helper: detect current page for nav highlighting ─────
window.CC = window.CC || {};
CC.detectPage = () => {
  const path = location.pathname;
  if (path.includes('gallery')) return 'gallery';
  if (path.includes('recipes')) return 'recipes';
  if (path.includes('community')) return 'community';
  return 'dashboard';
};

// ─── Toast queue (ensures showToast works before cc-toast registers) ──
if (!window.showToast) {
  window._toastQueue = [];
  window.showToast = (msg, dur) => window._toastQueue.push([msg, dur]);
}

// ─── URL filter state (deep linking without history changes) ──
CC.getParams = () => Object.fromEntries(new URLSearchParams(location.search));
CC.setParams = (obj) => {
  const params = new URLSearchParams(location.search);
  Object.entries(obj).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '' || v === 'All' || v === 'all' || v === false) {
      params.delete(k);
    } else {
      params.set(k, v);
    }
  });
  const qs = params.toString();
  const url = location.pathname + (qs ? '?' + qs : '');
  history.replaceState(null, '', url);
};

// ─── Lucide icon refresh helper ───────────────────────────
window.refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };

// ─── Default Lucide icon styles ───────────────────────────
(function() {
  const style = document.createElement('style');
  style.textContent = `
    [data-lucide] { width:16px; height:16px; vertical-align:middle; display:inline-block; }
    .page-header [data-lucide], .page-header i[data-lucide], h1 [data-lucide] { width:24px; height:24px; }
    .panel-header [data-lucide] { width:18px; height:18px; }
    .stars .star i, .star i[data-lucide] { width:16px; height:16px; }
    .stars .star.on i[data-lucide] { fill:currentColor; }
    .rf-star.on i[data-lucide] { fill:currentColor; }
  `;
  document.head.appendChild(style);
  // ── Shared trigger helper ──
  // Queues a task via Supabase trigger_queue (picked up by cron job)
  window.CCTrigger = function(message, opts) {
    opts = opts || {};
    const ack = opts.silent ? '' : ' IMPORTANT: Acknowledge this request in Slack immediately ("⚡ On it — [brief description]...") and report back when done.';
    const fullMsg = message + ack;
    if (window.trigger) return window.trigger(fullMsg, opts);
    // Fallback: use supabase directly
    if (window.supabase) {
      return window.supabase.upsert('trigger_queue', {
        id: crypto.randomUUID(),
        message: '[From ' + location.hostname + '] ' + fullMsg,
        source: location.hostname,
        status: 'pending',
        created_at: new Date().toISOString()
      }).catch(() => {});
    }
    console.warn('CCTrigger: no supabase or trigger.js available');
    return Promise.resolve();
  };

})();
