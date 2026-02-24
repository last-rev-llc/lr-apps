/**
 * Schedule View
 */

const ScheduleView = {
  currentView: 'cards',
  data: [],
  filteredData: [],

  async render() {
    const container = document.getElementById('view-container');
    Components.showLoading(container);

    try {
      this.data = await this.fetchSchedules();
      this.filteredData = [...this.data];

      container.innerHTML = `
        <div class="schedule">
          <tq-page-header title="Schedule" icon="📅">
            ${Auth.hasRole('admin', 'supervisor') ? `
              <tq-button slot="actions" variant="primary" icon="➕" onclick="ScheduleView.showCreateModal()">
                Add Shift
              </tq-button>
            ` : ''}
          </tq-page-header>

          <!-- Calendar Week View -->
          ${this.renderCalendar(this.data)}

          <tq-filter-bar 
            id="schedule-filter"
            searchable
            search-placeholder="Search shifts..."
            sort-options='${JSON.stringify(this.getSortOptions())}'
          ></tq-filter-bar>

          <tq-view-toggle id="schedule-view-toggle" default-view="cards"></tq-view-toggle>

          <div id="items-grid" class="items-grid" style="margin-top: var(--spacing-lg);"></div>
        </div>
      `;

      this.attachEventListeners();
      this.renderItems();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading schedule: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading schedule: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  getSortOptions() {
    return [
      { key: 'shift_date_asc', label: 'Date: Soonest First' },
      { key: 'shift_date_desc', label: 'Date: Latest First' }
    ];
  },

  attachEventListeners() {
    // View toggle
    const viewToggle = document.getElementById('schedule-view-toggle');
    if (viewToggle) {
      this.currentView = viewToggle.view || 'cards';
      viewToggle.addEventListener('tq-view-change', (e) => {
        this.currentView = e.detail.view;
        this.renderItems();
      });
    }

    // Filter bar
    const filterBar = document.getElementById('schedule-filter');
    if (filterBar) {
      filterBar.addEventListener('tq-filter-change', (e) => {
        this.applyFilters(e.detail);
      });
    }
  },

  applyFilters({ filters, sort, search }) {
    let result = [...this.data];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(schedule => 
        schedule.locations?.name?.toLowerCase().includes(searchLower) ||
        schedule.user?.full_name?.toLowerCase().includes(searchLower) ||
        schedule.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    if (sort) {
      const [field, direction] = sort.split('_');
      result.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
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
      grid.innerHTML = '<tq-empty icon="📅" title="No Shifts" message="No shifts are scheduled"></tq-empty>';
      return;
    }

    grid.innerHTML = '';
    grid.className = this.currentView === 'cards' ? 'items-grid view-cards' :
                     this.currentView === 'list' ? 'items-grid view-list' :
                     'items-grid view-expanded';

    this.filteredData.forEach(schedule => {
      const card = document.createElement('tq-schedule-card');
      card.setAttribute('view', this.currentView);
      card.setData({
        ...schedule,
        location_name: schedule.locations?.name,
        user_name: schedule.user?.full_name
      });
      card.addEventListener('tq-card-click', (e) => {
        if (Auth.hasRole('admin', 'supervisor')) {
          this.showDeleteConfirm(e.detail.schedule.id);
        }
      });
      grid.appendChild(card);
    });
  },

  renderCalendar(schedules) {
    // Simple upcoming week view
    const today = new Date();
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date;
    });

    return `
      <div class="calendar" style="margin-bottom: var(--spacing-xl);">
        <div class="calendar-header">
          <h3 style="font-size: 1.125rem; font-weight: 600; color: var(--trinity-navy);">This Week</h3>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-md); margin-top: var(--spacing-md);">
          ${next7Days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const daySchedules = schedules.filter(s => s.shift_date === dateStr);
            const isToday = dateStr === today.toISOString().split('T')[0];
            
            return `
              <div class="calendar-day ${isToday ? 'today' : ''}" style="
                min-height: 120px;
                background: white;
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                border: 2px solid ${isToday ? 'var(--trinity-blue)' : 'var(--gray-200)'};
              ">
                <div style="font-weight: 600; margin-bottom: var(--spacing-sm); color: var(--trinity-navy);">
                  ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                ${daySchedules.map(s => `
                  <div class="calendar-event" title="${s.locations?.name || 'Unknown location'}" style="
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    background: var(--trinity-accent);
                    color: white;
                    border-radius: var(--radius-sm);
                    margin-top: 0.25rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  ">
                    ${this.formatTime(s.shift_start)} - ${this.formatTime(s.shift_end)}
                  </div>
                `).join('')}
                ${daySchedules.length === 0 ? `
                  <div style="color: var(--gray-400); font-size: 0.875rem; text-align: center; padding: var(--spacing-md) 0;">
                    No shifts
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  formatTime(time) {
    if (!time) return '';
    return new Date('2000-01-01T' + time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  },

  async fetchSchedules() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const today = new Date().toISOString().split('T')[0];
    
    const query = supabase
      .from('schedules')
      .select(`
        *,
        locations (name),
        user:profiles!schedules_user_id_fkey (full_name, role)
      `)
      .gte('shift_date', today)
      .order('shift_date')
      .order('shift_start');

    if (role === 'janitor') {
      query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  showDeleteConfirm(scheduleId) {
    Components.showModal('Delete Shift', `
      <p>Are you sure you want to delete this shift?</p>
    `, [
      {
        label: 'Cancel',
        className: 'btn-secondary',
        action: 'cancel',
        handler: () => Components.closeModal()
      },
      {
        label: 'Delete',
        className: 'btn-danger',
        action: 'delete',
        handler: () => this.deleteSchedule(scheduleId)
      }
    ]);
  },

  async deleteSchedule(scheduleId) {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Shift deleted', 'success');
      } else {
        Components.notify('Shift deleted', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error deleting schedule: ' + error.message, 'danger');
      } else {
        Components.notify('Error deleting schedule: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  async showCreateModal() {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    const { data: staff } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['janitor', 'supervisor'])
      .order('full_name');

    const content = `
      <form id="create-schedule-form">
        ${Components.createForm([
          {
            id: 'schedule-location',
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
            id: 'schedule-user',
            name: 'user_id',
            label: 'Staff Member',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select staff...' },
              ...(staff || []).map(s => ({ value: s.id, label: `${s.full_name} (${s.role})` }))
            ]
          },
          {
            id: 'schedule-date',
            name: 'shift_date',
            label: 'Date',
            type: 'date',
            required: true
          },
          {
            id: 'schedule-start',
            name: 'shift_start',
            label: 'Start Time',
            type: 'time',
            required: true
          },
          {
            id: 'schedule-end',
            name: 'shift_end',
            label: 'End Time',
            type: 'time',
            required: true
          },
          {
            id: 'schedule-notes',
            name: 'notes',
            label: 'Notes',
            type: 'textarea',
            placeholder: 'Special instructions...'
          }
        ])}
      </form>
    `;

    Components.showModal('Add Shift', content, [
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
        handler: () => this.handleCreateSchedule()
      }
    ]);
  },

  async handleCreateSchedule() {
    const form = document.getElementById('create-schedule-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Components.getFormData('create-schedule-form');
    
    try {
      const { error } = await supabase
        .from('schedules')
        .insert({
          ...data,
          created_by: Auth.currentUser.id
        });

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Shift scheduled successfully', 'success');
      } else {
        Components.notify('Shift scheduled successfully', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error creating schedule: ' + error.message, 'danger');
      } else {
        Components.notify('Error creating schedule: ' + error.message, 'error');
      }
      console.error(error);
    }
  }
};

window.ScheduleView = ScheduleView;
