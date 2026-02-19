// ─── Leads Summary (dashboard widget) ──────────────────────
class CcLeadsSummary extends HTMLElement {
  connectedCallback() { this._load(); }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try { this._data = await (await fetch(src)).json(); this._render(); } catch (e) { console.error('cc-leads-summary:', e); }
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  _render() {
    const cos = Object.values(this._data.companies || {});
    const people = Object.values(this._data.people || {});
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);

    const meetings = Object.values(this._data.meetings || {})
      .filter(m => { const d = new Date(m.start); return d >= now && d <= week; })
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (cos.length === 0 && meetings.length === 0) {
      this.innerHTML = `<cc-empty-state message="No upcoming meetings" icon="📅"></cc-empty-state>`;
      return;
    }

    const topFit = cos.filter(c => c.lastRevFit.score >= 8).sort((a, b) => b.lastRevFit.score - a.lastRevFit.score).slice(0, 4);

    const meetingRows = meetings.map(m => {
      const dt = new Date(m.start);
      const time = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
      const brief = m.briefPosted
        ? '<span style="font-size:10px;color:#22c55e;">✓</span>'
        : '<span style="font-size:10px;color:#eab308;">⏳</span>';
      return `<li class="lead-meeting">
        ${brief} <span class="text-primary flex-1 truncate">${this._esc(m.title)}</span>
        <span class="meeting-time">${time}</span>
      </li>`;
    }).join('');

    const topRows = topFit.map(c => {
      const color = c.lastRevFit.score >= 9 ? 'var(--green)' : 'var(--green)';
      return `<li class="lead-item">
        <span class="lead-score high">${c.lastRevFit.score}</span>
        <span class="lead-company flex-1">${this._esc(c.name)}</span>
        <span class="text-muted text-xs">${this._esc(c.industry)}</span>
      </li>`;
    }).join('');

    this.innerHTML = `
      <div class="panel">
        <div class="panel-header"><i data-lucide="target"></i> Lead Research <span class="badge">${cos.length} companies</span>
          <a href="leads.html" class="view-all-link">View all →</a>
        </div>
        <div class="flex gap-4 mb-3">
          <div class="stat-box">
            <div class="stat-box-value">${cos.length}</div>
            <div class="stat-box-label">Companies</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${people.length}</div>
            <div class="stat-box-label">Contacts</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-value">${meetings.length}</div>
            <div class="stat-box-label">Meetings</div>
          </div>
        </div>
        ${meetings.length ? `<div class="mb-2"><div class="entity-section-title">Upcoming Meetings</div><ul class="list-none p-0 m-0">${meetingRows}</ul></div>` : ''}
        ${topFit.length ? `<div><div class="entity-section-title">Top Fit (8+)</div><ul class="list-none p-0 m-0">${topRows}</ul></div>` : ''}
      </div>`;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-leads-summary', CcLeadsSummary);
