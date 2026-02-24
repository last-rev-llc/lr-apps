/**
 * TQInspectionCard - Inspection/QA walk card component
 * 
 * @element tq-inspection-card
 * @attr {string} view - Display mode (card|list|expanded)
 * @fires tq-card-click - Fired when card is clicked
 */
export class TQInspectionCard extends HTMLElement {
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
      detail: { inspection: this._data },
      bubbles: true,
      composed: true
    }));
  }

  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit' 
    });
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
        .inspector {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--gray-100, #f3f4f6);
        }
        .location {
          font-size: 1rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .rating {
          margin-bottom: 1rem;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--gray-100, #f3f4f6);
          margin-top: auto;
        }
        .date {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
        }
      </style>
      <div class="card" role="button" tabindex="0">
        <!-- INSPECTOR FIRST -->
        <div class="inspector">
          ${data.inspector_name || data.inspector?.full_name 
            ? `<tq-avatar name="${data.inspector_name || data.inspector?.full_name}" role="Inspector" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">No inspector</span>'}
        </div>

        <div class="location">✓ ${data.location_name || data.locations?.name || 'Unknown Location'}</div>
        ${data.overall_rating ? `
          <div class="rating">
            <tq-rating value="${data.overall_rating}" size="md"></tq-rating>
          </div>
        ` : ''}
        <div class="card-footer">
          <tq-badge type="status" value="${data.status || 'in_progress'}"></tq-badge>
          <div class="date">${this.formatDate(data.created_at)}</div>
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
        .row-inspector { flex: 0 0 150px; }
        .row-location { font-weight: 600; flex: 0 0 200px; font-size: 0.875rem; }
        .row-status { flex: 0 0 100px; }
        .row-rating { flex: 0 0 120px; }
        .row-date { flex: 0 0 100px; font-size: 0.875rem; color: var(--gray-600, #4b5563); text-align: right; }
      </style>
      <div class="list-row" role="button" tabindex="0">
        <!-- INSPECTOR FIRST -->
        <div class="row-inspector">
          ${data.inspector_name || data.inspector?.full_name 
            ? `<tq-avatar name="${data.inspector_name || data.inspector?.full_name}" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">—</span>'}
        </div>
        <div class="row-location">${data.location_name || data.locations?.name || 'Unknown'}</div>
        <div class="row-status">
          <tq-badge type="status" value="${data.status || 'in_progress'}"></tq-badge>
        </div>
        <div class="row-rating">
          ${data.overall_rating ? `<tq-rating value="${data.overall_rating}" size="sm"></tq-rating>` : '<span style="color: var(--gray-400); font-size: 0.875rem;">Not rated</span>'}
        </div>
        <div class="row-date">${this.formatDate(data.created_at)}</div>
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
        .inspector {
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
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
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
        .notes {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-200, #e5e7eb);
          font-size: 0.875rem;
          color: var(--gray-700, #374151);
          white-space: pre-wrap;
        }
      </style>
      <div class="expanded-card" role="button" tabindex="0">
        <!-- INSPECTOR FIRST -->
        <div class="inspector">
          ${data.inspector_name || data.inspector?.full_name 
            ? `<tq-avatar name="${data.inspector_name || data.inspector?.full_name}" role="Inspector" size="md"></tq-avatar>` 
            : 'Not assigned'}
        </div>

        <div class="header">
          <div class="title">✓ ${data.location_name || data.locations?.name || 'Unknown Location'}</div>
          <tq-badge type="status" value="${data.status || 'in_progress'}"></tq-badge>
        </div>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Overall Rating</div>
            <div class="detail-value">
              ${data.overall_rating ? `<tq-rating value="${data.overall_rating}" size="md"></tq-rating>` : 'Not rated yet'}
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Date</div>
            <div class="detail-value">${this.formatDateTime(data.created_at)}</div>
          </div>
          ${data.completed_at ? `
            <div class="detail-item">
              <div class="detail-label">Completed</div>
              <div class="detail-value">${this.formatDateTime(data.completed_at)}</div>
            </div>
          ` : ''}
        </div>
        ${data.notes ? `<div class="notes">${data.notes}</div>` : ''}
      </div>
    `;

    this.shadowRoot.querySelector('.expanded-card').addEventListener('click', () => this.handleClick());
  }
}

customElements.define('tq-inspection-card', TQInspectionCard);
