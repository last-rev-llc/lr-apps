// ─── App Nav — Top navigation bar for individual apps ────────────────
// Usage: <cc-app-nav app="ideas" title="💡 Ideas"></cc-app-nav>
// Attributes:
//   app    — app slug used for URL building (e.g. "ideas")
//   title  — display title with optional emoji (e.g. "💡 Ideas")
//   active — current page: "home" | "landing" | "admin" (default: auto-detect)
//   base   — base URL override (default: auto from location)
//   repo   — GitHub repo override (default: last-rev-llc/ah-${app})
//   pages  — JSON array of extra nav links (optional)
//
// Streamlined nav: Logo/Title | Landing | Admin
// GitHub moved to dev toolbar. Admin page uses <cc-tabs> for Ideas, Prompts, Ads, Docs sub-pages.
class CcAppNav extends HTMLElement {
  connectedCallback() {
    const app = this.getAttribute('app') || '';
    const title = this.getAttribute('title') || app;
    const autoBase = window.location.pathname.replace(/\/[^/]*$/, '') || '/';
    const base = this.getAttribute('base') || autoBase;
    let active = this.getAttribute('active') || this._detectActive();
    const repo = this.getAttribute('repo') || `last-rev-llc/ah-${app}`;

    const links = [
      { id: 'landing', label: 'Landing', lucide: 'rocket',    href: `${base}/landing.html` },
      { id: 'admin',   label: 'Admin',   lucide: 'settings',  href: `${base}/admin.html` },
    ];

    // Support app-specific extra pages via `pages` attribute (JSON array)
    const pagesAttr = this.getAttribute('pages');
    if (pagesAttr) {
      try {
        const extra = JSON.parse(pagesAttr);
        extra.forEach(p => {
          const href = p.href.startsWith('http') ? p.href : `${base}/${p.href}`;
          links.push({ id: p.id, label: p.label, lucide: p.lucide || null, icon: p.icon || null, href });
        });
      } catch(e) { console.warn('cc-app-nav: invalid pages JSON', e); }
    }

    const navLinks = links.map(l => {
      const cls = l.id === active ? 'cc-app-nav-link active' : 'cc-app-nav-link';
      const iconHtml = l.lucide ? `<i data-lucide="${l.lucide}" style="width:16px;height:16px;"></i>` : (l.icon || '');
      return `<a href="${l.href}" class="${cls}">${iconHtml} ${l.label}</a>`;
    }).join('');

    const pos = this.getAttribute('position') || 'top';
    const posClass = pos === 'bottom' ? ' cc-app-nav-bottom' : '';

    this.innerHTML = `
      <nav class="cc-app-nav${posClass}">
        <a href="${base}/" class="cc-app-nav-title">${title}</a>
        <div class="cc-app-nav-links">
          ${navLinks}
        </div>
      </nav>
      <cc-dev-toolbar app="${app}" repo="${repo}"></cc-dev-toolbar>
    `;

    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }

  _detectActive() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '');
    if (['landing', 'admin'].includes(file)) return file;
    return 'home';
  }
}
customElements.define('cc-app-nav', CcAppNav);
