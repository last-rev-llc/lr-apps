/* ── Quick Access — Starred + Recent Apps as compact pills ── */
(function() {
  if (customElements.get('cc-quick-access')) return;

  class CcQuickAccess extends HTMLElement {
    connectedCallback() {
      this._load();
    }

    async _load() {
      if (!window.supabase) await new Promise(r => setTimeout(r, 500));
      if (!window.supabase) { this.innerHTML = ''; return; }

      try {
        const apps = await window.supabase.select('app_registry', {
          filters: { status: 'eq.active' },
          select: 'id,name,icon,url,starred,last_accessed,pageview_count'
        });

        const starred = apps.filter(a => a.starred);
        const recent = apps
          .filter(a => a.last_accessed && !a.starred)
          .sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed))
          .slice(0, 6);

        const all = [...starred, ...recent];
        if (!all.length) { this.innerHTML = ''; return; }

        this.innerHTML = `
          <div class="panel">
            <div class="panel-header">🚀 Quick Access</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:4px 0;">
              ${all.map(a => `<a href="${a.url}" target="_blank" rel="noopener" class="pill" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;font-size:13px;">
                ${a.starred ? '⭐' : ''} ${a.name}
              </a>`).join('')}
            </div>
          </div>`;
      } catch(e) {
        console.error('Quick access load failed', e);
        this.innerHTML = '';
      }
    }
  }

  customElements.define('cc-quick-access', CcQuickAccess);
})();
