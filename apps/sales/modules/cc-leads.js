// ─── Lead Research Command Center ──────────────────────────
class CcLeads extends HTMLElement {
  connectedCallback() {
    this._data = { companies: {}, people: {}, meetings: {} };
    this._sort = 'score';
    this._sortDir = 'desc';
    this._filter = 'all';
    this._search = '';
    this.addEventListener('cc-search', e => { this._search = e.detail.value; this._saveParams(); this._render(); });
    this.addEventListener('pill-change', e => {
      const el = e.target;
      if (el.getAttribute('label') === 'Fit') { this._setFilter(e.detail.value); }
    });
    this.addEventListener('dropdown-change', e => {
      const el = e.target;
      if (el.getAttribute('label') === 'Sort') { this._setSort(e.detail.value); }
    });
    this.addEventListener('direction-change', e => { this._sortDir = e.detail.direction; this._saveParams(); this._render(); });
    this.addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle-key]');
      if (toggle) { e.stopPropagation(); this._toggleExpand(toggle.dataset.toggleKey); }
    });
    this._expanded = {};
    this._restoreParams();
    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  _escAttr(s) { return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  _restoreParams() {
    const p = (typeof CC !== 'undefined' && CC.getParams) ? CC.getParams() : {};
    if (p.sort) this._sort = p.sort;
    if (p.dir) this._sortDir = p.dir;
    if (p.filter) this._filter = p.filter;
    if (p.q) this._search = p.q;
  }

  _saveParams() {
    if (typeof CC !== 'undefined' && CC.setParams) {
      CC.setParams({ sort: this._sort, dir: this._sortDir, filter: this._filter === 'all' ? null : this._filter, q: this._search || null });
    }
  }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try { this._data = await (await fetch(src)).json(); this._render(); } catch (e) { console.error('cc-leads:', e); }
  }

  _setSort(key) {
    if (this._sort === key) { this._sortDir = this._sortDir === 'desc' ? 'asc' : 'desc'; }
    else { this._sort = key; this._sortDir = 'desc'; }
    this._saveParams();
    this._render();
  }

  _setFilter(val) { this._filter = val; this._saveParams(); this._render(); }

  _setSearch(val) { this._search = val; this._saveParams(); this._render(); }

  _toggleExpand(key) { this._expanded[key] = !this._expanded[key]; this._render(); }

  _fitColor(score) {
    if (score >= 8) return { bg: 'rgba(34,197,94,0.15)', text: 'var(--green)', border: 'var(--green)' };
    if (score >= 5) return { bg: 'rgba(234,179,8,0.15)', text: 'var(--yellow)', border: 'var(--yellow)' };
    return { bg: 'rgba(239,68,68,0.15)', text: 'var(--red)', border: 'var(--red)' };
  }

  _isAccentTech(t) { return /contentful|next\.?js|react/i.test(t); }

  _relDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  _getCompanies() {
    const cos = Object.values(this._data.companies || {});
    const people = Object.values(this._data.people || {});
    const q = this._search.toLowerCase();

    let filtered = cos.filter(c => {
      if (this._filter === '7+' && c.lastRevFit.score < 7) return false;
      if (this._filter === '5+' && c.lastRevFit.score < 5) return false;
      if (q) {
        const cMatch = c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q);
        const pMatch = people.some(p => p.company === c.domain && p.name.toLowerCase().includes(q));
        if (!cMatch && !pMatch) return false;
      }
      return true;
    });

    const dir = this._sortDir === 'asc' ? 1 : -1;
    if (this._sort === 'score') filtered.sort((a, b) => dir * (a.lastRevFit.score - b.lastRevFit.score));
    else if (this._sort === 'name') filtered.sort((a, b) => dir * a.name.localeCompare(b.name));
    else if (this._sort === 'date') filtered.sort((a, b) => dir * (new Date(a.researchedAt) - new Date(b.researchedAt)));

    return filtered;
  }

  _getPeopleFor(domain) {
    return Object.values(this._data.people || {}).filter(p => p.company === domain);
  }

  _getUpcomingMeetings() {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    return Object.entries(this._data.meetings || {})
      .filter(([, m]) => { const d = new Date(m.start); return d >= now && d <= week; })
      .sort((a, b) => new Date(a[1].start) - new Date(b[1].start))
      .map(([id, m]) => ({ id, ...m }));
  }

  _sortArrow(key) {
    if (this._sort !== key) return '';
    return this._sortDir === 'desc' ? ' ↓' : ' ↑';
  }

  _render() {
    const esc = this._esc.bind(this);
    const escAttr = this._escAttr.bind(this);
    const companies = this._getCompanies();
    const meetings = this._getUpcomingMeetings();
    const allPeople = Object.values(this._data.people || {});

    // Meetings section
    let meetingsHtml = '';
    if (meetings.length) {
      const rows = meetings.map(m => {
        const dt = new Date(m.start);
        const time = dt.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
        const coLinks = (m.companies || []).map(d => `<a href="#co-${d}" style="color:var(--accent);text-decoration:none;font-size:12px;">${esc(this._data.companies[d]?.name || d)}</a>`).join(', ');
        const briefBadge = m.briefPosted
          ? '<span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:rgba(34,197,94,0.15);color:var(--green);">Brief ✓</span>'
          : '<span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:rgba(234,179,8,0.15);color:var(--yellow);">No brief</span>';
        return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
          <span style="color:var(--accent);flex-shrink:0;">📅</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--text);">${esc(m.title)}</div>
            <div style="font-size:11px;color:var(--muted);">${time} · ${coLinks}</div>
          </div>
          ${briefBadge}
        </div>`;
      }).join('');

      meetingsHtml = `<div class="panel" style="margin-bottom:20px;">
        <div class="panel-header">🕐 Upcoming Meetings <span class="badge">${meetings.length}</span></div>
        ${rows}
      </div>`;
    }

    // Controls
    const filterItems = JSON.stringify([
      {value:'all',label:'All'},
      {value:'5+',label:'Fit 5+'},
      {value:'7+',label:'Fit 7+'}
    ]);
    const sortItems = JSON.stringify([
      {value:'score',label:'Fit Score'},
      {value:'name',label:'Name'},
      {value:'date',label:'Date'}
    ]);
    const controlsHtml = `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:20px;">
      <div style="flex:1;min-width:200px;">
        <cc-search placeholder="Search companies, people, domains…" value="${escAttr(this._search)}"></cc-search>
      </div>
      <cc-pill-filter label="Fit" items='${escAttr(filterItems)}' value="${escAttr(this._filter)}"></cc-pill-filter>
      <cc-pill-dropdown label="Sort" items='${escAttr(sortItems)}' value="${escAttr(this._sort)}" direction="${escAttr(this._sortDir)}"></cc-pill-dropdown>
    </div>`;

    // Company cards
    const cardsHtml = companies.map(c => {
      const fit = this._fitColor(c.lastRevFit.score);
      const people = this._getPeopleFor(c.domain);

      // Tech badges
      const allTech = [c.techStack.cms, c.techStack.framework, c.techStack.hosting, ...(c.techStack.other || [])].filter(Boolean);
      const techBadges = allTech.map(t => {
        const accent = this._isAccentTech(t);
        return `<span style="font-size:10px;padding:2px 8px;border-radius:9999px;font-weight:600;background:${accent ? 'rgba(124,58,237,0.15)' : 'rgba(113,113,122,0.15)'};color:${accent ? 'var(--accent)' : 'var(--muted)'};">${esc(t)}</span>`;
      }).join('');

      // People rows
      const peopleRows = people.map(p => {
        const dmBadge = p.decisionMaker ? '<span style="font-size:10px;padding:1px 6px;border-radius:9999px;background:rgba(234,179,8,0.15);color:var(--yellow);font-weight:600;">Decision Maker</span>' : '';
        const topicsKey = 'topics-' + p.email;
        const topicsExpanded = this._expanded[topicsKey];
        const topicsHtml = (p.suggestedTopics || []).length ? `
          <div data-toggle-key="${escAttr(topicsKey)}" style="cursor:pointer;font-size:11px;color:var(--muted);margin-top:2px;">
            <span style="display:inline-block;width:10px;">${topicsExpanded ? '▼' : '▶'}</span> Topics
          </div>
          ${topicsExpanded ? `<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap;">${p.suggestedTopics.map(t => `<span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:rgba(59,130,246,0.1);color:var(--blue);">${esc(t)}</span>`).join('')}</div>` : ''}` : '';

        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(42,45,58,0.5);">
          <span style="color:var(--muted);flex-shrink:0;">👤</span>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:13px;font-weight:600;color:var(--text);">${esc(p.name)}</span>
              <span style="font-size:11px;color:var(--muted);">${esc(p.title)}</span>
              ${dmBadge}
            </div>
            ${topicsHtml}
          </div>
          ${p.linkedinUrl ? `<a href="${escAttr(p.linkedinUrl)}" target="_blank" rel="noopener" style="color:#0a66c2;flex-shrink:0;" title="LinkedIn">💼</a>` : ''}
        </div>`;
      }).join('');

      // Talking points
      const tpKey = 'tp-' + c.domain;
      const tpExpanded = this._expanded[tpKey];
      const talkingPoints = (c.lastRevFit.talkingPoints || []);
      const tpHtml = talkingPoints.length ? `
        <div data-toggle-key="${escAttr(tpKey)}" style="cursor:pointer;display:flex;align-items:center;gap:4px;margin-top:8px;font-size:12px;color:var(--muted);">
          <span style="width:12px;display:inline-block;">${tpExpanded ? '▼' : '▶'}</span> Talking Points (${talkingPoints.length})
        </div>
        ${tpExpanded ? `<ul style="margin:6px 0 0 16px;padding:0;list-style:disc;">${talkingPoints.map(t => `<li style="font-size:12px;color:var(--muted);margin-bottom:4px;">${esc(t)}</li>`).join('')}</ul>` : ''}` : '';

      // Reasons
      const reasonsKey = 'reasons-' + c.domain;
      const reasonsExpanded = this._expanded[reasonsKey];
      const reasons = (c.lastRevFit.reasons || []);
      const reasonsHtml = reasons.length ? `
        <div data-toggle-key="${escAttr(reasonsKey)}" style="cursor:pointer;display:flex;align-items:center;gap:4px;margin-top:4px;font-size:12px;color:var(--muted);">
          <span style="width:12px;display:inline-block;">${reasonsExpanded ? '▼' : '▶'}</span> Fit Reasons (${reasons.length})
        </div>
        ${reasonsExpanded ? `<ul style="margin:6px 0 0 16px;padding:0;list-style:disc;">${reasons.map(r => `<li style="font-size:12px;color:var(--muted);margin-bottom:4px;">${esc(r)}</li>`).join('')}</ul>` : ''}` : '';

      // News
      const newsHtml = (c.recentNews || []).length ? `
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:2px;">
          ${c.recentNews.map(n => `<a href="${escAttr(n.url)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--blue);text-decoration:none;display:flex;align-items:center;gap:4px;">
            📰 ${esc(n.title)} <span style="color:var(--muted);">· ${this._relDate(n.date)}</span>
          </a>`).join('')}
        </div>` : '';

      // Social links
      const socials = [];
      if (c.socialLinks?.linkedin) socials.push(`<a href="${escAttr(c.socialLinks.linkedin)}" target="_blank" rel="noopener" style="color:#0a66c2;">💼</a>`);
      if (c.socialLinks?.twitter) socials.push(`<a href="${escAttr(c.socialLinks.twitter)}" target="_blank" rel="noopener" style="color:#1d9bf0;">🐦</a>`);
      const socialsHtml = socials.length ? `<div style="display:flex;gap:8px;align-items:center;">${socials.join('')}</div>` : '';

      return `<div id="co-${escAttr(c.domain)}" class="panel" style="margin-bottom:16px;">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
          <div style="padding:6px 12px;border-radius:8px;background:${fit.bg};border:1px solid ${fit.border};text-align:center;min-width:44px;">
            <div style="font-size:22px;font-weight:800;color:${fit.text};line-height:1;">${c.lastRevFit.score}</div>
            <div style="font-size:9px;color:${fit.text};opacity:0.7;">FIT</div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:17px;font-weight:700;color:var(--text);">${esc(c.name)}</span>
              <a href="https://${escAttr(c.domain)}" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent);text-decoration:none;">${esc(c.domain)} ↗</a>
              ${socialsHtml}
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:2px;display:flex;gap:12px;flex-wrap:wrap;">
              <span>🏢 ${esc(c.industry)}</span>
              <span>👥 ${esc(c.size)}</span>
              <span>📍 ${esc(c.location)}</span>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">${techBadges}</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${esc(c.description)}</div>
        ${reasonsHtml}
        ${tpHtml}
        ${newsHtml}
        <div style="margin-top:12px;">
          <div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
            👥 Contacts (${people.length})
          </div>
          ${peopleRows || '<div style="font-size:12px;color:var(--muted);padding:8px 0;">No contacts researched yet.</div>'}
        </div>
        <div style="margin-top:8px;font-size:10px;color:var(--muted);display:flex;gap:8px;">
          <span>Researched ${this._relDate(c.researchedAt)}</span>
          <span>· Source: ${esc(c.source)}</span>
        </div>
      </div>`;
    }).join('');

    this.innerHTML = `
      <div class="page-header">
        <h1>🎯 Lead Research</h1>
        <div style="color:var(--muted);font-size:13px;">${Object.keys(this._data.companies || {}).length} companies · ${Object.keys(this._data.people || {}).length} contacts</div>
      </div>
      ${meetingsHtml}
      ${controlsHtml}
      ${cardsHtml || '<cc-empty-state message="No leads match your search" icon="🔍" animation="none"></cc-empty-state>'}
    `;

    // Focus restoration handled by cc-search component

    // Icons now use Unicode characters, no refreshIcons needed
  }
}
customElements.define('cc-leads', CcLeads);
