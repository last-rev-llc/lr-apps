// Filters module - handles all filtering logic
// Manages date ranges, search, and tab-specific filters

const Filters = (() => {
  const state = {
    all: { search: '', dateFrom: '', dateTo: '' },
    zoom: { search: '', dateFrom: '', dateTo: '', participants: '' },
    slack: { search: '', dateFrom: '', dateTo: '', channel: '' },
    jira: { search: '', dateFrom: '', dateTo: '', priority: '', status: '' }
  };

  let seedData = null;
  let slackChannels = new Set();

  // Initialize filters and load data from Supabase
  async function init() {
    try {
      // Load slack channels from Supabase for filter dropdown
      try {
        const slackData = await window.supabase.select('summaries_slack');
        seedData = { summaries_zoom: [], summaries_slack: slackData || [], summaries_jira: [] };
        (slackData || []).forEach(s => slackChannels.add(s.channel_id));
      } catch (err) {
        console.warn('Filters: Could not load slack channels:', err);
        seedData = { summaries_zoom: [], summaries_slack: [], summaries_jira: [] };
      }

      // Setup event listeners
      setupEventListeners();

      // Load initial data
      await loadAllData();
    } catch (err) {
      console.error('Filters: Init error', err);
    }
  }

  // Setup all event listeners
  function setupEventListeners() {
    // All tab
    setupSearchListener('search-all', 'all');
    setupDateListener('date-from-all', 'all', 'dateFrom');
    setupDateListener('date-to-all', 'all', 'dateTo');

    // Zoom tab
    setupSearchListener('search-zoom', 'zoom');
    setupDateListener('date-from-zoom', 'zoom', 'dateFrom');
    setupDateListener('date-to-zoom', 'zoom', 'dateTo');
    setupTextListener('filter-zoom-participants', 'zoom', 'participants');

    // Slack tab
    setupSearchListener('search-slack', 'slack');
    setupDateListener('date-from-slack', 'slack', 'dateFrom');
    setupDateListener('date-to-slack', 'slack', 'dateTo');
    setupChannelSelect();

    // Jira tab
    setupSearchListener('search-jira', 'jira');
    setupDateListener('date-from-jira', 'jira', 'dateFrom');
    setupDateListener('date-to-jira', 'jira', 'dateTo');
    setupSelectListener('filter-jira-priority', 'jira', 'priority');
    setupSelectListener('filter-jira-status', 'jira', 'status');

    // Tab switching
    setupTabSwitching();
  }

  // Setup search listener for cc-search component
  function setupSearchListener(elementId, tab) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // cc-search emits 'search' event
    element.addEventListener('search', (e) => {
      state[tab].search = e.detail.query;
      loadTabData(tab);
    });
  }

  // Setup date input listener
  function setupDateListener(elementId, tab, field) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.addEventListener('change', (e) => {
      state[tab][field] = e.target.value;
      loadTabData(tab);
    });
  }

  // Setup text input listener
  function setupTextListener(elementId, tab, field) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.addEventListener('input', (e) => {
      state[tab][field] = e.target.value;
      loadTabData(tab);
    });
  }

  // Setup select listener
  function setupSelectListener(elementId, tab, field) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.addEventListener('change', (e) => {
      state[tab][field] = e.target.value;
      loadTabData(tab);
    });
  }

  // Setup Slack channel select
  function setupChannelSelect() {
    const select = document.getElementById('filter-slack-channel');
    if (!select) return;

    slackChannels.forEach(channel => {
      const option = document.createElement('option');
      option.value = channel;
      option.textContent = `# ${channel}`;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      state.slack.channel = e.target.value;
      loadTabData('slack');
    });
  }

  // Setup tab switching
  function setupTabSwitching() {
    const tabs = document.querySelectorAll('cc-tabs');
    tabs.forEach(tab => {
      tab.addEventListener('tab-change', (e) => {
        const activeTab = e.detail.tab || e.detail;
        console.log('Tab changed to:', activeTab);
        loadTabData(activeTab);
      });
    });
  }

  // Load all data
  async function loadAllData() {
    try {
      // Try to load from Supabase
      const summaries = await DB.getAllSummaries();
      
      if (summaries && summaries.length > 0) {
        renderAllData(summaries);
      } else {
        // Fallback to seed data
        renderAllData(getSummariesFromSeed());
      }
    } catch (err) {
      console.error('Filters: Load all error', err);
      // Fallback to seed data on error
      renderAllData(getSummariesFromSeed());
    }
  }

  // Load data for specific tab
  async function loadTabData(tab) {
    try {
      UI.showLoading(document.getElementById(`container-${tab}`));

      let summaries = [];
      const filters = state[tab];

      if (tab === 'all') {
        summaries = await DB.getAllSummaries({
          search: filters.search,
          from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : '',
          to: filters.dateTo ? new Date(filters.dateTo).toISOString() : ''
        });
      } else if (tab === 'zoom') {
        summaries = await DB.getZoomSummaries({
          search: filters.search,
          from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : '',
          to: filters.dateTo ? new Date(filters.dateTo).toISOString() : ''
        });
        // Filter by participants
        if (filters.participants) {
          summaries = summaries; // Filter would need action_items/key_decisions with names
        }
      } else if (tab === 'slack') {
        summaries = await DB.getSlackSummaries({
          search: filters.search,
          channel: filters.channel,
          from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : '',
          to: filters.dateTo ? new Date(filters.dateTo).toISOString() : ''
        });
      } else if (tab === 'jira') {
        summaries = await DB.getJiraSummaries({
          search: filters.search,
          priority: filters.priority,
          status: filters.status,
          from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : '',
          to: filters.dateTo ? new Date(filters.dateTo).toISOString() : ''
        });
      }

      renderTabData(tab, summaries);
    } catch (err) {
      console.error(`Filters: Load ${tab} error`, err);
      // Fallback to seed data
      const summaries = filterSeedData(tab, state[tab]);
      renderTabData(tab, summaries);
    }
  }

  // Get summaries from seed data
  function getSummariesFromSeed() {
    const all = [];

    if (seedData.summaries_zoom) {
      all.push(...seedData.summaries_zoom.map(item => ({
        ...item,
        source: 'zoom',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })));
    }

    if (seedData.summaries_slack) {
      all.push(...seedData.summaries_slack.map(item => ({
        ...item,
        source: 'slack',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })));
    }

    if (seedData.summaries_jira) {
      all.push(...seedData.summaries_jira.map(item => ({
        ...item,
        source: 'jira',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })));
    }

    return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Filter seed data based on tab and filters
  function filterSeedData(tab, filters) {
    let data = [];

    if (tab === 'all') {
      data = getSummariesFromSeed();
    } else if (tab === 'zoom') {
      data = (seedData.summaries_zoom || []).map(item => ({
        ...item,
        source: 'zoom',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
    } else if (tab === 'slack') {
      data = (seedData.summaries_slack || []).map(item => ({
        ...item,
        source: 'slack',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
    } else if (tab === 'jira') {
      data = (seedData.summaries_jira || []).map(item => ({
        ...item,
        source: 'jira',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
    }

    // Apply search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      data = data.filter(item => {
        const title = Summaries.getTitle(item).toLowerCase();
        const summary = Summaries.getShortSummary(item).toLowerCase();
        return title.includes(query) || summary.includes(query);
      });
    }

    // Apply date filters
    if (filters.dateFrom || filters.dateTo) {
      data = data.filter(item => {
        const date = new Date(item.created_at);
        if (filters.dateFrom && date < new Date(filters.dateFrom)) return false;
        if (filters.dateTo) {
          const to = new Date(filters.dateTo);
          to.setHours(23, 59, 59, 999);
          if (date > to) return false;
        }
        return true;
      });
    }

    // Apply tab-specific filters
    if (tab === 'slack' && filters.channel) {
      data = data.filter(item => item.channel_id === filters.channel);
    }

    if (tab === 'jira') {
      if (filters.priority) {
        data = data.filter(item => item.priority === filters.priority);
      }
      if (filters.status) {
        data = data.filter(item => item.status === filters.status);
      }
    }

    return data;
  }

  // Render all data with day grouping
  function renderAllData(summaries) {
    const container = document.getElementById('container-all');
    const grouped = Summaries.groupByDay(summaries);
    UI.renderGrouped(container, grouped);
  }

  // Render tab data
  function renderTabData(tab, summaries) {
    const container = document.getElementById(`container-${tab}`);
    const grouped = Summaries.groupByDay(summaries);
    UI.renderGrouped(container, grouped);
  }

  return {
    init
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Filters.init();
  });
} else {
  Filters.init();
}
