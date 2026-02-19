(function () {
  const TAG = 'cc-logo-cloud';
  if (customElements.get(TAG)) return;

  /* Default integration brands */
  const INTEGRATION_BRANDS = [
    { name: 'Salesforce', color: '#00A1E0', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.05 2.53a4.74 4.74 0 0 1 3.43 1.49 5.59 5.59 0 0 1 3.32-1.1 5.64 5.64 0 0 1 5.6 5.05 4.42 4.42 0 0 1-.5 8.8h-.09a4.42 4.42 0 0 1-2.27-.63 5.3 5.3 0 0 1-3.82 1.66 5.26 5.26 0 0 1-2.54-.65A4.87 4.87 0 0 1 9 19.5a4.84 4.84 0 0 1-1.06-.12 4.14 4.14 0 0 1-6.32-3.52 4.14 4.14 0 0 1 1.88-3.47A5.18 5.18 0 0 1 5.7 5.67 5.2 5.2 0 0 1 10.05 2.53z"/></svg>` },
    { name: 'HubSpot', color: '#FF7A59', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.01 9.6V7.07a2.02 2.02 0 0 0 1.16-1.82v-.06a2.02 2.02 0 0 0-2.02-2.02h-.06A2.02 2.02 0 0 0 14.07 5.2v.05c0 .79.46 1.48 1.13 1.81V9.6a5.1 5.1 0 0 0-2.3 1.25l-6.07-4.72a2.17 2.17 0 0 0 .06-.5 2.18 2.18 0 1 0-2.18 2.18c.47 0 .9-.15 1.26-.41l5.94 4.63a5.13 5.13 0 0 0 .07 5.04l-1.77 1.77a1.84 1.84 0 0 0-.54-.09 1.87 1.87 0 1 0 1.87 1.87c0-.2-.04-.38-.1-.55l1.74-1.74a5.15 5.15 0 1 0 3.63-8.73z"/></svg>` },
    { name: 'Zendesk', color: '#03363D', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 3v14.2L3 21V6.8A3.8 3.8 0 0 1 6.8 3H11zm2 17V5.8L21 3v14.2a3.8 3.8 0 0 1-3.8 3.8H13zM3 3h8l-8 8V3zm10 18h8l-8-8v8z"/></svg>` },
    { name: 'Slack', color: '#E01E5A', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.04 15.16a2.12 2.12 0 1 1-2.12-2.12h2.12v2.12zm1.07 0a2.12 2.12 0 1 1 4.24 0v5.3a2.12 2.12 0 1 1-4.24 0v-5.3zm2.12-10.12a2.12 2.12 0 1 1 2.12-2.12v2.12H8.23zm0 1.07a2.12 2.12 0 1 1 0 4.24H2.93a2.12 2.12 0 1 1 0-4.24h5.3zm10.12 2.12a2.12 2.12 0 1 1 2.12 2.12h-2.12V8.23zm-1.07 0a2.12 2.12 0 1 1-4.24 0v-5.3a2.12 2.12 0 1 1 4.24 0v5.3zm-2.12 10.12a2.12 2.12 0 1 1-2.12 2.12v-2.12h2.12zm0-1.07a2.12 2.12 0 1 1 0-4.24h5.3a2.12 2.12 0 1 1 0 4.24h-5.3z"/></svg>` },
    { name: 'ServiceNow', color: '#81B5A1', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15.5c-2.76 0-5-1.79-5-4s2.24-4 5-4 5 1.79 5 4-2.24 4-5 4z"/></svg>` },
    { name: 'Freshdesk', color: '#25C16F', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h3v3.28a.72.72 0 0 0 1.2.53L13 18h6a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zm-8 10H8a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2zm5-4H8a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2z"/></svg>` },
    { name: 'Jira', color: '#0052CC', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.005 2L2 12.005l4.488 4.487L12.005 11l5.516 5.493L22 12.005 12.005 2zm0 5.643L8.17 11.48 12.005 15.3l3.818-3.82-3.818-3.838z"/></svg>` },
    { name: 'GitHub', color: '#F0F0F0', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48 0-.24-.01-.86-.01-1.69-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.004 1.71.115 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"/></svg>` },
    { name: 'Google', color: '#4285F4', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1H12v2.97h5.39c-.47 2.35-2.52 3.84-5.39 3.84a5.91 5.91 0 0 1 0-11.82c1.47 0 2.8.53 3.84 1.4l2.22-2.22A9.82 9.82 0 0 0 12 2.18 9.82 9.82 0 0 0 2.18 12 9.82 9.82 0 0 0 12 21.82c5.04 0 9.41-3.55 9.41-9.82 0-.63-.07-1.25-.06-1.9z"/></svg>` },
    { name: 'Zoom', color: '#2D8CFF', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-1.5l4.2 2.8a.75.75 0 0 0 1.2-.6V8.3a.75.75 0 0 0-1.2-.6l-4.2 2.8V9a3 3 0 0 0-3-3H3z"/></svg>` },
    { name: 'Contentful', color: '#FFD85C', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="7" r="2.5"/><circle cx="5.5" cy="17" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M7.5 7.8a7.5 7.5 0 0 1 8.5 3.4M7.5 16.2a7.5 7.5 0 0 0 8.5-3.4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>` },
    { name: 'Linear', color: '#5E6AD2', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.65 14.68a10.2 10.2 0 0 0 6.67 6.67l-6.67-6.67zm-.53-2.09a10.22 10.22 0 0 0 9.29 9.29L2.12 12.59zm1.3-3.39a10.2 10.2 0 0 0-1.18 2.47L13.41 22.84a10.2 10.2 0 0 0 2.47-1.18L3.42 9.2zm2.66-2.27L18.8 19.65A10.2 10.2 0 0 0 21.24 16L8 2.76A10.2 10.2 0 0 0 6.08 6.93zm5.45-4.18 9.72 9.72a10.27 10.27 0 0 0-.44-7.45 10.26 10.26 0 0 0-7.45-.44z"/></svg>` },
  ];

  /* Tech stack brands */
  const TECH_BRANDS = [
    { name: 'Next.js', color: '#F0F0F0', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15V9.5l7.5 9.66A9.93 9.93 0 0 1 12 22a9.97 9.97 0 0 1-1-.07V17zm2-10.5V15l-4.5-5.77V7h.02A9.95 9.95 0 0 1 12 2c1.26 0 2.47.23 3.58.66L13 6.5z"/></svg>` },
    { name: 'React', color: '#61DAFB', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2.2"/><path fill="none" stroke="currentColor" stroke-width="1" d="M12 7.5c3.87 0 7 1.37 7 3s-3.13 3-7 3-7-1.37-7-3 3.13-3 7-3z" transform="rotate(30 12 12)"/><path fill="none" stroke="currentColor" stroke-width="1" d="M12 7.5c3.87 0 7 1.37 7 3s-3.13 3-7 3-7-1.37-7-3 3.13-3 7-3z" transform="rotate(90 12 12)"/><path fill="none" stroke="currentColor" stroke-width="1" d="M12 7.5c3.87 0 7 1.37 7 3s-3.13 3-7 3-7-1.37-7-3 3.13-3 7-3z" transform="rotate(150 12 12)"/></svg>` },
    { name: 'TypeScript', color: '#3178C6', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="2"/><path fill="#fff" d="M13.5 15.5v2.1c.4.2.9.35 1.4.43.55.08 1.1.12 1.6.12.5 0 .97-.05 1.42-.15.45-.1.84-.27 1.17-.5s.59-.54.78-.9c.19-.37.28-.82.28-1.33 0-.37-.06-.7-.17-.97a2.4 2.4 0 0 0-.48-.73 3.4 3.4 0 0 0-.73-.56c-.28-.16-.59-.32-.93-.47-.25-.11-.47-.22-.65-.32-.18-.1-.33-.21-.45-.33a1.3 1.3 0 0 1-.28-.36.94.94 0 0 1-.1-.43c0-.15.04-.28.1-.4.08-.12.18-.22.3-.3.13-.08.28-.14.46-.18.18-.04.37-.06.58-.06.15 0 .31.01.49.04.17.03.35.07.53.13.18.06.35.13.51.22.16.09.3.19.43.31v-1.96a4.6 4.6 0 0 0-.94-.26 6.6 6.6 0 0 0-1.14-.09c-.5 0-.96.06-1.4.17-.44.12-.82.3-1.15.54-.33.25-.59.55-.78.92-.19.37-.28.8-.28 1.29 0 .62.17 1.14.51 1.56.34.42.86.78 1.56 1.06.26.11.5.22.72.33.22.11.4.22.56.34.16.12.28.25.37.4.09.14.13.3.13.49 0 .14-.03.27-.1.39-.06.12-.16.22-.29.3-.13.09-.3.15-.5.2-.2.04-.43.06-.7.06-.47 0-.93-.09-1.38-.27-.45-.18-.86-.44-1.22-.78zM10.5 10.2H8v10h-2v-10H3.5V8.5h7v1.7z"/></svg>` },
    { name: 'Contentful', color: '#FFD85C', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="7" r="2.5"/><circle cx="5.5" cy="17" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M7.5 7.8a7.5 7.5 0 0 1 8.5 3.4M7.5 16.2a7.5 7.5 0 0 0 8.5-3.4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>` },
    { name: 'Sanity', color: '#F36458', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.3 5.5C6.3 8.3 8 9.9 11.3 10.8l3.5.9c2.8.8 4.5 2.3 4.5 5 0 .6-.1 1.1-.2 1.6a5.3 5.3 0 0 0-1.6-5.5c-.7-.6-1.7-1.1-3.2-1.5l-3.3-.9C8.6 9.8 6.7 8.5 6.3 5.5zm11.4 13a5.4 5.4 0 0 0 1.6-3.7c0-3-1.7-4.7-5.2-5.6l-3.3-.8C8.2 7.7 6.8 6.6 6.3 5.1 6.1 5.9 6 6.7 6 7.5c0 3 1.6 4.6 5.2 5.6l3.4.9c2.8.7 3.8 1.8 3.8 3.3 0 .4-.1.8-.3 1.2z"/></svg>` },
    { name: 'GraphQL', color: '#E10098', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.7 2.3l7.1 4.1c.1-.4.5-.7.9-.7a1 1 0 1 1 0 2c-.5 0-.9-.3-1-.8l-7.1 4.1v8.2c.5.1.8.6.8 1.1a1 1 0 1 1-2 0c0-.5.4-.9.8-1.1V11l-7-4.1c-.2.5-.6.8-1.1.8a1 1 0 1 1 0-2c.4 0 .8.3 1 .7l7-4.1z"/><path d="M3.3 7.5l8.4 14.7h.6L21 7.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>` },
    { name: 'Node.js', color: '#339933', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l9 5.25v10.5L12 23l-9-5.25V7.25L12 2zm0 2.16L5 8.87v7.26L12 20.84l7-4.71V8.87L12 4.16z"/><path d="M12 8v8l-3.5-2V10L12 8z"/></svg>` },
    { name: 'Netlify', color: '#00C7B7', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.93 12.05l-3.15-1.39c-.13-.06-.28-.02-.37.09l-1.98 2.33-.02.02-.48-.16v-2.88l2.78-2.67a.27.27 0 0 0 .02-.36l-1.66-2.11a.27.27 0 0 0-.38-.06L9.15 7.14 6.83 5.1a.27.27 0 0 0-.37.02L4.25 7.52a.27.27 0 0 0 .04.38l2.19 1.72v2.45L4.2 13.38a.27.27 0 0 0-.09.37l1.83 2.84c.09.13.27.17.4.08l2.6-1.86 2.56 1.2c.08.04.17.03.24-.02l5.34-3.5a.27.27 0 0 0 .04-.4l-.19-.04z"/></svg>` },
    { name: 'Vercel', color: '#F0F0F0', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 20h20L12 2z"/></svg>` },
    { name: 'Tailwind', color: '#06B6D4', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.9 1.35.98 1 2.1 2.15 4.6 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.9-1.35C15.62 7.15 14.5 6 12 6zM7 12c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.9 1.35C8.38 16.85 9.5 18 12 18c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.9-1.35C10.62 13.15 9.5 12 7 12z"/></svg>` },
    { name: 'Storybook', color: '#FF4785', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.24 2.04l-.34 3.38-.95-.88-.95.88-.03-3.56L5.6 2.8A1 1 0 0 0 4.7 3.8v16.4a1 1 0 0 0 .94 1l12.85.8a1 1 0 0 0 1.06-1V3.04a1 1 0 0 0-1.06-1h-1.25zm-2.6 7.84c0 .44 2.94.23 3.33-.09 0-2.94-1.58-4.48-4.47-4.48s-4.53 1.6-4.53 3.99c0 4.14 5.58 4.22 5.58 6.48 0 .64-.28 1.01-1.01 1.01-.9 0-1.3-.46-1.25-2.05 0-.33-3.4-.44-3.51 0-.26 3.7 2.04 4.77 4.82 4.77s4.72-1.43 4.72-4.02c0-4.44-5.67-4.31-5.67-6.53 0-.87.55-1 1.04-1 .52 0 1.13.07.95 1.92z"/></svg>` },
    { name: 'Cypress', color: '#17202C', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.65 14.15l-1.55.9c-.2-.4-.45-.7-.75-.9-.3-.2-.6-.3-1-.3-.55 0-1 .2-1.35.6-.35.4-.55.95-.55 1.6s.2 1.2.55 1.6c.35.4.8.6 1.35.6.7 0 1.25-.35 1.65-1.05l1.5.85c-.3.55-.75 1-1.3 1.3-.55.3-1.2.45-1.9.45-.55 0-1.05-.1-1.5-.3s-.85-.5-1.15-.85c-.3-.35-.55-.8-.75-1.3-.2-.5-.3-1.05-.3-1.65s.1-1.15.3-1.65c.2-.5.45-.9.75-1.25.3-.35.7-.6 1.15-.8.45-.2.95-.3 1.5-.3 1.35 0 2.35.65 3 1.9z"/></svg>` },
  ];

  const PREDEFINED_SETS = {
    'integration': INTEGRATION_BRANDS,
    'tech': TECH_BRANDS,
  };

  class CcLogoCloud extends HTMLElement {
    connectedCallback() {
      this._setupBrands();
      this._render();
      this._injectStyles();
      this._animate();
    }

    _setupBrands() {
      // Allow multiple ways to specify brands:
      // 1. brands="tech" or brands="integration" for predefined sets
      // 2. Custom brands via JSON in brands attribute
      // 3. Default to integration brands
      const brandsAttr = this.getAttribute('brands');
      
      if (PREDEFINED_SETS[brandsAttr]) {
        this.brands = PREDEFINED_SETS[brandsAttr];
      } else if (brandsAttr && brandsAttr.startsWith('[')) {
        try {
          this.brands = JSON.parse(brandsAttr);
        } catch {
          this.brands = INTEGRATION_BRANDS;
        }
      } else {
        this.brands = INTEGRATION_BRANDS;
      }
    }

    _render() {
      const title = this.getAttribute('title') || 'Integrates With Everything';
      const subtitle = this.getAttribute('subtitle') || '+ Custom APIs & Webhooks';
      
      this.innerHTML = `
        <div class="lc-container">
          <h3 class="lc-title">${title}</h3>
          <div class="lc-grid">
            ${this.brands.map((brand, i) => `
              <div class="lc-item" data-index="${i}" style="--brand-color: ${brand.color}">
                <div class="lc-icon">${brand.icon}</div>
                <span class="lc-label">${brand.name}</span>
              </div>
            `).join('')}
          </div>
          ${subtitle ? `<p class="lc-subtitle">${subtitle}</p>` : ''}
        </div>
      `;
    }

    _animate() {
      const items = this.querySelectorAll('.lc-item');
      const total = items.length;
      this.visibleSet = new Set();

      // Add hover listeners for immediate fade-in
      items.forEach((item, i) => {
        item.addEventListener('mouseenter', () => {
          item.classList.add('lc-visible', 'lc-hover');
          item.style.transitionDelay = '0s';
        });
        
        item.addEventListener('mouseleave', () => {
          item.classList.remove('lc-hover');
          // If it's not in the current visible set, fade it back out
          if (!this.visibleSet.has(i)) {
            item.classList.remove('lc-visible');
            item.style.transitionDelay = `${Math.random() * 0.3}s`;
          }
        });
      });

      const cycle = () => {
        // Show 4-6 items at random
        const showCount = 4 + Math.floor(Math.random() * 3);
        this.visibleSet.clear();

        // Generate random indices
        while (this.visibleSet.size < Math.min(showCount, total)) {
          this.visibleSet.add(Math.floor(Math.random() * total));
        }

        items.forEach((item, i) => {
          const shouldShow = this.visibleSet.has(i);
          const isHovered = item.classList.contains('lc-hover');
          
          if (shouldShow || isHovered) {
            item.classList.add('lc-visible');
            // More random delay spread
            item.style.transitionDelay = `${Math.random() * 0.6}s`;
          } else {
            item.classList.remove('lc-visible');
            item.style.transitionDelay = `${Math.random() * 0.4}s`;
          }
        });
      };

      // Initial display
      cycle();
      // Cycle every 3s with some randomness
      const intervalTime = 2800 + Math.random() * 800;
      this._interval = setInterval(cycle, intervalTime);
    }

    disconnectedCallback() {
      if (this._interval) clearInterval(this._interval);
    }

    _injectStyles() {
      if (document.getElementById('cc-lc-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-lc-styles';
      s.textContent = `
        cc-logo-cloud { display: block; }
        .lc-container {
          text-align: center;
          padding: 48px 24px;
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .lc-title {
          font-size: 1.5rem; font-weight: 700;
          color: var(--text, #e2e8f0);
          margin: 0 0 36px;
        }
        .lc-grid {
          display: flex; flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
          max-width: 700px;
          margin: 0 auto;
          min-height: 120px;
        }
        .lc-item {
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
          width: 80px;
          opacity: 0.12;
          transform: scale(0.85);
          transition: opacity 0.8s ease, transform 0.8s ease;
          will-change: opacity, transform;
          cursor: pointer;
        }
        .lc-item.lc-visible {
          opacity: 1;
          transform: scale(1);
        }
        .lc-item.lc-hover {
          transform: scale(1.05);
        }
        .lc-icon {
          width: 48px; height: 48px;
          color: var(--brand-color);
          filter: drop-shadow(0 0 12px var(--brand-color));
          transition: filter 0.8s ease, transform 0.3s ease;
        }
        .lc-item:hover .lc-icon {
          transform: scale(1.1);
          filter: drop-shadow(0 0 18px var(--brand-color));
        }
        .lc-item:not(.lc-visible) .lc-icon {
          filter: none;
        }
        .lc-icon svg { width: 100%; height: 100%; }
        .lc-label {
          font-size: 0.72rem; font-weight: 600;
          color: var(--muted, #94a3b8);
          letter-spacing: 0.3px;
          white-space: nowrap;
          transition: color 0.3s ease;
        }
        .lc-item:hover .lc-label {
          color: var(--text, #e2e8f0);
        }
        .lc-subtitle {
          margin: 28px 0 0;
          font-size: 0.85rem;
          color: var(--muted, #94a3b8);
          font-style: italic;
        }
        @media (max-width: 600px) {
          .lc-grid { gap: 20px; }
          .lc-item { width: 64px; }
          .lc-icon { width: 36px; height: 36px; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcLogoCloud);
})();