class CcDailyFeed extends HTMLElement {
  connectedCallback() {
    this._items = [];
    this._loading = true;
    this._render();
    this._load();
    this._interval = setInterval(() => { if (document.hasFocus()) this._load(); }, 60000);
  }

  disconnectedCallback() {
    if (this._interval) clearInterval(this._interval);
  }

  async _load() {
    try {
      const sb = window.supabase;
      if (!sb) { setTimeout(() => this._load(), 500); return; }

      const data = await sb.select('daily_updates', {
        order: 'created_at.desc',
        limit: 6
      });

      this._items = data || [];
      this._loading = false;
      this._render();
    } catch (e) {
      console.error('Daily feed load error:', e);
      this._loading = false;
      this._render();
    }
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  _truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : s || ''; }

  _timeAgo(iso) {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 60000) return 'just now';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  }

  _categoryIcon(cat) {
    const m = {
      'tech': 'cpu', 'ai': 'brain', 'business': 'briefcase', 'news': 'newspaper',
      'security': 'shield', 'dev': 'code', 'design': 'palette', 'marketing': 'megaphone',
      'finance': 'trending-up', 'health': 'heart', 'science': 'flask-conical',
      'entertainment': 'play-circle', 'sports': 'trophy', 'politics': 'landmark'
    };
    return m[(cat || '').toLowerCase()] || 'rss';
  }

  _categoryColor(cat) {
    const m = {
      'tech': '#38bdf8', 'ai': '#a78bfa', 'business': '#f59e0b', 'news': '#4ade80',
      'security': '#f87171', 'dev': '#38bdf8', 'design': '#f472b6', 'marketing': '#fb923c',
      'finance': '#34d399', 'health': '#f87171', 'science': '#818cf8',
      'entertainment': '#fbbf24', 'sports': '#4ade80', 'politics': '#94a3b8'
    };
    return m[(cat || '').toLowerCase()] || 'var(--muted)';
  }

  _render() {
    const items = this._items.slice(0, 5);

    let body;
    if (this._loading) {
      body = '<div class="dfeed-empty">Loading…</div>';
    } else if (!items.length) {
      body = '<div class="dfeed-empty"><i data-lucide="inbox" style="width:20px;height:20px;color:var(--muted);vertical-align:middle"></i> No updates yet</div>';
    } else {
      body = items.map(item => {
        const icon = this._categoryIcon(item.category);
        const color = this._categoryColor(item.category);
        const title = this._esc(this._truncate(item.title, 80));
        const teaser = this._esc(this._truncate(item.body || item.summary || '', 120));
        const source = this._esc(item.source_name || item.source_app || '');
        const sourceIcon = item.source_icon ? `<span style="margin-right:3px">${item.source_icon}</span>` : '';
        const time = this._timeAgo(item.created_at);
        const cat = item.category ? `<span class="dfeed-cat" style="color:${color}">${this._esc(item.category)}</span>` : '';

        return `
          <div class="dfeed-item">
            <div class="dfeed-icon" style="color:${color}">
              <i data-lucide="${icon}" style="width:16px;height:16px"></i>
            </div>
            <div class="dfeed-body">
              <div class="dfeed-title">${title}</div>
              ${teaser ? `<div class="dfeed-teaser">${teaser}</div>` : ''}
              <div class="dfeed-meta">
                ${sourceIcon}${source ? `<span>${source}</span>` : ''}
                ${cat}
                <span class="dfeed-time">${time}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.innerHTML = `
      <style>
        cc-daily-feed { display:block; }
        .dfeed-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .dfeed-header h2 { font-family:var(--serif); margin:0; display:flex; align-items:center; gap:8px; font-size:1.15rem; }
        .dfeed-header h2 i { color:var(--accent); }
        .dfeed-count { font-size:12px; color:var(--muted); background:var(--card); padding:2px 8px; border-radius:10px; }

        .dfeed-list { display:flex; flex-direction:column; gap:2px; }

        .dfeed-item { display:flex; gap:10px; padding:8px 10px; border-radius:8px; transition:background .15s; }
        .dfeed-item:hover { background:rgba(255,255,255,.03); }

        .dfeed-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:rgba(255,255,255,.04); }

        .dfeed-body { flex:1; min-width:0; }
        .dfeed-title { font-size:13px; font-weight:600; color:var(--text); line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dfeed-teaser { font-size:12px; color:var(--muted); line-height:1.4; margin-top:2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        .dfeed-meta { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); margin-top:3px; flex-wrap:wrap; }
        .dfeed-cat { font-weight:600; font-size:10px; text-transform:uppercase; letter-spacing:.3px; }
        .dfeed-time { margin-left:auto; white-space:nowrap; }

        .dfeed-empty { text-align:center; padding:24px 16px; color:var(--muted); font-size:13px; }

        .dfeed-link { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:10px; padding:8px; border-radius:8px; background:rgba(245,158,11,.06); border:1px solid rgba(245,158,11,.15); color:var(--accent); font-size:12px; font-weight:600; text-decoration:none; transition:all .15s; }
        .dfeed-link:hover { background:rgba(245,158,11,.12); border-color:rgba(245,158,11,.3); }
      </style>

      <div class="dfeed-header">
        <h2><i data-lucide="rss"></i> Daily Feed</h2>
        <span class="dfeed-count">${this._items.length} update${this._items.length !== 1 ? 's' : ''}</span>
      </div>

      <div class="dfeed-list">
        ${body}
      </div>

      ${!this._loading && this._items.length > 0 ? `
        <a class="dfeed-link" href="https://daily-updates.adam-harris.alphaclaw.app/" target="_blank" rel="noopener">
          <i data-lucide="external-link" style="width:13px;height:13px"></i>
          View Full Feed
        </a>
      ` : ''}
    `;

    setTimeout(() => window.refreshIcons?.(), 0);
  }
}
customElements.define('cc-daily-feed', CcDailyFeed);
