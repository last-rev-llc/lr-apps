/**
 * Inspections (QA Walks) View
 */

const InspectionsView = {
  currentView: 'cards',
  data: [],
  filteredData: [],

  async render() {
    const container = document.getElementById('view-container');
    Components.showLoading(container);

    try {
      this.data = await this.fetchInspections();
      this.filteredData = [...this.data];

      container.innerHTML = `
        <div class="inspections">
          <tq-page-header title="QA Inspections" icon="✓">
            ${Auth.hasRole('admin', 'supervisor') ? `
              <tq-button slot="actions" variant="primary" icon="➕" onclick="InspectionsView.showCreateModal()">
                New Inspection
              </tq-button>
            ` : ''}
          </tq-page-header>

          <tq-filter-bar 
            id="inspections-filter"
            searchable
            search-placeholder="Search inspections..."
            filters='${JSON.stringify(this.getFilterConfig())}'
            sort-options='${JSON.stringify(this.getSortOptions())}'
          ></tq-filter-bar>

          <tq-view-toggle id="inspections-view-toggle" default-view="cards"></tq-view-toggle>

          <div id="items-grid" class="items-grid" style="margin-top: var(--spacing-lg);"></div>
        </div>
      `;

      this.attachEventListeners();
      this.renderItems();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading inspections: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading inspections: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  getFilterConfig() {
    return [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' }
        ]
      }
    ];
  },

  getSortOptions() {
    return [
      { key: 'created_at_desc', label: 'Newest First' },
      { key: 'created_at_asc', label: 'Oldest First' },
      { key: 'rating_desc', label: 'Highest Rated' },
      { key: 'rating_asc', label: 'Lowest Rated' }
    ];
  },

  attachEventListeners() {
    // View toggle
    const viewToggle = document.getElementById('inspections-view-toggle');
    if (viewToggle) {
      this.currentView = viewToggle.view || 'cards';
      viewToggle.addEventListener('tq-view-change', (e) => {
        this.currentView = e.detail.view;
        this.renderItems();
      });
    }

    // Filter bar
    const filterBar = document.getElementById('inspections-filter');
    if (filterBar) {
      filterBar.addEventListener('tq-filter-change', (e) => {
        this.applyFilters(e.detail);
      });
    }
  },

  applyFilters({ filters, sort, search }) {
    let result = [...this.data];

    // Apply status filter
    if (filters.status) {
      result = result.filter(insp => insp.status === filters.status);
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(insp => 
        insp.locations?.name?.toLowerCase().includes(searchLower) ||
        insp.inspector?.full_name?.toLowerCase().includes(searchLower) ||
        insp.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    if (sort) {
      const [field, direction] = sort.split('_');
      result.sort((a, b) => {
        let aVal = a[field === 'rating' ? 'overall_rating' : field] || 0;
        let bVal = b[field === 'rating' ? 'overall_rating' : field] || 0;
        
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
      grid.innerHTML = '<tq-empty icon="✓" title="No Inspections" message="No inspections match your filters"></tq-empty>';
      return;
    }

    grid.innerHTML = '';
    grid.className = this.currentView === 'cards' ? 'items-grid view-cards' :
                     this.currentView === 'list' ? 'items-grid view-list' :
                     'items-grid view-expanded';

    this.filteredData.forEach(insp => {
      const card = document.createElement('tq-inspection-card');
      card.setAttribute('view', this.currentView);
      card.setData({
        ...insp,
        location_name: insp.locations?.name,
        inspector_name: insp.inspector?.full_name
      });
      card.addEventListener('tq-card-click', () => {
        // Navigate to inspection detail when implemented
        TQToast.show('Inspection detail view coming soon', 'info');
      });
      grid.appendChild(card);
    });
  },

  async fetchInspections() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const query = supabase
      .from('inspections')
      .select(`
        *,
        locations (name),
        inspector:profiles!inspections_inspector_id_fkey (full_name)
      `)
      .order('created_at', { ascending: false });

    if (role === 'customer') {
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('customer_id', userId);
      
      if (locations && locations.length > 0) {
        query.in('location_id', locations.map(l => l.id));
      } else {
        return [];
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async showCreateModal() {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    const { data: checklists } = await supabase
      .from('checklists')
      .select('id, name')
      .eq('is_template', true)
      .order('name');

    const content = `
      <form id="create-inspection-form">
        ${Components.createForm([
          {
            id: 'insp-location',
            name: 'location_id',
            label: 'Location',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select location...' },
              ...(locations || []).map(loc => ({ value: loc.id, label: loc.name }))
            ]
          },
          {
            id: 'insp-checklist',
            name: 'checklist_id',
            label: 'Checklist Template',
            type: 'select',
            options: [
              { value: '', label: 'None' },
              ...(checklists || []).map(cl => ({ value: cl.id, label: cl.name }))
            ]
          },
          {
            id: 'insp-notes',
            name: 'notes',
            label: 'Initial Notes',
            type: 'textarea',
            placeholder: 'Any initial observations...'
          }
        ])}
      </form>
    `;

    Components.showModal('New Inspection', content, [
      {
        label: 'Cancel',
        className: 'btn-secondary',
        action: 'cancel',
        handler: () => Components.closeModal()
      },
      {
        label: 'Start Inspection',
        className: 'btn-primary',
        action: 'create',
        handler: () => this.handleCreateInspection()
      }
    ]);
  },

  async handleCreateInspection() {
    const form = document.getElementById('create-inspection-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Components.getFormData('create-inspection-form');
    
    try {
      const { error } = await supabase
        .from('inspections')
        .insert({
          ...data,
          inspector_id: Auth.currentUser.id,
          status: 'in_progress'
        });

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Inspection created successfully', 'success');
      } else {
        Components.notify('Inspection created successfully', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error creating inspection: ' + error.message, 'danger');
      } else {
        Components.notify('Error creating inspection: ' + error.message, 'error');
      }
      console.error(error);
    }
  }
};

window.InspectionsView = InspectionsView;
