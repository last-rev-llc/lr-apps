/**
 * TQ Page Header Component
 * 
 * Standardized page header with title, subtitle, and action button slot.
 * 
 * @example
 * <tq-page-header title="Locations" subtitle="Manage your service locations">
 *   <tq-button slot="actions" variant="primary" icon="➕">Add Location</tq-button>
 * </tq-page-header>
 * 
 * @attr {string} title - Page title (required)
 * @attr {string} subtitle - Optional subtitle/description
 * @attr {string} icon - Optional emoji/icon before title
 * @attr {string} count - Optional record count badge
 */
export class TQPageHeader extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'subtitle', 'icon', 'count'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-page-header');
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.render();
  }

  /** @param {number|string} count - Update the count badge */
  setCount(count) {
    this.setAttribute('count', count);
  }

  render() {
    const title = this.getAttribute('title') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    const icon = this.getAttribute('icon') || '';
    const count = this.getAttribute('count');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: var(--spacing-xl, 2rem);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-md, 1rem);
          flex-wrap: wrap;
        }

        .title-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs, 0.25rem);
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
        }

        h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .icon {
          font-size: 1.5rem;
        }

        .count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.5rem;
          height: 1.5rem;
          padding: 0 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--trinity-blue, #2c5f8d);
          background: rgba(44, 95, 141, 0.1);
          border-radius: 999px;
        }

        .subtitle {
          font-size: 0.9375rem;
          color: var(--gray-500, #6b7280);
          margin: 0;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 0.5rem);
        }

        @media (max-width: 640px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .actions {
            width: 100%;
          }

          .actions ::slotted(*) {
            width: 100%;
          }
        }
      </style>

      <div class="page-header">
        <div class="title-group">
          <div class="title-row">
            ${icon ? `<span class="icon">${icon}</span>` : ''}
            <h1>${title}</h1>
            ${count != null ? `<span class="count">${count}</span>` : ''}
          </div>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        </div>
        <div class="actions">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('tq-page-header', TQPageHeader);
