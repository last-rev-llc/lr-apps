/**
 * TQLocationCard - Location card component
 * 
 * @element tq-location-card
 * @attr {string} view - Display mode (card|list|expanded)
 * @fires tq-card-click - Fired when card is clicked
 */
export class TQLocationCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = {};
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-location-card');
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
      detail: { location: this._data },
      bubbles: true,
      composed: true
    }));
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
        }
        .card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
          border-color: var(--trinity-blue, #2c5f8d);
        }
        .customer {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--gray-100, #f3f4f6);
        }
        .name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 0.75rem;
        }
        .address {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .badges {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .card-footer {
          padding-top: 0.75rem;
          border-top: 1px solid var(--gray-100, #f3f4f6);
          margin-top: auto;
          display: grid;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        .footer-row {
          display: flex;
          justify-content: space-between;
        }
        .label {
          color: var(--gray-500, #6b7280);
        }
        .value {
          color: var(--gray-900, #111827);
        }
      </style>
      <div class="card" role="button" tabindex="0">
        <!-- CUSTOMER FIRST -->
        <div class="customer">
          ${data.customer_name || data.customer?.full_name 
            ? `<tq-avatar name="${data.customer_name || data.customer?.full_name}" role="Customer" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">No customer</span>'}
        </div>

        <div class="name">📍 ${data.name || 'Unnamed Location'}</div>
        <div class="address">
          ${data.address || ''}<br/>
          ${data.city ? data.city + ', ' : ''}${data.state || ''} ${data.zip || ''}
        </div>
        <div class="badges">
          <tq-badge variant="neutral" value="${data.service_type || 'General'}"></tq-badge>
          <tq-badge variant="${data.is_active ? 'success' : 'neutral'}" value="${data.is_active ? 'Active' : 'Inactive'}"></tq-badge>
        </div>
        <div class="card-footer">
          <div class="footer-row">
            <span class="label">Account Mgr</span>
            <span class="value">${data.account_manager_name || data.account_manager?.full_name || 'Unassigned'}</span>
          </div>
        </div>
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
        .row-customer { flex: 0 0 120px; }
        .row-name { font-weight: 600; flex: 0 0 180px; font-size: 0.875rem; }
        .row-address { flex: 1; font-size: 0.875rem; color: var(--gray-600, #4b5563); }
        .row-badges { flex: 0 0 180px; display: flex; gap: 0.5rem; }
      </style>
      <div class="list-row" role="button" tabindex="0">
        <!-- CUSTOMER FIRST -->
        <div class="row-customer">
          ${data.customer_name || data.customer?.full_name 
            ? `<tq-avatar name="${data.customer_name || data.customer?.full_name}" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">N/A</span>'}
        </div>
        <div class="row-name">${data.name || 'Unnamed'}</div>
        <div class="row-address">${data.address}, ${data.city}, ${data.state}</div>
        <div class="row-badges">
          <tq-badge variant="neutral" value="${data.service_type || 'General'}"></tq-badge>
          <tq-badge variant="${data.is_active ? 'success' : 'neutral'}" value="${data.is_active ? 'Active' : 'Inactive'}"></tq-badge>
        </div>
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
        .customer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-200, #e5e7eb);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
        }
        .address {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .badges {
          display: flex;
          gap: 0.5rem;
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
        <!-- TITLE FIRST -->
        <div class="header">
          <div>
            <div class="title">📍 ${data.name || 'Unnamed Location'}</div>
            <div class="address">
              ${data.address || ''}<br/>
              ${data.city ? data.city + ', ' : ''}${data.state || ''} ${data.zip || ''}
            </div>
          </div>
          <div class="badges">
            <tq-badge variant="neutral" value="${data.service_type || 'General'}"></tq-badge>
            <tq-badge variant="${data.is_active ? 'success' : 'neutral'}" value="${data.is_active ? 'Active' : 'Inactive'}"></tq-badge>
          </div>
        </div>

        <!-- CUSTOMER BELOW -->
        <div class="customer">
          ${data.customer_name || data.customer?.full_name 
            ? `<tq-avatar name="${data.customer_name || data.customer?.full_name}" role="Customer" size="md"></tq-avatar>` 
            : 'No customer'}
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Account Manager</div>
            <div class="detail-value">${data.account_manager_name || data.account_manager?.full_name || 'Unassigned'}</div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.expanded-card').addEventListener('click', () => this.handleClick());
  }
}

customElements.define('tq-location-card', TQLocationCard);
