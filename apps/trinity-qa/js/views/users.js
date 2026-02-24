/**
 * Users View (Admin Only)
 */

const UsersView = {
  currentView: 'cards',
  data: [],
  filteredData: [],

  async render() {
    const container = document.getElementById('view-container');
    
    if (!Auth.isAdmin()) {
      container.innerHTML = `<tq-empty icon="🔒" title="Access Denied" message="You don't have permission to view this page."></tq-empty>`;
      return;
    }

    Components.showLoading(container);

    try {
      this.data = await this.fetchUsers();
      this.filteredData = [...this.data];

      const stats = this.calculateRoleStats(this.data);

      container.innerHTML = `
        <div class="users">
          <tq-page-header title="User Management" icon="👥">
            <tq-button slot="actions" variant="primary" icon="➕" onclick="UsersView.showCreateModal()">
              Add User
            </tq-button>
          </tq-page-header>

          <!-- Role Stats -->
          <div class="stats-grid">
            <tq-stat label="Admins" value="${stats.admin}" icon="👑"></tq-stat>
            <tq-stat label="Account Managers" value="${stats.account_manager}" icon="💼"></tq-stat>
            <tq-stat label="Supervisors" value="${stats.supervisor}" icon="👷"></tq-stat>
            <tq-stat label="Janitors" value="${stats.janitor}" icon="🧹"></tq-stat>
            <tq-stat label="Customers" value="${stats.customer}" icon="🏢"></tq-stat>
          </div>

          <tq-filter-bar 
            id="users-filter"
            searchable
            search-placeholder="Search users..."
            filters='${JSON.stringify(this.getFilterConfig())}'
            sort-options='${JSON.stringify(this.getSortOptions())}'
          ></tq-filter-bar>

          <tq-view-toggle id="users-view-toggle" default-view="cards"></tq-view-toggle>

          <div id="items-grid" class="items-grid" style="margin-top: var(--spacing-lg);"></div>
        </div>
      `;

      this.attachEventListeners();
      this.renderItems();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading users: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading users: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  getFilterConfig() {
    return [
      {
        key: 'role',
        label: 'Role',
        options: [
          { value: 'admin', label: 'Admin' },
          { value: 'account_manager', label: 'Account Manager' },
          { value: 'supervisor', label: 'Supervisor' },
          { value: 'janitor', label: 'Janitor' },
          { value: 'customer', label: 'Customer' }
        ]
      }
    ];
  },

  getSortOptions() {
    return [
      { key: 'full_name_asc', label: 'Name: A-Z' },
      { key: 'full_name_desc', label: 'Name: Z-A' },
      { key: 'created_at_desc', label: 'Newest First' },
      { key: 'created_at_asc', label: 'Oldest First' }
    ];
  },

  calculateRoleStats(users) {
    const stats = {
      admin: 0,
      account_manager: 0,
      supervisor: 0,
      janitor: 0,
      customer: 0
    };

    users.forEach(user => {
      if (stats.hasOwnProperty(user.role)) {
        stats[user.role]++;
      }
    });

    return stats;
  },

  attachEventListeners() {
    // View toggle
    const viewToggle = document.getElementById('users-view-toggle');
    if (viewToggle) {
      this.currentView = viewToggle.view || 'cards';
      viewToggle.addEventListener('tq-view-change', (e) => {
        this.currentView = e.detail.view;
        this.renderItems();
      });
    }

    // Filter bar
    const filterBar = document.getElementById('users-filter');
    if (filterBar) {
      filterBar.addEventListener('tq-filter-change', (e) => {
        this.applyFilters(e.detail);
      });
    }
  },

  applyFilters({ filters, sort, search }) {
    let result = [...this.data];

    // Apply role filter
    if (filters.role) {
      result = result.filter(user => user.role === filters.role);
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(user => 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower)
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
      grid.innerHTML = '<tq-empty icon="👥" title="No Users" message="No users match your filters"></tq-empty>';
      return;
    }

    grid.innerHTML = '';
    grid.className = this.currentView === 'cards' ? 'items-grid view-cards' :
                     this.currentView === 'list' ? 'items-grid view-list' :
                     'items-grid view-expanded';

    this.filteredData.forEach(user => {
      const card = document.createElement('tq-user-card');
      card.setAttribute('view', this.currentView);
      card.setData(user);
      card.addEventListener('tq-card-click', (e) => {
        this.showEditModal(e.detail.user.id);
      });
      grid.appendChild(card);
    });
  },

  async fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) throw error;
    return data || [];
  },

  showCreateModal() {
    const content = `
      <form id="create-user-form">
        ${Components.createForm([
          {
            id: 'user-name',
            name: 'full_name',
            label: 'Full Name',
            type: 'text',
            required: true
          },
          {
            id: 'user-email',
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true
          },
          {
            id: 'user-role',
            name: 'role',
            label: 'Role',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select role...' },
              { value: 'admin', label: 'Admin' },
              { value: 'account_manager', label: 'Account Manager' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'janitor', label: 'Janitor' },
              { value: 'customer', label: 'Customer' }
            ]
          },
          {
            id: 'user-phone',
            name: 'phone',
            label: 'Phone',
            type: 'tel',
            placeholder: '(555) 123-4567'
          }
        ])}
        <p style="margin-top: var(--spacing-md); font-size: 0.875rem; color: var(--gray-600);">
          Note: User will need to set up their password via Supabase authentication separately.
        </p>
      </form>
    `;

    Components.showModal('Add User', content, [
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
        handler: () => this.handleCreateUser()
      }
    ]);
  },

  async handleCreateUser() {
    if (window.TQToast) {
      TQToast.show('User creation requires Supabase auth integration. Please create users via Supabase dashboard.', 'warning');
    } else {
      Components.notify('User creation requires Supabase auth integration. Please create users via Supabase dashboard.', 'warning');
    }
    Components.closeModal();
  },

  async showEditModal(userId) {
    TQToast.show('Edit user feature coming soon', 'info');
  }
};

window.UsersView = UsersView;
