/* <cc-pill> — Self-coloring pill/badge/tag component
   Usage:
     <cc-pill>Design</cc-pill>
     <cc-pill variant="badge">Active</cc-pill>
     <cc-pill variant="tag">frontend</cc-pill>
     <cc-pill neutral>All</cc-pill>
     <cc-pill active>Selected</cc-pill>
     <cc-pill color="#ef4444">Custom</cc-pill>

   Attributes:
     variant  — "pill" (default) | "badge" | "tag"  — controls size/shape
     active   — (boolean) filled background style
     neutral  — (boolean) no color, uses default muted style
     color    — override the auto-assigned color
     count    — optional count badge shown after label

   Auto-colors based on text content using the shared 10-hue palette.
   Same label always gets the same color across all apps.

   Static helper:
     CcPill.colorFor(label) — returns color for any string
*/
(function () {
  const P = ['#7c3aed','#2563eb','#22c55e','#eab308','#ef4444','#f97316','#ec4899','#06b6d4','#8b5cf6','#14b8a6'];
  function hc(s) { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return P[Math.abs(h) % P.length]; }

  const STYLE = document.createElement('style');
  STYLE.textContent = `
    cc-pill {
      display: inline-flex; align-items: center; gap: 4px;
      border-radius: 99px; font-weight: 600; cursor: default;
      border: 1px solid color-mix(in srgb, var(--_pc, var(--glass-border, rgba(255,255,255,.1))) 40%, transparent);
      color: var(--_pc, var(--muted, #71717a));
      background: transparent;
      transition: all .15s;
      white-space: nowrap;
      user-select: none;
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    }
    /* Sizes by variant */
    cc-pill, cc-pill[variant="pill"] { padding: 6px 16px; font-size: 12px; }
    cc-pill[variant="badge"] { padding: 2px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
    cc-pill[variant="tag"] { padding: 2px 8px; font-size: 10px; font-weight: 500;
      background: color-mix(in srgb, var(--_pc, var(--muted, #71717a)) 14%, transparent);
      border: none;
    }
    /* Active state — filled */
    cc-pill[active] {
      background: var(--_pc, var(--accent, #f59e0b));
      color: white; border-color: var(--_pc, transparent);
    }
    /* Neutral — no color */
    cc-pill[neutral] { --_pc: var(--muted, #71717a); }
    /* Clickable pills */
    cc-pill[clickable] { cursor: pointer; }
    cc-pill[clickable]:hover { border-color: var(--_pc, var(--accent, #f59e0b)); color: var(--text, #fff); }
    /* Count badge */
    cc-pill .cc-pill-count { opacity: 0.6; font-size: 10px; }
  `;
  document.head.appendChild(STYLE);

  class CcPill extends HTMLElement {
    static PALETTE = P;
    static colorFor(label) { return hc(label); }
    static get observedAttributes() { return ['color', 'count', 'neutral']; }

    connectedCallback() { this._applyColor(); this._renderCount(); }
    attributeChangedCallback() { if (this.isConnected) { this._applyColor(); this._renderCount(); } }

    _applyColor() {
      if (this.hasAttribute('neutral')) { this.style.removeProperty('--_pc'); return; }
      const c = this.getAttribute('color') || hc(this.textContent.trim());
      this.style.setProperty('--_pc', c);
    }

    _renderCount() {
      const existing = this.querySelector('.cc-pill-count');
      if (existing) existing.remove();
      const count = this.getAttribute('count');
      if (count != null) {
        const span = document.createElement('span');
        span.className = 'cc-pill-count';
        span.textContent = count;
        this.appendChild(span);
      }
    }
  }

  customElements.define('cc-pill', CcPill);
})();
