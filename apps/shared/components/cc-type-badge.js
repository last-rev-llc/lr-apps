/* <cc-type-badge> — Semantic content-type badge with predefined neon colors
   Usage:
     <cc-type-badge type="Image"></cc-type-badge>
     <cc-type-badge>Video</cc-type-badge>

   Attributes:
     type — "Image" | "Video" | "GIF" | "Audio" | "PDF" | "Presentation"

   Colors are predefined per type. Falls back to muted for unknown types.
*/
(function () {
  const TYPE_MAP = {
    image:        { color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
    video:        { color: '#8b5cf6', bg: 'rgba(139,92,246,.15)' },
    gif:          { color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
    audio:        { color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
    pdf:          { color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
    presentation: { color: '#06b6d4', bg: 'rgba(6,182,212,.15)' },
  };
  const FALLBACK = { color: 'var(--muted, #71717a)', bg: 'rgba(255,255,255,.06)' };

  const STYLE = document.createElement('style');
  STYLE.textContent = `
    cc-type-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      white-space: nowrap;
      letter-spacing: .3px;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(STYLE);

  class CcTypeBadge extends HTMLElement {
    static get observedAttributes() { return ['type']; }
    connectedCallback() { this._apply(); }
    attributeChangedCallback() { if (this.isConnected) this._apply(); }

    _apply() {
      const raw = (this.getAttribute('type') || this.textContent || '').trim().toLowerCase();
      const t = TYPE_MAP[raw] || FALLBACK;
      this.style.color = t.color;
      this.style.background = t.bg;
      if (!this.textContent.trim() && this.getAttribute('type')) {
        this.textContent = this.getAttribute('type');
      }
    }
  }

  customElements.define('cc-type-badge', CcTypeBadge);
})();
