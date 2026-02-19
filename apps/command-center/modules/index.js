/* ⚡ Command Center — App Modules (barrel)
   These are command-center-specific modules, not shared building blocks.
   Include via: <script src="modules/index.js"></script>
*/

(function() {
  const base = document.currentScript.src.replace(/\/index\.js$/, '/');
  const load = (f) => { const s = document.createElement('script'); s.src = base + f; document.head.appendChild(s); };

  load('cc-queue-summary.js');
  load('cc-daily-feed.js');
  load('cc-calendar.js');
  load('cc-prs.js');
  load('cc-slack.js');
  load('cc-recipes.js');
  load('cc-gallery.js');
  load('cc-ideas.js');
  load('cc-ideas-summary.js');
  load('cc-client-health.js');
  load('cc-client-health-summary.js');
  load('cc-ga4-alerts.js');
  load('cc-leads.js');
  load('cc-leads-summary.js');
  load('cc-dry-audit.js');
  load('cc-lighthouse.js');
  load('cc-uptime.js');
  load('cc-users.js');
  load('cc-community.js');
  load('cc-community-summary.js');
  load('cc-import.js');
  load('cc-quick-access.js');
})();
