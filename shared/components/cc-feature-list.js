(function () {
  const TAG = 'cc-feature-list';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcFeatureList extends HTMLElement {
    static get observedAttributes() { return ['items', 'columns', 'variant', 'icon']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const items = this._parse();
      const columns = this.getAttribute('columns') || '1';
      const variant = this.getAttribute('variant') || 'list';
      const defaultIcon = this.getAttribute('icon') || 'check';

      this.innerHTML = `<div class="cc-fl cc-fl--${_esc(variant)}" style="--cc-fl-cols:${_esc(columns)}">
        ${items.map(item => `
          <div class="cc-fl__item">
            <div class="cc-fl__icon"><i data-lucide="${_esc(item.icon || defaultIcon)}"></i></div>
            <div class="cc-fl__content">
              <div class="cc-fl__title">${_esc(item.title)}</div>
              ${item.description ? `<div class="cc-fl__desc">${_esc(item.description)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;

      window.refreshIcons?.();
      this._injectStyles();
    }

    _parse() { try { return JSON.parse(this.getAttribute('items') || '[]'); } catch { return []; } }

    _injectStyles() {
      if (document.getElementById('cc-fl-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-fl-styles';
      s.textContent = `
        cc-feature-list { display: block; }
        .cc-fl { display: grid; grid-template-columns: repeat(var(--cc-fl-cols, 1), 1fr); gap: 16px; }
        .cc-fl__item { display: flex; gap: 12px; align-items: flex-start; }
        .cc-fl--cards .cc-fl__item { background: var(--surface, #1e293b); border: 1px solid var(--border, rgba(255,255,255,0.1)); border-radius: 12px; padding: 20px; }
        .cc-fl--compact .cc-fl__item { gap: 8px; }
        .cc-fl__icon { flex-shrink: 0; width: 24px; height: 24px; color: var(--accent, #f59e0b); }
        .cc-fl__icon svg { width: 20px; height: 20px; }
        .cc-fl__title { font-weight: 600; color: var(--text, #e2e8f0); font-size: 0.95rem; }
        .cc-fl__desc { color: var(--muted, #94a3b8); font-size: 0.875rem; margin-top: 4px; line-height: 1.5; }
        @media (max-width: 600px) { .cc-fl { grid-template-columns: 1fr; } }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcFeatureList);
})();
