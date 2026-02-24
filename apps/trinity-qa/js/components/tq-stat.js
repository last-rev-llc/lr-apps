/**
 * TQStat - Dashboard stat card component
 * 
 * @element tq-stat
 * @attr {string} label - Stat label
 * @attr {string} value - Stat value
 * @attr {string} icon - Icon/emoji
 * @attr {string} change - Change value (e.g., "+12%")
 * @attr {string} change-type - up|down|neutral
 */
export class TQStat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-stat');
    this.render();
  }

  static get observedAttributes() {
    return ['label', 'value', 'icon', 'change', 'change-type'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  render() {
    const label = this.getAttribute('label') || '';
    const value = this.getAttribute('value') || '0';
    const icon = this.getAttribute('icon') || '';
    const change = this.getAttribute('change') || '';
    const changeType = this.getAttribute('change-type') || 'neutral';

    const changeIcons = {
      up: '↑',
      down: '↓',
      neutral: '→'
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .stat-card {
          background: white;
          border-radius: var(--radius-lg, 0.75rem);
          padding: var(--spacing-lg, 1.5rem);
          border: 1px solid var(--gray-200, #e5e7eb);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--gray-600, #4b5563);
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-family: var(--font-sans, sans-serif);
        }

        .icon {
          font-size: 1.5rem;
          opacity: 0.7;
        }

        .value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 0.5rem;
          font-family: var(--font-sans, sans-serif);
        }

        .change {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm, 0.25rem);
        }

        .change.up {
          background: color-mix(in srgb, var(--success, #10b981) 10%, transparent);
          color: var(--success, #10b981);
        }

        .change.down {
          background: color-mix(in srgb, var(--danger, #ef4444) 10%, transparent);
          color: var(--danger, #ef4444);
        }

        .change.neutral {
          background: var(--gray-100, #f3f4f6);
          color: var(--gray-600, #4b5563);
        }

        .change-icon {
          font-size: 1em;
        }
      </style>
      <div class="stat-card">
        <div class="stat-header">
          <div class="label">${label}</div>
          ${icon ? `<div class="icon">${icon}</div>` : ''}
        </div>
        <div class="value">${value}</div>
        ${change ? `
          <div class="change ${changeType}">
            <span class="change-icon">${changeIcons[changeType]}</span>
            <span>${change}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
}

customElements.define('tq-stat', TQStat);
