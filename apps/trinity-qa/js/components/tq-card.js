/**
 * TQCard - Content card component with optional collapsing
 * 
 * @element tq-card
 * @attr {string} card-title - Card title text
 * @attr {string} subtitle - Card subtitle text
 * @attr {boolean} collapsible - Enable collapse functionality
 * @slot default - Main card content
 * @slot header-actions - Actions in header (buttons, etc)
 * @slot footer - Card footer content
 */
export class TQCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._collapsed = false;
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-card');
    this.render();
    this.setupEventHandlers();
  }

  static get observedAttributes() {
    return ['card-title', 'subtitle', 'collapsible'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
      this.setupEventHandlers();
    }
  }

  setupEventHandlers() {
    const toggle = this.shadowRoot.querySelector('.collapse-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        this._collapsed = !this._collapsed;
        this.updateCollapseState();
      });
    }
  }

  updateCollapseState() {
    const content = this.shadowRoot.querySelector('.card-content');
    const icon = this.shadowRoot.querySelector('.collapse-icon');
    if (content) {
      content.style.display = this._collapsed ? 'none' : 'block';
    }
    if (icon) {
      icon.textContent = this._collapsed ? '▶' : '▼';
    }
  }

  render() {
    const title = this.getAttribute('card-title') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    const collapsible = this.hasAttribute('collapsible');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .card {
          background: white;
          border-radius: var(--radius-lg, 0.75rem);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid var(--gray-200, #e5e7eb);
        }

        .card-header {
          padding: var(--spacing-lg, 1.5rem);
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .card-header.collapsible {
          cursor: pointer;
          user-select: none;
        }

        .card-header.collapsible:hover {
          background: var(--gray-50, #f9fafb);
        }

        .header-left {
          flex: 1;
          min-width: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin: 0;
          font-family: var(--font-sans, sans-serif);
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          margin: 0.25rem 0 0 0;
        }

        .collapse-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          color: var(--gray-600, #4b5563);
          font-size: 0.75rem;
        }

        .collapse-icon {
          transition: transform 0.2s ease;
        }

        .card-content {
          padding: var(--spacing-lg, 1.5rem);
        }

        .card-footer {
          padding: var(--spacing-lg, 1.5rem);
          border-top: 1px solid var(--gray-200, #e5e7eb);
          background: var(--gray-50, #f9fafb);
        }

        .card-footer:empty {
          display: none;
        }
      </style>
      <div class="card">
        ${title || subtitle ? `
          <div class="card-header ${collapsible ? 'collapsible' : ''}" ${collapsible ? 'role="button" tabindex="0"' : ''}>
            <div class="header-left">
              ${title ? `<h3 class="card-title">${title}</h3>` : ''}
              ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
            </div>
            <div class="header-actions">
              <slot name="header-actions"></slot>
              ${collapsible ? '<button class="collapse-toggle" aria-label="Toggle collapse"><span class="collapse-icon">▼</span></button>' : ''}
            </div>
          </div>
        ` : ''}
        <div class="card-content">
          <slot></slot>
        </div>
        <div class="card-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-card', TQCard);
