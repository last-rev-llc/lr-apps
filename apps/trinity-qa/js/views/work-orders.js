/**
 * Work Orders View
 */

const WorkOrdersView = {
  currentView: 'cards',
  data: [],
  filteredData: [],

  async render() {
    const container = document.getElementById('view-container');
    const params = Router.getParams();

    // If there's an ID parameter, show single work order
    if (params[0]) {
      return this.renderSingle(params[0], container);
    }

    // Otherwise show list
    Components.showLoading(container);

    try {
      this.data = await this.fetchWorkOrders();
      this.filteredData = [...this.data];

      container.innerHTML = `
        <div class="work-orders">
          <tq-page-header title="Work Orders" icon="🔧">
            ${this.canCreate() ? `
              <tq-button slot="actions" variant="primary" icon="➕" onclick="WorkOrdersView.showCreateModal()">
                Create Work Order
              </tq-button>
            ` : ''}
          </tq-page-header>

          <tq-filter-bar 
            id="work-orders-filter"
            searchable
            search-placeholder="Search work orders..."
            filters='${JSON.stringify(this.getFilterConfig())}'
            sort-options='${JSON.stringify(this.getSortOptions())}'
          ></tq-filter-bar>

          <tq-view-toggle id="work-orders-view-toggle" default-view="cards"></tq-view-toggle>

          <div id="items-grid" class="items-grid" style="margin-top: var(--spacing-lg);"></div>
        </div>
      `;

      this.attachEventListeners();
      this.renderItems();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading work orders: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading work orders: ' + error.message, 'error');
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
          { value: 'open', label: 'Open' },
          { value: 'assigned', label: 'Assigned' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'closed', label: 'Closed' }
        ]
      },
      {
        key: 'priority',
        label: 'Priority',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' }
        ]
      }
    ];
  },

  getSortOptions() {
    return [
      { key: 'created_at_desc', label: 'Newest First' },
      { key: 'created_at_asc', label: 'Oldest First' },
      { key: 'priority_desc', label: 'Priority: High to Low' },
      { key: 'due_date_asc', label: 'Due Date: Soonest First' }
    ];
  },

  attachEventListeners() {
    // View toggle
    const viewToggle = document.getElementById('work-orders-view-toggle');
    if (viewToggle) {
      this.currentView = viewToggle.view || 'cards';
      viewToggle.addEventListener('tq-view-change', (e) => {
        this.currentView = e.detail.view;
        this.renderItems();
      });
    }

    // Filter bar
    const filterBar = document.getElementById('work-orders-filter');
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
      result = result.filter(wo => wo.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      result = result.filter(wo => wo.priority === filters.priority);
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(wo => 
        wo.title?.toLowerCase().includes(searchLower) ||
        wo.description?.toLowerCase().includes(searchLower) ||
        wo.locations?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    if (sort) {
      const [field, direction] = sort.split('_');
      result.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (field === 'priority') {
          const priorities = { low: 1, medium: 2, high: 3, urgent: 4 };
          aVal = priorities[a.priority] || 0;
          bVal = priorities[b.priority] || 0;
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
      grid.innerHTML = '<tq-empty icon="🔧" title="No Work Orders" message="No work orders match your filters"></tq-empty>';
      return;
    }

    grid.innerHTML = '';
    grid.className = this.currentView === 'cards' ? 'items-grid view-cards' :
                     this.currentView === 'list' ? 'items-grid view-list' :
                     'items-grid view-expanded';

    this.filteredData.forEach(wo => {
      const card = document.createElement('tq-work-order-card');
      card.setAttribute('view', this.currentView);
      card.setData({
        ...wo,
        location_name: wo.locations?.name,
        assigned_to_name: wo.assigned_to_profile?.full_name
      });
      card.addEventListener('tq-card-click', (e) => {
        Router.navigate(`work-orders/${e.detail.workOrder.id}`);
      });
      grid.appendChild(card);
    });
  },

  async renderSingle(id, container) {
    Components.showLoading(container);

    try {
      const { data: workOrder, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          locations (id, name, address),
          created_by_profile:profiles!work_orders_created_by_fkey (full_name),
          assigned_to_profile:profiles!work_orders_assigned_to_fkey (full_name),
          work_order_comments (
            id,
            comment_text,
            created_at,
            profiles (full_name, role)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      container.innerHTML = `
        <div class="work-order-detail">
          <button class="btn btn-secondary" onclick="Router.navigate('work-orders')" style="margin-bottom: var(--spacing-lg);">
            ← Back to Work Orders
          </button>

          <div class="card">
            <div class="card-header">
              <div>
                <h1 class="card-title">${workOrder.title}</h1>
                <p style="color: var(--gray-600); margin-top: var(--spacing-xs);">
                  ${workOrder.locations?.name || 'N/A'}
                </p>
              </div>
              <div style="display: flex; gap: var(--spacing-sm);">
                <tq-badge type="status" value="${workOrder.status}"></tq-badge>
                <tq-badge type="priority" value="${workOrder.priority}"></tq-badge>
              </div>
            </div>

            <div class="card-body">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
                <div>
                  <label style="font-size: 0.875rem; font-weight: 600; color: var(--gray-600);">Created By</label>
                  <p>${workOrder.created_by_profile?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <label style="font-size: 0.875rem; font-weight: 600; color: var(--gray-600);">Assigned To</label>
                  <p>${workOrder.assigned_to_profile?.full_name || 'Unassigned'}</p>
                </div>
                <div>
                  <label style="font-size: 0.875rem; font-weight: 600; color: var(--gray-600);">Due Date</label>
                  <p>${Components.formatDate(workOrder.due_date)}</p>
                </div>
                <div>
                  <label style="font-size: 0.875rem; font-weight: 600; color: var(--gray-600);">Created</label>
                  <p>${Components.formatDateTime(workOrder.created_at)}</p>
                </div>
              </div>

              <div style="margin-bottom: var(--spacing-xl);">
                <label style="font-size: 0.875rem; font-weight: 600; color: var(--gray-600); display: block; margin-bottom: var(--spacing-sm);">Description</label>
                <p style="white-space: pre-wrap;">${workOrder.description || 'No description provided.'}</p>
              </div>

              ${workOrder.completion_photo_url ? `
                <div style="margin-bottom: var(--spacing-xl);">
                  <label style="font-size: 0.875rem; font-weight: 600; color: var(--gray-600); display: block; margin-bottom: var(--spacing-sm);">Completion Photo</label>
                  <img src="${workOrder.completion_photo_url}" alt="Completion photo" style="max-width: 400px; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
                </div>
              ` : ''}

              ${this.canUpdateStatus(workOrder) ? `
                <div style="margin-bottom: var(--spacing-xl);">
                  <button class="btn btn-primary" onclick="WorkOrdersView.showUpdateStatusModal('${workOrder.id}', '${workOrder.status}')">
                    Update Status
                  </button>
                </div>
              ` : ''}

              <!-- Comments Section -->
              <div style="border-top: 1px solid var(--gray-200); padding-top: var(--spacing-xl);">
                <h3 style="margin-bottom: var(--spacing-lg);">Comments</h3>
                
                <div id="comments-list" style="margin-bottom: var(--spacing-lg);">
                  ${this.renderComments(workOrder.work_order_comments)}
                </div>

                <form id="comment-form" onsubmit="WorkOrdersView.submitComment(event, '${workOrder.id}')">
                  <div class="form-group">
                    <textarea id="comment-text" placeholder="Add a comment..." required></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary">Post Comment</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading work order: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading work order: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  renderComments(comments) {
    if (!comments || comments.length === 0) {
      return '<p style="color: var(--gray-500); text-align: center; padding: var(--spacing-lg);">No comments yet.</p>';
    }

    return comments
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(comment => `
        <div style="background: var(--gray-50); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md);">
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-sm);">
            <strong>${comment.profiles?.full_name || 'Unknown'}</strong>
            <span style="font-size: 0.875rem; color: var(--gray-500);">
              ${Components.formatDateTime(comment.created_at)}
            </span>
          </div>
          <p style="white-space: pre-wrap;">${comment.comment_text}</p>
        </div>
      `).join('');
  },

  async submitComment(event, workOrderId) {
    event.preventDefault();
    
    const textarea = document.getElementById('comment-text');
    const commentText = textarea.value.trim();
    
    if (!commentText) return;

    try {
      const { error } = await supabase
        .from('work_order_comments')
        .insert({
          work_order_id: workOrderId,
          user_id: Auth.currentUser.id,
          comment_text: commentText
        });

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Comment posted', 'success');
      } else {
        Components.notify('Comment posted', 'success');
      }
      textarea.value = '';
      
      // Refresh the view
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error posting comment: ' + error.message, 'danger');
      } else {
        Components.notify('Error posting comment: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  async fetchWorkOrders() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const query = supabase
      .from('work_orders')
      .select(`
        *,
        locations (name),
        assigned_to_profile:profiles!work_orders_assigned_to_fkey (full_name)
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
    } else if (role === 'janitor') {
      query.eq('assigned_to', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async fetchLocations() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const query = supabase
      .from('locations')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (role === 'customer') {
      query.eq('customer_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  canCreate() {
    return true; // All roles can create work orders
  },

  canUpdateStatus(workOrder) {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;
    
    return ['admin', 'supervisor'].includes(role) || 
           workOrder.assigned_to === userId;
  },

  async showCreateModal() {
    const locations = await this.fetchLocations();
    
    const content = `
      <form id="create-work-order-form">
        ${Components.createForm([
          {
            id: 'wo-location',
            name: 'location_id',
            label: 'Location',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select location...' },
              ...locations.map(loc => ({ value: loc.id, label: loc.name }))
            ]
          },
          {
            id: 'wo-title',
            name: 'title',
            label: 'Title',
            type: 'text',
            required: true,
            placeholder: 'Brief description of the issue'
          },
          {
            id: 'wo-description',
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Detailed description of the work needed'
          },
          {
            id: 'wo-priority',
            name: 'priority',
            label: 'Priority',
            type: 'select',
            required: true,
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium', selected: true },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]
          },
          {
            id: 'wo-due-date',
            name: 'due_date',
            label: 'Due Date',
            type: 'date'
          }
        ])}
      </form>
    `;

    Components.showModal('Create Work Order', content, [
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
        handler: () => this.handleCreateWorkOrder()
      }
    ]);
  },

  async handleCreateWorkOrder() {
    const form = document.getElementById('create-work-order-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Components.getFormData('create-work-order-form');
    
    try {
      const { error } = await supabase
        .from('work_orders')
        .insert({
          ...data,
          created_by: Auth.currentUser.id,
          status: 'open'
        });

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Work order created successfully', 'success');
      } else {
        Components.notify('Work order created successfully', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error creating work order: ' + error.message, 'danger');
      } else {
        Components.notify('Error creating work order: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  async showUpdateStatusModal(workOrderId, currentStatus) {
    const content = `
      <form id="update-status-form">
        ${Components.createForm([
          {
            id: 'new-status',
            name: 'status',
            label: 'New Status',
            type: 'select',
            required: true,
            options: [
              { value: 'open', label: 'Open', selected: currentStatus === 'open' },
              { value: 'assigned', label: 'Assigned', selected: currentStatus === 'assigned' },
              { value: 'in_progress', label: 'In Progress', selected: currentStatus === 'in_progress' },
              { value: 'completed', label: 'Completed', selected: currentStatus === 'completed' },
              { value: 'closed', label: 'Closed', selected: currentStatus === 'closed' }
            ]
          },
          {
            id: 'completion-photo',
            name: 'photo',
            label: 'Completion Photo (required for completed status)',
            type: 'file',
            accept: 'image/*'
          }
        ])}
      </form>
    `;

    Components.showModal('Update Status', content, [
      {
        label: 'Cancel',
        className: 'btn-secondary',
        action: 'cancel',
        handler: () => Components.closeModal()
      },
      {
        label: 'Update',
        className: 'btn-primary',
        action: 'update',
        handler: () => this.handleUpdateStatus(workOrderId)
      }
    ]);
  },

  async handleUpdateStatus(workOrderId) {
    const form = document.getElementById('update-status-form');
    const status = document.getElementById('new-status').value;
    const photoInput = document.getElementById('completion-photo');

    // If status is completed, require photo
    if (status === 'completed' && !photoInput.files[0]) {
      if (window.TQToast) {
        TQToast.show('Completion photo is required', 'warning');
      } else {
        Components.notify('Completion photo is required', 'error');
      }
      return;
    }

    try {
      const updateData = { status };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        
        if (photoInput.files[0]) {
          const photoUrl = await Components.uploadPhoto(photoInput.files[0], 'work-orders');
          updateData.completion_photo_url = photoUrl;
        }
      }

      if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('work_orders')
        .update(updateData)
        .eq('id', workOrderId);

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Status updated successfully', 'success');
      } else {
        Components.notify('Status updated successfully', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error updating status: ' + error.message, 'danger');
      } else {
        Components.notify('Error updating status: ' + error.message, 'error');
      }
      console.error(error);
    }
  }
};

window.WorkOrdersView = WorkOrdersView;
