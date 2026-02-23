(function () {
  const TAG = 'cc-intro-text';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcIntroText extends HTMLElement {
    static get observedAttributes() { return ['overline', 'title', 'subtitle', 'body', 'align']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const overline = this.getAttribute('overline') || '';
      const title = this.getAttribute('title') || '';
      const subtitle = this.getAttribute('subtitle') || '';
      const body = this.getAttribute('body') || '';
      const align = this.getAttribute('align') || 'center';

      this.innerHTML = `
        <div class="cc-intro" style="text-align:${_esc(align)}">
          ${overline ? `<div class="cc-intro__overline">${_esc(overline)}</div>` : ''}
          ${title ? `<h2 class="cc-intro__title">${_esc(title)}</h2>` : ''}
          ${subtitle ? `<p class="cc-intro__subtitle">${_esc(subtitle)}</p>` : ''}
          ${body ? `<p class="cc-intro__body">${_esc(body)}</p>` : ''}
        </div>`;

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-intro-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-intro-styles';
      s.textContent = `
        cc-intro-text { display: block; }
        .cc-intro { max-width: 720px; margin: 0 auto; }
        .cc-intro__overline { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--accent, #f59e0b); font-weight: 600; margin-bottom: 8px; }
        .cc-intro__title { font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 800; color: var(--text, #e2e8f0); margin: 0 0 12px; line-height: 1.2; }
        .cc-intro__subtitle { font-size: 1.1rem; color: var(--muted, #94a3b8); margin: 0 0 12px; line-height: 1.5; }
        .cc-intro__body { font-size: 1rem; color: var(--muted, #94a3b8); margin: 0; line-height: 1.7; }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcIntroText);
})();
