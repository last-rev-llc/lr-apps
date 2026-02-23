/* <cc-star-rating> — Shared read-only star rating display
   Usage:
     <cc-star-rating value="4.2"></cc-star-rating>
     <cc-star-rating value="3" max="5" label></cc-star-rating>

   Attributes:
     value  — Rating number (e.g. 4.2)
     max    — Max stars (default 5)
     label  — If present, show "4.2/5" text after stars
     size   — "sm" | "md" (default "md")
*/
(function() {
  class CcStarRating extends HTMLElement {
    static get observedAttributes() { return ['value', 'max', 'label', 'size']; }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const value = parseFloat(this.getAttribute('value')) || 0;
      const max = parseInt(this.getAttribute('max')) || 5;
      const showLabel = this.hasAttribute('label');
      const size = this.getAttribute('size') || 'md';
      const rounded = Math.round(value);

      if (!value) { this.innerHTML = ''; return; }

      const iconSize = size === 'sm' ? '12px' : '14px';
      const fontSize = size === 'sm' ? '0.75rem' : '0.85rem';

      const stars = [];
      for (let i = 1; i <= max; i++) {
        const on = i <= rounded;
        stars.push(`<span class="star${on ? ' on' : ''}" style="color:var(--accent);"><i data-lucide="star" style="width:${iconSize};height:${iconSize};${on ? 'fill:currentColor;' : ''}"></i></span>`);
      }

      this.innerHTML = `<span class="stars" style="display:inline-flex;align-items:center;gap:2px;">
        ${stars.join('')}
        ${showLabel ? `<span style="font-size:${fontSize};margin-left:4px;">${value}/${max}</span>` : ''}
      </span>`;

      if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide' });
    }
  }

  customElements.define('cc-star-rating', CcStarRating);
})();
