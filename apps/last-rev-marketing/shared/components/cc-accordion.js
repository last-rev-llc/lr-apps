(function () {
  const TAG = 'cc-accordion';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcAccordion extends HTMLElement {
    static get observedAttributes() { return ['items', 'multiple', 'variant']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const items = this._parseItems();
      const variant = this.getAttribute('variant') || 'default';

      this.innerHTML = items.map((item, i) => `
        <div class="cc-accordion__item cc-accordion__item--${_esc(variant)}" data-index="${i}">
          <button class="cc-accordion__header" aria-expanded="false">
            <span class="cc-accordion__title">${_esc(item.title)}</span>
            <svg class="cc-accordion__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="cc-accordion__body"><div class="cc-accordion__content">${_esc(item.content)}</div></div>
        </div>
      `).join('');

      this.querySelectorAll('.cc-accordion__header').forEach(btn => {
        btn.addEventListener('click', () => this._toggle(btn));
      });

      this._injectStyles();
    }

    _parseItems() {
      try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; }
    }

    _toggle(btn) {
      const multiple = this.hasAttribute('multiple');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const item = btn.closest('.cc-accordion__item');
      const body = item.querySelector('.cc-accordion__body');

      if (!multiple && !expanded) {
        this.querySelectorAll('.cc-accordion__header[aria-expanded="true"]').forEach(other => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            const ob = other.closest('.cc-accordion__item').querySelector('.cc-accordion__body');
            ob.style.maxHeight = '0';
          }
        });
      }

      const nowOpen = !expanded;
      btn.setAttribute('aria-expanded', String(nowOpen));
      if (nowOpen) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = '0';
      }

      this.dispatchEvent(new CustomEvent('accordion-toggle', { detail: { index: +item.dataset.index, open: nowOpen }, bubbles: true }));
    }

    _injectStyles() {
      if (document.getElementById('cc-accordion-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-accordion-styles';
      s.textContent = `
        cc-accordion { display: block; }
        .cc-accordion__item { border-bottom: 1px solid var(--border, rgba(255,255,255,0.1)); }
        .cc-accordion__item--bordered { border: 1px solid var(--border, rgba(255,255,255,0.1)); border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
        .cc-accordion__item--bordered:last-child { margin-bottom: 0; }
        .cc-accordion__header { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 14px 4px; background: none; border: none; color: var(--text, #e2e8f0); font-size: 1rem; font-weight: 600; cursor: pointer; text-align: left; transition: color 0.2s; }
        .cc-accordion__item--bordered .cc-accordion__header { padding: 14px 16px; }
        .cc-accordion__header:hover { color: var(--accent, #f59e0b); }
        .cc-accordion__chevron { transition: transform 0.25s ease; flex-shrink: 0; }
        .cc-accordion__header[aria-expanded="true"] .cc-accordion__chevron { transform: rotate(180deg); }
        .cc-accordion__body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .cc-accordion__content { padding: 0 4px 14px; color: var(--muted, #94a3b8); font-size: 0.925rem; line-height: 1.6; }
        .cc-accordion__item--bordered .cc-accordion__content { padding: 0 16px 14px; }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcAccordion);
})();
