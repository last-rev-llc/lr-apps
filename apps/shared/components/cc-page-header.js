/* <cc-page-header> — Standardized app page header
   Usage:
     <cc-page-header icon="🏥" title="Client Health Scorecard" description="Health scores based on GitHub activity"></cc-page-header>
     <cc-page-header icon="🖼️" title="Media Gallery" description="All generated media assets" count="24" count-label="items"></cc-page-header>

   Attributes:
     icon         — Emoji or Lucide icon name (e.g. "🏥" or "building-2")
     title        — Page title text
     description  — Subtitle/description text (optional)
     count        — Item count number (optional, shown as badge)
     count-label  — Label for count, default "items"
     count-el     — ID of external element to sync count from (optional)

   Slots:
     Default slot — extra content rendered in the header-right area (buttons, toggles, etc.)
*/
(function() {
  class CcPageHeader extends HTMLElement {
    static get observedAttributes() { return ['icon', 'title', 'description', 'count', 'count-label', 'count-el']; }

    connectedCallback() { this._render(); this._observeCountEl(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _observeCountEl() {
      const elId = this.getAttribute('count-el');
      if (!elId) return;
      const check = () => {
        const el = document.getElementById(elId);
        if (el) {
          const obs = new MutationObserver(() => {
            const c = this.querySelector('.cc-ph-count-num');
            if (c) c.textContent = el.textContent;
          });
          obs.observe(el, { childList: true, characterData: true, subtree: true });
        }
      };
      requestAnimationFrame(check);
    }

    _render() {
      const icon = this.getAttribute('icon') || '';
      const title = this.getAttribute('title') || '';
      const desc = this.getAttribute('description') || '';
      const count = this.getAttribute('count');
      const countLabel = this.getAttribute('count-label') || 'items';

      // Determine if icon is emoji or lucide
      const isEmoji = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(icon);
      const iconHtml = icon
        ? (isEmoji
          ? `<span class="cc-ph-icon">${icon}</span>`
          : `<span class="cc-ph-icon"><i data-lucide="${icon}"></i></span>`)
        : '';

      const countHtml = count != null
        ? `<span class="cc-ph-count"><span class="cc-ph-count-num">${count}</span> ${countLabel}</span>`
        : '';

      this.innerHTML = `
        <div class="cc-ph-left">
          <div class="cc-ph-title-row">
            ${iconHtml}
            <h1 class="cc-ph-title"><span>${title}</span></h1>
            ${countHtml}
          </div>
          ${desc ? `<p class="cc-ph-desc">${desc}</p>` : ''}
        </div>
        <div class="cc-ph-right"></div>
      `;

      // Move slotted children into right area
      const right = this.querySelector('.cc-ph-right');
      const slotted = [...this.childNodes].filter(n =>
        n !== this.querySelector('.cc-ph-left') && n !== right && n.nodeType === 1
      );
      slotted.forEach(n => right.appendChild(n));

      // Init lucide icons if needed
      if (!isEmoji && icon && window.lucide) {
        requestAnimationFrame(() => lucide.createIcons({ nodes: [this] }));
      }
    }
  }

  // Inject styles once
  if (!document.getElementById('cc-page-header-style')) {
    const s = document.createElement('style');
    s.id = 'cc-page-header-style';
    s.textContent = `
      cc-page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
      }
      .cc-ph-left { flex: 1; min-width: 0; }
      .cc-ph-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .cc-ph-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
      .cc-ph-icon i, .cc-ph-icon svg { width: 28px; height: 28px; color: var(--accent); }
      .cc-ph-title {
        font-size: 24px;
        font-weight: 400;
        font-family: var(--serif);
        margin: 0;
        line-height: 1.2;
      }
      .cc-ph-title span {
        background: var(--accent-grad);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .cc-ph-count {
        color: var(--muted);
        font-size: 14px;
        white-space: nowrap;
      }
      .cc-ph-desc {
        color: var(--muted);
        font-size: 13px;
        margin: 4px 0 0;
        line-height: 1.4;
      }
      .cc-ph-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      @media (max-width: 600px) {
        cc-page-header { flex-direction: column; gap: 8px; }
        .cc-ph-title { font-size: 20px; }
        .cc-ph-icon { font-size: 24px; }
      }
    `;
    document.head.appendChild(s);
  }

  customElements.define('cc-page-header', CcPageHeader);
})();
