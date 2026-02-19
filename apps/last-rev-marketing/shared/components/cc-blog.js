(function () {
  const TAG = 'cc-blog';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
  const BLOG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'%3E%3Crect fill='%230f172a' width='800' height='400'/%3E%3Crect x='200' y='100' width='400' height='200' rx='16' fill='%231e293b' stroke='%23334155' stroke-width='1'/%3E%3Ccircle cx='400' cy='175' r='30' fill='none' stroke='%23f59e0b' stroke-width='2' opacity='0.5'/%3E%3Crect x='320' y='225' width='160' height='8' rx='4' fill='%23334155'/%3E%3Crect x='340' y='245' width='120' height='6' rx='3' fill='%23334155' opacity='0.6'/%3E%3C/svg%3E";

  /**
   * <cc-blog> — Blog listing and post display component
   *
   * Usage (listing mode):
   *   <cc-blog
   *     mode="listing"
   *     columns="3"
   *     variant="cards|minimal|magazine"
   *     show-featured="true"
   *     show-categories="true"
   *     show-search="true">
   *   </cc-blog>
   *
   * Posts are provided as <cc-blog-post> children or via data-posts JSON attribute.
   *
   * Usage (single post mode):
   *   <cc-blog mode="post" title="..." author="..." date="..." category="..." image="..." read-time="...">
   *     <div slot="content">...HTML/MDX content...</div>
   *   </cc-blog>
   *
   * Child element:
   *   <cc-blog-post
   *     title="Post Title"
   *     slug="post-slug"
   *     excerpt="Short description"
   *     image="https://..."
   *     author="Author Name"
   *     author-image="https://..."
   *     date="2026-02-17"
   *     category="AI"
   *     read-time="5 min"
   *     featured="true">
   *   </cc-blog-post>
   */

  class CcBlog extends HTMLElement {
    static get observedAttributes() {
      return ['mode', 'columns', 'variant', 'show-featured', 'show-categories', 'show-search',
              'title', 'author', 'author-image', 'date', 'category', 'image', 'read-time'];
    }

    connectedCallback() {
      this._activeCategory = this._activeCategory || 'all';
      this._searchQuery = this._searchQuery || '';
      // In post mode, cache slotted content on first connect before any render
      // replaces innerHTML. lr-layout reparenting can trigger connectedCallback
      // again after innerHTML was already replaced — the cache survives that.
      if (!this._cachedPostContent) {
        const slot = this.querySelector('[slot="content"]');
        if (slot) this._cachedPostContent = slot.innerHTML;
      }
      if (this._postRendered) return;
      this._render();
    }

    attributeChangedCallback() {
      // In post mode, never re-render — content is static and re-render would
      // lose the cached post body (the slot is gone after first render).
      if (this.getAttribute('mode') === 'post' && this._postRendered) return;
      if (this.isConnected) this._render();
    }

    _getPosts() {
      const jsonAttr = this.getAttribute('data-posts');
      if (jsonAttr) {
        try { return JSON.parse(jsonAttr); } catch(e) { /* fall through */ }
      }
      return Array.from(this.querySelectorAll('cc-blog-post')).map(el => ({
        title: el.getAttribute('title') || '',
        slug: el.getAttribute('slug') || '',
        excerpt: el.getAttribute('excerpt') || '',
        image: el.getAttribute('image') || '',
        author: el.getAttribute('author') || '',
        authorImage: el.getAttribute('author-image') || '',
        date: el.getAttribute('date') || '',
        category: el.getAttribute('category') || '',
        readTime: el.getAttribute('read-time') || '',
        featured: el.getAttribute('featured') === 'true',
        href: el.getAttribute('href') || '',
      }));
    }

    _getCategories(posts) {
      const cats = new Set();
      posts.forEach(p => { if (p.category) cats.add(p.category); });
      return Array.from(cats).sort();
    }

    _filterPosts(posts) {
      let filtered = posts;
      if (this._activeCategory !== 'all') {
        filtered = filtered.filter(p => p.category === this._activeCategory);
      }
      if (this._searchQuery) {
        const q = this._searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          (p.author && p.author.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }
      return filtered;
    }

    _formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch(e) { return dateStr; }
    }

    _renderListing() {
      const variant = this.getAttribute('variant') || 'cards';
      const columns = this.getAttribute('columns') || '3';
      const showFeatured = this.getAttribute('show-featured') !== 'false';
      const showCategories = this.getAttribute('show-categories') !== 'false';
      const showSearch = this.getAttribute('show-search') !== 'false';

      const allPosts = this._getPosts();
      const categories = this._getCategories(allPosts);
      const featured = showFeatured ? allPosts.find(p => p.featured) : null;
      const filtered = this._filterPosts(allPosts);
      const regularPosts = featured && showFeatured && this._activeCategory === 'all' && !this._searchQuery
        ? filtered.filter(p => p !== featured) : filtered;

      let html = '';

      // Search bar
      if (showSearch) {
        html += `<div class="ccb-search" data-cc-component="cc-blog-search">
          <input type="text" class="ccb-search__input" placeholder="Search posts..." value="${_esc(this._searchQuery)}">
          <svg class="ccb-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>`;
      }

      // Category pills
      if (showCategories && categories.length > 0) {
        html += `<div class="ccb-categories" data-cc-component="cc-blog-filters">
          <button class="ccb-cat${this._activeCategory === 'all' ? ' ccb-cat--active' : ''}" data-cat="all">All</button>
          ${categories.map(c => `<button class="ccb-cat${this._activeCategory === c ? ' ccb-cat--active' : ''}" data-cat="${_esc(c)}">${_esc(c)}</button>`).join('')}
        </div>`;
      }

      // Featured post
      if (featured && showFeatured && this._activeCategory === 'all' && !this._searchQuery) {
        const href = featured.href || (featured.slug ? `blog/${featured.slug}` : '#');
        html += `<a class="ccb-featured" href="${_esc(href)}" data-cc-component="cc-blog-card">
          <div class="ccb-featured__image"><img src="${_esc(featured.image || BLOG_PLACEHOLDER)}" alt="" loading="lazy"/></div>
          <div class="ccb-featured__content">
            ${featured.category ? `<cc-pill variant="badge">${_esc(featured.category)}</cc-pill>` : ''}
            <h2 class="ccb-featured__title">${_esc(featured.title)}</h2>
            ${featured.excerpt ? `<p class="ccb-featured__excerpt">${_esc(featured.excerpt)}</p>` : ''}
            <div class="ccb-meta">
              ${featured.author ? `<cc-user-pill name="${_esc(featured.author)}"${featured.authorImage ? ` avatar="${_esc(featured.authorImage)}"` : ''} size="sm"></cc-user-pill>` : ''}
              ${featured.date ? `<span class="ccb-meta__date">${this._formatDate(featured.date)}</span>` : ''}
              ${featured.readTime ? `<span class="ccb-meta__read">${_esc(featured.readTime)} read</span>` : ''}
            </div>
          </div>
        </a>`;
      }

      // Post grid
      if (regularPosts.length === 0) {
        html += `<div class="ccb-empty">No posts found.</div>`;
      } else {
        html += `<div class="ccb-grid ccb-grid--${_esc(variant)} ccb-grid--cols-${_esc(columns)}">`;
        regularPosts.forEach(p => {
          const href = p.href || (p.slug ? `blog/${p.slug}` : '#');
          if (variant === 'minimal') {
            html += `<a class="ccb-post-minimal" href="${_esc(href)}" data-cc-component="cc-blog-card">
              <div class="ccb-post-minimal__meta">
                ${p.date ? `<span class="ccb-meta__date">${this._formatDate(p.date)}</span>` : ''}
                ${p.category ? `<cc-pill variant="badge">${_esc(p.category)}</cc-pill>` : ''}
              </div>
              <h3 class="ccb-post-minimal__title">${_esc(p.title)}</h3>
              ${p.excerpt ? `<p class="ccb-post-minimal__excerpt">${_esc(p.excerpt)}</p>` : ''}
            </a>`;
          } else if (variant === 'magazine') {
            html += `<a class="ccb-post-mag" href="${_esc(href)}" data-cc-component="cc-blog-card">
              <div class="ccb-post-mag__image"><img src="${_esc(p.image || BLOG_PLACEHOLDER)}" alt="" loading="lazy"/></div>
              <div class="ccb-post-mag__body">
                ${p.category ? `<cc-pill variant="badge">${_esc(p.category)}</cc-pill>` : ''}
                <h3 class="ccb-post-mag__title">${_esc(p.title)}</h3>
                ${p.excerpt ? `<p class="ccb-post-mag__excerpt">${_esc(p.excerpt)}</p>` : ''}
                <div class="ccb-meta">
                  ${p.author ? `<cc-user-pill name="${_esc(p.author)}"${p.authorImage ? ` avatar="${_esc(p.authorImage)}"` : ''} size="sm"></cc-user-pill>` : ''}
                  ${p.readTime ? `<span class="ccb-meta__read">${_esc(p.readTime)}</span>` : ''}
                </div>
              </div>
            </a>`;
          } else {
            // cards (default)
            html += `<a class="ccb-post-card" href="${_esc(href)}" data-cc-component="cc-blog-card">
              <div class="ccb-post-card__image"><img src="${_esc(p.image || BLOG_PLACEHOLDER)}" alt="" loading="lazy"/></div>
              <div class="ccb-post-card__body">
                ${p.category ? `<cc-pill variant="badge">${_esc(p.category)}</cc-pill>` : ''}
                <h3 class="ccb-post-card__title">${_esc(p.title)}</h3>
                ${p.excerpt ? `<p class="ccb-post-card__excerpt">${_esc(p.excerpt)}</p>` : ''}
                <div class="ccb-meta">
                  ${p.author ? `<cc-user-pill name="${_esc(p.author)}"${p.authorImage ? ` avatar="${_esc(p.authorImage)}"` : ''} size="sm"></cc-user-pill>` : ''}
                  ${p.date ? `<span class="ccb-meta__date">${this._formatDate(p.date)}</span>` : ''}
                  ${p.readTime ? `<span class="ccb-meta__read">${_esc(p.readTime)}</span>` : ''}
                </div>
              </div>
            </a>`;
          }
        });
        html += '</div>';
      }

      this.innerHTML = `<div class="ccb-listing">${html}</div>`;

      // Bind events
      this.querySelectorAll('.ccb-cat').forEach(btn => {
        btn.addEventListener('click', () => {
          this._activeCategory = btn.dataset.cat;
          this._render();
        });
      });
      const searchInput = this.querySelector('.ccb-search__input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this._searchQuery = e.target.value;
          this._render();
        });
      }
    }

    _renderPost() {
      this._postRendered = true;
      const title = this.getAttribute('title') || '';
      const author = this.getAttribute('author') || '';
      const authorImage = this.getAttribute('author-image') || '';
      const date = this.getAttribute('date') || '';
      const category = this.getAttribute('category') || '';
      const image = this.getAttribute('image') || '';
      const readTime = this.getAttribute('read-time') || '';
      const backHref = this.getAttribute('back-href') || 'blog.html';

      // Use cached content (saved in connectedCallback before any innerHTML replace)
      // Fall back to live querySelector for first-render-without-reparent case
      if (!this._cachedPostContent) {
        const contentSlot = this.querySelector('[slot="content"]');
        if (contentSlot) this._cachedPostContent = contentSlot.innerHTML;
      }
      const contentHTML = this._cachedPostContent || '';

      this.innerHTML = `<article class="ccb-article">
        <a href="${_esc(backHref)}" class="ccb-article__back">← Back to Blog</a>
        ${category ? `<cc-pill variant="badge">${_esc(category)}</cc-pill>` : ''}
        <h1 class="ccb-article__title">${_esc(title)}</h1>
        <div class="ccb-meta ccb-meta--lg">
          ${author ? `<cc-user-pill name="${_esc(author)}"${authorImage ? ` avatar="${_esc(authorImage)}"` : ''} size="lg"></cc-user-pill>` : ''}
          ${date ? `<span class="ccb-meta__date">${this._formatDate(date)}</span>` : ''}
          ${readTime ? `<span class="ccb-meta__read">${_esc(readTime)} read</span>` : ''}
        </div>
        <div class="ccb-article__hero"><img src="${_esc(image || BLOG_PLACEHOLDER)}" alt="" loading="lazy"/></div>
        <div class="ccb-article__content">${contentHTML}</div>
      </article>`;
    }

    _render() {
      const mode = this.getAttribute('mode') || 'listing';
      if (mode === 'post') {
        this._renderPost();
      } else {
        this._renderListing();
      }
      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-blog-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-blog-styles';
      s.textContent = `
        cc-blog { display: block; }
        cc-blog-post { display: none; }

        /* Search */
        .ccb-search { position: relative; margin-bottom: 1.5rem; max-width: 400px; margin-left: auto; margin-right: auto; }
        .ccb-search__input {
          width: 100%; padding: 10px 14px 10px 38px; border-radius: 8px;
          border: 1px solid var(--border, rgba(255,255,255,0.12));
          background: var(--surface, rgba(255,255,255,0.05));
          color: var(--text, #e2e8f0); font-size: 0.9rem;
          outline: none; transition: border-color 0.2s;
        }
        .ccb-search__input:focus { border-color: var(--accent, #f59e0b); }
        .ccb-search__input::placeholder { color: var(--text-muted, rgba(255,255,255,0.4)); }
        .ccb-search__icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: 0.4; }

        /* Categories */
        .ccb-categories { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 2rem; justify-content: center; }
        .ccb-cat {
          padding: 6px 16px; border-radius: 20px; border: 1px solid var(--border, rgba(255,255,255,0.12));
          background: transparent; color: var(--text-muted, rgba(255,255,255,0.6));
          font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .ccb-cat:hover { border-color: var(--accent, #f59e0b); color: var(--text, #e2e8f0); }
        .ccb-cat--active {
          background: var(--accent, #f59e0b); color: #000; border-color: var(--accent, #f59e0b); font-weight: 600;
        }

        /* Tag */
        .ccb-tag {
          display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.7rem;
          text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
          background: rgba(245,158,11,0.15); color: var(--accent, #f59e0b);
        }
        .ccb-tag--sm { font-size: 0.65rem; padding: 3px 8px; }

        /* Meta */
        .ccb-meta { display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: var(--text-muted, rgba(255,255,255,0.5)); flex-wrap: wrap; }
        .ccb-meta--lg { font-size: 0.9rem; margin-bottom: 2rem; }
        .ccb-meta__author { display: flex; align-items: center; gap: 6px; }
        .ccb-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
        .ccb-avatar--lg { width: 32px; height: 32px; }
        .ccb-meta__date::before, .ccb-meta__read::before { content: ''; }

        /* Featured */
        .ccb-featured {
          display: grid; grid-template-columns: 1fr 1fr; gap: 0;
          border-radius: 16px; overflow: hidden; margin-bottom: 3rem;
          background: var(--surface, rgba(255,255,255,0.05));
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s;
        }
        .ccb-featured:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); text-decoration: none; }
        .ccb-featured__image { min-height: 300px; }
        .ccb-featured__image img { width: 100%; height: 100%; object-fit: cover; }
        .ccb-featured__content { padding: 2rem; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
        .ccb-featured__title { font-size: 1.6rem; font-weight: 700; color: var(--text, #e2e8f0); margin: 0; line-height: 1.3; }
        .ccb-featured__excerpt { color: var(--text-muted, rgba(255,255,255,0.6)); line-height: 1.6; margin: 0; }

        /* Grid */
        .ccb-grid { display: grid; gap: 1.5rem; }
        .ccb-grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
        .ccb-grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
        .ccb-grid--cols-4 { grid-template-columns: repeat(4, 1fr); }

        /* Card variant */
        .ccb-post-card {
          display: flex; flex-direction: column; border-radius: 12px; overflow: hidden;
          background: var(--surface, rgba(255,255,255,0.05));
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s;
        }
        .ccb-post-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); text-decoration: none; }
        .ccb-post-card__image { height: 200px; overflow: hidden; }
        .ccb-post-card__image img { width: 100%; height: 100%; object-fit: cover; }
        .ccb-post-card__image--placeholder { background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(99,102,241,0.1)); }
        .ccb-post-card__body { padding: 1.25rem; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .ccb-post-card__title { font-size: 1.1rem; font-weight: 700; color: var(--text, #e2e8f0); margin: 0; line-height: 1.3; }
        .ccb-post-card__excerpt { font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.55)); line-height: 1.5; margin: 0; flex: 1; }

        /* Minimal variant */
        .ccb-post-minimal {
          display: block; padding: 1.25rem 0; border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          text-decoration: none; color: inherit; transition: opacity 0.2s;
        }
        .ccb-post-minimal:hover { opacity: 0.8; text-decoration: none; }
        .ccb-post-minimal__meta { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
        .ccb-post-minimal__title { font-size: 1.1rem; font-weight: 600; color: var(--text, #e2e8f0); margin: 0 0 4px; }
        .ccb-post-minimal__excerpt { font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 0; }

        /* Magazine variant */
        .ccb-post-mag {
          display: grid; grid-template-columns: 140px 1fr; gap: 1rem; align-items: start;
          text-decoration: none; color: inherit; padding: 1rem; border-radius: 12px;
          transition: background 0.2s;
        }
        .ccb-post-mag:hover { background: var(--surface, rgba(255,255,255,0.03)); text-decoration: none; }
        .ccb-post-mag__image { border-radius: 8px; overflow: hidden; aspect-ratio: 4/3; }
        .ccb-post-mag__image img { width: 100%; height: 100%; object-fit: cover; }
        .ccb-post-mag__body { display: flex; flex-direction: column; gap: 6px; }
        .ccb-post-mag__title { font-size: 1rem; font-weight: 600; color: var(--text, #e2e8f0); margin: 0; line-height: 1.3; }
        .ccb-post-mag__excerpt { font-size: 0.8rem; color: var(--text-muted, rgba(255,255,255,0.5)); margin: 0; line-height: 1.5; }

        /* Empty */
        .ccb-empty { text-align: center; padding: 3rem; color: var(--text-muted, rgba(255,255,255,0.4)); font-size: 0.9rem; }

        /* Article (single post) */
        .ccb-article { max-width: 720px; margin: 0 auto; }
        .ccb-article__back {
          display: block; margin-bottom: 1rem; color: var(--accent, #f59e0b);
          text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: opacity 0.2s;
        }
        .ccb-article__back:hover { opacity: 0.7; }
        .ccb-article > cc-pill { display: inline-block; margin-bottom: 0.75rem; }
        .ccb-article__title { font-size: 2.5rem; font-weight: 800; line-height: 1.2; color: var(--text, #e2e8f0); margin: 0.75rem 0 1rem; }
        .ccb-article__hero { margin-bottom: 2rem; border-radius: 12px; overflow: hidden; }
        .ccb-article__hero img { width: 100%; display: block; }
        .ccb-article__content { font-size: 1.05rem; line-height: 1.8; color: var(--text, rgba(255,255,255,0.85)); }
        .ccb-article__content h2 {
          font-size: 1.5rem; font-weight: 700; margin: 2.5rem 0 1rem; color: var(--accent, #f59e0b);
          position: relative; padding-top: 2rem;
        }
        .ccb-article__content h2::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          overflow: hidden;
        }
        .ccb-article__content h2::after {
          content: '';
          position: absolute; top: 0; left: -60%; width: 60%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent, #f59e0b), transparent);
          animation: ccb-divider-shimmer 3s linear infinite;
        }
        @keyframes ccb-divider-shimmer {
          0%   { left: -60%; }
          100% { left: 100%; }
        }
        .ccb-article__content h3 { font-size: 1.2rem; font-weight: 600; margin: 2rem 0 0.75rem; color: var(--accent, #f59e0b); }
        .ccb-article__content p { margin: 0 0 1.25rem; }
        .ccb-article__content ul, .ccb-article__content ol { margin: 0 0 1.25rem; padding-left: 1.5rem; }
        .ccb-article__content li { margin-bottom: 0.5rem; }
        .ccb-article__content li::marker { color: var(--accent, #f59e0b); }
        .ccb-article__content strong { color: var(--text, #e2e8f0); }
        .ccb-article__content blockquote {
          border-left: 3px solid var(--accent, #f59e0b); margin: 1.5rem 0; padding: 1rem 1.5rem;
          background: rgba(245,158,11,0.05); border-radius: 0 8px 8px 0; font-style: italic;
        }
        .ccb-article__content code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
        .ccb-article__content pre { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1.25rem; overflow-x: auto; margin: 0 0 1.25rem; }
        .ccb-article__content pre code { background: none; padding: 0; }
        .ccb-article__content img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
        .ccb-article__content a { color: var(--accent, #f59e0b); text-decoration: underline; }

        /* Responsive */
        @media (max-width: 768px) {
          .ccb-featured { grid-template-columns: 1fr; }
          .ccb-featured__image { min-height: 200px; }
          .ccb-grid--cols-3, .ccb-grid--cols-4 { grid-template-columns: repeat(2, 1fr); }
          .ccb-post-mag { grid-template-columns: 100px 1fr; }
          .ccb-article__title { font-size: 1.8rem; }
        }
        @media (max-width: 480px) {
          .ccb-grid--cols-2, .ccb-grid--cols-3, .ccb-grid--cols-4 { grid-template-columns: 1fr; }
          .ccb-post-mag { grid-template-columns: 1fr; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcBlog);

  // Register cc-blog-post as a no-op element (just a data container)
  if (!customElements.get('cc-blog-post')) {
    customElements.define('cc-blog-post', class extends HTMLElement {});
  }
})();
