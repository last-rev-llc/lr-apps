/**
 * TQToast - Toast notification component
 * 
 * @element tq-toast
 * Static method: TQToast.show(message, type, duration)
 */
export class TQToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - success|warning|danger|info
   * @param {number} duration - Duration in ms (default 3000)
   */
  static show(message, type = 'info', duration = 3000) {
    let container = document.querySelector('tq-toast-container');
    if (!container) {
      container = document.createElement('tq-toast-container');
      document.body.appendChild(container);
    }

    const toast = document.createElement('tq-toast');
    toast.setAttribute('message', message);
    toast.setAttribute('type', type);
    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
      toast.remove();
    }, duration);

    return toast;
  }

  render() {
    const message = this.getAttribute('message') || '';
    const type = this.getAttribute('type') || 'info';

    const icons = {
      success: '✓',
      warning: '⚠',
      danger: '✕',
      info: 'ℹ'
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 0.75rem;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-lg, 0.75rem);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          font-family: var(--font-sans, sans-serif);
          animation: slideIn 0.3s ease;
          min-width: 300px;
          max-width: 500px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toast.success {
          background: var(--success, #10b981);
          color: white;
        }

        .toast.warning {
          background: var(--warning, #f59e0b);
          color: white;
        }

        .toast.danger {
          background: var(--danger, #ef4444);
          color: white;
        }

        .toast.info {
          background: var(--info, #3b82f6);
          color: white;
        }

        .icon {
          font-size: 1.25rem;
          font-weight: bold;
        }

        .message {
          flex: 1;
          font-size: 0.875rem;
        }
      </style>
      <div class="toast ${type}">
        <span class="icon">${icons[type] || icons.info}</span>
        <span class="message">${message}</span>
      </div>
    `;
  }
}

// Container for toast notifications
class TQToastContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          pointer-events: none;
        }

        ::slotted(*) {
          pointer-events: auto;
        }
      </style>
      <slot></slot>
    `;
  }
}

customElements.define('tq-toast', TQToast);
customElements.define('tq-toast-container', TQToastContainer);
