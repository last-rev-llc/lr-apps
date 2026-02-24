/**
 * TQTable - Data table component with sorting
 * 
 * @element tq-table
 * @attr {string} columns - JSON array of column definitions
 * @attr {boolean} sortable - Enable sorting
 * @attr {string} empty-message - Message when no data
 * @fires tq-row-click - Fired when row is clicked
 */
export class TQTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = [];
    this._sortColumn = null;
    this._sortDirection = 'asc';
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-table');
    this.render();
  }

  static get observedAttributes() {
    return ['columns', 'sortable', 'empty-message'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  /**
   * Set table data
   * @param {Array} data - Array of row objects
   */
  setData(data) {
    this._data = data || [];
    this.render();
  }

  getColumns() {
    const columnsAttr = this.getAttribute('columns') || '[]';
    try {
      return JSON.parse(columnsAttr);
    } catch (e) {
      console.error('Invalid columns JSON:', e);
      return [];
    }
  }

  sortData(column) {
    if (this._sortColumn === column) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = 'asc';
    }

    this._data.sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return this._sortDirection === 'asc' ? comparison : -comparison;
    });

    this.render();
  }

  setupEventHandlers() {
    const sortable = this.hasAttribute('sortable');
    if (sortable) {
      const headers = this.shadowRoot.querySelectorAll('.sortable');
      headers.forEach(header => {
        header.addEventListener('click', () => {
          const column = header.dataset.column;
          this.sortData(column);
        });
      });
    }

    const rows = this.shadowRoot.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
      row.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('tq-row-click', {
          detail: { row: this._data[index], index },
          bubbles: true,
          composed: true
        }));
      });
    });
  }

  render() {
    const columns = this.getColumns();
    const sortable = this.hasAttribute('sortable');
    const emptyMessage = this.getAttribute('empty-message') || 'No data available';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        .table-container {
          overflow-x: auto;
          border-radius: var(--radius-lg, 0.75rem);
          border: 1px solid var(--gray-200, #e5e7eb);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-family: var(--font-sans, sans-serif);
        }

        thead {
          background: var(--gray-50, #f9fafb);
          border-bottom: 2px solid var(--gray-200, #e5e7eb);
        }

        th {
          padding: 0.875rem 1rem;
          text-align: left;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--gray-700, #374151);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        th.sortable {
          cursor: pointer;
          user-select: none;
          position: relative;
        }

        th.sortable:hover {
          background: var(--gray-100, #f3f4f6);
        }

        th.sortable::after {
          content: '';
          margin-left: 0.5rem;
          opacity: 0.3;
        }

        th.sortable.active::after {
          opacity: 1;
        }

        th.sortable[data-direction="asc"]::after {
          content: '↑';
        }

        th.sortable[data-direction="desc"]::after {
          content: '↓';
        }

        tbody tr {
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
          transition: background 0.2s ease;
          cursor: pointer;
        }

        tbody tr:hover {
          background: var(--gray-50, #f9fafb);
        }

        tbody tr:last-child {
          border-bottom: none;
        }

        td {
          padding: 1rem;
          font-size: 0.875rem;
          color: var(--gray-900, #111827);
        }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--gray-500, #6b7280);
          font-size: 0.875rem;
        }
      </style>
      <div class="table-container">
        ${this._data.length === 0 ? `
          <div class="empty-state">${emptyMessage}</div>
        ` : `
          <table>
            <thead>
              <tr>
                ${columns.map(col => {
                  const key = col.key || col;
                  const label = col.label || key;
                  const isSorted = this._sortColumn === key;
                  return `
                    <th 
                      class="${sortable ? 'sortable' : ''} ${isSorted ? 'active' : ''}" 
                      data-column="${key}"
                      ${isSorted ? `data-direction="${this._sortDirection}"` : ''}
                    >
                      ${label}
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${this._data.map(row => `
                <tr>
                  ${columns.map(col => {
                    const key = col.key || col;
                    const format = col.format;
                    let value = row[key] ?? '';
                    
                    if (format && typeof format === 'function') {
                      value = format(value, row);
                    }
                    
                    return `<td>${value}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-table', TQTable);
