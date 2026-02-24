/**
 * <lr-head> — Manages <head> meta, styles, scripts, and favicon for Last Rev Marketing pages.
 *
 * Usage:
 *   <lr-head
 *     title="Page Title — Last Rev"
 *     description="Page description for SEO"
 *     extra-css="./css/ai-offerings.css"
 *     og-image="./assets/og-default.png"
 *   ></lr-head>
 *
 * What it injects:
 *   - charset + viewport meta
 *   - <title> and meta description
 *   - Open Graph + Twitter Card meta
 *   - Core stylesheets (theme.css, landing.css, last-rev.css)
 *   - Optional extra CSS via extra-css attribute (comma-separated)
 *   - Shared components script
 *   - lr-nav, lr-subnav, lr-footer, lr-layout, app.js scripts
 *   - Favicon
 *   - Google Analytics (placeholder — uncomment when GA ID is set)
 */

/* FOUC Prevention — immediately hide body until stylesheets are loaded */
(function() {
  if (document.getElementById('lr-fouc-guard')) return;
  var s = document.createElement('style');
  s.id = 'lr-fouc-guard';
  s.textContent = 'body{opacity:0!important;transition:opacity .15s ease-in}body.lr-ready{opacity:1!important}';
  document.head.appendChild(s);
})();

(function () {
  const TAG = 'lr-head';
  if (customElements.get(TAG)) return;

  class LrHead extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || 'Last Rev — AI, Automation & Business App Development';
      const desc = this.getAttribute('description') || 'Last Rev builds intelligent business applications powered by AI and automation.';
      const ogImage = this.getAttribute('og-image') || '';
      const extraCss = this.getAttribute('extra-css') || '';
      const canonical = this.getAttribute('canonical') || '';

      // Set document title
      document.title = title;

      // Helper to add meta if not present
      const setMeta = (attr, attrVal, content) => {
        if (document.querySelector(`meta[${attr}="${attrVal}"]`)) return;
        const m = document.createElement('meta');
        m.setAttribute(attr, attrVal);
        m.content = content;
        document.head.appendChild(m);
      };

      // Ensure charset + viewport
      if (!document.querySelector('meta[charset]')) {
        const cs = document.createElement('meta');
        cs.setAttribute('charset', 'UTF-8');
        document.head.prepend(cs);
      }
      if (!document.querySelector('meta[name="viewport"]')) {
        setMeta('name', 'viewport', 'width=device-width, initial-scale=1.0');
      }

      // Component base URL (for alphaclaw — points to shared domain)
      // In monorepo, this would be: setMeta('name', 'cc-base', '/shared/');
      setMeta('name', 'cc-base', 'https://shared.adam-harris.alphaclaw.app/');

      // Theme color (brand amber)
      setMeta('name', 'theme-color', '#f59e0b');

      // SEO meta
      setMeta('name', 'description', desc);

      // Open Graph
      setMeta('property', 'og:title', title);
      setMeta('property', 'og:description', desc);
      setMeta('property', 'og:type', 'website');
      if (ogImage) setMeta('property', 'og:image', ogImage);
      if (canonical) {
        setMeta('property', 'og:url', canonical);
        if (!document.querySelector('link[rel="canonical"]')) {
          const link = document.createElement('link');
          link.rel = 'canonical';
          link.href = canonical;
          document.head.appendChild(link);
        }
      }

      // Twitter Card
      setMeta('name', 'twitter:card', 'summary_large_image');
      setMeta('name', 'twitter:title', title);
      setMeta('name', 'twitter:description', desc);
      if (ogImage) setMeta('name', 'twitter:image', ogImage);

      // Resolve base path relative to where lr-head.js lives (always in /js/)
      const scriptEl = document.querySelector('script[src$="lr-head.js"]');
      const base = scriptEl ? scriptEl.src.replace(/js\/lr-head\.js$/, '') : './';

      // Core stylesheets
      const coreStyles = [base + 'shared/theme.css', base + 'shared/landing.css', base + 'css/last-rev.css'];
      coreStyles.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          document.head.appendChild(link);
        }
      });

      // Extra CSS (resolve relative to base)
      if (extraCss) {
        extraCss.split(',').map(s => s.trim()).filter(Boolean).forEach(href => {
          const resolved = href.startsWith('./') ? base + href.slice(2) : href;
          if (!document.querySelector(`link[href="${resolved}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = resolved;
            document.head.appendChild(link);
          }
        });
      }

      // Favicon
      if (!document.querySelector('link[rel="icon"]')) {
        const fav = document.createElement('link');
        fav.rel = 'icon';
        fav.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>";
        document.head.appendChild(fav);
      }

      // Manifest
      if (!document.querySelector('link[rel="manifest"]')) {
        const man = document.createElement('link');
        man.rel = 'manifest';
        man.href = base + 'manifest.json';
        document.head.appendChild(man);
      }

      // Shared components
      const loadScript = (src, defer = false) => {
        if (document.querySelector(`script[src="${src}"]`)) return;
        const s = document.createElement('script');
        s.src = src;
        if (defer) s.defer = true;
        document.head.appendChild(s);
      };

      loadScript(base + 'shared/components/index.js');
      loadScript(base + 'js/lr-nav.js');
      loadScript(base + 'js/lr-subnav.js');
      loadScript(base + 'js/cc-contact-form.js');
      loadScript(base + 'js/lr-footer.js');
      loadScript(base + 'js/lr-layout.js');
      loadScript(base + 'js/app.js', true);

      // --- GA4 Direct (analytics.js) ---
      loadScript(base + 'js/analytics.js');

      // Wait for all stylesheets to load, then reveal the page
      const allLinks = document.querySelectorAll('link[rel="stylesheet"]');
      if (allLinks.length === 0) {
        document.body.classList.add('lr-ready');
      } else {
        let loaded = 0;
        const total = allLinks.length;
        const reveal = () => { if (++loaded >= total) document.body.classList.add('lr-ready'); };
        allLinks.forEach(link => {
          if (link.sheet) { reveal(); }
          else {
            link.addEventListener('load', reveal);
            link.addEventListener('error', reveal);
          }
        });
        // Safety fallback — always reveal after 800ms
        setTimeout(() => document.body.classList.add('lr-ready'), 800);
      }

      // Remove self from DOM (it's done its job)
      this.remove();
    }
  }

  customElements.define(TAG, LrHead);
})();
