(function () {
  const TAG = 'cc-testimonial';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcTestimonial extends HTMLElement {
    static get observedAttributes() { return ['quote', 'author', 'role', 'company', 'avatar', 'variant']; }
    connectedCallback() { this._render(); this._observe(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }
    disconnectedCallback() { this._io?.disconnect(); }

    _render() {
      const quote = this.getAttribute('quote') || '';
      const author = this.getAttribute('author') || '';
      const role = this.getAttribute('role') || '';
      const company = this.getAttribute('company') || '';
      const avatar = this.getAttribute('avatar') || '';
      const variant = this.getAttribute('variant') || 'default';

      this.setAttribute('data-variant', variant);
      this.innerHTML = `
        <div class="cc-testimonial cc-testimonial--${_esc(variant)}">
          <div class="cc-testimonial__quote-mark">\u201C</div>
          <blockquote class="cc-testimonial__text">${_esc(quote)}</blockquote>
          <div class="cc-testimonial__author">
            ${avatar ? `<img class="cc-testimonial__avatar" src="${_esc(avatar)}" alt="${_esc(author)}" loading="lazy"/>` : ''}
            <div class="cc-testimonial__info">
              <div class="cc-testimonial__name">${_esc(author)}</div>
              ${role || company ? `<div class="cc-testimonial__meta">${_esc(role)}${role && company ? ', ' : ''}${_esc(company)}</div>` : ''}
            </div>
          </div>
        </div>`;

      this._injectStyles();
    }

    _observe() {
      this._io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { this.classList.add('cc-testimonial--visible'); this._io.disconnect(); }
      }, { threshold: 0.2 });
      this._io.observe(this);
    }

    _injectStyles() {
      if (document.getElementById('cc-testimonial-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-testimonial-styles';
      s.textContent = `
        cc-testimonial { display: block; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
        cc-testimonial.cc-testimonial--visible { opacity: 1; transform: translateY(0); }
        .cc-testimonial { padding: 24px; border-radius: 12px; }
        .cc-testimonial--default { background: var(--surface, #1e293b); border: 1px solid var(--border, rgba(255,255,255,0.1)); }
        .cc-testimonial--highlighted { background: linear-gradient(135deg, var(--accent, #f59e0b)11, var(--surface, #1e293b)); border: 1px solid var(--accent, #f59e0b)33; }
        .cc-testimonial--minimal { background: transparent; padding: 16px 0; }
        .cc-testimonial__quote-mark { font-size: 3rem; line-height: 1; color: var(--accent, #f59e0b); opacity: 0.5; }
        .cc-testimonial__text { font-style: italic; font-size: 1.05rem; line-height: 1.7; color: var(--text, #e2e8f0); margin: 8px 0 20px; border: none; padding: 0; }
        .cc-testimonial__author { display: flex; align-items: center; gap: 12px; }
        .cc-testimonial__avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .cc-testimonial__name { font-weight: 600; color: var(--text, #e2e8f0); font-size: 0.95rem; }
        .cc-testimonial__meta { color: var(--muted, #94a3b8); font-size: 0.85rem; }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcTestimonial);
})();
