(function () {
  const TAG = 'cc-cta';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcCta extends HTMLElement {
    static get observedAttributes() { return ['title', 'description', 'primary-text', 'primary-href', 'secondary-text', 'secondary-href', 'align', 'variant']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const title = this.getAttribute('title') || '';
      const desc = this.getAttribute('description') || '';
      const pt = this.getAttribute('primary-text') || '';
      const ph = this.getAttribute('primary-href') || '#';
      const st = this.getAttribute('secondary-text') || '';
      const sh = this.getAttribute('secondary-href') || '#';
      const align = this.getAttribute('align') || 'center';
      const variant = this.getAttribute('variant') || 'default';

      this.innerHTML = `
        <div class="cc-cta cc-cta--${_esc(variant)}" style="text-align:${_esc(align)}">
          ${title ? `<h3 class="cc-cta__title">${_esc(title)}</h3>` : ''}
          ${desc ? `<p class="cc-cta__desc">${_esc(desc)}</p>` : ''}
          <div class="cc-cta__actions" style="justify-content:${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'}">
            ${pt ? `<a class="cc-cta__btn cc-cta__btn--primary" href="${_esc(ph)}">${_esc(pt)}</a>` : ''}
            ${st ? `<a class="cc-cta__btn cc-cta__btn--secondary" href="${_esc(sh)}">${_esc(st)}</a>` : ''}
          </div>
        </div>`;

      this.querySelectorAll('.cc-cta__btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const isPrimary = btn.classList.contains('cc-cta__btn--primary');
          this.dispatchEvent(new CustomEvent('cta-click', { detail: { button: isPrimary ? 'primary' : 'secondary', href: btn.href }, bubbles: true }));
        });
      });

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-cta-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-cta-styles';
      s.textContent = `
        cc-cta { display: block; }
        .cc-cta { padding: 40px 24px; border-radius: 16px; }
        .cc-cta--default { background: var(--surface, #1e293b); border: 1px solid var(--border, rgba(255,255,255,0.1)); }
        .cc-cta--gradient { background: linear-gradient(135deg, var(--accent, #f59e0b)22, var(--surface, #1e293b)); border: 1px solid var(--accent, #f59e0b)33; }
        .cc-cta--bordered { background: transparent; border: 2px solid var(--accent, #f59e0b); }
        .cc-cta__title { font-size: 1.5rem; font-weight: 700; color: var(--text, #e2e8f0); margin: 0 0 8px; }
        .cc-cta__desc { color: var(--muted, #94a3b8); font-size: 1rem; margin: 0 0 24px; line-height: 1.6; }
        .cc-cta__actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .cc-cta__btn { display: inline-block; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; text-decoration: none; transition: transform 0.15s ease, opacity 0.15s ease; }
        .cc-cta__btn:hover { transform: translateY(-1px); }
        .cc-cta__btn--primary { background: var(--accent, #f59e0b); color: #000; }
        .cc-cta__btn--secondary { background: transparent; border: 1px solid var(--border, rgba(255,255,255,0.2)); color: var(--text, #e2e8f0); }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcCta);
})();
