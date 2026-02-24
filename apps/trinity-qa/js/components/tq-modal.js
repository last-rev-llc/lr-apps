/**
 * TQModal - Modal dialog component
 * 
 * @element tq-modal
 * @attr {string} modal-title - Modal title text
 * @attr {boolean} open - Whether modal is open
 * @attr {string} size - sm|md|lg|xl
 */
export class TQModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventHandlers();
  }

  static get observedAttributes() {
    return ['modal-title', 'open', 'size'];
  }

  attributeChangedCallback(name) {
    if (this.shadowRoot.children.length > 0) {
      if (name === 'open') {
        this.updateOpenState();
      } else {
        this.render();
        this.setupEventHandlers();
      }
    }
  }

  /**
   * Show the modal
   */
  show() {
    this.setAttribute('open', '');
  }

  /**
   * Close the modal
   */
  close() {
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('tq-close', {
      bubbles: true,
      composed: true
    }));
  }

  updateOpenState() {
    const modal = this.shadowRoot.querySelector('.modal');
    if (modal) {
      if (this.hasAttribute('open')) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      } else {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  }

  setupEventHandlers() {
    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    const closeBtn = this.shadowRoot.querySelector('.close-button');

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // ESC key handler
    this._escapeHandler = (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._escapeHandler);
    document.body.style.overflow = '';
  }

  render() {
    const title = this.getAttribute('modal-title') || '';
    const size = this.getAttribute('size') || 'md';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: contents;
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
        }

        .modal.open {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-container {
          position: relative;
          background: white;
          border-radius: var(--radius-xl, 1rem);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
          margin: 1rem;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-container.sm { width: 100%; max-width: 400px; }
        .modal-container.md { width: 100%; max-width: 600px; }
        .modal-container.lg { width: 100%; max-width: 800px; }
        .modal-container.xl { width: 100%; max-width: 1200px; }

        .modal-header {
          padding: var(--spacing-lg, 1.5rem);
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin: 0;
          font-family: var(--font-sans, sans-serif);
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--gray-500, #6b7280);
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          transition: color 0.2s ease;
        }

        .close-button:hover {
          color: var(--gray-900, #111827);
        }

        .modal-body {
          padding: var(--spacing-lg, 1.5rem);
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: var(--spacing-lg, 1.5rem);
          border-top: 1px solid var(--gray-200, #e5e7eb);
          background: var(--gray-50, #f9fafb);
        }

        .modal-footer:empty {
          display: none;
        }
      </style>
      <div class="modal ${this.hasAttribute('open') ? 'open' : ''}">
        <div class="modal-overlay"></div>
        <div class="modal-container ${size}">
          <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
            <button class="close-button" aria-label="Close modal">×</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `;

    this.setupEventHandlers();
    this.updateOpenState();
  }
}

customElements.define('tq-modal', TQModal);
