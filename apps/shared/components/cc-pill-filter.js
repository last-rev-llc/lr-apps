/* <cc-pill-filter> — Shared labeled pill filter row
   Usage:
     <cc-pill-filter label="Type" items='["All","Internal","Client"]' value="All"></cc-pill-filter>
     <cc-pill-filter label="Tags" items='["All","Design","Dev"]' value="All" colored></cc-pill-filter>

   Attributes:
     label    — Row label text
     items    — JSON array of pill labels, or JSON array of {value,label,count} objects
     value    — Currently active value
     counts   — Optional JSON object {value: count} for badge counts
     colored  — (boolean) When present, pills get hash-based colors from the shared palette

   Events:
     pill-change — detail: { value }

   JS API:
     .value (get/set)
     .items (set array)

   Static helper:
     CcPillFilter.colorFor(label) — Returns a color string for any label (useful for cards/badges)
*/
(function() {
  const PALETTE = ['#7c3aed','#2563eb','#22c55e','#eab308','#ef4444','#f97316','#ec4899','#06b6d4','#8b5cf6','#14b8a6'];

  function hashColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return PALETTE[Math.abs(h) % PALETTE.length];
  }

  class CcPillFilter extends HTMLElement {
    static get observedAttributes() { return ['label', 'items', 'value', 'counts', 'colored']; }
    static PALETTE = PALETTE;
    static colorFor(label) { return hashColor(label); }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    get value() { return this.getAttribute('value') || ''; }
    set value(v) { this.setAttribute('value', v); }
    get colored() { return this.hasAttribute('colored'); }

    _getItems() {
      try {
        const raw = JSON.parse(this.getAttribute('items') || '[]');
        return raw.map(i => typeof i === 'string' ? { value: i, label: i } : i);
      } catch { return []; }
    }

    _getCounts() {
      try { return JSON.parse(this.getAttribute('counts') || '{}'); } catch { return {}; }
    }

    _select(val) {
      this.setAttribute('value', val);
      this.dispatchEvent(new CustomEvent('pill-change', { detail: { value: val }, bubbles: true }));
    }

    _render() {
      const label = this.getAttribute('label') || '';
      const active = this.value;
      const items = this._getItems();
      const counts = this._getCounts();
      const useColor = this.colored;

      const pills = items.map(item => {
        const isActive = item.value === active;
        const count = item.count != null ? item.count : counts[item.value];
        const countHtml = count != null ? ` <span class="pill-count">${count}</span>` : '';
        const colorCls = useColor && item.value !== 'All' ? ' pill-colored' : '';
        const colorStyle = useColor && item.value !== 'All' ? ` style="--_pc:${hashColor(item.value)}"` : '';
        return `<button type="button" class="pill${isActive ? ' active' : ''}${colorCls}" data-value="${item.value}"${colorStyle}>${item.label}${countHtml}</button>`;
      }).join('');

      this.innerHTML = `<div class="filter-row">
        ${label ? `<span class="filter-label">${label}</span>` : ''}
        <div class="filter-pills">${pills}</div>
      </div>`;

      this.querySelectorAll('.pill').forEach(btn => {
        btn.addEventListener('click', () => this._select(btn.dataset.value));
      });
    }
  }

  customElements.define('cc-pill-filter', CcPillFilter);
})();
