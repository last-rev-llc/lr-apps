class AccountsDashboard extends HTMLElement {
  connectedCallback() {
    this.clients = [];
    this.db = null;
    this.innerHTML = '<div style="padding:20px;color:var(--muted)">Loading…</div>';
    this._init();
  }

  async _init() {
    this.db = await SyncDB.init(ACCOUNTS_DB_CONFIG);
    this.clients = this.db.all('clients');
    this._render();
  }

  _render() {
    const clients = this.clients;
    if (!clients.length) {
      this.innerHTML = '<cc-empty-state message="No clients loaded" icon="👥"></cc-empty-state>';
      return;
    }
    this.innerHTML = `
      <div class="acct-selector">
        <label class="text-sm font-semibold text-muted">CLIENT</label>
        <select id="clientSelect">${clients.map(c => `<option value="${this._escAttr(c.id)}">${this._esc(c.name)}</option>`).join('')}</select>
        <span id="industryPill" class="pill text-xs text-muted"></span>
      </div>
      <div class="grid grid-cards" id="dashboard"></div>
    `;
    const sel = this.querySelector('#clientSelect');
    sel.addEventListener('change', () => { location.hash = encodeURIComponent(sel.value); this._renderClient(sel.value); });
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && clients.find(c => c.id === hash)) sel.value = hash;
    this._renderClient(sel.value);
    window.addEventListener('hashchange', () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (clients.find(c => c.id === h)) { sel.value = h; this._renderClient(h); }
    });
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _escAttr(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  _badge(text, color) {
    const colors = { green:'var(--green)', amber:'var(--yellow)', red:'var(--red)', purple:'var(--accent2)', gray:'var(--muted)' };
    return `<span class="badge" style="color:${colors[color]||'var(--muted)'}">${text}</span>`;
  }

  _extLink(url, label) {
    return url ? `<a href="${this._escAttr(url)}" target="_blank" rel="noopener" class="text-xs text-muted no-underline" title="${this._escAttr(label||url)}"><i data-lucide="external-link" style="width:12px;height:12px"></i></a>` : '';
  }

  _card(icon, title, content) {
    return `<div class="card p-4"><div class="flex items-center gap-2 mb-3 font-semibold text-sm"><i data-lucide="${icon}" style="width:16px;height:16px;color:var(--accent)"></i>${title}</div>${content}</div>`;
  }

  _fmtDate(iso) {
    try { return new Date(iso).toLocaleString('en-US',{timeZone:'America/Los_Angeles',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}); }
    catch { return iso; }
  }

  _renderClient(id) {
    const c = this.clients.find(x => x.id === id);
    if (!c) return;
    this.querySelector('#industryPill').textContent = c.industry || '';
    const h = [];

    // Company Info
    let urls = '<div class="flex flex-wrap gap-2">';
    if (c.urls?.website) urls += `<a href="${this._escAttr(c.urls.website)}" target="_blank" rel="noopener" class="btn btn-sm"><i data-lucide="globe" style="width:13px;height:13px"></i>Website</a>`;
    if (c.urls?.production && c.urls.production !== c.urls.website) urls += `<a href="${this._escAttr(c.urls.production)}" target="_blank" rel="noopener" class="btn btn-sm"><i data-lucide="rocket" style="width:13px;height:13px"></i>Production</a>`;
    if (c.urls?.staging) urls += `<a href="${this._escAttr(c.urls.staging)}" target="_blank" rel="noopener" class="btn btn-sm"><i data-lucide="flask-conical" style="width:13px;height:13px"></i>Staging</a>`;
    if (c.urls?.github?.length) c.urls.github.forEach(r => { urls += `<a href="https://github.com/last-rev-llc/${this._escAttr(r)}" target="_blank" rel="noopener" class="btn btn-sm"><i data-lucide="github" style="width:13px;height:13px"></i>${this._esc(r)}</a>`; });
    if (c.urls?.contentful) urls += `<a href="#" class="btn btn-sm"><i data-lucide="database" style="width:13px;height:13px"></i>${this._esc(c.urls.contentful)}</a>`;
    urls += '</div>';
    h.push(this._card('building-2', this._esc(c.name), `<p class="text-muted text-sm mb-2">${this._esc(c.industry)}</p>${urls}`));

    // Daily Standup
    let su = '';
    if (c.standup && (c.standup.yesterday?.length || c.standup.today?.length)) {
      su += '<div class="text-xs font-semibold mb-2" style="color:var(--accent2)">Yesterday</div>';
      if (c.standup.yesterday?.length) c.standup.yesterday.forEach(s => {
        su += `<div class="entity-row text-sm"><span class="font-semibold" style="color:var(--accent);min-width:100px;font-size:12px">${this._esc(s.user)}</span><span>${this._esc(s.item)}${s.ticket?' '+this._badge(this._esc(s.ticket),'purple'):''}${this._extLink(s.ticketUrl,s.ticket)}${this._extLink(s.prUrl,'PR')}</span></div>`;
      }); else su += '<cc-empty-state message="Nothing logged" animation="none"></cc-empty-state>';
      su += '<div class="text-xs font-semibold mb-2 mt-3" style="color:var(--blue)">Today</div>';
      if (c.standup.today?.length) c.standup.today.forEach(s => {
        su += `<div class="entity-row text-sm"><span class="font-semibold" style="color:var(--accent);min-width:100px;font-size:12px">${this._esc(s.user)}</span><span>${this._esc(s.item)}${s.ticket?' '+this._badge(this._esc(s.ticket),'purple'):''}${this._extLink(s.ticketUrl,s.ticket)}${this._extLink(s.prUrl,'PR')}</span></div>`;
      }); else su += '<cc-empty-state message="Nothing planned" animation="none"></cc-empty-state>';
    } else su = '<cc-empty-state message="No standup data" animation="none"></cc-empty-state>';
    h.push(this._card('clipboard-list', 'Daily Standup', su));

    // Contacts
    let ct = '';
    if (c.contacts?.length) c.contacts.forEach(x => {
      ct += `<div class="entity-row text-sm${x.isPrimary?' bg-accent':''}"><span class="font-semibold" style="min-width:120px">${this._esc(x.name)}${x.isPrimary?' '+this._badge('Primary','purple'):''}</span><span class="text-muted">${this._esc(x.role||'')}</span>`;
      if (x.email) ct += `<a href="mailto:${this._escAttr(x.email)}" class="text-xs" style="color:var(--blue)">${this._esc(x.email)}</a>`;
      if (x.linkedin) ct += `<a href="${this._escAttr(x.linkedin)}" target="_blank" rel="noopener" class="text-xs" style="color:var(--blue)">LinkedIn</a>`;
      ct += '</div>';
    }); else ct = '<cc-empty-state message="No contacts added yet" animation="none"></cc-empty-state>';
    h.push(this._card('users', 'Contacts', ct));

    // GitHub
    const prCount = c.github?.openPRs || 0;
    let gh = `<div class="flex items-baseline gap-2 mb-2"><span class="text-2xl font-bold${prCount>5?' text-yellow':''}">${prCount}</span><span class="text-muted text-sm">open PRs</span>${prCount>10?this._badge('Needs attention','amber'):''}</div>`;
    if (c.github?.repos?.length) {
      gh += '<div class="flex flex-wrap gap-2 mb-3">';
      c.github.repos.forEach(r => { gh += `<a href="https://github.com/last-rev-llc/${this._escAttr(r)}" target="_blank" rel="noopener" class="btn btn-sm"><i data-lucide="git-branch" style="width:13px;height:13px"></i>${this._esc(r)}</a>`; });
      gh += '</div>';
    }
    if (c.github?.prs?.length) c.github.prs.forEach(pr => {
      const url = `https://github.com/last-rev-llc/${encodeURIComponent(pr.repo)}/pull/${pr.number}`;
      gh += `<div class="entity-row text-sm"><span style="color:var(--blue);font-weight:600;min-width:50px">#${pr.number}</span><span class="flex-1">${this._esc(pr.title)}</span><span class="text-muted text-xs" style="min-width:80px">${this._esc(pr.authorName||pr.author)}</span>${this._extLink(url,'View PR')}</div>`;
    }); else if (!c.github?.repos?.length) gh += '<cc-empty-state message="No repos linked" animation="none"></cc-empty-state>';
    h.push(this._card('github', 'GitHub', gh));

    // Jira
    let jira = '';
    if (c.jira?.status === 'pending-reauth') {
      jira = `<div class="flex items-center gap-2 p-3 rounded-lg" style="background:rgba(251,191,36,0.08)"><i data-lucide="alert-triangle" style="width:16px;height:16px;color:var(--yellow)"></i><span class="text-sm" style="color:var(--yellow)">Jira integration pending re-auth</span></div>`;
    } else {
      jira = `<div class="flex gap-4"><div><span class="text-xl font-bold">${c.jira?.openTickets||0}</span><span class="text-muted text-xs"> open</span></div><div><span class="text-xl font-bold text-yellow">${c.jira?.staleTickets||0}</span><span class="text-muted text-xs"> stale</span></div></div>`;
    }
    h.push(this._card('ticket', 'Jira', jira));

    // Contentful
    let cf = '';
    if (c.contentfulSpaces?.length) {
      cf += `<div id="cf-${c.id}">`;
      c.contentfulSpaces.forEach(sp => {
        cf += `<div class="mb-3"><div class="text-sm font-semibold mb-2">${this._esc(sp.spaceName)}</div>`;
        cf += `<div class="flex flex-wrap gap-1 mb-2">${sp.environments.map(e => `<span class="badge text-xs">${this._esc(e)}</span>`).join('')}</div>`;
        cf += `<div class="cf-stats text-xs text-muted" data-space="${this._escAttr(sp.spaceId)}">Loading stats…</div></div>`;
      });
      cf += '</div>';
    } else cf = '<cc-empty-state message="No Contentful spaces linked" animation="none"></cc-empty-state>';
    h.push(this._card('database', 'Contentful', cf));

    // Netlify
    let nl = '';
    if (c.netlify?.length) c.netlify.forEach(n => {
      const col = n.status==='success'?'green':n.status==='failed'?'red':'amber';
      nl += `<div class="entity-row text-sm"><span class="font-semibold">${this._esc(n.site)}</span>${this._badge(this._esc(n.status),col)}<span class="text-muted">${this._esc(n.lastDeploy||'')}</span></div>`;
    }); else nl = '<cc-empty-state message="No Netlify sites configured" animation="none"></cc-empty-state>';
    h.push(this._card('cloud', 'Netlify Status', nl));

    // Contracts
    let con = '';
    if (c.contracts?.length) c.contracts.forEach(ct => {
      const sc = ct.status==='active'?'green':ct.status==='expiring-soon'?'amber':'red';
      con += `<div class="entity-row text-sm flex-wrap">${this._badge(this._esc(ct.type),'purple')} ${this._badge(this._esc(ct.status),sc)} <span class="text-muted">${this._esc(ct.startDate||'?')} → ${this._esc(ct.endDate||'?')}</span>`;
      if (ct.monthlyRetainer) con += `<span class="font-semibold">$${this._esc(String(ct.monthlyRetainer))}/mo</span>`;
      if (ct.hourlyRate) con += `<span>$${this._esc(String(ct.hourlyRate))}/hr</span>`;
      con += '</div>';
    }); else con = '<cc-empty-state message="No contracts on file" animation="none"></cc-empty-state>';
    h.push(this._card('file-text', 'Contracts', con));

    // Highlights & Challenges
    let hl = '<div class="grid-2"><div><div class="text-xs font-semibold mb-2" style="color:var(--green)">Highlights</div>';
    if (c.highlights?.length) { hl += '<ul class="text-sm pl-4 m-0" style="color:var(--green)">'; c.highlights.forEach(x => hl += `<li class="mb-1">${this._esc(x)}</li>`); hl += '</ul>'; }
    else hl += '<cc-empty-state message="None this week" animation="none"></cc-empty-state>';
    hl += '</div><div><div class="text-xs font-semibold mb-2" style="color:var(--yellow)">Challenges</div>';
    if (c.challenges?.length) { hl += '<ul class="text-sm pl-4 m-0" style="color:var(--yellow)">'; c.challenges.forEach(x => hl += `<li class="mb-1">${this._esc(x)}</li>`); hl += '</ul>'; }
    else hl += '<cc-empty-state message="None this week" animation="none"></cc-empty-state>';
    hl += '</div></div>';
    h.push(this._card('activity', 'Weekly Highlights & Challenges', hl));

    // Upcoming Focus
    let fo = '';
    if (c.upcomingFocus?.length) c.upcomingFocus.forEach(f => {
      fo += `<div class="entity-row text-sm"><i data-lucide="square" style="width:14px;height:14px;color:var(--accent)"></i>${this._esc(f)}</div>`;
    }); else fo = '<cc-empty-state message="No priorities set for next week" animation="none"></cc-empty-state>';
    h.push(this._card('target', 'Upcoming Focus', fo));

    // Upcoming Meetings
    let mt = '';
    if (c.upcomingMeetings?.length) c.upcomingMeetings.forEach(m => {
      mt += `<div class="entity-row flex-col items-start"><div class="font-semibold text-sm">${this._esc(m.title)}</div><div class="text-xs text-muted">${this._fmtDate(m.datetime)}</div>`;
      if (m.attendees) { mt += '<div class="flex flex-wrap gap-2 mt-1">'; m.attendees.forEach(a => { mt += `<span class="text-xs">${{accepted:'✅',pending:'⏳',declined:'❌'}[a.status]||'⏳'} ${this._esc(a.name)}</span>`; }); mt += '</div>'; }
      mt += '</div>';
    }); else mt = '<cc-empty-state message="No upcoming meetings scheduled" animation="none"></cc-empty-state>';
    h.push(this._card('calendar', 'Upcoming Meetings (2 weeks)', mt));

    this.querySelector('#dashboard').innerHTML = h.join('');
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);

    // Load Contentful stats
    if (c.contentfulSpaces?.length) this._loadCfStats(c);
  }

  async _loadCfStats(client) {
    for (const sp of client.contentfulSpaces) {
      const el = this.querySelector(`.cf-stats[data-space="${CSS.escape(sp.spaceId)}"]`);
      if (!el) continue;
      try {
        const cacheKey = `cf-stats-${sp.spaceId}`;
        const cached = sessionStorage.getItem(cacheKey);
        const ts = sessionStorage.getItem(cacheKey+'-ts');
        let stats;
        if (cached && ts && (Date.now()-parseInt(ts)) < 1800000) {
          stats = JSON.parse(cached);
        } else {
          try {
            const r = await fetch(`data/contentful-stats-${sp.spaceId}.json`);
            if (r.ok) { stats = await r.json(); sessionStorage.setItem(cacheKey,JSON.stringify(stats)); sessionStorage.setItem(cacheKey+'-ts',String(Date.now())); }
          } catch {}
        }
        if (stats) {
          const published = Number(stats.published) || 0;
          const draft = Number(stats.draft) || 0;
          const changed = Number(stats.changed) || 0;
          const total = Number(stats.total) || 0;
          const recentlyPublished = Number(stats.recentlyPublished) || 0;
          const recentlyArchived = Number(stats.recentlyArchived) || 0;
          const entryCount = (total || (published + draft + changed)).toLocaleString();
          el.innerHTML = `<div class="flex flex-wrap gap-4 mb-2">
            <div><span class="text-lg font-bold">${this._esc(entryCount)}</span><span class="text-xs text-muted"> entries</span></div>
            <div><span class="text-lg font-bold" style="color:var(--green)">${this._esc(published.toLocaleString())}</span><span class="text-xs text-muted"> published</span></div>
            <div><span class="text-lg font-bold" style="color:var(--yellow)">${this._esc(String(draft))}</span><span class="text-xs text-muted"> draft</span></div>
            <div><span class="text-lg font-bold" style="color:var(--blue)">${this._esc(String(changed))}</span><span class="text-xs text-muted"> changed</span></div>
          </div>
          ${recentlyPublished||recentlyArchived?`<div class="text-xs text-muted">Past 7d: ${recentlyPublished?`<span style="color:var(--green)">${this._esc(String(recentlyPublished))} published</span>`:''} ${recentlyPublished&&recentlyArchived?' · ':''} ${recentlyArchived?`<span style="color:var(--red)">${this._esc(String(recentlyArchived))} archived</span>`:''}</div>`:''}`;
        } else {
          el.innerHTML = '<span class="text-xs text-muted">Stats available on next data refresh</span>';
        }
      } catch { el.innerHTML = '<span class="text-xs text-muted">Error loading stats</span>'; }
    }
  }
}
customElements.define('accounts-dashboard', AccountsDashboard);
