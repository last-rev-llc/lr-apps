// ─── Navigation ───────────────────────────────────────────
// Styles live in theme.css (.cc-nav-bar, .cc-nav-brand)
class CcNav extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || '';
    const pages = [
      { href: '/apps.html', label: 'Apps', key: 'apps' },
      { href: '/gallery.html', label: 'Media Gallery', key: 'gallery' },
      /* recipes moved to ideas page Recipes tab */
      { href: '/ideas.html', label: 'Ideas', key: 'ideas' },
      { href: 'https://cc-crons.adam-harris.alphaclaw.app/', label: 'Tasks', key: 'crons', absolute: true },
      { href: '/client-health.html', label: 'Clients', key: 'clients' },
      { href: '/leads.html', label: 'Leads', key: 'leads' },
      /* import moved to cc-users Import tab */
      { href: '/people.html', label: 'People', key: 'people' },
      /* backlog meeting moved to cc-client-health app */
      /* summaries moved to standalone cc-meeting-summaries app */
      /* higgsfield prompts moved to cc-gallery Prompts tab */
    ];

    const customPages = this.getAttribute('data-pages');
    const allPages = customPages ? JSON.parse(customPages) : pages;
    const ccDomain = 'https://command-center.adam-harris.alphaclaw.app';
    const isCommandCenter = window.location.hostname.startsWith('command-center');
    const base = this.getAttribute('base') || (isCommandCenter ? '' : ccDomain);

    const links = allPages.map(p => {
      const cls = p.key === active ? ' class="active"' : '';
      const url = p.absolute ? p.href : `${base}${p.href}`;
      return `<a href="${url}"${cls}>${p.label}</a>`;
    }).join('\n      ');

    this.innerHTML = `
    <nav class="cc-nav-bar collapsed">
      <a href="${base}/index.html" class="cc-nav-brand" style="text-decoration:none;color:inherit"><i data-lucide="zap"></i> CC</a>
      <button class="cc-nav-toggle" aria-label="Menu">☰</button>
      ${links}
    </nav>`;

    const nav = this.querySelector('.cc-nav-bar');
    const toggle = this.querySelector('.cc-nav-toggle');
    toggle.addEventListener('click', () => {
      nav.classList.toggle('collapsed');
      toggle.textContent = nav.classList.contains('collapsed') ? '☰' : '✕';
    });

    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-nav', CcNav);
