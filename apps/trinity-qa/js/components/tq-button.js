/**
 * TQButton - Button component with variants and loading states
 * 
 * @element tq-button
 * @attr {string} variant - primary|secondary|success|danger|ghost
 * @attr {string} size - sm|md|lg
 * @attr {boolean} loading - Show loading spinner
 * @attr {boolean} disabled - Disable button
 * @attr {boolean} block - Full width button
 * @attr {string} icon - Icon name (basic support)
 */
export class TQButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventHandlers();
  }

  static get observedAttributes() {
    return ['variant', 'size', 'loading', 'disabled', 'block', 'icon'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  setupEventHandlers() {
    const button = this.shadowRoot.querySelector('button');
    if (button) {
      button.addEventListener('click', (e) => {
        if (this.hasAttribute('loading') || this.hasAttribute('disabled')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Let click bubble naturally to parent
      });
    }
  }

  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const loading = this.hasAttribute('loading');
    const disabled = this.hasAttribute('disabled');
    const block = this.hasAttribute('block');
    const icon = this.getAttribute('icon');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: ${block ? 'block' : 'inline-block'};
        }

        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: ${block ? '100%' : 'auto'};
          border: none;
          border-radius: var(--radius-md, 0.5rem);
          font-family: var(--font-sans, sans-serif);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          white-space: nowrap;
        }

        button:focus {
          outline: 2px solid var(--trinity-accent, #6ab0dd);
          outline-offset: 2px;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Sizes */
        button.sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        button.md {
          padding: 0.625rem 1.25rem;
          font-size: 1rem;
        }

        button.lg {
          padding: 0.875rem 1.75rem;
          font-size: 1.125rem;
        }

        /* Variants */
        button.primary {
          background: linear-gradient(135deg, var(--trinity-blue, #2c5f8d), var(--trinity-light-blue, #4a90c8));
          color: white;
        }

        button.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--trinity-light-blue, #4a90c8), var(--trinity-accent, #6ab0dd));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(44, 95, 141, 0.3);
        }

        button.secondary {
          background: var(--gray-100, #f3f4f6);
          color: var(--gray-900, #111827);
          border: 1px solid var(--gray-300, #d1d5db);
        }

        button.secondary:hover:not(:disabled) {
          background: var(--gray-200, #e5e7eb);
          border-color: var(--gray-400, #9ca3af);
        }

        button.success {
          background: var(--success, #10b981);
          color: white;
        }

        button.success:hover:not(:disabled) {
          background: color-mix(in srgb, var(--success, #10b981) 90%, black);
          transform: translateY(-1px);
        }

        button.danger {
          background: var(--danger, #ef4444);
          color: white;
        }

        button.danger:hover:not(:disabled) {
          background: color-mix(in srgb, var(--danger, #ef4444) 90%, black);
          transform: translateY(-1px);
        }

        button.ghost {
          background: transparent;
          color: var(--trinity-blue, #2c5f8d);
        }

        button.ghost:hover:not(:disabled) {
          background: color-mix(in srgb, var(--trinity-blue, #2c5f8d) 10%, transparent);
        }

        /* Loading spinner */
        .spinner {
          display: inline-block;
          width: 1em;
          height: 1em;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .icon {
          font-size: 1.2em;
        }
      </style>
      <button 
        class="${variant} ${size}" 
        ${disabled || loading ? 'disabled' : ''}
        type="button"
      >
        ${loading ? '<span class="spinner"></span>' : ''}
        ${icon && !loading ? `<span class="icon">${icon}</span>` : ''}
        <slot></slot>
      </button>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-button', TQButton);
