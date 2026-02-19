/**
 * <lr-subnav> — Floating secondary nav for Last Rev Marketing pages.
 *
 * Attrs: links (required) — comma-separated "Label:#id" pairs.
 * Appears on scroll (>300px), highlights active section via IntersectionObserver.
 *
 * NOTE: Don't use directly — <lr-layout subnav="..."> renders this automatically.
 *       Sections must have matching id attributes for anchors to work.
 */
(function () {
  const TAG = 'lr-subnav';
  if (customElements.get(TAG)) return;

  class LrSubnav extends HTMLElement {
    connectedCallback() { this._render(); this._observe(); }
    disconnectedCallback() { if (this._io) this._io.disconnect(); }

    _render() {
      // Parse links from attribute: "Services:#services,Approach:#approach,Work:#work"
      const raw = this.getAttribute('links') || '';
      if (!raw) { this.style.display = 'none'; return; }

      const links = raw.split(',').map(s => {
        const [label, href] = s.split(':');
        return { label: label.trim(), href: href.trim(), id: href.trim().replace('#', '') };
      });

      this.innerHTML = `
        <nav class="lr-subnav">
          ${links.map(l => `<a href="${l.href}" data-section="${l.id}">${l.label}</a>`).join('')}
        </nav>
      `;

      this._links = links;
      this._injectStyles();
    }

    _observe() {
      if (!this._links) return;
      const anchors = this.querySelectorAll('a');
      const setActive = (id) => {
        anchors.forEach(a => a.classList.toggle('lr-subnav-active', a.dataset.section === id));
      };

      this._io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setActive(e.target.id); break; }
        }
      }, { rootMargin: '-40% 0px -50% 0px' });

      this._links.forEach(l => {
        const el = document.getElementById(l.id);
        if (el) this._io.observe(el);
      });

      // Show/hide based on scroll (hide at very top)
      const nav = this.querySelector('.lr-subnav');
      const onScroll = () => {
        nav.classList.toggle('lr-subnav--visible', window.scrollY > 300);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    _injectStyles() {
      if (document.getElementById('lr-subnav-styles')) return;
      const s = document.createElement('style');
      s.id = 'lr-subnav-styles';
      s.textContent = `
        lr-subnav { display: block; }
        lr-subnav .lr-subnav {
          position: fixed; top: 90px; left: 50%; transform: translateX(-50%) translateY(-20px);
          z-index: 90; display: flex; gap: 4px; padding: 6px;
          background: rgba(8, 8, 15, 0.75); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s;
        }
        lr-subnav .lr-subnav--visible {
          opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0);
        }
        lr-subnav .lr-subnav a {
          color: rgba(255, 255, 255, 0.5); text-decoration: none; font-size: 13px; font-weight: 500;
          padding: 8px 16px; border-radius: 10px; transition: all 0.2s; white-space: nowrap;
        }
        lr-subnav .lr-subnav a:hover { color: #fff; background: rgba(255, 255, 255, 0.06); }
        lr-subnav .lr-subnav a.lr-subnav-active {
          color: #000; background: var(--accent-grad, linear-gradient(135deg, #f59e0b, #f97316));
          font-weight: 700;
        }
        @media (max-width: 768px) {
          lr-subnav .lr-subnav { top: 78px; gap: 2px; padding: 5px; }
          lr-subnav .lr-subnav a { font-size: 12px; padding: 7px 12px; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, LrSubnav);
})();
