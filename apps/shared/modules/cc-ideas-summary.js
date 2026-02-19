// ─── Ideas Summary (dashboard widget) ──────────────────────
class CcIdeasSummary extends HTMLElement {
  connectedCallback() { this._load(); }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json(); this._render();
      if (window.UserPrefs && UserPrefs.ready) UserPrefs.ready.then(() => this._render());
    } catch (e) { console.error('cc-ideas-summary:', e); }
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  _render() {
    const CAT_COLORS = { Product:'#7c3aed', Content:'#3b82f6', Business:'#eab308', Technical:'#22c55e', Creative:'#ec4899' };
    const STATUS_COLORS = { new:'#3b82f6', backlog:'#71717a', 'in-progress':'#f97316', completed:'#22c55e', archived:'#52525b' };
    const P = window.UserPrefs;
    const hidden = (() => { const a = P ? P.get('hiddenIdeas', []) : (() => { try { return JSON.parse(localStorage.getItem('hiddenIdeas') || '[]'); } catch { return []; } })(); const b = P ? P.get('communityHidden', []) : (() => { try { return JSON.parse(localStorage.getItem('communityHidden') || '[]'); } catch { return []; } })(); return [...new Set([...a, ...b])]; })();
    const completed = (() => { const a = P ? P.get('completedIdeas', {}) : (() => { try { return JSON.parse(localStorage.getItem('completedIdeas') || '{}'); } catch { return {}; } })(); const b = P ? P.get('communityCompleted', {}) : (() => { try { return JSON.parse(localStorage.getItem('communityCompleted') || '{}'); } catch { return {}; } })(); return { ...b, ...a }; })();

    // Show top ideas: active AND (user-rated 5 stars OR compositeScore >= 9)
    const ratings = P ? P.get('ideaRatings', {}) : (() => { try { return JSON.parse(localStorage.getItem('idea-ratings') || '{}'); } catch { return {}; } })();
    const open = this._data
      .filter(x => !hidden.includes(x.id) && !completed[x.id] && x.status !== 'completed' && x.status !== 'archived')
      .filter(x => ratings[x.id] === 5 || x.compositeScore >= 9)
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 8);

    const total = this._data.filter(x => !hidden.includes(x.id) && x.status !== 'archived').length;
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
            ${open.length === 0 ? '<li class="p-4 text-center text-muted text-sm">No open ideas</li>' : ''}
          </ul>
        </div>
      </div>`;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-ideas-summary', CcIdeasSummary);
