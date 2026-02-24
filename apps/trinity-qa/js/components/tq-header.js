/**
 * TQHeader - Main application header with navigation
 * 
 * @element tq-header
 * @attr {string} app-title - Application title
 * @attr {string} user-name - Current user name
 * @attr {string} user-role - Current user role
 * @fires tq-navigate - Fired when navigation item clicked
 * @fires tq-logout - Fired when logout clicked
 */
export class TQHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._navItems = [];
    this._activeRoute = '';
    this._mobileMenuOpen = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventHandlers();
  }

  static get observedAttributes() {
    return ['app-title', 'user-name', 'user-role'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
      this.setupEventHandlers();
    }
  }

  /**
   * Set navigation items
   * @param {Array} items - Array of {label, route, icon?}
   */
  setNavItems(items) {
    this._navItems = items || [];
    this.render();
    this.setupEventHandlers();
  }

  /**
   * Set active route
   * @param {string} route - Active route path
   */
  setActiveRoute(route) {
    this._activeRoute = route;
    this.updateActiveState();
  }

  updateActiveState() {
    const links = this.shadowRoot.querySelectorAll('.nav-link');
    links.forEach(link => {
      const route = link.dataset.route;
      if (route === this._activeRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  toggleMobileMenu() {
    this._mobileMenuOpen = !this._mobileMenuOpen;
    const nav = this.shadowRoot.querySelector('.nav');
    const hamburger = this.shadowRoot.querySelector('.hamburger');
    
    if (this._mobileMenuOpen) {
      nav.classList.add('open');
      hamburger.classList.add('open');
    } else {
      nav.classList.remove('open');
      hamburger.classList.remove('open');
    }
  }

  setupEventHandlers() {
    // Navigation links
    const links = this.shadowRoot.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.dataset.route;
        this._activeRoute = route;
        this._mobileMenuOpen = false;
        
        this.dispatchEvent(new CustomEvent('tq-navigate', {
          detail: { route },
          bubbles: true,
          composed: true
        }));
        
        this.render();
        this.setupEventHandlers();
      });
    });

    // Logout button
    const logoutBtn = this.shadowRoot.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('tq-logout', {
          bubbles: true,
          composed: true
        }));
      });
    }

    // Hamburger menu
    const hamburger = this.shadowRoot.querySelector('.hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Update active state
    this.updateActiveState();
  }

  render() {
    const appTitle = this.getAttribute('app-title') || 'Trinity QA';
    const userName = this.getAttribute('user-name') || '';
    const userRole = this.getAttribute('user-role') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        header {
          background: var(--trinity-navy, #1a2332);
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          height: 4rem;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          text-decoration: none;
          font-family: var(--font-sans, sans-serif);
          flex-shrink: 0;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-link {
          padding: 0.625rem 1rem;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: var(--radius-md, 0.5rem);
          transition: all 0.2s ease;
          white-space: nowrap;
          font-family: var(--font-sans, sans-serif);
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-link.active {
          color: white;
          background: var(--trinity-blue, #2c5f8d);
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }

        .logout-btn {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md, 0.5rem);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-sans, sans-serif);
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .hamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .hamburger span {
          width: 24px;
          height: 2px;
          background: white;
          transition: all 0.3s ease;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        @media (max-width: 768px) {
          .hamburger {
            display: flex;
          }

          .nav {
            position: absolute;
            top: 4rem;
            left: 0;
            right: 0;
            background: var(--trinity-dark-blue, #243447);
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
            gap: 0.5rem;
            display: none;
          }

          .nav.open {
            display: flex;
          }

          .nav-link {
            text-align: left;
          }
        }
      </style>
      <header>
        <div class="header-container">
          <div class="logo">${appTitle}</div>
          
          <button class="hamburger" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav class="nav">
            ${this._navItems.map(item => `
              <a href="#${item.route}" class="nav-link" data-route="${item.route}">
                ${item.icon ? `${item.icon} ` : ''}${item.label}
              </a>
            `).join('')}
          </nav>

          <div class="user-section">
            ${userName ? `
              <tq-avatar name="${userName}" role="${userRole}" size="sm"></tq-avatar>
            ` : ''}
            <button class="logout-btn">Logout</button>
          </div>
        </div>
      </header>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-header', TQHeader);
