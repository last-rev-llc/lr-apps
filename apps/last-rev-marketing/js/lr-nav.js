/**
 * <lr-nav> — Top navigation for Last Rev Marketing site.
 *
 * Attrs: active ("home"|"ai-offerings"|"web-offerings"|"client-stories"|"apps"|"blog"),
 *        cta-text (default "Get in Touch"), cta-href (default "#contact")
 * Nav links are hardcoded. Fixed position, glass morphism, mobile hamburger.
 *
 * NOTE: Don't use directly — <lr-layout> renders this automatically.
 *       LR marketing pages only; standalone apps use <cc-app-nav>.
 */
(function () {
  const TAG = 'lr-nav';
  if (customElements.get(TAG)) return;

  class LrNav extends HTMLElement {
    static get observedAttributes() { return ['active', 'cta-text', 'cta-href']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const active = this.getAttribute('active') || 'home';
      const ctaText = this.getAttribute('cta-text') || 'Get in Touch';
      const ctaHref = this.getAttribute('cta-href') || '#contact';

      const links = [
        { key: 'home', label: 'Home', href: '/index.html' },
        { key: 'ai-offerings', label: 'AI Offerings', href: '/ai-offerings.html' },
        { key: 'web-offerings', label: 'Web Development', href: '/web-offerings.html' },
        { key: 'client-stories', label: 'Client Stories', href: '/client-stories.html' },
        { key: 'apps', label: 'Apps', href: '/apps.html' },
        { key: 'blog', label: 'Blog', href: '/blog.html' },
      ];

      this.innerHTML = `
        <nav class="lr-nav">
          <div class="lr-logo"><a href="/index.html" style="text-decoration:none"><img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzQ0IiBoZWlnaHQ9IjU4IiB2aWV3Qm94PSIwIDAgMzQ0IDU4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMV8yKSI+CjxwYXRoIGQ9Ik0wIDI4LjUxNDZMMjkuNDUwNyAxNC40MDE0VjIwLjY2Nkw2LjA0ODM0IDMxLjY4MzZMMjkuNDUwNyA0Mi42OTkyVjQ4Ljk2NDhMMCAzNC44NTE2VjI4LjUxNDZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNjcuMjc0NCAwTDM4LjAzOTUgNTcuNjA1NUgzMS44NDcyTDYxLjA4MTUgMEg2Ny4yNzQ0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTExNi40OCA1NC4wMDQ5SDExMS41ODRMMTEwLjcyIDQ4Ljg5MjZDMTA4LjQxNiA1Mi4yMDUxIDEwMy4zMDMgNTQuNTgxMSA5Ny45MDIzIDU0LjU4MTFDOTEuODU0IDU0LjU4MTEgODYuNjY5NCA1MC45ODA1IDg2LjY2OTQgNDMuNTY0NUM4Ni42Njk0IDM1LjUgOTMuMTQ5OSAzMS42ODM2IDEwMy4wODcgMzEuNjgzNkgxMTAuNDMyVjMwLjA5ODZDMTEwLjQzMiAyNC40ODI0IDEwNi40NzEgMjIuNjEwMyAxMDIuMDc5IDIyLjYxMDNDMTAwLjE3NCAyMi41ODE3IDk4LjMxMSAyMy4xNjkxIDk2Ljc2NyAyNC4yODQ5Qzk1LjIyMzEgMjUuNDAwNyA5NC4wODA4IDI2Ljk4NTIgOTMuNTEwMyAyOC44MDI3TDg4LjE4MTcgMjcuMzYzMkM4OS44Mzc5IDIxLjAyNTQgOTUuNDU0MSAxNy4xMzc3IDEwMi4wNzkgMTcuMTM3N0MxMTAuNTc2IDE3LjEzNzcgMTE2LjQ4IDIxLjA5NzcgMTE2LjQ4IDMxLjEwNzRMMTE2LjQ4IDU0LjAwNDlaTTk4LjgzODQgNDkuMTA4NEMxMDMuNTE5IDQ5LjEwODQgMTEwLjQzMiA0Ni4yMjg1IDExMC40MzIgMzguMDE5NVYzNi44NjcySDEwMi41MTFDOTYuMzE4NCAzNi44NjcyIDkyLjg2MTggMzkuNDU5IDkyLjg2MTggNDMuNTY0NUM5Mi44NjE4IDQ3LjAyMDUgOTUuMjM4MyA0OS4xMDg0IDk4LjgzODQgNDkuMTA4NFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNTEuNTQ0IDI0Ljk4NjNMMTQ2Ljc5MiAyOC4zNzExQzE0NC41NTkgMjQuMzM3OSAxNDEuOTY3IDIyLjYxMDMgMTM4LjA3OSAyMi42MTAzQzEzNC45ODIgMjIuNjEwMyAxMzEuODE0IDIzLjkwNjIgMTMxLjgxNCAyNy40MzQ2QzEzMS44MTQgMzAuNTMxMiAxMzQuODM4IDMxLjk3MDcgMTQwLjIzOSAzMy4wNTA4QzE0Ny4wMDcgMzQuNDE4OSAxNTMuMjcyIDM2LjM2MzMgMTUzLjI3MiA0Mi45MTZDMTUzLjI3MiA1MC40MDQzIDE0Ni43OTIgNTQuNTgxIDEzOS4zMDMgNTQuNTgxQzEzMi4wMyA1NC41ODEgMTI1Ljc2NiA1MC45ODA0IDEyMy41MzMgNDQuMDY4M0wxMjkuMjk0IDQxLjkwODJDMTI5LjkzMyA0NC4wNDUyIDEzMS4yNjEgNDUuOTEwNiAxMzMuMDcyIDQ3LjIxMzFDMTM0Ljg4MyA0OC41MTU3IDEzNy4wNzQgNDkuMTgyMSAxMzkuMzAzIDQ5LjEwODRDMTQzLjQwNyA0OS4xMDg0IDE0Ny4wMDcgNDcuMzA4NiAxNDcuMDA3IDQzLjQ5MjJDMTQ3LjAwNyA0MC4zOTU1IDE0My40MDcgMzkuMzg3NyAxMzcuNjQ3IDM4LjE2NDFDMTMxLjUyNiAzNi44NjcyIDEyNS45MSAzNC43NzkzIDEyNS45MSAyNy42NTA0QzEyNS45MSAyMS4xNjk5IDEzMS41OTggMTcuMTM3NyAxMzguMjk0IDE3LjEzNzdDMTQ0Ljg0NyAxNy4xMzc3IDE0OC44MDggMjAuMDE3NiAxNTEuNTQ0IDI0Ljk4NjNaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTU3Ljc0OSAxNy43MTM5SDE2Ny4zOTdWNi44NDA4MkwxNzMuNDQ2IDMuMDI0NDFWMTcuNzEzOUgxOTEuMTU5VjIzLjE4NTZIMTczLjQ0NlY0MS43NjM3QzE3My40NDYgNDYuODA0NyAxNzUuNjc4IDQ5LjEwODQgMTc5LjcxIDQ5LjEwODRDMTgyLjg3OSA0OS4xMDg0IDE4NS40NzEgNDguMTAwNiAxODguNjM5IDQ0Ljc4ODFMMTkwLjg3MiA0OS45MDA0QzE4OS40NTggNTEuNDM4NSAxODcuNzI5IDUyLjY1MyAxODUuODAzIDUzLjQ2MDlDMTgzLjg3NiA1NC4yNjg3IDE4MS43OTggNTQuNjUwOCAxNzkuNzEgNTQuNTgxMUMxNzEuNzkgNTQuNTgxMSAxNjcuMzk3IDUwLjQwNDMgMTY3LjM5NyA0MS45ODA1VjIzLjE4NTZIMTU3Ljc0OVYxNy43MTM5WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTIyMy4wNzkgMjkuMjM0NEMyMjIuNTc1IDI1LjA1ODYgMjIwLjQxNSAyMi42MTA0IDIxNi4wOTQgMjIuNjEwNEMyMDkuNzU4IDIyLjYxMDQgMjAzLjc4MSAyOC41ODY5IDIwMy43ODEgNDAuOTAwNFY1NC4wMDQ5SDE5Ny43MzNWMTcuNzEzOUgyMDMuNzgxVjI0LjQxMDJDMjA1LjE4NSAyMi4xMzQ1IDIwNy4xNTkgMjAuMjY1OCAyMDkuNTA5IDE4Ljk5QzIxMS44NTkgMTcuNzE0MSAyMTQuNTAxIDE3LjA3NTYgMjE3LjE3NCAxNy4xMzc3QzIyNC4zNzUgMTcuMTM3NyAyMjguNjk1IDIxLjQ1OCAyMjkuMTI3IDI5LjIzNDRMMjIzLjA3OSAyOS4yMzQ0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI2Ny4yMzEgMzcuMTU1M0gyMzguODZDMjM5LjIyIDQ0LjM1NTUgMjQzLjYxMyA0OS4xMDg0IDI1MC4wMjEgNDkuMTA4NEMyNTUuNDk0IDQ5LjEwODQgMjU5LjIzOCA0Ni40NDQzIDI2MS42ODYgNDEuOTA4MkwyNjYuNTExIDQ0LjQyNzdDMjYyLjU1IDUyLjA2MDUgMjU2Ljc5IDU0LjU4MSAyNTAuMDIxIDU0LjU4MUMyMzkuNDM2IDU0LjU4MSAyMzIuNjY4IDQ2LjQ0NDMgMjMyLjY2OCAzNS44NTk0QzIzMi42NjggMjUuNjM0OCAyMzkuMTQ4IDE3LjEzNzcgMjUwLjAyMSAxNy4xMzc3QzI2MS4yNTQgMTcuMTM3NyAyNjcuMjMxIDI1LjEzMDkgMjY3LjIzMSAzNC42MzQ4TDI2Ny4yMzEgMzcuMTU1M1pNMjM5LjI5MyAzMS42ODM2SDI2MC44MjJDMjU5Ljc0MiAyNS45MjE5IDI1NS45MjYgMjIuNjEwMyAyNTAuMDIyIDIyLjYxMDNDMjQ0LjE4OSAyMi42MTAzIDI0MC41MTcgMjYuMjEwOSAyMzkuMjkyIDMxLjY4MzZIMjM5LjI5M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zMDcuNDk1IDE3LjcxMzlMMjkyLjMwMSA1NC4wMDQ5SDI4Ni4yNTNMMjcxLjA2IDE3LjcxMzlIMjc3LjYxMkwyODkuMjc3IDQ2LjgwNDdMMzAwLjk0MiAxNy43MTM5SDMwNy40OTVaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzQzLjc3NCAzNC44NTE2TDMxNC4zMjMgNDguOTY0OFY0Mi42OTkyTDMzNy43MjUgMzEuNjgzNkwzMTQuMzIzIDIwLjY2NlYxNC40MDE0TDM0My43NzQgMjguNTE0NlYzNC44NTE2WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTc5LjYxNiA0Ny45NTdWMy42MDFINzMuMjc5VjU0LjAwNUg3OS42MTZWNDcuOTU3WiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xXzIiPgo8cmVjdCB3aWR0aD0iMzQzLjc3NCIgaGVpZ2h0PSI1Ny42MDU1IiBmaWxsPSJ3aGl0ZSIvPgo8L2NsaXBQYXRoPgo8L2RlZnM+Cjwvc3ZnPgo=" alt="Last Rev" height="32"></a></div>
          <button class="lr-nav-hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
          <div class="lr-nav-links">
            ${links.map(l => `<a href="${l.href}"${l.key === active ? ' class="lr-nav-active"' : ''}>${l.label}</a>`).join('')}
            <a href="${ctaHref}" class="lr-nav-cta" data-track-cta="nav_${ctaText.toLowerCase().replace(/\s+/g, '_')}">${ctaText}</a>
          </div>
        </nav>
      `;

      const hamburger = this.querySelector('.lr-nav-hamburger');
      const navLinks = this.querySelector('.lr-nav-links');
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('lr-nav-links--open');
        hamburger.classList.toggle('lr-nav-hamburger--open');
      });

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('lr-nav-styles')) return;
      const s = document.createElement('style');
      s.id = 'lr-nav-styles';
      s.textContent = `
        lr-nav { display: block; }
        lr-nav .lr-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 20px 40px; display: flex; align-items: center; justify-content: space-between;
          background: rgba(8, 8, 15, 0.35); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        lr-nav .lr-logo { font-family: var(--serif, Georgia, serif); font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        lr-nav .lr-logo span { background: var(--accent-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        lr-nav .lr-nav-links { display: flex; gap: 32px; align-items: center; }
        lr-nav .lr-nav-links a { color: rgba(255, 255, 255, 0.5); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        lr-nav .lr-nav-links a:hover, lr-nav .lr-nav-links a.lr-nav-active { color: #fff; }
        lr-nav .lr-nav-cta {
          padding: 10px 24px; border-radius: 10px; background: var(--accent-grad);
          color: #000 !important; font-weight: 700; font-size: 13px; text-decoration: none;
          transition: all 0.3s; box-shadow: 0 0 30px rgba(245, 158, 11, 0.15);
        }
        lr-nav .lr-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 0 40px rgba(245, 158, 11, 0.3); }
        lr-nav .lr-nav-hamburger {
          display: none; background: none; border: none; cursor: pointer; padding: 4px;
          flex-direction: column; gap: 5px; z-index: 101;
        }
        lr-nav .lr-nav-hamburger span {
          display: block; width: 24px; height: 2px; background: rgba(255,255,255,0.7);
          transition: transform 0.3s, opacity 0.3s;
        }
        lr-nav .lr-nav-hamburger--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        lr-nav .lr-nav-hamburger--open span:nth-child(2) { opacity: 0; }
        lr-nav .lr-nav-hamburger--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
        @media (max-width: 768px) {
          lr-nav .lr-nav { padding: 16px 20px; }
          lr-nav .lr-nav-hamburger { display: flex; }
          lr-nav .lr-nav-links {
            display: none; position: fixed; top: 80px; left: 0; right: 0; bottom: 0;
            background: rgba(8, 8, 15, 0.95); backdrop-filter: blur(20px);
            flex-direction: column; align-items: center; justify-content: flex-start; gap: 24px;
            padding-top: 40px; overflow-y: auto;
          }
          lr-nav .lr-nav-links--open { display: flex; }
          lr-nav .lr-nav-links a { font-size: 18px; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, LrNav);
})();
