// ─── Cron Jobs ────────────────────────────────────────────
class CcCrons extends HTMLElement {
  connectedCallback() {
    const isWidget = this.getAttribute('layout') === 'list';
    const p = (!isWidget && window.CC && CC.getParams) ? CC.getParams() : {};
    this._activeFilter = p.filter || 'All';
    this._activeCategory = p.cat || 'All';
    this._activeSort = p.sort || 'nextRun';
    this._searchQuery = p.q || '';
    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._syncUrl(); this._render(); });
    // Run Now uses trigger.js → Supabase trigger_queue (polled by cron every 1 min)
    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      const raw = await (await fetch(src)).json();
      const jobs = Array.isArray(raw) ? raw : (raw.jobs || []);
      // Normalize OpenClaw native schema to our flat format
      this._data = jobs.map(j => ({
        id: j.id,
        name: j.name,
        enabled: j.enabled !== false,
        schedule: j.schedule && j.schedule.expr ? j.schedule.expr : (j.schedule || ''),
        scheduleHuman: j.scheduleHuman || this._cronToHuman(j.schedule),
        prompt: j.prompt || (j.payload && j.payload.message) || '',
        sessionTarget: j.sessionTarget || 'isolated',
        lastStatus: j.lastStatus || (j.state && j.state.lastStatus) || null,
        lastRun: j.lastRun || (j.state && j.state.lastRunAtMs ? new Date(j.state.lastRunAtMs).toISOString() : null),
        nextRun: j.nextRun || (j.state && j.state.nextRunAtMs ? new Date(j.state.nextRunAtMs).toISOString() : null),
        category: j.category || 'Uncategorized',
      }));
      // Build category list
      const cats = new Set(this._data.map(j => j.category));
      this._categories = ['All', ...Array.from(cats).sort()];
      this._render();
    } catch (e) { console.error('cc-crons:', e); }
  }

  _syncUrl() {
    if (window.CC && CC.setParams) CC.setParams({
      filter: this._activeFilter,
      cat: this._activeCategory === 'All' ? null : this._activeCategory,
      sort: this._activeSort === 'nextRun' ? null : this._activeSort,
      q: this._searchQuery || null
    });
  }
  _setFilter(f) { this._activeFilter = f; this._syncUrl(); this._render(); }
  _setCategory(c) { this._activeCategory = c; this._syncUrl(); this._render(); }
  _setSort(s) { this._activeSort = s; this._syncUrl(); this._render(); }
  _toggle(id) { this.querySelector('#cron-' + id)?.classList.toggle('expanded'); }

  async _setJobCategory(id, category) {
    const job = this._data.find(j => j.id === id);
    if (!job) return;
    job.category = category;
    // Persist to Supabase crons table if available
    try {
      const meta = document.querySelector('meta[name="supabase-url"]');
      const key = document.querySelector('meta[name="supabase-key"]');
      if (meta && key) {
        await fetch(`${meta.content}/rest/v1/crons?id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'apikey': key.content, 'Authorization': `Bearer ${key.content}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ category })
        });
      }
    } catch (e) { console.warn('Failed to persist category:', e); }
    const toast = document.querySelector('cc-toast');
    if (toast && toast.show) toast.show(`Category → ${category}`, 'success');
  }

  _cronToHuman(sched) {
    if (!sched || !sched.expr) return sched || '';
    const e = sched.expr;
    const p = e.split(' ');
    const min = p[0], hr = p[1], dow = p[4];
    const dowMap = {'1':'Mon','2':'Tue','3':'Wed','4':'Thu','5':'Fri','6':'Sat','0':'Sun','1-5':'Weekdays','*':'Daily'};
    const fmtHr = (h) => { h = parseInt(h); return h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h-12) + ' PM'; };
    // Every N minutes
    if (min.startsWith('*/')) {
      const interval = min.replace('*/','');
      let scope = dow !== '*' ? (dowMap[dow] || dow) : 'daily';
      return `Every ${interval} min, ${scope}`;
    }
    // Every hour at :MM
    if (hr === '*') return `Every hour at :${min.padStart(2,'0')}`;
    // Hourly range like "15,16,17,18,19,20,21,22,23,0" or "15-0"
    const hrs = hr.includes(',') ? hr.split(',').map(Number) : hr.includes('-') ? [hr] : [parseInt(hr)];
    if (Array.isArray(hrs) && hrs.length > 3) {
      const sorted = hr.split(',').map(Number).sort((a,b) => a - b);
      const first = fmtHr(sorted[0]);
      const last = fmtHr((sorted[sorted.length - 1] + 1) % 24);
      const days = dowMap[dow] || dow || 'daily';
      return `Hourly ${first}–${last}, ${days}`;
    }
    // Single hour with minute
    if (hrs.length === 1 && !hr.includes('-') && !hr.includes(',')) {
      const time = fmtHr(parseInt(hr)).replace(' ', ':' + min.padStart(2,'0') + ' ');
      const days = dowMap[dow] || (dow === '*' ? 'daily' : dow);
      if (dow === '1') return `Mondays at ${time}`;
      return `${days} at ${time}`;
    }
    // Fallback: range
    if (hr.includes('-')) {
      const [s,e2] = hr.split('-').map(Number);
      const days = dowMap[dow] || dow || 'daily';
      return `Hourly ${fmtHr(s)}–${fmtHr(e2+1)}, ${days}`;
    }
    return e;
  }

  _deriveFreq(schedule) {
    if (schedule.includes('*/')) return 'Hourly';
    const parts = schedule.split(' ');
    // day-of-week field
    const dow = parts[4];
    if (dow === '1' || dow === '0') return 'Weekly';
    // hour field with range = hourly
    if (parts[1] && parts[1].includes('-')) return 'Hourly';
    return 'Daily';
  }

  _relativeTime(iso) {
    if (!iso) return '—';
    const diff = new Date(iso) - Date.now();
    const abs = Math.abs(diff);
    const past = diff < 0;
    const mins = Math.round(abs / 60000);
    const hrs = Math.round(abs / 3600000);
    const days = Math.round(abs / 86400000);
    let str;
    if (mins < 2) str = 'just now';
    else if (mins < 60) str = `${mins}m`;
    else if (hrs < 24) str = `${hrs}h`;
    else str = `${days}d`;
    if (mins < 2) return str;
    return past ? `${str} ago` : `in ${str}`;
  }

  _statusDot(item) {
    if (!item.enabled) return '<span class="status-dot gray" title="Disabled"></span>';
    if (item.lastStatus === 'error') return '<span class="status-dot red" title="Error"></span>';
    return '<span class="status-dot green" title="OK"></span>';
  }

  _copyPrompt(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    navigator.clipboard.writeText(x.prompt).then(() => {
      window.showToast('Prompt copied to clipboard!', 2500);
    });
  }

  async _runNow(id) {
    const x = this._data.find(i => i.id === id);
    if (!x) return;
    const btn = this.querySelector('#cron-' + id + ' .run-btn');
    if (!btn) return;
    btn.classList.add('loading'); btn.innerHTML = '⏳ Sending…';
    const msg = `Run this cron job now: ${x.name}\n\nPrompt: ${x.prompt}`;
    try {
      if (!window.trigger) throw new Error('trigger.js not loaded');
      const ok = await window.trigger(msg, { context: 'cc-crons', silent: true });
      if (!ok) throw new Error('trigger() returned false');
      btn.classList.remove('loading'); btn.textContent = '✅ Queued!';
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show(`⚡ "${x.name}" queued for Claudia`, 'success');
      setTimeout(() => { btn.innerHTML = '<i data-lucide="play"></i> Run Now'; window.refreshIcons && window.refreshIcons(); }, 3000);
    } catch (e) {
      console.error('_runNow failed:', e);
      btn.classList.remove('loading'); btn.innerHTML = '<i data-lucide="play"></i> Run Now'; window.refreshIcons && window.refreshIcons();
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Failed to queue job — try again', 'error');
    }
  }

  _filtered() {
    let items = this._data || [];
    const q = (this._searchQuery || '').toLowerCase().trim();
    if (q) items = items.filter(x =>
      x.name.toLowerCase().includes(q) || x.prompt.toLowerCase().includes(q) ||
      x.scheduleHuman.toLowerCase().includes(q)
    );
    if (this._activeFilter !== 'All') {
      items = items.filter(x => this._deriveFreq(x.schedule) === this._activeFilter);
    }
    if (this._activeCategory !== 'All') {
      items = items.filter(x => x.category === this._activeCategory);
    }
    // Sort
    return [...items].sort((a, b) => {
      switch (this._activeSort) {
        case 'name': return a.name.localeCompare(b.name);
        case 'lastRun': return (b.lastRun || '').localeCompare(a.lastRun || '');
        case 'nextRun':
        default:
          return (a.nextRun || 'z').localeCompare(b.nextRun || 'z');
      }
    });
  }

  _render() {
    const hadFocus = this.querySelector('.search') === document.activeElement;
    const selStart = hadFocus ? this.querySelector('.search').selectionStart : 0;
    const selEnd = hadFocus ? this.querySelector('.search').selectionEnd : 0;

    const items = this._filtered();
    const q = this._searchQuery || '';
    const esc = this._esc.bind(this);
    const FILTERS = ['All', 'Daily', 'Hourly', 'Weekly'];
    const SORTS = [
      { key: 'nextRun', label: 'Next Run' },
      { key: 'name', label: 'Name' },
      { key: 'lastRun', label: 'Last Run' },
    ];

    const isWidget = this.getAttribute('layout') === 'list';

    // Shared styles
    const styles = `
      <style>
        cc-crons .status-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }
        cc-crons .status-dot.green { background:var(--green); }
        cc-crons .status-dot.red { background:var(--red); }
        cc-crons .status-dot.gray { background:var(--muted); }
        cc-crons .card { cursor:pointer; transition:border-color .2s; }
        cc-crons .card:hover { border-color:var(--accent); }
        cc-crons .card-detail { display:none; }
        cc-crons .card.expanded .card-detail { display:block; }
        cc-crons .prompt-block { background:var(--prompt-bg); border:1px solid var(--border); border-radius:8px; padding:12px; font-size:12px; color:var(--muted); white-space:pre-wrap; margin:8px 0; line-height:1.5; }
        cc-crons .run-btn { background:transparent; color:var(--green); border:1px solid var(--green); border-radius:8px; padding:4px 12px; cursor:pointer; font-size:12px; font-weight:600; }
        cc-crons .run-btn:hover { background:rgba(16,185,129,0.1); }
        cc-crons .run-btn.loading { opacity:0.6; pointer-events:none; }
        cc-crons .copy-btn { background:transparent; color:var(--muted); border:1px solid var(--border); border-radius:8px; padding:4px 12px; cursor:pointer; font-size:12px; }
        cc-crons .copy-btn:hover { border-color:var(--accent); color:var(--text); }
        cc-crons .cron-meta { display:flex; gap:12px; flex-wrap:wrap; font-size:12px; color:var(--muted); margin:6px 0; }
        cc-crons .cron-meta span { display:flex; align-items:center; gap:4px; }
        cc-crons .cron-schedule { font-size:12px; color:var(--muted); }
        cc-crons .card-actions-row { display:flex; gap:8px; margin-top:8px; }
        cc-crons .freq-badge { font-size:10px; padding:2px 8px; border-radius:10px; font-weight:600; }
        cc-crons .freq-Daily { background:rgba(56,189,248,0.15); color:var(--blue); }
        cc-crons .freq-Hourly { background:rgba(245,158,11,0.15); color:var(--yellow); }
        cc-crons .freq-Weekly { background:rgba(168,85,247,0.15); color:#c084fc; }
        cc-crons .cron-widget-list { list-style:none; padding:0; margin:0; }
        cc-crons .cron-widget-item { display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--glass-border, var(--border)); }
        cc-crons .cron-widget-item:last-child { border-bottom:none; }
        cc-crons .cron-widget-info { flex:1; min-width:0; }
        cc-crons .cron-widget-name { font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; }
        cc-crons .cron-widget-meta { font-size:11px; color:var(--muted); margin-top:2px; }
        cc-crons .cron-list { display:flex; flex-direction:column; gap:4px; }
        cc-crons .cron-list .card { display:flex; flex-wrap:wrap; align-items:center; gap:8px 16px; padding:10px 0; background:none; border:none; border-bottom:1px solid var(--glass-border, var(--border)); border-radius:0; box-shadow:none; }
        cc-crons .cron-list .card:last-child { border-bottom:none; }
        cc-crons .cron-list .card:hover { background:rgba(255,255,255,0.03); border-color:var(--glass-border, var(--border)); transform:none; }
        cc-crons .cron-list .card::before { display:none; }
        cc-crons .cron-list .card-top { flex:1; min-width:200px; }
        cc-crons .cron-list .cron-schedule { flex:0 0 auto; }
        cc-crons .cron-list .cron-meta { flex:0 0 auto; margin:0; }
        cc-crons .cron-list .card-detail { width:100%; }
      </style>`;

    // Widget mode: compact panel for dashboard — matches Slack/PRs/Calendar list style
    if (isWidget) {
      this.innerHTML = `${styles}
      <div class="panel">
        <div class="panel-header">⏰ Cron Jobs <span class="badge">${items.length}</span></div>
        <div class="scrollable-body"><ul class="cron-widget-list">${items.map(x => {
          const freq = this._deriveFreq(x.schedule);
          return `
          <li class="cron-widget-item">
            <div class="cron-widget-info">
              <div class="cron-widget-name">${this._statusDot(x)}${esc(x.name)} <span class="freq-badge freq-${freq}">${freq}</span></div>
              <div class="cron-widget-meta">Next: ${this._relativeTime(x.nextRun)} · Last: ${x.lastRun ? this._relativeTime(x.lastRun) : 'Never'}</div>
            </div>
          </li>`;
        }).join('')}</ul></div>
      </div>`;
      setTimeout(() => window.refreshIcons && window.refreshIcons(), 50);
      return;
    }

    // Full page mode: header, filters, sort, grid
    this.innerHTML = `${styles}
      <div class="page-header" style="margin-bottom:8px;">
        <h1><i data-lucide="clock"></i> <span>Cron Jobs</span></h1>
        <span class="count">${items.length} job${items.length !== 1 ? 's' : ''}</span>
      </div>
      <p class="subtitle">Scheduled automations. Click a card to see the full prompt. Run any job on demand.</p>
      <div class="controls">
        <cc-search placeholder="Search jobs…" value="${esc(q)}"></cc-search>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <cc-pill-filter label="Category" items='${JSON.stringify(this._categories || ['All'])}' value="${esc(this._activeCategory || 'All')}" colored></cc-pill-filter>
      </div>
      <div class="grid grid-cards-wide">${items.map(x => {
        const freq = this._deriveFreq(x.schedule);
        const catColor = (typeof CcPillFilter !== 'undefined' && CcPillFilter.colorFor) ? CcPillFilter.colorFor(x.category) : 'var(--muted)';
        return `
        <div class="card" id="cron-${x.id}" onclick="this.closest('cc-crons')._toggle('${x.id}')">
          <div class="card-top">
            ${this._statusDot(x)}
            <span class="card-title">${esc(x.name)}</span>
            <span class="freq-badge freq-${freq}">${freq}</span>
            <span class="cat-badge" style="font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;background:${catColor}22;color:${catColor};margin-left:4px;">${esc(x.category)}</span>
          </div>
          <div class="cron-schedule">${esc(x.scheduleHuman)}</div>
          <div class="cron-meta">
            <span>⏭ Next: ${this._relativeTime(x.nextRun)}</span>
            <span>⏮ Last: ${x.lastRun ? this._relativeTime(x.lastRun) : 'Never'}</span>
            <button style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;color:var(--green);padding:2px;line-height:1;opacity:.7;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.7'" onclick="event.stopPropagation();this.closest('cc-crons')._runNow('${x.id}')" title="Run Now"><i data-lucide="play" style="width:14px;height:14px"></i></button>
          </div>
          <div class="card-detail">
            <div class="prompt-block">${esc(x.prompt)}</div>
            <div style="margin:8px 0;display:flex;align-items:center;gap:8px;" onclick="event.stopPropagation()">
              <label style="font-size:12px;color:var(--muted);font-weight:600;">Category:</label>
              <select class="cat-select" data-id="${x.id}" style="background:var(--bg-secondary,var(--surface));color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;">
                ${(this._categories || ['All']).filter(c => c !== 'All').map(c => `<option value="${c}"${c === x.category ? ' selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="card-actions-row" onclick="event.stopPropagation()">
              <button class="copy-btn" onclick="this.closest('cc-crons')._copyPrompt('${x.id}')"><i data-lucide="clipboard"></i> Copy Prompt</button>
              <button class="run-btn" onclick="this.closest('cc-crons')._runNow('${x.id}')"><i data-lucide="play"></i> Run Now</button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>
      ${items.length ? '' : '<cc-empty-state message="No cron jobs match that filter" icon="✅" animation="sparkle"></cc-empty-state>'}`;

    // Category filter listener
    const catFilter = this.querySelector('cc-pill-filter');
    if (catFilter) catFilter.addEventListener('pill-change', e => this._setCategory(e.detail.value));
    // Category assignment dropdowns
    this.querySelectorAll('.cat-select').forEach(sel => {
      sel.addEventListener('change', e => this._setJobCategory(e.target.dataset.id, e.target.value));
    });

    if (hadFocus) {
      const inp = this.querySelector('.search');
      if (inp) { inp.focus(); inp.setSelectionRange(selStart, selEnd); }
    }
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-crons', CcCrons);
