/**
 * TQSurveyCard - Survey response card component
 * 
 * @element tq-survey-card
 * @attr {string} view - Display mode (card|list|expanded)
 * @fires tq-card-click - Fired when card is clicked
 */
export class TQSurveyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = {};
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-survey-card');
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
      detail: { survey: this._data },
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
        .location {
          font-size: 1rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .ratings {
          display: grid;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .rating-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }
        .rating-label {
          color: var(--gray-600, #4b5563);
        }
        .comments {
          font-size: 0.875rem;
          color: var(--gray-700, #374151);
          margin-bottom: 1rem;
          flex: 1;
        }
        .card-footer {
          padding-top: 0.75rem;
          border-top: 1px solid var(--gray-100, #f3f4f6);
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
        }
      </style>
      <div class="card" role="button" tabindex="0">
        <!-- CUSTOMER FIRST -->
        <div class="customer">
          ${data.customer_name || data.customer?.full_name 
            ? `<tq-avatar name="${data.customer_name || data.customer?.full_name}" role="Customer" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">Anonymous</span>'}
        </div>

        <div class="location">⭐ ${data.location_name || data.locations?.name || 'Unknown Location'}</div>
        <div class="ratings">
          <div class="rating-row">
            <span class="rating-label">Cleanliness</span>
            <tq-rating value="${data.cleanliness_rating || 0}" size="sm"></tq-rating>
          </div>
          <div class="rating-row">
            <span class="rating-label">Service</span>
            <tq-rating value="${data.service_quality_rating || 0}" size="sm"></tq-rating>
          </div>
          <div class="rating-row">
            <span class="rating-label">Satisfaction</span>
            <tq-rating value="${data.satisfaction_rating || 0}" size="sm"></tq-rating>
          </div>
        </div>
        ${data.comments ? `<div class="comments">${this.truncate(data.comments, 80)}</div>` : ''}
        <div class="card-footer">
          ${this.formatDate(data.submitted_at)}
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
        .row-customer { flex: 0 0 120px; font-size: 0.875rem; }
        .row-location { font-weight: 600; flex: 0 0 150px; font-size: 0.875rem; }
        .row-ratings { display: flex; gap: 1rem; flex: 1; }
        .row-date { flex: 0 0 100px; font-size: 0.875rem; color: var(--gray-600, #4b5563); text-align: right; }
      </style>
      <div class="list-row" role="button" tabindex="0">
        <!-- CUSTOMER FIRST -->
        <div class="row-customer">
          ${data.customer_name || data.customer?.full_name 
            ? `<tq-avatar name="${data.customer_name || data.customer?.full_name}" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">Anonymous</span>'}
        </div>
        <div class="row-location">${data.location_name || data.locations?.name || 'Unknown'}</div>
        <div class="row-ratings">
          <tq-rating value="${data.cleanliness_rating || 0}" size="sm"></tq-rating>
          <tq-rating value="${data.service_quality_rating || 0}" size="sm"></tq-rating>
          <tq-rating value="${data.satisfaction_rating || 0}" size="sm"></tq-rating>
        </div>
        <div class="row-date">${this.formatDate(data.submitted_at)}</div>
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
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
        }
        .date {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
        }
        .ratings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }
        .rating-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .rating-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--gray-600, #4b5563);
          text-transform: uppercase;
        }
        .comments {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-200, #e5e7eb);
          font-size: 0.875rem;
          color: var(--gray-700, #374151);
          white-space: pre-wrap;
        }
      </style>
      <div class="expanded-card" role="button" tabindex="0">
        <!-- CUSTOMER FIRST -->
        <div class="customer">
          ${data.customer_name || data.customer?.full_name 
            ? `<tq-avatar name="${data.customer_name || data.customer?.full_name}" role="Customer" size="md"></tq-avatar>` 
            : 'Anonymous'}
        </div>

        <div class="header">
          <div>
            <div class="title">⭐ ${data.location_name || data.locations?.name || 'Unknown Location'}</div>
            <div class="date">${this.formatDate(data.submitted_at)}</div>
          </div>
        </div>
        <div class="ratings-grid">
          <div class="rating-item">
            <div class="rating-label">Cleanliness Rating</div>
            <tq-rating value="${data.cleanliness_rating || 0}" size="md"></tq-rating>
          </div>
          <div class="rating-item">
            <div class="rating-label">Service Quality</div>
            <tq-rating value="${data.service_quality_rating || 0}" size="md"></tq-rating>
          </div>
          <div class="rating-item">
            <div class="rating-label">Overall Satisfaction</div>
            <tq-rating value="${data.satisfaction_rating || 0}" size="md"></tq-rating>
          </div>
        </div>
        ${data.comments ? `
          <div class="comments">
            <strong>Comments:</strong><br/>${data.comments}
          </div>
        ` : ''}
      </div>
    `;

    this.shadowRoot.querySelector('.expanded-card').addEventListener('click', () => this.handleClick());
  }
}

customElements.define('tq-survey-card', TQSurveyCard);
