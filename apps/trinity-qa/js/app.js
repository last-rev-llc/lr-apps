/**
 * Trinity Building Services QA Portal
 * Main Application Entry Point
 */

(async function() {
  'use strict';

  // Show loading screen
  const loadingScreen = document.getElementById('loading-screen');
  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');

  try {
    // Check for existing session
    const isAuthenticated = await Auth.init();

    if (isAuthenticated) {
      // User is logged in
      showApp();
    } else {
      // User needs to log in
      showLogin();
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showLogin();
  }

  function showApp() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');

    // Update user info in header
    updateUserInfo();

    // Initialize router
    initializeRouter();

    // Register routes
    registerRoutes();

    // Setup event listeners
    setupEventListeners();

    // Navigate to current route or default to dashboard
    Router.handleRoute();
  }

  function showLogin() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    app.classList.add('hidden');

    // Setup login form
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);
  }

  async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
      const result = await Auth.signIn(email, password);

      if (result.success) {
        // Successful login - show app
        showApp();
      } else {
        // Login failed
        // Use TQToast if available, fallback to Components
        if (window.TQToast) {
          TQToast.show(result.error || 'Login failed', 'danger');
        } else {
          Components.notify(result.error || 'Login failed', 'error');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    } catch (error) {
      console.error('Login error:', error);
      if (window.TQToast) {
        TQToast.show('An error occurred during login', 'danger');
      } else {
        Components.notify('An error occurred during login', 'error');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }

  function updateUserInfo() {
    const profile = Auth.currentProfile;
    if (!profile) return;

    const header = document.getElementById('main-header');
    if (!header) return;

    // Set user name and role on header
    header.setAttribute('user-name', profile.full_name);
    header.setAttribute('user-role', profile.role.replace('_', ' '));

    // Filter navigation items based on role
    const navItems = filterNavigationByRole(profile.role);
    header.setNavItems(navItems);
  }

  function filterNavigationByRole(role) {
    // Define all navigation items with role restrictions
    const allNavItems = [
      { label: 'Dashboard', route: 'dashboard', roles: ['all'] },
      { label: 'Inspections', route: 'inspections', roles: ['admin', 'account_manager', 'supervisor', 'janitor'] },
      { label: 'Work Orders', route: 'work-orders', roles: ['all'] },
      { label: 'Surveys', route: 'surveys', roles: ['all'] },
      { label: 'Schedule', route: 'schedule', roles: ['admin', 'supervisor', 'janitor'] },
      { label: 'Locations', route: 'locations', roles: ['admin', 'account_manager', 'supervisor'] },
      { label: 'Users', route: 'users', roles: ['admin'] }
    ];

    // Filter based on role
    return allNavItems.filter(item => 
      item.roles.includes('all') || item.roles.includes(role)
    );
  }

  function initializeRouter() {
    Router.init();
  }

  function registerRoutes() {
    // Register all view routes
    Router.register('dashboard', () => DashboardView.render());
    Router.register('inspections', () => InspectionsView.render());
    Router.register('work-orders', () => WorkOrdersView.render());
    Router.register('surveys', () => SurveysView.render());
    Router.register('schedule', () => ScheduleView.render());
    Router.register('locations', () => LocationsView.render());
    Router.register('users', () => UsersView.render());
  }

  function setupEventListeners() {
    const header = document.getElementById('main-header');
    if (!header) return;

    // Listen for navigation events from tq-header
    header.addEventListener('tq-navigate', (e) => {
      const route = e.detail.route;
      window.location.hash = `#${route}`;
      Router.handleRoute();
    });

    // Listen for logout events from tq-header
    header.addEventListener('tq-logout', async () => {
      if (confirm('Sign out?')) {
        await Auth.signOut();
        location.reload();
      }
    });

    // Update active route when hash changes
    window.addEventListener('hashchange', () => {
      const currentRoute = window.location.hash.slice(1) || 'dashboard';
      header.setActiveRoute(currentRoute);
    });

    // Set initial active route
    const currentRoute = window.location.hash.slice(1) || 'dashboard';
    header.setActiveRoute(currentRoute);
  }

  // Make functions globally available for onclick handlers
  window.showLogin = showLogin;
  window.showApp = showApp;

})();

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment to enable service worker
    // navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
