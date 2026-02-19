(function () {
  const TAG = 'cc-hero';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcHero extends HTMLElement {
    static get observedAttributes() { return ['title', 'subtitle', 'body', 'overline', 'image', 'variant', 'align', 'height']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const title = this.getAttribute('title') || '';
      const subtitle = this.getAttribute('subtitle') || '';
      const body = this.getAttribute('body') || '';
      const overline = this.getAttribute('overline') || '';
      const image = this.getAttribute('image') || '';
      const variant = this.getAttribute('variant') || 'default';
      const align = this.getAttribute('align') || 'center';
      const height = this.getAttribute('height') || 'full';

      // Preserve slotted actions
      const actionsSlot = this.querySelector('[slot="actions"]');
      const actionsHTML = actionsSlot ? actionsSlot.outerHTML : '';

      const textBlock = `
        <div class="cc-hero__text" style="text-align:${_esc(align)}">
          ${overline ? `<div class="cc-hero__overline">${_esc(overline)}</div>` : ''}
          ${title ? `<h1 class="cc-hero__title">${_esc(title)}</h1>` : ''}
          ${subtitle ? `<p class="cc-hero__subtitle">${_esc(subtitle)}</p>` : ''}
          ${body ? `<p class="cc-hero__body">${_esc(body)}</p>` : ''}
          <div class="cc-hero__actions" style="justify-content:${align === 'left' ? 'flex-start' : 'center'}">${actionsHTML}</div>
        </div>`;

      const heightClass = `cc-hero--h-${_esc(height)}`;

      if (variant === 'split' && image) {
        this.innerHTML = `<div class="cc-hero cc-hero--split ${heightClass}">${textBlock}<div class="cc-hero__image"><img src="${_esc(image)}" alt="" loading="lazy"/></div></div>`;
      } else {
        this.innerHTML = `<div class="cc-hero cc-hero--${_esc(variant)} ${heightClass}">
          ${variant === 'glow' ? '<div class="cc-hero__glow"></div>' : ''}
          ${textBlock}
          ${image && variant !== 'split' ? `<div class="cc-hero__image"><img src="${_esc(image)}" alt="" loading="lazy"/></div>` : ''}
        </div>`;
      }

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-hero-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-hero-styles';
      s.textContent = `
        cc-hero { display: block; }
        .cc-hero { position: relative; padding: 64px 24px; display: flex; flex-direction: column; justify-content: center; }
        .cc-hero--h-full { min-height: 100vh; }
        .cc-hero--h-medium { min-height: 50vh; }
        .cc-hero--h-fit { min-height: auto; padding: 80px 24px; }
        .cc-hero--split { display: flex; align-items: center; gap: 40px; }
        .cc-hero--split .cc-hero__text { flex: 1; text-align: left; }
        .cc-hero--split .cc-hero__image { flex: 1; }
        .cc-hero--split .cc-hero__image img { width: 100%; border-radius: 12px; }
        .cc-hero__glow { position: absolute; top: 50%; left: 50%; width: 400px; height: 400px; transform: translate(-50%,-50%); background: radial-gradient(circle, var(--accent, #f59e0b)22, transparent 70%); pointer-events: none; z-index: 0; }
        .cc-hero__text { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }
        .cc-hero__overline { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--accent, #f59e0b); font-weight: 600; margin-bottom: 12px; }
        .cc-hero__title { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; color: var(--text, #e2e8f0); margin: 0 0 16px; line-height: 1.15; }
        .cc-hero__subtitle { font-size: 1.2rem; color: var(--muted, #94a3b8); margin: 0 0 12px; line-height: 1.5; }
        .cc-hero__body { font-size: 1rem; color: var(--muted, #94a3b8); margin: 0 0 24px; line-height: 1.6; }
        .cc-hero__actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .cc-hero__image img { max-width: 100%; border-radius: 12px; margin-top: 32px; }
        @media (max-width: 768px) {
          .cc-hero--split { flex-direction: column; }
          .cc-hero { padding: 40px 16px; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcHero);
})();
