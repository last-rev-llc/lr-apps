/**
 * Surveys View
 */

const SurveysView = {
  currentView: 'cards',
  data: [],
  filteredData: [],

  async render() {
    const container = document.getElementById('view-container');
    Components.showLoading(container);

    try {
      this.data = await this.fetchSurveys();
      this.filteredData = [...this.data];

      const stats = this.calculateStats(this.data);

      container.innerHTML = `
        <div class="surveys">
          <tq-page-header title="Customer Surveys" icon="⭐">
            ${Auth.isCustomer() ? `
              <tq-button slot="actions" variant="primary" icon="➕" onclick="SurveysView.showCreateModal()">
                Submit Feedback
              </tq-button>
            ` : ''}
          </tq-page-header>

          <!-- Stats Grid -->
          ${stats.count > 0 ? `
            <div class="stats-grid">
              <tq-stat 
                label="Average Cleanliness" 
                value="${stats.avgCleanliness}" 
                icon="🧹">
              </tq-stat>
              <tq-stat 
                label="Service Quality" 
                value="${stats.avgService}" 
                icon="👷">
              </tq-stat>
              <tq-stat 
                label="Overall Satisfaction" 
                value="${stats.avgSatisfaction}" 
                icon="⭐">
              </tq-stat>
              <tq-stat 
                label="Total Surveys" 
                value="${stats.count}" 
                icon="📋">
              </tq-stat>
            </div>
          ` : ''}

          <tq-filter-bar 
            id="surveys-filter"
            searchable
            search-placeholder="Search surveys..."
            sort-options='${JSON.stringify(this.getSortOptions())}'
          ></tq-filter-bar>

          <tq-view-toggle id="surveys-view-toggle" default-view="cards"></tq-view-toggle>

          <div id="items-grid" class="items-grid" style="margin-top: var(--spacing-lg);"></div>
        </div>
      `;

      this.attachEventListeners();
      this.renderItems();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading surveys: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading surveys: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  getSortOptions() {
    return [
      { key: 'submitted_at_desc', label: 'Newest First' },
      { key: 'submitted_at_asc', label: 'Oldest First' },
      { key: 'satisfaction_desc', label: 'Highest Rated' },
      { key: 'satisfaction_asc', label: 'Lowest Rated' }
    ];
  },

  calculateStats(surveys) {
    if (!surveys || surveys.length === 0) {
      return { count: 0, avgCleanliness: '0.0', avgService: '0.0', avgSatisfaction: '0.0' };
    }

    const avgCleanliness = surveys.reduce((sum, s) => sum + (s.cleanliness_rating || 0), 0) / surveys.length;
    const avgService = surveys.reduce((sum, s) => sum + (s.service_quality_rating || 0), 0) / surveys.length;
    const avgSatisfaction = surveys.reduce((sum, s) => sum + (s.satisfaction_rating || 0), 0) / surveys.length;

    return {
      count: surveys.length,
      avgCleanliness: avgCleanliness.toFixed(1),
      avgService: avgService.toFixed(1),
      avgSatisfaction: avgSatisfaction.toFixed(1)
    };
  },

  attachEventListeners() {
    // View toggle
    const viewToggle = document.getElementById('surveys-view-toggle');
    if (viewToggle) {
      this.currentView = viewToggle.view || 'cards';
      viewToggle.addEventListener('tq-view-change', (e) => {
        this.currentView = e.detail.view;
        this.renderItems();
      });
    }

    // Filter bar
    const filterBar = document.getElementById('surveys-filter');
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
      result = result.filter(survey => 
        survey.locations?.name?.toLowerCase().includes(searchLower) ||
        survey.customer?.full_name?.toLowerCase().includes(searchLower) ||
        survey.comments?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    if (sort) {
      const [field, direction] = sort.split('_');
      result.sort((a, b) => {
        let aVal = a[field === 'satisfaction' ? 'satisfaction_rating' : field] || 0;
        let bVal = b[field === 'satisfaction' ? 'satisfaction_rating' : field] || 0;
        
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
      grid.innerHTML = '<tq-empty icon="⭐" title="No Surveys" message="No customer feedback has been submitted yet"></tq-empty>';
      return;
    }

    grid.innerHTML = '';
    grid.className = this.currentView === 'cards' ? 'items-grid view-cards' :
                     this.currentView === 'list' ? 'items-grid view-list' :
                     'items-grid view-expanded';

    this.filteredData.forEach(survey => {
      const card = document.createElement('tq-survey-card');
      card.setAttribute('view', this.currentView);
      card.setData({
        ...survey,
        location_name: survey.locations?.name,
        customer_name: survey.customer?.full_name
      });
      card.addEventListener('tq-card-click', (e) => {
        if (e.detail.survey.comments) {
          this.showComments(e.detail.survey.id, e.detail.survey.comments);
        }
      });
      grid.appendChild(card);
    });
  },

  async fetchSurveys() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const query = supabase
      .from('surveys')
      .select(`
        *,
        locations (name),
        customer:profiles!surveys_customer_id_fkey (full_name)
      `)
      .order('submitted_at', { ascending: false });

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

  showComments(surveyId, comments) {
    Components.showModal('Survey Comments', `
      <p style="white-space: pre-wrap;">${comments}</p>
    `, [
      {
        label: 'Close',
        className: 'btn-secondary',
        action: 'close',
        handler: () => Components.closeModal()
      }
    ]);
  },

  async showCreateModal() {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('customer_id', Auth.currentUser.id)
      .eq('is_active', true)
      .order('name');

    const content = `
      <form id="create-survey-form">
        ${Components.createForm([
          {
            id: 'survey-location',
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
            id: 'survey-cleanliness',
            name: 'cleanliness_rating',
            label: 'Cleanliness Rating',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select rating...' },
              { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
              { value: '4', label: '⭐⭐⭐⭐ Good' },
              { value: '3', label: '⭐⭐⭐ Average' },
              { value: '2', label: '⭐⭐ Poor' },
              { value: '1', label: '⭐ Very Poor' }
            ]
          },
          {
            id: 'survey-service',
            name: 'service_quality_rating',
            label: 'Service Quality Rating',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select rating...' },
              { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
              { value: '4', label: '⭐⭐⭐⭐ Good' },
              { value: '3', label: '⭐⭐⭐ Average' },
              { value: '2', label: '⭐⭐ Poor' },
              { value: '1', label: '⭐ Very Poor' }
            ]
          },
          {
            id: 'survey-satisfaction',
            name: 'satisfaction_rating',
            label: 'Overall Satisfaction',
            type: 'select',
            required: true,
            options: [
              { value: '', label: 'Select rating...' },
              { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
              { value: '4', label: '⭐⭐⭐⭐ Good' },
              { value: '3', label: '⭐⭐⭐ Average' },
              { value: '2', label: '⭐⭐ Poor' },
              { value: '1', label: '⭐ Very Poor' }
            ]
          },
          {
            id: 'survey-comments',
            name: 'comments',
            label: 'Additional Comments',
            type: 'textarea',
            placeholder: 'Share any additional feedback...'
          }
        ])}
      </form>
    `;

    Components.showModal('Submit Feedback', content, [
      {
        label: 'Cancel',
        className: 'btn-secondary',
        action: 'cancel',
        handler: () => Components.closeModal()
      },
      {
        label: 'Submit',
        className: 'btn-primary',
        action: 'submit',
        handler: () => this.handleCreateSurvey()
      }
    ]);
  },

  async handleCreateSurvey() {
    const form = document.getElementById('create-survey-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Components.getFormData('create-survey-form');
    
    try {
      const { error } = await supabase
        .from('surveys')
        .insert({
          ...data,
          customer_id: Auth.currentUser.id
        });

      if (error) throw error;

      if (window.TQToast) {
        TQToast.show('Feedback submitted successfully', 'success');
      } else {
        Components.notify('Feedback submitted successfully', 'success');
      }
      Components.closeModal();
      this.render();
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error submitting feedback: ' + error.message, 'danger');
      } else {
        Components.notify('Error submitting feedback: ' + error.message, 'error');
      }
      console.error(error);
    }
  }
};

window.SurveysView = SurveysView;
