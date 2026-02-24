// ─── App Top Nav — Public-facing top navigation bar ────────────────
// Usage: <cc-app-topnav app="cringe-rizzler" title="Cringe Rizzler" logo="icons/logo.png"></cc-app-topnav>
// Attributes:
//   app    — app slug
//   title  — display name
//   logo   — path to logo image (relative to app dir or absolute URL)
//   links  — JSON array of nav links: [{"label":"Features","href":"#features"}]
//   active — current active link id (optional)
//   base   — base URL override
class CcAppTopnav extends HTMLElement {
  connectedCallback() {
    const app = this.getAttribute('app') || '';
    const title = this.getAttribute('title') || app;
    const autoBase = window.location.pathname.replace(/\/[^/]*$/, '') || '/';
    const base = this.getAttribute('base') || autoBase;
    const logoSrc = this.getAttribute('logo') || '';
    const active = this.getAttribute('active') || '';

    // Build logo HTML — real image if provided, otherwise text
    const logoHtml = logoSrc
      ? `<img src="${logoSrc}" alt="${title}" class="cc-topnav-logo-img">`
      : `<span class="cc-topnav-logo-text">${title}</span>`;

    // Parse links attribute
    let navLinks = '';
    const linksAttr = this.getAttribute('links');
    if (linksAttr) {
      try {
        const links = JSON.parse(linksAttr);
        navLinks = links.map(l => {
          const href = l.href.startsWith('http') || l.href.startsWith('#') || l.href.startsWith('/')
            ? l.href : `${base}/${l.href}`;
          const cls = l.id === active ? 'cc-topnav-link active' : 'cc-topnav-link';
          return `<a href="${href}" class="${cls}">${l.label}</a>`;
        }).join('');
      } catch(e) { console.warn('cc-app-topnav: invalid links JSON', e); }
    }

    this.innerHTML = `
      <nav class="cc-topnav">
        <a href="${base}/" class="cc-topnav-brand">
          ${logoHtml}
        </a>
        <div class="cc-topnav-links">${navLinks}</div>
        <div class="cc-topnav-actions">
          <cc-user-auth mode="menu" allow-signup="false"></cc-user-auth>
        </div>
        <button class="cc-topnav-hamburger" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </nav>
      <div class="cc-topnav-mobile-menu">
        ${navLinks}
        <div class="cc-topnav-mobile-auth">
          <cc-user-auth mode="menu" allow-signup="false"></cc-user-auth>
        </div>
      </div>
    `;

    // Hamburger toggle
    const hamburger = this.querySelector('.cc-topnav-hamburger');
    const mobileMenu = this.querySelector('.cc-topnav-mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', open);
      });
    }
  }
}
customElements.define('cc-app-topnav', CcAppTopnav);
