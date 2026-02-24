/**
 * Locations View
 */

const LocationsView = {
  currentView: 'cards',
  data: [],
  filteredData: [],

  async render() {
    const container = document.getElementById('view-container');
    Components.showLoading(container);

    try {
      this.data = await this.fetchLocations();
      this.filteredData = [...this.data];

      container.innerHTML = `
        <div class="locations">
          <tq-page-header title="Locations" icon="📍">
            ${Auth.hasRole('admin', 'account_manager') ? `
              <tq-button slot="actions" variant="primary" icon="➕" onclick="LocationsView.showCreateModal()">
                Add Location
              </tq-button>
            ` : ''}
          </tq-page-header>

          <tq-filter-bar 
            id="locations-filter"
            searchable
            search-placeholder="Search locations..."
            filters='${JSON.stringify(this.getFilterConfig())}'
            sort-options='${JSON.stringify(this.getSortOptions())}'
          ></tq-filter-bar>

          <tq-view-toggle id="locations-view-toggle" default-view="cards"></tq-view-toggle>

          <div id="items-grid" class="items-grid" style="margin-top: var(--spacing-lg);"></div>
        </div>
      `;

      this.attachEventListeners();
      this.renderItems();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading locations: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading locations: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  getFilterConfig() {
    // Get unique service types from data
    const serviceTypes = [...new Set(this.data.map(loc => loc.service_type).filter(Boolean))];
    
    return [
      {
        key: 'service_type',
        label: 'Service Type',
        options: serviceTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }))
      }
    ];
  },

  getSortOptions() {
    return [
      { key: 'name_asc', label: 'Name: A-Z' },
      { key: 'name_desc', label: 'Name: Z-A' },
      { key: 'created_at_desc', label: 'Newest First' },
      { key: 'created_at_asc', label: 'Oldest First' }
    ];
  },

  attachEventListeners() {
    // View toggle
    const viewToggle = document.getElementById('locations-view-toggle');
    if (viewToggle) {
      this.currentView = viewToggle.view || 'cards';
      viewToggle.addEventListener('tq-view-change', (e) => {
        this.currentView = e.detail.view;
        this.renderItems();
      });
    }

    // Filter bar
    const filterBar = document.getElementById('locations-filter');
    if (filterBar) {
      filterBar.addEventListener('tq-filter-change', (e) => {
        this.applyFilters(e.detail);
      });
    }
  },

  applyFilters({ filters, sort, search }) {
    let result = [...this.data];

    // Apply service type filter
    if (filters.service_type) {
      result = result.filter(loc => loc.service_type === filters.service_type);
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(loc => 
        loc.name?.toLowerCase().includes(searchLower) ||
        loc.address?.toLowerCase().includes(searchLower) ||
        loc.city?.toLowerCase().includes(searchLower) ||
        loc.customer?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    if (sort) {
      const [field, direction] = sort.split('_');
      result.sort((a, b) => {
        let aVal = a[field] || '';
        let bVal = b[field] || '';
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    this.filteredData = result;
    this.renderItems();
  },

  renderItems() {
    const grid = document.getElementById('items-grid');
    if (!grid) return;

    if (!this.filteredData.length) {
      grid.innerHTML = '<tq-empty icon="📍" title="No Locations" message="No locations match your filters"></tq-empty>';
      return;
    }

    grid.innerHTML = '';
    grid.className = this.currentView === 'cards' ? 'items-grid view-cards' :
                     this.currentView === 'list' ? 'items-grid view-list' :
                     'items-grid view-expanded';

    this.filteredData.forEach(loc => {
      const card = document.createElement('tq-location-card');
      card.setAttribute('view', this.currentView);
      card.setData({
        ...loc,
        customer_name: loc.customer?.full_name,
        account_manager_name: loc.account_manager?.full_name
      });
      card.addEventListener('tq-card-click', (e) => {
        if (Auth.hasRole('admin', 'account_manager')) {
          this.showEditModal(e.detail.location.id);
        }
      });
      grid.appendChild(card);
    });
  },

  async fetchLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        customer:profiles!locations_customer_id_fkey (full_name),
        account_manager:profiles!locations_account_manager_id_fkey (full_name)
      `)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async showCreateModal() {
    const { data: customers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'customer')
      .order('full_name');

    const { data: accountManagers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'account_manager')
      .order('full_name');

    const content = `
      <form id="create-location-form">
        ${Components.createForm([
          {
            id: 'loc-name',
            name: 'name',
            label: 'Location Name',
            type: 'text',
            required: true,
            placeholder: 'e.g., Downtown Office Building'
          },
          {
            id: 'loc-address',
            name: 'address',
            label: 'Street Address',
            type: 'text',
            required: true
          },
          {
            id: 'loc-city',
            name: 'city',
            label: 'City',
            type: 'text',
            required: true
          },
          {
            id: 'loc-state',
            name: 'state',
            label: 'State',
            type: 'text',
            required: true,
            value: 'CA'
          },
          {
            id: 'loc-zip',
            name: 'zip',
            label: 'ZIP Code',
            type: 'text',
            required: true
          },
          {
            id: 'loc-service-type',
            name: 'service_type',
            label: 'Service Type',
            type: 'select',
            options: [
              { value: '', label: 'Select type...' },
              { value: 'office', label: 'Office' },
              { value: 'retail', label: 'Retail' },
              { value: 'healthcare', label: 'Healthcare' },
              { value: 'education', label: 'Education' },
              { value: 'industrial', label: 'Industrial' },
              { value: 'residential', label: 'Residential' }
            ]
          },
          {
            id: 'loc-customer',
            name: 'customer_id',
            label: 'Customer',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select customer...' },
              ...(customers || []).map(c => ({ value: c.id, label: c.full_name }))
            ]
          },
          {
            id: 'loc-account-manager',
            name: 'account_manager_id',
            label: 'Account Manager',
            type: 'select',
            options: [
              { value: '', label: 'Unassigned' },
              ...(accountManagers || []).map(am => ({ value: am.id, label: am.full_name }))
            ]
          },
          {
            id: 'loc-notes',
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            placeholder: 'Special instructions or information...'
          }
        ])}
      </form>
    `;

    Components.showModal('Add Location', content, [
      {
        label: 'Cancel',
        className: 'btn-secondary',
        action: 'cancel',
        handler: () => Components.closeModal()
      },
      {
        label: 'Create',
        className: 'btn-primary',
        action: 'create',
        handler: () => this.handleCreateLocation()
      }
    ]);
  },

  async handleCreateLocation() {
    const form = document.getElementById('create-location-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Components.getFormData('create-location-form');
    
    try {
      const { error } = await supabase
        .from('locations')
        .insert(data);

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Location created successfully', 'success');
      } else {
        Components.notify('Location created successfully', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error creating location: ' + error.message, 'danger');
      } else {
        Components.notify('Error creating location: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  async showEditModal(locationId) {
    TQToast.show('Edit location feature coming soon', 'info');
  }
};

window.LocationsView = LocationsView;
