/**
 * TQEmpty - Empty state component
 * 
 * @element tq-empty
 * @attr {string} icon - Icon/emoji to display
 * @attr {string} title - Empty state title
 * @attr {string} message - Empty state message
 * @slot default - Action button or additional content
 */
export class TQEmpty extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-empty');
    this.render();
  }

  static get observedAttributes() {
    return ['icon', 'title', 'message'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  render() {
    const icon = this.getAttribute('icon') || '📭';
    const title = this.getAttribute('title') || 'No data';
    const message = this.getAttribute('message') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--gray-900, #111827);
          margin: 0 0 0.5rem 0;
          font-family: var(--font-sans, sans-serif);
        }

        .message {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          margin: 0 0 1.5rem 0;
          max-width: 400px;
          line-height: 1.5;
        }

        .action {
          margin-top: 0.5rem;
        }
      </style>
      <div class="empty-state">
        <div class="icon">${icon}</div>
        <h3 class="title">${title}</h3>
        ${message ? `<p class="message">${message}</p>` : ''}
        <div class="action">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('tq-empty', TQEmpty);
