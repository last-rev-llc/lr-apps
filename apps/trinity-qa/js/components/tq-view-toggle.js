/**
 * TQViewToggle - View mode toggle (cards/list/expanded)
 * 
 * @element tq-view-toggle
 * @attr {string} view - Current view mode (cards|list|expanded)
 * @attr {string} default-view - Default view mode (default: cards)
 * @fires tq-view-change - Fired when view changes
 */
export class TQViewToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._storageKey = 'tq-view-preference';
  }

  connectedCallback() {
    // Restore from localStorage or use default
    const stored = localStorage.getItem(this._storageKey);
    const defaultView = this.getAttribute('default-view') || 'cards';
    this._currentView = this.getAttribute('view') || stored || defaultView;
    
    this.render();
    this.setupEventHandlers();
  }

  get view() {
    return this._currentView;
  }

  set view(val) {
    if (['cards', 'list', 'expanded'].includes(val)) {
      this._currentView = val;
      this.setAttribute('view', val);
      localStorage.setItem(this._storageKey, val);
      this.updateActiveState();
    }
  }

  setupEventHandlers() {
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.view;
        this.view = mode;
        
        this.dispatchEvent(new CustomEvent('tq-view-change', {
          detail: { view: mode },
          bubbles: true,
          composed: true
        }));
      });
    });
  }

  updateActiveState() {
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.dataset.view === this._currentView) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          gap: 0.25rem;
          background: var(--gray-100, #f3f4f6);
          border-radius: var(--radius-md, 0.5rem);
          padding: 0.25rem;
        }

        button {
          background: transparent;
          border: none;
          padding: 0.5rem;
          border-radius: var(--radius-sm, 0.25rem);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: var(--gray-600, #4b5563);
          width: 2rem;
          height: 2rem;
        }

        button:hover {
          background: var(--gray-200, #e5e7eb);
          color: var(--gray-900, #111827);
        }

        button.active {
          background: white;
          color: var(--trinity-blue, #2c5f8d);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        svg {
          width: 1rem;
          height: 1rem;
          fill: currentColor;
        }
      </style>
      <button data-view="cards" class="${this._currentView === 'cards' ? 'active' : ''}" title="Card view">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
      <button data-view="list" class="${this._currentView === 'list' ? 'active' : ''}" title="List view">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="2" rx="1"/>
          <rect x="3" y="11" width="18" height="2" rx="1"/>
          <rect x="3" y="17" width="18" height="2" rx="1"/>
        </svg>
      </button>
      <button data-view="expanded" class="${this._currentView === 'expanded' ? 'active' : ''}" title="Expanded view">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="6" rx="1"/>
          <rect x="3" y="12" width="18" height="6" rx="1"/>
        </svg>
      </button>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-view-toggle', TQViewToggle);
