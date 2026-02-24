/**
 * TQUserCard - User card component
 * 
 * @element tq-user-card
 * @attr {string} view - Display mode (card|list|expanded)
 * @fires tq-card-click - Fired when card is clicked
 */
export class TQUserCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = {};
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-user-card');
    this.render();
  }

  static get observedAttributes() {
    return ['view'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  setData(data) {
    this._data = data || {};
    this.render();
  }

  getData() {
    return this._data;
  }

  handleClick() {
    this.dispatchEvent(new CustomEvent('tq-card-click', {
      detail: { user: this._data },
      bubbles: true,
      composed: true
    }));
  }

  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  render() {
    const view = this.getAttribute('view') || 'card';
    
    if (view === 'list') {
      this.renderList();
    } else if (view === 'expanded') {
      this.renderExpanded();
    } else {
      this.renderCard();
    }
  }

  renderCard() {
    const data = this._data;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          background: white;
          border-radius: var(--radius-lg, 0.75rem);
          padding: 1.25rem;
          border: 1px solid var(--gray-200, #e5e7eb);
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
          border-color: var(--trinity-blue, #2c5f8d);
        }
        .avatar-wrapper {
          margin-bottom: 1rem;
        }
        .name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 0.5rem;
        }
        .email {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          margin-bottom: 1rem;
          word-break: break-all;
        }
        .badge-wrapper {
          margin-bottom: 1rem;
        }
        .card-footer {
          padding-top: 0.75rem;
          border-top: 1px solid var(--gray-100, #f3f4f6);
          margin-top: auto;
          width: 100%;
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
        }
      </style>
      <div class="card" role="button" tabindex="0">
        <div class="avatar-wrapper">
          <tq-avatar name="${data.full_name || 'Unknown'}" size="lg"></tq-avatar>
        </div>
        <div class="name">${data.full_name || 'Unknown User'}</div>
        <div class="email">${data.email || ''}</div>
        <div class="badge-wrapper">
          <tq-badge type="role" value="${data.role || 'user'}"></tq-badge>
        </div>
        ${data.phone ? `<div class="card-footer">📞 ${data.phone}</div>` : ''}
      </div>
    `;

    this.shadowRoot.querySelector('.card').addEventListener('click', () => this.handleClick());
  }

  renderList() {
    const data = this._data;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .list-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          background: white;
          border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: var(--radius-md, 0.5rem);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .list-row:hover {
          background: var(--gray-50, #f9fafb);
          border-color: var(--trinity-blue, #2c5f8d);
        }
        .row-user { flex: 0 0 200px; }
        .row-email { flex: 1; font-size: 0.875rem; color: var(--gray-600, #4b5563); }
        .row-role { flex: 0 0 150px; }
        .row-phone { flex: 0 0 120px; font-size: 0.875rem; color: var(--gray-600, #4b5563); }
      </style>
      <div class="list-row" role="button" tabindex="0">
        <div class="row-user">
          <tq-avatar name="${data.full_name || 'Unknown'}" size="sm"></tq-avatar>
        </div>
        <div class="row-email">${data.email || ''}</div>
        <div class="row-role">
          <tq-badge type="role" value="${data.role || 'user'}"></tq-badge>
        </div>
        <div class="row-phone">${data.phone || 'N/A'}</div>
      </div>
    `;

    this.shadowRoot.querySelector('.list-row').addEventListener('click', () => this.handleClick());
  }

  renderExpanded() {
    const data = this._data;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .expanded-card {
          background: white;
          border-radius: var(--radius-lg, 0.75rem);
          padding: 1.5rem;
          border: 1px solid var(--gray-200, #e5e7eb);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .expanded-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-color: var(--trinity-blue, #2c5f8d);
        }
        .header {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }
        .user-info {
          flex: 1;
        }
        .name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 0.25rem;
        }
        .email {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-200, #e5e7eb);
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--gray-600, #4b5563);
          text-transform: uppercase;
        }
        .detail-value {
          font-size: 0.875rem;
          color: var(--gray-900, #111827);
        }
      </style>
      <div class="expanded-card" role="button" tabindex="0">
        <div class="header">
          <tq-avatar name="${data.full_name || 'Unknown'}" size="xl"></tq-avatar>
          <div class="user-info">
            <div class="name">${data.full_name || 'Unknown User'}</div>
            <div class="email">${data.email || ''}</div>
          </div>
          <tq-badge type="role" value="${data.role || 'user'}"></tq-badge>
        </div>
        <div class="details-grid">
          ${data.phone ? `
            <div class="detail-item">
              <div class="detail-label">Phone</div>
              <div class="detail-value">${data.phone}</div>
            </div>
          ` : ''}
          <div class="detail-item">
            <div class="detail-label">Created</div>
            <div class="detail-value">${this.formatDate(data.created_at)}</div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.expanded-card').addEventListener('click', () => this.handleClick());
  }
}

customElements.define('tq-user-card', TQUserCard);
