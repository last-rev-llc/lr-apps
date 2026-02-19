/* Daily Updates — Social Feed Component */

class DailyUpdates extends HTMLElement {
  constructor() {
    super();
    this.db = null;
    this.updates = [];
    this.profiles = [];
    this.sourceApps = [];
    this.categories = [];
    this.currentFilters = {
      source_app: 'all',
      category: 'all',
      time_range: 'all',
      search: ''
    };
    this.currentView = 'cards';
    this.loading = false;
    this.loadedCount = 0;
    this.hasMore = true;
  }

  async connectedCallback() {
    await this.loadData();
    this.render();
    this.setupEventListeners();
  }

  async loadData() {
    try {
      this.db = await DailyUpdatesDB.init();
      
      // Load initial data
      await Promise.all([
        this.loadUpdates(true),
        this.loadSourceApps(),
        this.loadCategories(),
        this.loadProfiles()
      ]);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showError('Failed to load updates');
    }
  }

  async loadUpdates(reset = false) {
    if (this.loading) return;
    this.loading = true;

    try {
      const offset = reset ? 0 : this.loadedCount;
      const limit = 20;
      
      const newUpdates = await this.db.getUpdates({
        ...this.currentFilters,
        limit,
        offset
      });

      if (reset) {
        this.updates = newUpdates;
        this.loadedCount = newUpdates.length;
      } else {
        this.updates.push(...newUpdates);
        this.loadedCount += newUpdates.length;
      }

      this.hasMore = newUpdates.length === limit;
      
      if (reset) {
        this.refreshContent();
      } else {
        this.renderMoreUpdates(newUpdates);
      }
      
    } catch (error) {
      console.error('Failed to load updates:', error);
      this.showError('Failed to load updates');
    }

    this.loading = false;
  }

  async loadSourceApps() {
    try {
      this.sourceApps = await this.db.getSourceApps();
    } catch (error) {
      console.error('Failed to load source apps:', error);
    }
  }

  async loadCategories() {
    try {
      this.categories = await this.db.getCategories();
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  async loadProfiles() {
    try {
      this.profiles = await this.db.getProfiles();
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  }

  render() {
    this.innerHTML = `
      ${this.renderHeader()}
      <div class="daily-updates-container">
        ${this.renderFilters()}
        ${this.renderTimeTabs()}
        ${this.renderContent()}
        ${this.renderLoadMore()}
      </div>
    `;
    
    // Refresh Lucide icons
    if (window.lucide) window.lucide.createIcons();
    this.setupInfiniteScroll();
  }

  renderHeader() {
    return `
      <div class="page-header">
        <div>
          <h1>📱 Daily Updates</h1>
          <!-- subtitle removed -->
        </div>
        <div class="header-right">
          <cc-view-toggle app="daily-updates"></cc-view-toggle>
          <button class="btn btn-secondary btn-icon" data-action="email-modal" title="Email Summary">
            <i data-lucide="mail"></i>
          </button>
          <button class="btn btn-secondary btn-icon" data-action="presentation-modal" title="Create Presentation">
            <i data-lucide="presentation"></i>
          </button>
        </div>
      </div>
    `;
  }

  renderFilters() {
    const sourceOptions = [
      { value: 'all', label: 'All Apps' },
      ...this.sourceApps.map(app => ({ 
        value: app.id, 
        label: app.name 
      }))
    ];

    const categoryOptions = [
      { value: 'all', label: 'All Categories' },
      ...this.categories.map(cat => ({ 
        value: cat, 
        label: this.formatCategoryName(cat) 
      }))
    ];

    return `
      <div class="controls">
        <div style="display:flex;gap:12px;align-items:center;">
          <cc-search placeholder="Search updates..." value="${this._esc(this.currentFilters.search)}" input-style="width:100%;"></cc-search>
          <cc-filter-drawer title="Filters" ${this.hasActiveFilters() ? 'active' : ''}>
            <div class="filter-section-label" style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--muted);margin-bottom:6px;">Filter Updates</div>
            <cc-pill-dropdown label="Source App" items='${JSON.stringify(sourceOptions)}' value="${this.currentFilters.source_app}"></cc-pill-dropdown>
            <cc-pill-dropdown label="Category" items='${JSON.stringify(categoryOptions)}' value="${this.currentFilters.category}"></cc-pill-dropdown>
          </cc-filter-drawer>
        </div>
      </div>
    `;
  }

  hasActiveFilters() {
    return this.currentFilters.source_app !== 'all' || 
           this.currentFilters.category !== 'all' ||
           this.currentFilters.time_range !== 'all' ||
           (this.currentFilters.search && this.currentFilters.search.length > 0);
  }

  renderTimeTabs() {
    return `
      <cc-tabs active="${this.currentFilters.time_range}" no-url>
        <cc-tab name="all" label="All Time"></cc-tab>
        <cc-tab name="day" label="Today"></cc-tab>
        <cc-tab name="week" label="This Week"></cc-tab>
        <cc-tab name="month" label="This Month"></cc-tab>
      </cc-tabs>
    `;
  }

  renderContent() {
    if (this.updates.length === 0) {
      return `
        <cc-empty-state 
          message="No updates yet — the feed is waiting for its first post!" 
          icon="📭"
          animation="sparkle">
        </cc-empty-state>
      `;
    }

    const viewClass = this.currentView === 'list' ? 'view-list' : 
                     this.currentView === 'expanded' ? 'view-expanded' : 
                     'view-cards';

    return `
      <div id="updates-container" class="${viewClass}">
        ${this.updates.map(update => this.renderUpdate(update)).join('')}
      </div>
    `;
  }

  renderUpdate(update) {
    const timeAgo = this.formatTimeAgo(update.created_at);
    const links = this.parseLinks(update.links);
    const reactions = update.reactions || {};
    
    if (this.currentView === 'list') {
      return this.renderUpdateList(update, timeAgo, links, reactions);
    } else if (this.currentView === 'expanded') {
      return this.renderUpdateExpanded(update, timeAgo, links, reactions);
    } else {
      return this.renderUpdateCard(update, timeAgo, links, reactions);
    }
  }

  _neonColor(sourceApp) {
    const colors = {
      'command-center': '#f59e0b',
      'media-gallery': '#a855f7',
      'crm': '#3b82f6',
      'travel': '#06b6d4',
      'daily-updates': '#10b981',
      'kanban': '#ef4444',
      'accounts': '#6366f1',
      'recipes': '#ec4899',
      'crons': '#14b8a6',
      'prompts': '#8b5cf6',
      'ideas': '#f97316',
    };
    return colors[sourceApp] || '#f59e0b';
  }

  _previewImage(update) {
    // Use image_url if present, or first link that looks like an image, or generate a gradient placeholder
    if (update.image_url) return update.image_url;
    const links = this.parseLinks(update.links);
    const imgLink = links.find(l => /\.(png|jpg|jpeg|gif|webp|svg)/i.test(l.url));
    if (imgLink) return imgLink.url;
    return null;
  }

  /* ── OG Link Preview (Facebook-style) ── */
  _ogCache = {};

  _getPreviewableLinks(update) {
    const links = this.parseLinks(update.links);
    // Return links that are web URLs (not images, not anchors)
    return links.filter(l => 
      l.url && 
      /^https?:\/\//i.test(l.url) && 
      !/\.(png|jpg|jpeg|gif|webp|svg|mp4|mp3|pdf)$/i.test(l.url)
    );
  }

  async _fetchOG(url) {
    if (this._ogCache[url]) return this._ogCache[url];

    // Check localStorage cache
    const cacheKey = `og_${btoa(url).slice(0, 40)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed._ts && Date.now() - parsed._ts < 86400000) { // 24h cache
          this._ogCache[url] = parsed;
          return parsed;
        }
      }
    } catch(e) {}

    try {
      // Use microlink.io free tier for OG extraction
      const resp = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      if (!resp.ok) return null;
      const json = await resp.json();
      if (json.status !== 'success' || !json.data) return null;
      
      const d = json.data;
      const result = {
        title: d.title || '',
        description: d.description || '',
        image: d.image?.url || d.logo?.url || '',
        site: d.publisher || new URL(url).hostname.replace('www.', ''),
        url: url,
        _ts: Date.now()
      };
      
      this._ogCache[url] = result;
      try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch(e) {}
      return result;
    } catch(e) {
      console.warn('OG fetch failed for', url, e);
      return null;
    }
  }

  _renderOGPreview(og) {
    if (!og) return '';
    const hasImage = og.image && og.image.length > 0;
    return `
      <a href="${this._esc(og.url)}" target="_blank" rel="noopener" class="og-preview-card">
        ${hasImage ? `<div class="og-preview-image"><img src="${this._esc(og.image)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` : ''}
        <div class="og-preview-body">
          <div class="og-preview-site">${this._esc(og.site)}</div>
          <div class="og-preview-title">${this._esc(og.title)}</div>
          ${og.description ? `<div class="og-preview-desc">${this._esc(og.description.slice(0, 120))}${og.description.length > 120 ? '…' : ''}</div>` : ''}
        </div>
      </a>
    `;
  }

  async _loadOGForCard(updateId, links) {
    // Fetch OG for the first previewable link and inject into the card
    if (!links.length) return;
    const og = await this._fetchOG(links[0].url);
    if (!og || (!og.title && !og.image)) return;

    const cardEl = this.querySelector(`[data-id="${updateId}"]`);
    if (!cardEl) return;

    // Replace the old preview section or insert before update-body
    const existingPreview = cardEl.querySelector('.update-preview');
    const ogHTML = this._renderOGPreview(og);

    if (existingPreview) {
      existingPreview.outerHTML = ogHTML;
    } else {
      const body = cardEl.querySelector('.update-body');
      if (body) body.insertAdjacentHTML('beforebegin', ogHTML);
    }

    // If there are more links, add additional previews after the first
    for (let i = 1; i < Math.min(links.length, 3); i++) {
      const ogN = await this._fetchOG(links[i].url);
      if (ogN && (ogN.title || ogN.image)) {
        const body = cardEl.querySelector('.update-body');
        if (body) body.insertAdjacentHTML('beforebegin', this._renderOGPreview(ogN));
      }
    }
  }

  renderUpdateCard(update, timeAgo, links, reactions) {
    const neon = this._neonColor(update.source_app);
    const previewImg = this._previewImage(update);
    const previewableLinks = this._getPreviewableLinks(update);

    // If there are previewable links, show a placeholder that gets replaced async
    // Otherwise fall back to image or gradient
    let previewHTML;
    if (previewableLinks.length > 0) {
      // Kick off async OG fetch — will replace placeholder when done
      previewHTML = `<div class="update-preview og-preview-placeholder" style="background:linear-gradient(135deg, ${neon}22 0%, ${neon}08 100%);">
          <div class="og-loading-pulse"></div>
        </div>`;
      // Schedule OG fetch (non-blocking)
      setTimeout(() => this._loadOGForCard(update.id, previewableLinks), 0);
    } else if (previewImg) {
      previewHTML = `<div class="update-preview"><img src="${this._esc(previewImg)}" alt="" loading="lazy"></div>`;
    } else {
      previewHTML = `<div class="update-preview update-preview-gradient" style="background:linear-gradient(135deg, ${neon}22 0%, ${neon}08 100%);">
          <span class="update-preview-icon">${update.source_icon || '📱'}</span>
        </div>`;
    }

    return `
      <div class="card update-card" data-id="${update.id}" style="--neon: ${neon}; border-left: 3px solid ${neon};">
        <div class="update-header">
          <div class="update-avatar" style="background: ${neon}18; border-color: ${neon}55;">
            <span class="update-icon" style="background: ${neon}22; border-color: ${neon}44;">${update.source_icon}</span>
          </div>
          <div class="update-meta">
            <div class="update-source" style="color: ${neon};">${this._esc(update.source_name)}</div>
            <div class="update-time">${timeAgo}</div>
          </div>
          ${update.priority === 'high' ? '<div class="priority-badge">🔥</div>' : ''}
        </div>

        ${previewHTML}
        
        <div class="update-body">
          <h3 class="update-title">${this._esc(update.title)}</h3>
          <div class="update-text">${this.formatUpdateText(update.body)}</div>
          
          ${links.length > 0 ? `
            <div class="update-links">
              ${links.map(link => `
                <a href="${this._esc(link.url)}" target="_blank" rel="noopener" class="pill link-pill" style="border-color: ${neon}44; color: ${neon};">
                  ${this._esc(link.label)}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="update-footer">
          <div class="update-reactions">
            ${this.renderReactionButtons(update.id, reactions)}
          </div>
          <button class="btn-ghost btn-sm share-btn" data-action="share" data-update-id="${this._escAttr(update.id)}">
            <i data-lucide="share"></i> Share
          </button>
        </div>
      </div>
    `;
  }

  renderUpdateList(update, timeAgo, links, reactions) {
    return `
      <div class="list-row update-row" data-id="${update.id}">
        <div class="update-icon">${update.source_icon}</div>
        <div class="update-info">
          <div class="update-title-row">
            <span class="update-source">${this._esc(update.source_name)}</span>
            <span class="update-time">${timeAgo}</span>
          </div>
          <div class="update-title">${this._esc(update.title)}</div>
          <div class="update-reactions-inline">
            ${Object.entries(reactions).map(([emoji, count]) => 
              `<span class="reaction-inline">${emoji} ${count}</span>`
            ).join('')}
          </div>
        </div>
        <button class="btn-ghost btn-sm" data-action="expand" data-update-id="${this._escAttr(update.id)}">
          <i data-lucide="chevron-right"></i>
        </button>
      </div>
    `;
  }

  renderUpdateExpanded(update, timeAgo, links, reactions) {
    return `
      <div class="expanded-card update-expanded" data-id="${update.id}">
        <div class="update-header">
          <div class="update-avatar">
            <span class="update-icon">${update.source_icon}</span>
          </div>
          <div class="update-meta">
            <div class="update-source">${this._esc(update.source_name)}</div>
            <div class="update-time">${timeAgo}</div>
          </div>
        </div>
        
        <div class="update-body">
          <h2 class="update-title">${this._esc(update.title)}</h2>
          <div class="update-text">${this.formatUpdateText(update.body)}</div>
          
          ${links.length > 0 ? `
            <div class="update-links">
              ${links.map(link => `
                <a href="${this._esc(link.url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                  ${this.getLinkIcon(link.type)} ${this._esc(link.label)}
                </a>
              `).join('')}
            </div>
          ` : ''}
          
          ${update.tags && update.tags.length > 0 ? `
            <div class="update-tags">
              ${update.tags.map(tag => `
                <span class="tag">#${this._esc(tag)}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="update-footer">
          <div class="update-reactions">
            ${this.renderReactionButtons(update.id, reactions)}
          </div>
          <div class="update-actions">
            <button class="btn-ghost btn-sm" data-action="share" data-update-id="${this._escAttr(update.id)}">
              <i data-lucide="share"></i> Share
            </button>
            <button class="btn-ghost btn-sm" data-action="copy" data-update-id="${this._escAttr(update.id)}">
              <i data-lucide="copy"></i> Copy
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderReactionButtons(updateId, reactions) {
    const availableReactions = ['🔥', '❤️', '👏', '💡', '😂'];
    
    return availableReactions.map(emoji => {
      const count = reactions[emoji] || 0;
      const hasCount = count > 0;
      
      return `
        <button class="reaction-btn ${hasCount ? 'has-reaction' : ''}" 
                data-action="reaction"
                data-emoji="${emoji}" 
                data-update-id="${this._escAttr(updateId)}">
          ${emoji} ${hasCount ? count : ''}
        </button>
      `;
    }).join('');
  }

  renderLoadMore() {
    if (!this.hasMore || this.updates.length === 0) return '';
    
    return `
      <div class="load-more-container" id="infinite-scroll-sentinel">
        <div class="scroll-loader">
          <div class="scroll-spinner"></div>
          <span>Loading more updates…</span>
        </div>
      </div>
    `;
  }

  renderMoreUpdates(newUpdates) {
    const container = this.querySelector('#updates-container');
    if (!container) return;
    
    const newHTML = newUpdates.map(update => this.renderUpdate(update)).join('');
    container.insertAdjacentHTML('beforeend', newHTML);
    
    // Refresh icons for new content
    if (window.lucide) window.lucide.createIcons();
    
    // Update load more sentinel
    const loadMoreContainer = this.querySelector('.load-more-container');
    if (loadMoreContainer) {
      if (this._scrollObserver) this._scrollObserver.disconnect();
      loadMoreContainer.outerHTML = this.renderLoadMore();
      this.setupInfiniteScroll();
    }
  }

  setupInfiniteScroll() {
    if (this._scrollObserver) this._scrollObserver.disconnect();
    const sentinel = this.querySelector('#infinite-scroll-sentinel');
    if (!sentinel) return;

    this._scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasMore && !this.loading) {
        this.loadMore();
      }
    }, { rootMargin: '400px' });

    this._scrollObserver.observe(sentinel);
  }

  setupEventListeners() {
    // Search
    this.addEventListener('cc-search', (e) => {
      this.currentFilters.search = e.detail.value;
      this.applyFilters();
    });

    // Filter dropdowns
    this.addEventListener('dropdown-change', (e) => {
      const label = e.target.getAttribute('label');
      if (label === 'Source App') {
        this.currentFilters.source_app = e.detail.value;
        this.applyFilters();
      } else if (label === 'Category') {
        this.currentFilters.category = e.detail.value;
        this.applyFilters();
      }
    });

    // Time range tabs
    this.addEventListener('tab-change', (e) => {
      this.currentFilters.time_range = e.detail.tab;
      this.applyFilters();
    });

    // View toggle
    this.addEventListener('cc-view-change', (e) => {
      this.currentView = e.detail.view;
      this.refreshContent();
    });

    // Button click handlers (using event delegation)
    this.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      switch (action) {
        case 'email-modal':
          this.showEmailModal();
          break;
        case 'presentation-modal':
          this.showPresentationModal();
          break;
        case 'share':
          const shareUpdateId = e.target.closest('[data-update-id]')?.dataset.updateId;
          if (shareUpdateId) this.shareUpdate(shareUpdateId);
          break;
        case 'copy':
          const copyUpdateId = e.target.closest('[data-update-id]')?.dataset.updateId;
          if (copyUpdateId) this.copyUpdate(copyUpdateId);
          break;
        case 'expand':
          const expandUpdateId = e.target.closest('[data-update-id]')?.dataset.updateId;
          if (expandUpdateId) this.expandUpdate(expandUpdateId);
          break;
        case 'reaction':
          const reactionBtn = e.target.closest('[data-action="reaction"]');
          const emoji = reactionBtn?.dataset.emoji;
          const reactionUpdateId = reactionBtn?.dataset.updateId;
          if (emoji && reactionUpdateId) this.toggleReaction(reactionUpdateId, emoji);
          break;
      }
    });
  }

  refreshContent() {
    const container = this.querySelector('#updates-container');
    if (container) {
      const viewClass = this.currentView === 'list' ? 'view-list' : 
                       this.currentView === 'expanded' ? 'view-expanded' : 
                       'view-cards';
      container.className = viewClass;
      container.innerHTML = this.updates.map(update => this.renderUpdate(update)).join('');
      if (window.lucide) window.lucide.createIcons();
    }
    // Re-render sentinel and re-attach observer
    const oldSentinel = this.querySelector('.load-more-container');
    if (oldSentinel) oldSentinel.outerHTML = this.renderLoadMore();
    else if (this.hasMore && this.updates.length > 0) {
      this.querySelector('.daily-updates-container')?.insertAdjacentHTML('beforeend', this.renderLoadMore());
    }
    this.setupInfiniteScroll();
  }

  async applyFilters() {
    await this.loadUpdates(true);
  }

  async loadMore() {
    await this.loadUpdates(false);
  }

  async toggleReaction(updateId, emoji) {
    try {
      await this.db.toggleReaction(updateId, emoji);
      
      // Update local state
      const update = this.updates.find(u => u.id === updateId);
      if (update) {
        if (!update.reactions) update.reactions = {};
        if (update.reactions[emoji]) {
          update.reactions[emoji]++;
        } else {
          update.reactions[emoji] = 1;
        }
        
        // Re-render just this update's reactions
        const updateEl = this.querySelector(`[data-id="${updateId}"]`);
        if (updateEl) {
          const reactionsEl = updateEl.querySelector('.update-reactions');
          if (reactionsEl) {
            reactionsEl.innerHTML = this.renderReactionButtons(updateId, update.reactions);
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      this.showError('Failed to add reaction');
    }
  }

  async shareUpdate(updateId) {
    const url = `${window.location.origin}${window.location.pathname}?update=${updateId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daily Update',
          url
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.copyToClipboard(url);
        }
      }
    } else {
      this.copyToClipboard(url);
    }
  }

  async copyUpdate(updateId) {
    const update = this.updates.find(u => u.id === updateId);
    if (update) {
      const text = `${update.source_name}: ${update.title}\\n\\n${update.body}`;
      this.copyToClipboard(text);
    }
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied to clipboard!');
    }).catch(() => {
      this.showError('Failed to copy to clipboard');
    });
  }

  showEmailModal() {
    this._showDateRangeModal('Email Summary', 'email');
  }

  showPresentationModal() {
    this._showDateRangeModal('Create Presentation', 'presentation');
  }

  _showDateRangeModal(title, type) {
    // Remove any existing modal
    const existing = document.getElementById('du-date-modal');
    if (existing) existing.remove();

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const modal = document.createElement('cc-modal');
    modal.id = 'du-date-modal';
    modal.setAttribute('title', title);
    modal.setAttribute('size', 'sm');

    modal.innerHTML = `
      <div class="cc-modal-body">
        <div style="display:flex;flex-direction:column;gap:14px;">
          <label style="font-size:.85rem;color:var(--text-muted,#aaa);">
            Start Date
            <input type="date" id="du-date-start" value="${weekAgo}" style="display:block;width:100%;margin-top:4px;padding:10px;border-radius:8px;border:1px solid var(--border,#333);background:var(--input-bg,#12121e);color:var(--text,#e0e0e0);font-size:.9rem;">
          </label>
          <label style="font-size:.85rem;color:var(--text-muted,#aaa);">
            End Date
            <input type="date" id="du-date-end" value="${today}" style="display:block;width:100%;margin-top:4px;padding:10px;border-radius:8px;border:1px solid var(--border,#333);background:var(--input-bg,#12121e);color:var(--text,#e0e0e0);font-size:.9rem;">
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('du-date-start').value='${today}';document.getElementById('du-date-end').value='${today}';">Today</button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('du-date-start').value='${weekAgo}';document.getElementById('du-date-end').value='${today}';">Last 7 days</button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('du-date-start').value='${new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]}';document.getElementById('du-date-end').value='${today}';">Last 30 days</button>
          </div>
        </div>
      </div>
      <div slot="footer">
        <button class="btn btn-secondary" onclick="this.closest('cc-modal').close()">Cancel</button>
        <button class="btn btn-primary" id="du-date-submit">
          ${type === 'email' ? '📧 Queue Email Summary' : '📊 Queue Presentation'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Wire up submit
    setTimeout(() => {
      const submitBtn = document.getElementById('du-date-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const start = document.getElementById('du-date-start')?.value;
          const end = document.getElementById('du-date-end')?.value;
          if (!start || !end) { this.showError('Please select both dates'); return; }
          if (start > end) { this.showError('Start date must be before end date'); return; }
          this._queueDateRangeAction(type, start, end);
          modal.close();
        });
      }
      modal.open();
    }, 50);
  }

  async _queueDateRangeAction(type, startDate, endDate) {
    const message = type === 'email'
      ? `Generate an email summary of daily updates from ${startDate} to ${endDate} for the Daily Updates app.`
      : `Create a presentation of daily updates from ${startDate} to ${endDate} for the Daily Updates app.`;

    try {
      if (window.supabase?.upsert) {
        await window.supabase.upsert('trigger_queue', {
          message,
          source: 'daily-updates',
          status: 'pending'
        });
      } else {
        const keyMeta = document.querySelector('meta[name="supabase-key"]');
        const urlMeta = document.querySelector('meta[name="supabase-url"]');
        const anonKey = keyMeta?.content || 'sb_publishable_HPinRWPrX97uxshGM0u1rw_UAsQsyFq';
        const sbUrl = urlMeta?.content || 'https://lregiwsovpmljxjvrrsc.supabase.co';
        await fetch(`${sbUrl}/rest/v1/trigger_queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ message, source: 'daily-updates', status: 'pending' })
        });
      }
      this.showToast(type === 'email' ? '📧 Email summary queued!' : '📊 Presentation creation queued!');
    } catch (err) {
      console.error('Queue error:', err);
      this.showError('Failed to queue — please try again');
    }
  }

  expandUpdate(updateId) {
    // For list view, expand to show full details
    this.currentView = 'expanded';
    this.refreshContent();
    
    // Scroll to the update
    setTimeout(() => {
      const updateEl = this.querySelector(`[data-id="${updateId}"]`);
      if (updateEl) {
        updateEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  // Utility methods
  formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  parseLinks(linksJson) {
    try {
      if (typeof linksJson === 'string') {
        return JSON.parse(linksJson);
      }
      return Array.isArray(linksJson) ? linksJson : [];
    } catch (e) {
      return [];
    }
  }

  getLinkIcon(type) {
    const icons = {
      pr: '<i data-lucide="git-pull-request"></i>',
      repo: '<i data-lucide="github"></i>',
      slack: '<i data-lucide="message-circle"></i>',
      jira: '<i data-lucide="ticket"></i>',
      doc: '<i data-lucide="file-text"></i>',
      site: '<i data-lucide="external-link"></i>'
    };
    return icons[type] || '<i data-lucide="link"></i>';
  }

  formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  }

  formatUpdateText(text) {
    if (!text) return '';
    let escaped = this._esc(text);
    // Bold and italic
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet lines: • or - at start of line
    escaped = escaped.replace(/^([•\-])\s+/gm, '<span class="bullet">$1</span> ');
    // Double newline = paragraph break, single = line break
    escaped = escaped.replace(/\n\n/g, '</p><p>');
    escaped = escaped.replace(/\n/g, '<br>');
    return '<p>' + escaped + '</p>';
  }

  showToast(message, duration = 3000) {
    if (window.showToast) {
      window.showToast(message, duration);
    }
  }

  showError(message) {
    this.showToast(message, 5000);
  }

  _esc(str) {
    if (!str) return '';
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  _escAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

customElements.define('daily-updates', DailyUpdates);