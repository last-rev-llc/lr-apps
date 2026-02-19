/**
 * <lr-layout> — Page layout wrapper for Last Rev Marketing pages.
 *
 * Wraps page content with consistent nav, subnav, background, and footer.
 * Children of <lr-layout> become the page body between nav and footer.
 *
 * Usage:
 *   <lr-layout
 *     active="home"
 *     cta-text="Get in Touch"
 *     cta-href="#contact"
 *     subnav="Services:#services,Approach:#approach"
 *   >
 *     <section class="lp-section">...</section>
 *   </lr-layout>
 *
 * Attributes:
 *   active     — current page key for nav highlighting (default: "home")
 *   cta-text   — nav CTA button text (default: "Get in Touch")
 *   cta-href   — nav CTA button link (default: "#contact")
 *   subnav     — floating subnav links, comma-separated "Label:#id" pairs (optional)
 *   no-bg      — if present, skip the fixed background div
 */
(function () {
  const TAG = 'lr-layout';
  if (customElements.get(TAG)) return;

  class LrLayout extends HTMLElement {
    connectedCallback() {
      // Wait for DOM to be fully parsed so all children are available
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._init());
      } else {
        this._init();
      }
    }

    _init() {
      // Enable smooth scrolling for all anchor links site-wide
      document.documentElement.style.scrollBehavior = 'smooth';

      const active = this.getAttribute('active') || 'home';
      const ctaText = this.getAttribute('cta-text') || 'Get in Touch';
      const ctaHref = this.getAttribute('cta-href') || '#contact';
      const subnav = this.getAttribute('subnav') || '';
      const noBg = this.hasAttribute('no-bg');

      // Collect existing children into a fragment
      const fragment = document.createDocumentFragment();
      while (this.firstChild) {
        fragment.appendChild(this.firstChild);
      }

      // Build layout structure in light DOM
      if (!noBg) {
        const bg = document.createElement('div');
        bg.className = 'lp-bg-fixed';
        this.appendChild(bg);
      }

      const nav = document.createElement('lr-nav');
      nav.setAttribute('active', active);
      nav.setAttribute('cta-text', ctaText);
      nav.setAttribute('cta-href', ctaHref);
      this.appendChild(nav);

      if (subnav) {
        const sub = document.createElement('lr-subnav');
        sub.setAttribute('links', subnav);
        this.appendChild(sub);
      }

      // Re-insert page content
      this.appendChild(fragment);

      // Add footer
      const footer = document.createElement('lr-footer');
      this.appendChild(footer);

      // Dev toolbar (edit mode, analytics, ideas, console logs)
      const toolbar = document.createElement('cc-dev-toolbar');
      toolbar.setAttribute('app', 'last-rev-marketing');
      this.appendChild(toolbar);
    }
  }

  customElements.define(TAG, LrLayout);
})();
