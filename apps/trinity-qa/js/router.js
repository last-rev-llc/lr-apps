/**
 * Simple Hash Router
 */

const Router = {
  routes: {},
  currentRoute: null,

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  register(path, handler) {
    this.routes[path] = handler;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const route = hash.split('/')[0];

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.route === route) {
        link.classList.add('active');
      }
    });

    // Check if route exists and user has permission
    const handler = this.routes[route];
    if (handler) {
      this.currentRoute = route;
      handler();
    } else {
      this.navigate('dashboard');
    }
  },

  navigate(path) {
    window.location.hash = path;
  },

  getParams() {
    const hash = window.location.hash.slice(1);
    const parts = hash.split('/');
    return parts.slice(1);
  }
};

window.Router = Router;
