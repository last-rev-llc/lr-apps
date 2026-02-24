/* ⚡ Command Center — Shared Web Components (barrel)
   Include via: <script src="https://shared.adam-harris.alphaclaw.app/components/index.js"></script>

   Components:
     <cc-nav active="page-name"></cc-nav>     — Navigation bar
     <cc-auth></cc-auth>                       — Password gate
     <cc-toast></cc-toast>                     — Toast notification system
*/

(function() {
  // Check for <meta name="cc-base"> first, fall back to script src resolution
  const ccBaseMeta = document.querySelector('meta[name="cc-base"]');
  const base = ccBaseMeta 
    ? ccBaseMeta.content + 'components/' 
    : document.currentScript.src.replace(/\/index\.js$/, '/');

  // Load Lucide icons from CDN first
  const lucideScript = document.createElement('script');
  lucideScript.src = 'https://unpkg.com/lucide@0.454.0/dist/umd/lucide.min.js';
  document.head.appendChild(lucideScript);

  const load = (f) => { const s = document.createElement('script'); s.src = base + f; document.head.appendChild(s); };

  load('cc-topbar.js');
  load('cc-nav.js');
  load('cc-auth.js');
  load('cc-toast.js');
  load('cc-helpers.js');
  load('cc-sidebar.js');
  load('cc-filter-drawer.js');
  load('cc-modal.js');
  load('cc-field.js');
  load('cc-prefs.js');
  load('cc-tabs.js');
  load('cc-icons.js');
  load('cc-pill.js');
  load('cc-pill-filter.js');
  load('cc-pill-dropdown.js');
  load('cc-user-pill.js');
  load('cc-slack-msg.js');
  load('cc-github-pr.js');
  load('cc-particles.js');
  load('cc-confetti.js');
  load('cc-stat-counter.js');
  load('cc-parallax.js');
  load('cc-lightbox.js');
  load('cc-fade-in.js');
  load('cc-slide-in.js');
  load('cc-stagger.js');
  load('cc-typewriter.js');
  load('cc-reveal.js');
  load('cc-empty-state.js');
  load('cc-search.js');
  load('cc-app-nav.js');
  load('cc-app-topnav.js');
  load('cc-pill-list.js');
  load('cc-star-rating.js');
  load('cc-apps.js');
  load('cc-share.js');
  load('cc-media-card.js');
  load('cc-type-badge.js');
  load('cc-view-toggle.js');
  load('cc-placeholder.js');
  load('cc-page-header.js');
  load('cc-stat-card.js');
  load('cc-layer-stack.js');
  load('cc-slide-deck.js');
  load('cc-edit-mode.js');
  load('cc-dev-toolbar.js');
  load('cc-docs.js');
  load('cc-console-log.js');
  load('cc-accordion.js');
  load('cc-timeline.js');
  load('cc-marquee.js');
  load('cc-testimonial.js');
  load('cc-cta.js');
  load('cc-hero.js');
  load('cc-logo-cloud.js');
  load('cc-feature-list.js');
  load('cc-mermaid.js');
  load('cc-intro-text.js');
  load('cc-card.js');
  load('cc-blog.js');
  load('cc-pricing.js');
  load('cc-section-intro.js');
  load('cc-user-auth.js');

  // App usage tracker (fire-and-forget pageview tracking)
  const trackerBase = base.replace(/\/components\/$/, '/');
  const ts = document.createElement('script');
  ts.src = trackerBase + 'app-tracker.js';
  document.head.appendChild(ts);
})();
