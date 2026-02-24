/**
 * TQWorkOrderCard - Work order card component
 * 
 * @element tq-work-order-card
 * @attr {string} view - Display mode (card|list|expanded)
 * @fires tq-card-click - Fired when card is clicked
 */
export class TQWorkOrderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = {};
  }

  connectedCallback() {
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
      detail: { workOrder: this._data },
      bubbles: true,
      composed: true
    }));
  }

  truncate(text, length = 100) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
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
        :host {
          display: block;
        }

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

        .assigned {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--gray-100, #f3f4f6);
        }

        .unassigned {
          color: var(--gray-400);
          font-size: 0.875rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          gap: 0.5rem;
        }

        .title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          line-height: 1.4;
          flex: 1;
        }

        .badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .location {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .description {
          font-size: 0.875rem;
          color: var(--gray-700, #374151);
          line-height: 1.5;
          margin-bottom: 1rem;
          flex: 1;
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--gray-100, #f3f4f6);
          margin-top: auto;
        }

        .due-date {
          font-size: 0.875rem;
          color: var(--gray-500, #6b7280);
        }

        .due-date.overdue {
          color: var(--danger, #ef4444);
          font-weight: 600;
        }
      </style>
      <div class="card" role="button" tabindex="0">
        <!-- ASSIGNED TO FIRST -->
        <div class="assigned">
          ${data.assigned_to_name || data.assigned_to_profile?.full_name 
            ? `<tq-avatar name="${data.assigned_to_name || data.assigned_to_profile?.full_name}" size="sm"></tq-avatar>` 
            : '<span class="unassigned">Unassigned</span>'}
        </div>

        <div class="card-header">
          <div class="title">${data.title || 'Untitled Work Order'}</div>
        </div>
        <div class="badges">
          <tq-badge type="status" value="${data.status || 'open'}"></tq-badge>
          <tq-badge type="priority" value="${data.priority || 'medium'}"></tq-badge>
        </div>
        <div class="location">📍 ${data.location_name || data.locations?.name || 'No location'}</div>
        <div class="description">${this.truncate(data.description, 120)}</div>
        <div class="card-footer">
          <div class="due-date ${data.due_date && new Date(data.due_date) < new Date() ? 'overdue' : ''}">
            ${data.due_date ? '📅 ' + this.formatDate(data.due_date) : 'No due date'}
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
        :host {
          display: block;
        }

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

        .row-assigned {
          flex: 0 0 48px;
        }

        .row-content {
          flex: 1;
          min-width: 0;
        }

        .row-title {
          font-weight: 600;
          color: var(--trinity-navy, #1a2332);
          font-size: 0.9375rem;
          margin-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .row-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.8125rem;
          color: var(--gray-500, #6b7280);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .row-badges {
          display: flex;
          gap: 0.5rem;
          flex: 0 0 auto;
        }

        @media (max-width: 768px) {
          .list-row {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .row-assigned, .row-content, .row-badges {
            width: 100%;
          }

          .row-title {
            white-space: normal;
          }
        }
      </style>
      <div class="list-row" role="button" tabindex="0">
        <!-- ASSIGNED TO LEFT -->
        <div class="row-assigned">
          ${data.assigned_to_name || data.assigned_to_profile?.full_name 
            ? `<tq-avatar name="${data.assigned_to_name || data.assigned_to_profile?.full_name}" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">—</span>'}
        </div>

        <!-- TITLE + DATE/LOCATION MIDDLE -->
        <div class="row-content">
          <div class="row-title">${data.title || 'Untitled'}</div>
          <div class="row-meta">
            <span class="meta-item">📅 ${data.due_date ? this.formatDate(data.due_date) : 'No due date'}</span>
            <span class="meta-item">📍 ${data.location_name || data.locations?.name || 'No location'}</span>
          </div>
        </div>

        <!-- BADGES RIGHT -->
        <div class="row-badges">
          <tq-badge type="priority" value="${data.priority || 'medium'}"></tq-badge>
          <tq-badge type="status" value="${data.status || 'open'}"></tq-badge>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.list-row').addEventListener('click', () => this.handleClick());
  }

  renderExpanded() {
    const data = this._data;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

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

        .assigned {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
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
          margin-bottom: 0.5rem;
        }

        .location {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .badges {
          display: flex;
          gap: 0.5rem;
        }

        .description {
          font-size: 0.875rem;
          color: var(--gray-700, #374151);
          line-height: 1.6;
          margin: 1rem 0;
          white-space: pre-wrap;
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
          letter-spacing: 0.025em;
        }

        .detail-value {
          font-size: 0.875rem;
          color: var(--gray-900, #111827);
        }
      </style>
      <div class="expanded-card" role="button" tabindex="0">
        <!-- ASSIGNED TO FIRST -->
        <div class="assigned">
          ${data.assigned_to_name || data.assigned_to_profile?.full_name 
            ? `<tq-avatar name="${data.assigned_to_name || data.assigned_to_profile?.full_name}" size="md"></tq-avatar>` 
            : '<span style="color: var(--gray-400);">Unassigned</span>'}
        </div>

        <div class="header">
          <div>
            <div class="title">${data.title || 'Untitled Work Order'}</div>
            <div class="location">📍 ${data.location_name || data.locations?.name || 'No location'}</div>
          </div>
          <div class="badges">
            <tq-badge type="status" value="${data.status || 'open'}"></tq-badge>
            <tq-badge type="priority" value="${data.priority || 'medium'}"></tq-badge>
          </div>
        </div>
        
        ${data.description ? `<div class="description">${data.description}</div>` : ''}
        
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Due Date</div>
            <div class="detail-value">${data.due_date ? this.formatDate(data.due_date) : 'Not set'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Created</div>
            <div class="detail-value">${data.created_at ? this.formatDate(data.created_at) : 'Unknown'}</div>
          </div>
          ${data.created_by_name || data.created_by_profile?.full_name ? `
            <div class="detail-item">
              <div class="detail-label">Created By</div>
              <div class="detail-value">${data.created_by_name || data.created_by_profile?.full_name}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.expanded-card').addEventListener('click', () => this.handleClick());
  }
}

customElements.define('tq-work-order-card', TQWorkOrderCard);
