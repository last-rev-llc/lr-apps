/* ── App Usage Tracker ─────────────────────────────────────
   Lightweight fire-and-forget pageview tracker.
   Include in any app page to auto-track visits.
   Determines app slug from hostname, increments pageview_count,
   and sets last_accessed on the app_registry table.
*/
(function() {
  try {
    const host = location.hostname;
    const match = host.match(/^([a-z0-9-]+)\.adam-harris\.alphaclaw\.app$/);
    if (!match) return; // not an app subdomain
    const slug = match[1];
    if (slug === 'shared') return; // skip shared library

    const SUPABASE_URL = 'https://lregiwsovpmljxjvrrsc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_HPinRWPrX97uxshGM0u1rw_UAsQsyFq';

    // Fire and forget - fetch the current count, then upsert
    fetch(`${SUPABASE_URL}/rest/v1/app_registry?slug=eq.${slug}&select=slug,pageview_count`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }).then(r => r.json()).then(rows => {
      if (!rows || !rows.length) return;
      const current = rows[0].pageview_count || 0;
      fetch(`${SUPABASE_URL}/rest/v1/app_registry?slug=eq.${slug}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          pageview_count: current + 1,
          last_accessed: new Date().toISOString()
        })
      }).catch(() => {}); // silent fail
    }).catch(() => {}); // silent fail
  } catch(e) { /* silent */ }
})();
