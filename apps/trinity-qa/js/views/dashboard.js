/**
 * Dashboard View
 */

const DashboardView = {
  async render() {
    const container = document.getElementById('view-container');
    Components.showLoading(container);

    try {
      // Fetch dashboard data based on role
      const stats = await this.fetchStats();
      const recentWorkOrders = await this.fetchRecentWorkOrders();
      const recentInspections = await this.fetchRecentInspections();

      container.innerHTML = `
        <div class="dashboard">
          <tq-page-header title="Dashboard" icon="📊"></tq-page-header>

          <!-- Stats Grid -->
          <div class="stats-grid">
            ${this.renderStats(stats)}
          </div>

          <!-- Recent Work Orders -->
          <div style="margin-bottom: var(--spacing-xl);">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--trinity-navy); margin-bottom: var(--spacing-lg);">
              Recent Work Orders
            </h2>
            <div id="recent-work-orders" class="view-list"></div>
          </div>

          <!-- Recent Inspections -->
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--trinity-navy); margin-bottom: var(--spacing-lg);">
              Recent Inspections
            </h2>
            <div id="recent-inspections" class="view-list"></div>
          </div>
        </div>
      `;

      this.renderRecentWorkOrders(recentWorkOrders);
      this.renderRecentInspections(recentInspections);
    } catch (error) {
      if (window.TQToast) {
        TQToast.show('Error loading dashboard: ' + error.message, 'danger');
      } else {
        Components.notify('Error loading dashboard: ' + error.message, 'error');
      }
      console.error(error);
    }
  },

  async fetchStats() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const stats = {
      openWorkOrders: 0,
      upcomingSchedule: 0,
      recentInspections: 0,
      avgRating: 0
    };

    // Open work orders
    const woQuery = supabase
      .from('work_orders')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'closed');

    if (role === 'customer') {
      // Get customer's locations
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('customer_id', userId);
      
      if (locations && locations.length > 0) {
        woQuery.in('location_id', locations.map(l => l.id));
      }
    } else if (role === 'janitor') {
      woQuery.eq('assigned_to', userId);
    }

    const { count: woCount } = await woQuery;
    stats.openWorkOrders = woCount || 0;

    // Upcoming schedule (for staff only)
    if (['admin', 'supervisor', 'janitor'].includes(role)) {
      const today = new Date().toISOString().split('T')[0];
      const { count: scheduleCount } = await supabase
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .gte('shift_date', today)
        .eq('user_id', userId);
      
      stats.upcomingSchedule = scheduleCount || 0;
    }

    // Recent inspections
    const inspQuery = supabase
      .from('inspections')
      .select('id', { count: 'exact', head: true });

    if (role === 'customer') {
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('customer_id', userId);
      
      if (locations && locations.length > 0) {
        inspQuery.in('location_id', locations.map(l => l.id));
      }
    }

    const { count: inspCount } = await inspQuery;
    stats.recentInspections = inspCount || 0;

    // Average rating from surveys
    if (role === 'customer' || role === 'account_manager' || role === 'admin') {
      const surveyQuery = supabase
        .from('surveys')
        .select('satisfaction_rating');

      if (role === 'customer') {
        surveyQuery.eq('customer_id', userId);
      }

      const { data: surveys } = await surveyQuery;
      if (surveys && surveys.length > 0) {
        const sum = surveys.reduce((acc, s) => acc + (s.satisfaction_rating || 0), 0);
        stats.avgRating = (sum / surveys.length).toFixed(1);
      }
    }

    return stats;
  },

  async fetchRecentWorkOrders() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const woQuery = supabase
      .from('work_orders')
      .select(`
        *,
        locations (name),
        assigned_to_profile:profiles!work_orders_assigned_to_fkey (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (role === 'customer') {
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('customer_id', userId);
      
      if (locations && locations.length > 0) {
        woQuery.in('location_id', locations.map(l => l.id));
      } else {
        return [];
      }
    } else if (role === 'janitor') {
      woQuery.eq('assigned_to', userId);
    }

    const { data } = await woQuery;
    return data || [];
  },

  async fetchRecentInspections() {
    const role = Auth.getRole();
    const userId = Auth.currentUser.id;

    const inspQuery = supabase
      .from('inspections')
      .select(`
        *,
        locations (name),
        inspector:profiles!inspections_inspector_id_fkey (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (role === 'customer') {
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('customer_id', userId);
      
      if (locations && locations.length > 0) {
        inspQuery.in('location_id', locations.map(l => l.id));
      } else {
        return [];
      }
    }

    const { data } = await inspQuery;
    return data || [];
  },

  renderStats(stats) {
    const role = Auth.getRole();
    
    let statsHtml = `
      <tq-stat 
        label="Open Work Orders" 
        value="${stats.openWorkOrders}" 
        icon="🔧">
      </tq-stat>

      <tq-stat 
        label="${role === 'customer' ? 'My' : 'Total'} Inspections" 
        value="${stats.recentInspections}" 
        icon="✓">
      </tq-stat>
    `;

    if (['admin', 'supervisor', 'janitor'].includes(role)) {
      statsHtml += `
        <tq-stat 
          label="Upcoming Shifts" 
          value="${stats.upcomingSchedule}" 
          icon="📅">
        </tq-stat>
      `;
    }

    if (stats.avgRating > 0) {
      statsHtml += `
        <tq-stat 
          label="Average Rating" 
          value="${stats.avgRating}" 
          icon="⭐">
        </tq-stat>
      `;
    }

    return statsHtml;
  },

  renderRecentWorkOrders(workOrders) {
    const container = document.getElementById('recent-work-orders');
    
    if (!workOrders || workOrders.length === 0) {
      container.innerHTML = '<tq-empty icon="🔧" title="No recent work orders" message="Work orders will appear here once they are created"></tq-empty>';
      return;
    }

    container.innerHTML = '';
    workOrders.forEach(wo => {
      const card = document.createElement('tq-work-order-card');
      card.setAttribute('view', 'list');
      card.setData({
        ...wo,
        location_name: wo.locations?.name,
        assigned_to_name: wo.assigned_to_profile?.full_name
      });
      card.addEventListener('tq-card-click', (e) => {
        Router.navigate(`work-orders/${e.detail.workOrder.id}`);
      });
      container.appendChild(card);
    });
  },

  renderRecentInspections(inspections) {
    const container = document.getElementById('recent-inspections');
    
    if (!inspections || inspections.length === 0) {
      container.innerHTML = '<tq-empty icon="✓" title="No recent inspections" message="Inspections will appear here once they are completed"></tq-empty>';
      return;
    }

    container.innerHTML = '';
    inspections.forEach(insp => {
      const card = document.createElement('tq-inspection-card');
      card.setAttribute('view', 'list');
      card.setData({
        ...insp,
        location_name: insp.locations?.name,
        inspector_name: insp.inspector?.full_name
      });
      card.addEventListener('tq-card-click', () => {
        // Navigate to inspection detail when implemented
        TQToast.show('Inspection detail view coming soon', 'info');
      });
      container.appendChild(card);
    });
  }
};

window.DashboardView = DashboardView;
