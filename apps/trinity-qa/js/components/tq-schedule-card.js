/**
 * TQScheduleCard - Schedule entry card component
 * 
 * @element tq-schedule-card
 * @attr {string} view - Display mode (card|list|expanded)
 * @fires tq-card-click - Fired when card is clicked
 */
export class TQScheduleCard extends HTMLElement {
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
      detail: { schedule: this._data },
      bubbles: true,
      composed: true
    }));
  }

  formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  formatTime(time) {
    if (!time) return '';
    return new Date('2000-01-01T' + time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
        .assigned-user {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--gray-100, #f3f4f6);
        }
        .date {
          font-size: 1rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 0.75rem;
        }
        .time {
          font-size: 0.875rem;
          color: var(--gray-600, #4b5563);
          margin-bottom: 1rem;
        }
        .location {
          font-size: 0.875rem;
          color: var(--gray-700, #374151);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
      </style>
      <div class="card" role="button" tabindex="0">
        <!-- ASSIGNED USER FIRST -->
        <div class="assigned-user">
          ${data.user_name || data.user?.full_name 
            ? `<tq-avatar name="${data.user_name || data.user?.full_name}" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">Unassigned</span>'}
        </div>

        <div class="date">📅 ${this.formatDate(data.shift_date)}</div>
        <div class="time">${this.formatTime(data.shift_start)} - ${this.formatTime(data.shift_end)}</div>
        <div class="location">📍 ${data.location_name || data.locations?.name || 'No location'}</div>
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
        .row-user { flex: 0 0 120px; }
        .row-date { font-weight: 600; flex: 0 0 120px; font-size: 0.875rem; }
        .row-time { flex: 0 0 150px; font-size: 0.875rem; color: var(--gray-600, #4b5563); }
        .row-location { flex: 0 0 150px; font-size: 0.875rem; }
      </style>
      <div class="list-row" role="button" tabindex="0">
        <!-- ASSIGNED USER FIRST -->
        <div class="row-user">
          ${data.user_name || data.user?.full_name 
            ? `<tq-avatar name="${data.user_name || data.user?.full_name}" size="sm"></tq-avatar>` 
            : '<span style="color: var(--gray-400); font-size: 0.875rem;">Unassigned</span>'}
        </div>
        <div class="row-date">${this.formatDate(data.shift_date)}</div>
        <div class="row-time">${this.formatTime(data.shift_start)} - ${this.formatTime(data.shift_end)}</div>
        <div class="row-location">${data.location_name || data.locations?.name || 'No location'}</div>
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
        .assigned-user {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
        }
        .title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--trinity-navy, #1a2332);
          margin-bottom: 1rem;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
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
        <!-- ASSIGNED USER FIRST -->
        <div class="assigned-user">
          ${data.user_name || data.user?.full_name 
            ? `<tq-avatar name="${data.user_name || data.user?.full_name}" size="md"></tq-avatar>` 
            : 'Unassigned'}
        </div>

        <div class="title">📅 ${this.formatDate(data.shift_date)}</div>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Time</div>
            <div class="detail-value">${this.formatTime(data.shift_start)} - ${this.formatTime(data.shift_end)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Location</div>
            <div class="detail-value">${data.location_name || data.locations?.name || 'No location'}</div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.expanded-card').addEventListener('click', () => this.handleClick());
  }
}

customElements.define('tq-schedule-card', TQScheduleCard);
