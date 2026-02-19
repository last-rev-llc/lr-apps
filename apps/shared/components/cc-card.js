(function () {
  const TAG = 'cc-card';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcCard extends HTMLElement {
    static get observedAttributes() { return ['title', 'overline', 'subtitle', 'body', 'href', 'image', 'variant', 'layout', 'icon']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const title = this.getAttribute('title') || '';
      const overline = this.getAttribute('overline') || '';
      const subtitle = this.getAttribute('subtitle') || '';
      const body = this.getAttribute('body') || '';
      const href = this.getAttribute('href') || '';
      const image = this.getAttribute('image') || '';
      const variant = this.getAttribute('variant') || 'default';
      const layout = this.getAttribute('layout') || 'vertical';
      const icon = this.getAttribute('icon') || '';

      const actionsSlot = this.querySelector('[slot="actions"]');
      const actionsHTML = actionsSlot ? actionsSlot.outerHTML : '';

      const imgHTML = image ? `<div class="cc-card__image"><img src="${_esc(image)}" alt="" loading="lazy"/></div>` : '';
      const iconHTML = icon && (variant === 'glass-icon' || variant === 'icon-bg') ? `<div class="cc-card__bg-icon">${icon}</div>` : '';
      const contentHTML = `
        <div class="cc-card__content">
          ${overline ? `<div class="cc-card__overline">${_esc(overline)}</div>` : ''}
          ${title ? `<h3 class="cc-card__title">${_esc(title)}</h3>` : ''}
          ${subtitle ? `<p class="cc-card__subtitle">${_esc(subtitle)}</p>` : ''}
          ${body ? `<p class="cc-card__body">${_esc(body)}</p>` : ''}
          ${actionsHTML ? `<div class="cc-card__actions">${actionsHTML}</div>` : ''}
        </div>`;

      const tag = href ? 'a' : 'div';
      const hrefAttr = href ? ` href="${_esc(href)}"` : '';
      this.innerHTML = `<${tag} class="cc-card cc-card--${_esc(variant)} cc-card--${_esc(layout)}"${hrefAttr}>${iconHTML}${imgHTML}${contentHTML}</${tag}>`;

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-card-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-card-styles';
      s.textContent = `
        cc-card { display: block; }
        .cc-card { display: flex; border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .cc-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .cc-card--vertical { flex-direction: column; }
        .cc-card--horizontal { flex-direction: row; }
        .cc-card--default { background: var(--surface, #1e293b); border: 1px solid var(--border, rgba(255,255,255,0.1)); }
        .cc-card--glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
        .cc-card--glass-icon { position: relative; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
        .cc-card--icon-bg { position: relative; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
        .cc-card--outline { background: transparent; border: 1px solid var(--border, rgba(255,255,255,0.15)); }
        .cc-card__image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cc-card--vertical .cc-card__image { height: 200px; }
        .cc-card--horizontal .cc-card__image { width: 200px; flex-shrink: 0; }
        .cc-card__content { padding: 20px; flex: 1; display: flex; flex-direction: column; }
        .cc-card__overline { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent, #f59e0b); font-weight: 600; margin-bottom: 6px; }
        .cc-card__title { font-size: 1.15rem; font-weight: 700; color: var(--text, #e2e8f0); margin: 0 0 6px; }
        .cc-card__subtitle { font-size: 0.9rem; color: var(--muted, #94a3b8); margin: 0 0 8px; }
        .cc-card__body { font-size: 0.9rem; color: var(--muted, #94a3b8); margin: 0; line-height: 1.6; flex: 1; }
        .cc-card__actions { margin-top: 16px; display: flex; gap: 8px; }
        .cc-card__bg-icon { position: absolute; top: 12px; right: 12px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: rgba(255,255,255,0.05); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); z-index: 1; opacity: 0.6; }
        .cc-card__bg-icon svg { width: 28px; height: 28px; opacity: 0.8; }
        .cc-card--glass-icon .cc-card__content { position: relative; z-index: 2; }
        .cc-card--icon-bg .cc-card__content { position: relative; z-index: 2; }
        @media (max-width: 600px) { .cc-card--horizontal { flex-direction: column; } .cc-card--horizontal .cc-card__image { width: 100%; height: 180px; } }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcCard);
})();
