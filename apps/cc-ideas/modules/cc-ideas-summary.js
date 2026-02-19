// ─── Ideas Summary (dashboard widget) ──────────────────────
class CcIdeasSummary extends HTMLElement {
  connectedCallback() { this._load(); }

  async _load() {
    try {
      // Primary: load from Supabase (same source as main board)
      if (window.supabase) {
        this._data = await window.supabase.select('ideas', { order: 'createdAt.desc.nullslast' });
        // Parse JSON string fields from Supabase
        const jsonFields = ['tags','similarSolutions','relatedIdeas','resources','integrations'];
        this._data.forEach(r => {
          jsonFields.forEach(f => { if (typeof r[f] === 'string') try { r[f] = JSON.parse(r[f]); } catch(e) { r[f] = []; } });
          jsonFields.forEach(f => { if (!r[f]) r[f] = []; });
        });
        this._source = 'supabase';
      } else {
        // Fallback: load from JSON file if Supabase isn't available
        const src = this.getAttribute('src');
        if (!src) return;
        this._data = await (await fetch(src)).json();
        this._source = 'json';
      }
      this._render();
      if (window.UserPrefs && UserPrefs.ready) UserPrefs.ready.then(() => this._render());
    } catch (e) {
      console.error('cc-ideas-summary:', e);
      // Fallback to JSON if Supabase fails
      if (this._source !== 'json') {
        const src = this.getAttribute('src');
        if (src) {
          try { this._data = await (await fetch(src)).json(); this._source = 'json-fallback'; this._render(); }
          catch(e2) { console.error('cc-ideas-summary fallback:', e2); }
        }
      }
    }
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  _render() {
    const CAT_COLORS = { Product:'#7c3aed', Content:'#3b82f6', Business:'#eab308', Technical:'var(--green)', Creative:'#ec4899' };
    const STATUS_COLORS = { new:'#3b82f6', backlog:'var(--muted)', 'in-progress':'#f97316', completed:'var(--green)', archived:'#52525b' };

    // Read state directly from Supabase row columns (consistent with main cc-ideas board)
    const open = this._data
      .filter(x => !x.hidden && !x.completedAt && x.status !== 'completed' && x.status !== 'archived')
      .filter(x => x.rating === 5 || x.compositeScore >= 9)
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 8);

    const total = this._data.filter(x => !x.hidden && x.status !== 'archived').length;
    const esc = this._esc.bind(this);

    this.innerHTML = `
      <div class="panel full-width">
        <div class="panel-header"><i data-lucide="lightbulb"></i> Top Ideas <span class="badge">${open.length} prioritized</span>
          <a href="ideas.html" class="view-all-link">View all →</a>
        </div>
        <div class="scrollable-body">
          <ul class="list-none p-0 m-0">
            ${open.map(x => `
              <li class="idea-item">
                <span class="idea-score">${x.compositeScore}</span>
                <div class="flex-1 min-w-0">
                  <div class="idea-title">${esc(x.title)}</div>
                  <div class="flex gap-1 mt-1">
                    <span class="idea-category" style="background:${CAT_COLORS[x.category]}22;color:${CAT_COLORS[x.category]};">${x.category}</span>
                    <span class="entity-badge" style="background:${STATUS_COLORS[x.status]}22;color:${STATUS_COLORS[x.status]};">${x.status}</span>
                  </div>
                </div>
                <span class="idea-effort">${x.effort}</span>
              </li>
            `).join('')}
            ${open.length === 0 ? '<li class="p-4"><cc-empty-state message="No open ideas" icon="💡" animation="none"></cc-empty-state></li>' : ''}
          </ul>
        </div>
      </div>`;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-ideas-summary', CcIdeasSummary);
