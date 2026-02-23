/* <cc-filter-drawer> — Slide-out filter/search sidebar
   Usage:
     <cc-filter-drawer title="Filters">
       <!-- filter controls as light DOM children -->
     </cc-filter-drawer>

   API:
     .open()   — show drawer
     .close()  — hide drawer
     .toggle() — toggle
     .isOpen   — boolean
     .active   — set true/false to show badge dot on trigger button

   Events: cc-filter-drawer-open, cc-filter-drawer-close

   Attributes:
     title   — drawer header text (default: "Filters")
     active  — presence = show active dot on trigger button

   The component renders its own trigger button. Place it inline where needed.
   Use CSS to position: cc-filter-drawer { display: inline-flex; }
*/
(function() {
  const STYLE = `
    :host { display: inline-flex; align-items: center; }

    /* Trigger button */
    .cc-fd-trigger {
      position: relative;
      background: var(--glass, rgba(255,255,255,0.08));
      border: 1px solid var(--glass-border, rgba(255,255,255,0.15));
      color: var(--muted, #94a3b8);
      cursor: pointer;
      padding: 8px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      transition: all .15s ease;
    }
    .cc-fd-trigger:hover {
      color: var(--text, #fff);
      background: var(--glass-hover, rgba(255,255,255,0.12));
      border-color: var(--accent, #f59e0b);
    }
    .cc-fd-trigger svg { width: 18px; height: 18px; }
    .cc-fd-dot {
      display: none;
      position: absolute; top: 4px; right: 4px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent, #f59e0b);
      box-shadow: 0 0 6px var(--accent, #f59e0b);
    }
    :host([active]) .cc-fd-dot { display: block; }

    /* Backdrop */
    .cc-fd-backdrop {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.5); opacity: 0;
      transition: opacity .25s ease;
      pointer-events: none;
    }
    .cc-fd-backdrop.open { opacity: 1; pointer-events: auto; }

    /* Panel */
    .cc-fd-panel {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 320px; max-width: 90vw; z-index: 1000;
      background: var(--bg, #0a0e1a);
      border-left: 1px solid var(--border, #333);
      box-shadow: -4px 0 30px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform .25s cubic-bezier(.4,0,.2,1);
    }
    .cc-fd-panel.open { transform: translateX(0); }

    /* Header */
    .cc-fd-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 16px 12px; border-bottom: 1px solid var(--border, #333);
      flex-shrink: 0;
    }
    .cc-fd-header h3 {
      margin: 0; font-size: 15px; font-weight: 600;
      color: var(--text, #fff);
      display: flex; align-items: center; gap: 8px;
    }
    .cc-fd-header h3 svg { width: 16px; height: 16px; color: var(--accent, #f59e0b); }
    .cc-fd-close {
      background: none; border: none; color: var(--muted, #888);
      cursor: pointer; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: all .15s;
    }
    .cc-fd-close:hover { color: var(--text, #fff); background: var(--glass, rgba(255,255,255,0.08)); }
    .cc-fd-close svg { width: 18px; height: 18px; }

    /* Body */
    .cc-fd-body {
      padding: 16px; flex: 1;
      display: flex; flex-direction: column; gap: 12px;
    }
    .cc-fd-body ::slotted(*) { width: 100%; }
    .cc-fd-body ::slotted(cc-pill-dropdown) { width: 100%; }
    .cc-fd-body ::slotted(.filter-section-label) {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
      color: var(--muted, #888); margin: 4px 0 -4px;
    }
  `;

  class CcFilterDrawer extends HTMLElement {
    static get observedAttributes() { return ['active', 'title']; }

    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
      this._isOpen = false;
    }

    connectedCallback() {
      const title = this.getAttribute('title') || 'Filters';
      this._shadow.innerHTML = `
        <style>${STYLE}</style>
        <button class="cc-fd-trigger" aria-label="Open filters" part="trigger">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>
          <span class="cc-fd-dot"></span>
        </button>
        <div class="cc-fd-backdrop" part="backdrop"></div>
        <div class="cc-fd-panel" part="panel">
          <div class="cc-fd-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>
              ${title}
            </h3>
            <button class="cc-fd-close" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div class="cc-fd-body">
            <slot></slot>
          </div>
        </div>
      `;

      this._trigger = this._shadow.querySelector('.cc-fd-trigger');
      this._backdrop = this._shadow.querySelector('.cc-fd-backdrop');
      this._panel = this._shadow.querySelector('.cc-fd-panel');
      this._closeBtn = this._shadow.querySelector('.cc-fd-close');

      this._trigger.addEventListener('click', () => this.toggle());
      this._backdrop.addEventListener('click', () => this.close());
      this._closeBtn.addEventListener('click', () => this.close());

      this._onKey = (e) => { if (e.key === 'Escape' && this._isOpen) this.close(); };
      document.addEventListener('keydown', this._onKey);
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this._onKey);
    }

    get isOpen() { return this._isOpen; }
    get active() { return this.hasAttribute('active'); }
    set active(v) { v ? this.setAttribute('active', '') : this.removeAttribute('active'); }

    open() {
      this._isOpen = true;
      this._backdrop.classList.add('open');
      this._panel.classList.add('open');
      this.dispatchEvent(new CustomEvent('cc-filter-drawer-open', { bubbles: true }));
    }

    close() {
      this._isOpen = false;
      this._backdrop.classList.remove('open');
      this._panel.classList.remove('open');
      this.dispatchEvent(new CustomEvent('cc-filter-drawer-close', { bubbles: true }));
    }

    toggle() {
      this._isOpen ? this.close() : this.open();
    }
  }

  if (!customElements.get('cc-filter-drawer')) {
    customElements.define('cc-filter-drawer', CcFilterDrawer);
  }
})();
