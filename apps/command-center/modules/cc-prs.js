// ─── PRs ──────────────────────────────────────────────────
class CcPrs extends HTMLElement {
  _esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  connectedCallback() { this._load(); }

  _getExcluded() { return window.UserPrefs ? window.UserPrefs.get('excludedPRs', []) : (() => { try { return JSON.parse(localStorage.getItem('excludedPRs') || '[]'); } catch { return []; } })(); }

  _toggleExclude(id) {
    const ex = this._getExcluded();
    const idx = ex.indexOf(id);
    if (idx === -1) ex.push(id); else ex.splice(idx, 1);
    (window.UserPrefs ? window.UserPrefs.set('excludedPRs', ex) : localStorage.setItem('excludedPRs', JSON.stringify(ex)));
    this._render(this._data);
  }

  _showAll() { window.UserPrefs ? window.UserPrefs.set('excludedPRs', []) : localStorage.removeItem('excludedPRs'); this._render(this._data); }

  _daysAgo(ds) { return Math.floor((new Date() - new Date(ds)) / 86400000); }
  _ageClass(d) { return d <= 3 ? 'fresh' : d <= 7 ? 'aging' : 'stale'; }
  _ageLabel(d) { return d === 0 ? 'today' : d === 1 ? '1 day' : d + ' days'; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json();
      this._render(this._data);
      if (window.UserPrefs && UserPrefs.ready) UserPrefs.ready.then(() => this._render(this._data));
    } catch (e) { console.error('cc-prs:', e); }
  }

  _render(prs) {
    const excluded = this._getExcluded();
    const visible = prs.filter(pr => !excluded.includes(pr.url));
    const hiddenCount = prs.length - visible.length;
    const sorted = [...visible].sort((a, b) => {
      const aBot = a.author.login.includes('[bot]') || a.author.type === 'Bot';
      const bBot = b.author.login.includes('[bot]') || b.author.type === 'Bot';
      if (aBot !== bBot) return aBot ? 1 : -1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    const countText = visible.length + (hiddenCount ? ` (${hiddenCount} hidden)` : '');
    const showAllBtn = hiddenCount > 0
      ? `<li style="padding:8px 0;text-align:center"><button onclick="this.closest('cc-prs')._showAll()" style="background:none;border:1px solid var(--border);color:var(--accent);font-size:12px;padding:4px 12px;border-radius:6px;cursor:pointer">Show ${hiddenCount} hidden</button></li>`
      : '';
    if (sorted.length === 0 && hiddenCount === 0) {
      this.innerHTML = `<div class="panel"><div class="panel-header">🔀 PRs Awaiting Review <span class="badge">0</span></div><cc-empty-state message="No PRs awaiting review" icon="✅"></cc-empty-state></div>`;
      return;
    }
    this.innerHTML = `
      <div class="panel">
        <div class="panel-header">🔀 PRs Awaiting Review <span class="badge">${countText}</span></div>
        <div class="scrollable-body"><ul class="pr-list">${sorted.map(pr => {
          const days = this._daysAgo(pr.createdAt);
          const isBot = pr.author.login.includes('[bot]') || pr.author.type === 'Bot';
          const typeTag = isBot ? '<span class="pr-type-tag bot">bot</span>' : '<span class="pr-type-tag human">human</span>';
          const prHtml = window.CCGitHubPR ? CCGitHubPR.render({
            url: pr.url, title: pr.title, repo: pr.repository.name,
            repoUrl: `https://github.com/${pr.repository.nameWithOwner || ('last-rev-llc/' + pr.repository.name)}`,
            author: pr.author.login.replace('[bot]', ''),
            age: this._ageLabel(days), ageClass: this._ageClass(days), body: pr.body
          }) : `<div>${pr.title}</div>`;
          return `<li class="pr-item">
            <div class="pr-info">${prHtml}</div>
            ${typeTag}
            <button class="pr-exclude-btn" onclick="this.closest('cc-prs')._toggleExclude('${pr.url}')" title="Hide this PR"><i data-lucide="x"></i></button>
          </li>`;
        }).join('')}${showAllBtn}</ul></div>
      </div>`;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-prs', CcPrs);
