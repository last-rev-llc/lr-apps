/* <cc-pill-dropdown> — Shared labeled pill dropdown (single-select)
   Usage:
     <cc-pill-dropdown label="Sort" items='[{"value":"date","label":"Date"},{"value":"name","label":"Name"}]' value="date"></cc-pill-dropdown>

   Attributes:
     label     — Row label text
     items     — JSON array of {value,label} objects, or plain strings
     value     — Currently selected value
     direction — Optional "asc"/"desc" to show direction toggle arrow

   Events:
     pill-change — detail: { value }
     direction-change — detail: { direction: "asc"|"desc" }

   JS API:
     .value (get/set)
     .direction (get/set)
*/
(function() {
  class CcPillDropdown extends HTMLElement {
    static get observedAttributes() { return ['label', 'items', 'value', 'direction']; }

    connectedCallback() {
      this._open = false;
      this._render();
      this._closeHandler = (e) => {
        if (this._open && !this.contains(e.target)) { this._open = false; this._render(); }
      };
      document.addEventListener('click', this._closeHandler);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._closeHandler);
    }

    attributeChangedCallback() { if (this.isConnected) this._render(); }

    get value() { return this.getAttribute('value') || ''; }
    set value(v) { this.setAttribute('value', v); }

    get direction() { return this.getAttribute('direction') || ''; }
    set direction(v) { this.setAttribute('direction', v); }

    _getItems() {
      try {
        const raw = JSON.parse(this.getAttribute('items') || '[]');
        return raw.map(i => typeof i === 'string' ? { value: i, label: i } : i);
      } catch { return []; }
    }

    _select(val) {
      this._open = false;
      this.setAttribute('value', val);
      this.dispatchEvent(new CustomEvent('pill-change', { detail: { value: val }, bubbles: true }));
      this._render();
    }

    _toggleDir() {
      const dir = this.direction === 'asc' ? 'desc' : 'asc';
      this.setAttribute('direction', dir);
      this.dispatchEvent(new CustomEvent('direction-change', { detail: { direction: dir }, bubbles: true }));
      this._render();
    }

    _render() {
      const label = this.getAttribute('label') || '';
      const items = this._getItems();
      const active = this.value;
      const dir = this.direction;
      const activeItem = items.find(i => i.value === active);
      const activeLabel = activeItem ? activeItem.label : active || 'Select';

      const options = items.map(item =>
        `<button type="button" class="sort-option${item.value === active ? ' active' : ''}" data-value="${item.value}">${item.label}</button>`
      ).join('');

      const dirHtml = dir ? `<span class="sort-dir" title="Toggle direction">${dir === 'asc' ? '↑' : '↓'}</span>` : '';

      this.innerHTML = `<div class="filter-row">
        ${label ? `<span class="filter-label">${label}</span>` : ''}
        <div class="sort-pill${this._open ? ' open' : ''}">
          <span class="sort-pill-trigger">${activeLabel} <span class="chevron">▾</span></span>
          <div class="sort-pill-menu">${options}</div>
          ${dirHtml}
        </div>
      </div>`;

      this.querySelector('.sort-pill-trigger')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._open = !this._open;
        this._render();
      });
      this.querySelectorAll('.sort-option').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); this._select(btn.dataset.value); });
      });
      this.querySelector('.sort-dir')?.addEventListener('click', (e) => { e.stopPropagation(); this._toggleDir(); });
    }
  }

  customElements.define('cc-pill-dropdown', CcPillDropdown);
})();
