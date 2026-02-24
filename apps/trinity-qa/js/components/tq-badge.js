/**
 * TQBadge - Status/priority/role badge component
 * 
 * @element tq-badge
 * @attr {string} type - Badge type: status|priority|role
 * @attr {string} value - Badge value/text
 * @attr {string} variant - Color variant override
 */
export class TQBadge extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-badge');
    this.render();
  }

  static get observedAttributes() {
    return ['type', 'value', 'variant'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  getColorClass() {
    const type = this.getAttribute('type') || 'status';
    const value = (this.getAttribute('value') || '').toLowerCase();
    const variant = this.getAttribute('variant');

    if (variant) return variant;

    // Status mappings
    if (type === 'status') {
      if (['completed', 'passed', 'active', 'approved'].includes(value)) return 'success';
      if (['pending', 'in-progress', 'review'].includes(value)) return 'warning';
      if (['failed', 'rejected', 'blocked'].includes(value)) return 'danger';
      return 'info';
    }

    // Priority mappings
    if (type === 'priority') {
      if (value === 'critical') return 'danger';
      if (value === 'high') return 'warning';
      if (value === 'medium') return 'info';
      return 'neutral';
    }

    // Role mappings
    if (type === 'role') {
      if (['admin', 'manager'].includes(value)) return 'primary';
      return 'neutral';
    }

    return 'neutral';
  }

  render() {
    const value = this.getAttribute('value') || '';
    const colorClass = this.getColorClass();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-md, 0.5rem);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          white-space: nowrap;
          font-family: var(--font-sans, sans-serif);
        }

        .badge.success {
          background-color: color-mix(in srgb, var(--success, #10b981) 10%, transparent);
          color: var(--success, #10b981);
          border: 1px solid color-mix(in srgb, var(--success, #10b981) 30%, transparent);
        }

        .badge.warning {
          background-color: color-mix(in srgb, var(--warning, #f59e0b) 10%, transparent);
          color: var(--warning, #f59e0b);
          border: 1px solid color-mix(in srgb, var(--warning, #f59e0b) 30%, transparent);
        }

        .badge.danger {
          background-color: color-mix(in srgb, var(--danger, #ef4444) 10%, transparent);
          color: var(--danger, #ef4444);
          border: 1px solid color-mix(in srgb, var(--danger, #ef4444) 30%, transparent);
        }

        .badge.info {
          background-color: color-mix(in srgb, var(--info, #3b82f6) 10%, transparent);
          color: var(--info, #3b82f6);
          border: 1px solid color-mix(in srgb, var(--info, #3b82f6) 30%, transparent);
        }

        .badge.primary {
          background-color: color-mix(in srgb, var(--trinity-blue, #2c5f8d) 15%, transparent);
          color: var(--trinity-light-blue, #4a90c8);
          border: 1px solid color-mix(in srgb, var(--trinity-blue, #2c5f8d) 30%, transparent);
        }

        .badge.neutral {
          background-color: var(--gray-100, #f3f4f6);
          color: var(--gray-700, #374151);
          border: 1px solid var(--gray-200, #e5e7eb);
        }
      </style>
      <span class="badge ${colorClass}">${value}</span>
    `;
  }
}

customElements.define('tq-badge', TQBadge);
