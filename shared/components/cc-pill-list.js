/* <cc-pill-list> — Shared read-only pill/tag list
   Usage:
     <cc-pill-list items='["Luxury","Adventure","Wellness"]'></cc-pill-list>
     <cc-pill-list items='["Pool","Spa","Golf"]' icon="🏨"></cc-pill-list>
     <cc-pill-list items='[{"label":"Luxury","icon":"💎"},{"label":"Adventure"}]'></cc-pill-list>

   Attributes:
     items  — JSON array of strings, or array of {label, icon} objects
     icon   — Optional default icon prefix for all pills
     size   — "sm" | "md" (default "md")
*/
(function() {
  class CcPillList extends HTMLElement {
    static get observedAttributes() { return ['items', 'icon', 'size']; }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _getItems() {
      try {
        const raw = JSON.parse(this.getAttribute('items') || '[]');
        return raw.map(i => typeof i === 'string' ? { label: i } : i);
      } catch { return []; }
    }

    _render() {
      const items = this._getItems();
      const defaultIcon = this.getAttribute('icon') || '';
      const size = this.getAttribute('size') || 'md';

      if (!items.length) { this.innerHTML = ''; return; }

      const sizeClass = size === 'sm' ? ' pill-sm' : '';
      const pills = items.map(item => {
        const icon = item.icon || defaultIcon;
        const prefix = icon ? icon + ' ' : '';
        return `<span class="pill${sizeClass}">${prefix}${item.label}</span>`;
      }).join('');

      this.innerHTML = `<div class="meta" style="display:flex;flex-wrap:wrap;gap:8px;">${pills}</div>`;
    }
  }

  customElements.define('cc-pill-list', CcPillList);
})();
