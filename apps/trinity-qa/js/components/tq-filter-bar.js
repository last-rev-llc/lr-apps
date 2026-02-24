/**
 * TQFilterBar - Filter, search, and sort bar for list views
 * Uses tq-input and tq-button components internally.
 * 
 * @element tq-filter-bar
 * @attr {string} filters - JSON array of filter configs [{key, label, options: [{value, label}]}]
 * @attr {string} sort-options - JSON array of sort options [{key, label}]
 * @attr {boolean} searchable - Show search input
 * @attr {string} search-placeholder - Custom search placeholder
 * @fires tq-filter-change - Fired when any filter, search, or sort value changes
 */
export class TQFilterBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._filterValues = {};
    this._sortValue = '';
    this._searchValue = '';
    this._debounceTimer = null;
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-filter-bar');
    this.render();
    this.setupEventHandlers();
  }

  static get observedAttributes() {
    return ['filters', 'sort-options', 'searchable', 'search-placeholder'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
      this.setupEventHandlers();
    }
  }

  /** @returns {Array} Parsed filter configurations */
  getFilters() {
    try { return JSON.parse(this.getAttribute('filters') || '[]'); }
    catch (e) { return []; }
  }

  /** @returns {Array} Parsed sort options */
  getSortOptions() {
    try { return JSON.parse(this.getAttribute('sort-options') || '[]'); }
    catch (e) { return []; }
  }

  /** @returns {Object} Current filter/sort/search state */
  getState() {
    return {
      filters: { ...this._filterValues },
      sort: this._sortValue,
      search: this._searchValue
    };
  }

  setupEventHandlers() {
    // Listen for tq-change events from child tq-input components
    this.shadowRoot.addEventListener('tq-change', (e) => {
      const name = e.target.getAttribute('name');
      const value = e.detail?.value ?? e.target.value ?? '';

      if (name === '_search') {
        this._searchValue = value;
        // Debounce search
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.emitChange(), 250);
        return;
      }

      if (name === '_sort') {
        this._sortValue = value;
        this.emitChange();
        return;
      }

      // Filter select
      if (name?.startsWith('_filter_')) {
        const key = name.replace('_filter_', '');
        this._filterValues[key] = value;
        this.emitChange();
      }
    });

    // Clear button
    const clearBtn = this.shadowRoot.querySelector('#clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }
  }

  /** Emit the current filter state */
  emitChange() {
    this.dispatchEvent(new CustomEvent('tq-filter-change', {
      detail: this.getState(),
      bubbles: true,
      composed: true
    }));
  }

  /** Reset all filters, sort, and search */
  clearAll() {
    this._filterValues = {};
    this._sortValue = '';
    this._searchValue = '';

    // Reset all tq-input components
    this.shadowRoot.querySelectorAll('tq-input').forEach(input => {
      input.value = '';
    });

    this.emitChange();
  }

  render() {
    const filters = this.getFilters();
    const sortOptions = this.getSortOptions();
    const searchable = this.hasAttribute('searchable');
    const searchPlaceholder = this.getAttribute('search-placeholder') || 'Search...';

    // Build options JSON for each filter select — prepend "All" option
    const filterSelectOptions = (filter) => {
      const opts = [{ value: '', label: 'All' }, ...filter.options];
      return JSON.stringify(opts).replace(/"/g, '&quot;');
    };

    const sortSelectOptions = () => {
      const opts = sortOptions.map(o => ({ value: o.key, label: o.label }));
      return JSON.stringify(opts).replace(/"/g, '&quot;');
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: var(--spacing-lg, 1.5rem);
        }

        .filter-bar {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
          flex-wrap: wrap;
          padding: 1rem;
          background: var(--gray-50, #f9fafb);
          border-radius: var(--radius-lg, 0.75rem);
          border: 1px solid var(--gray-200, #e5e7eb);
        }

        .search-field {
          flex: 0 1 auto;
          min-width: 200px;
          max-width: 300px;
        }

        .filter-field {
          min-width: 150px;
        }

        .sort-field {
          min-width: 150px;
        }

        .divider {
          width: 1px;
          height: 2.5rem;
          background: var(--gray-300, #d1d5db);
          align-self: center;
        }

        .clear-btn {
          align-self: flex-end;
          margin-top: 1.75rem; /* Account for label height */
        }

        @media (max-width: 640px) {
          .filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-field,
          .filter-field,
          .sort-field {
            min-width: unset;
            width: 100%;
          }

          .divider {
            display: none;
          }
        }
      </style>

      <div class="filter-bar">
        ${searchable ? `
          <div class="search-field">
            <tq-input
              type="text"
              name="_search"
              label="Search"
              placeholder="${searchPlaceholder}"
              value="${this._searchValue}"
            ></tq-input>
          </div>
        ` : ''}

        ${filters.map(filter => `
          <div class="filter-field">
            <tq-input
              type="select"
              name="_filter_${filter.key}"
              label="${filter.label}"
              options="${filterSelectOptions(filter)}"
              value="${this._filterValues[filter.key] || ''}"
            ></tq-input>
          </div>
        `).join('')}

        ${sortOptions.length > 0 ? `
          <div class="divider"></div>
          <div class="sort-field">
            <tq-input
              type="select"
              name="_sort"
              label="Sort By"
              options="${sortSelectOptions()}"
              value="${this._sortValue}"
            ></tq-input>
          </div>
        ` : ''}

        <div class="clear-btn">
          <tq-button id="clear-filters" variant="secondary" size="sm">Clear</tq-button>
        </div>
      </div>
    `;
  }
}

customElements.define('tq-filter-bar', TQFilterBar);
