/* cc-concerts — Concert Calendar Main Component (Production) */

class CcConcerts extends HTMLElement {
  connectedCallback() {
    this._currentUser = 'Adam H';
    this._currentInitials = 'AH';
    this._concerts = [];
    this._rsvps = [];
    this._sponsors = [];
    this._filter = 'all'; // all | my | friends
    this._genre = 'all';
    this._search = '';
    this._calMonth = new Date().getMonth();
    this._calYear = new Date().getFullYear();
    this._selectedDate = null;
    this._init();
  }

  async _init() {
    this.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--muted);">
      <div style="font-size:32px;margin-bottom:12px;">🎵</div>
      <p>Loading concerts...</p>
    </div>`;
    try {
      this.db = await ConcertsDB.init();
      this._concerts = await this.db.getConcerts();
      this._rsvps = await this.db.getAllRsvps();
    } catch (e) {
      console.error('DB init failed, using empty data', e);
      this._concerts = [];
      this._rsvps = [];
    }
    try {
      const r = await fetch('data/sponsors.json');
      this._sponsors = await r.json();
    } catch (e) { this._sponsors = []; }
    this._render();
  }

  /* ── escape helper ── */
  _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  _escAttr(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── helpers ── */

  _getGenres() {
    const g = new Set(this._concerts.map(c => c.genre).filter(Boolean));
    return ['all', ...Array.from(g).sort()];
  }

  _getAttendees(concertId) {
    return this._rsvps.filter(r => r.concert_id === concertId && r.status === 'going');
  }
  _getMaybes(concertId) {
    return this._rsvps.filter(r => r.concert_id === concertId && r.status === 'maybe');
  }
  _isGoing(concertId) {
    return this._rsvps.some(r => r.concert_id === concertId && r.user_name === this._currentUser && r.status === 'going');
  }

  _filtered() {
    let list = [...this._concerts];
    if (this._genre !== 'all') list = list.filter(c => c.genre === this._genre);
    if (this._search) {
      const q = this._search.toLowerCase();
      list = list.filter(c =>
        c.artist.toLowerCase().includes(q) ||
        (c.venue || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
      );
    }
    if (this._filter === 'my') {
      const myIds = new Set(this._rsvps.filter(r => r.user_name === this._currentUser && r.status === 'going').map(r => r.concert_id));
      list = list.filter(c => myIds.has(c.id));
    } else if (this._filter === 'friends') {
      const myIds = new Set(this._rsvps.filter(r => r.user_name === this._currentUser && r.status === 'going').map(r => r.concert_id));
      const friendIds = new Set(this._rsvps.filter(r => r.user_name !== this._currentUser && r.status === 'going').map(r => r.concert_id));
      list = list.filter(c => friendIds.has(c.id) && !myIds.has(c.id));
    }
    return list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  _formatDate(d) {
    if (!d) return 'TBA';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  _formatShortDate(d) {
    if (!d) return 'TBA';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  _relativeTime(d) {
    if (!d) return '';
    const now = new Date();
    const dt = new Date(d + 'T20:00:00'); // assume evening shows
    const diff = dt - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Past';
    if (days === 0) return 'Tonight!';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
    return `In ${Math.ceil(days / 30)} months`;
  }

  _isPast(d) {
    if (!d) return false;
    return d < new Date().toISOString().slice(0, 10);
  }

  /* ── sponsor banner ── */

  _sponsorBanner(tier) {
    const s = this._sponsors.find(sp => sp.tier === tier);
    if (!s) return '';
    const colors = { gold: '#f59e0b', silver: '#94a3b8', bronze: '#cd7f32' };
    return `<a href="${this._escAttr(s.url)}" target="_blank" rel="noopener" class="sponsor-banner" style="border-color:${colors[s.tier] || 'var(--border)'}">
      <span class="sponsor-tier" style="background:${colors[s.tier] || 'var(--accent)'}">${this._esc(s.tier)} sponsor</span>
      <strong>${this._esc(s.name)}</strong> <span style="color:var(--muted)">${this._esc(s.tagline)}</span>
    </a>`;
  }

  /* ── concert card ── */

  _concertCard(c, compact = false) {
    const att = this._getAttendees(c.id);
    const maybes = this._getMaybes(c.id);
    const going = this._isGoing(c.id);
    const past = this._isPast(c.date);
    const rel = this._relativeTime(c.date);
    const avatars = att.map(a => `<span class="avatar" title="${this._escAttr(a.user_name)}">${this._esc(a.user_initials)}</span>`).join('');
    const maybeAvatars = maybes.map(a => `<span class="avatar maybe" title="${this._escAttr(a.user_name)} (maybe)">${this._esc(a.user_initials)}</span>`).join('');

    if (compact) {
      return `<div class="card concert-card compact ${past ? 'past' : ''}" data-id="${this._escAttr(c.id)}">
        <div class="concert-header">
          <div class="concert-left">
            <div class="concert-date-badge">
              <span class="date-month">${c.date ? new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '?'}</span>
              <span class="date-day">${c.date ? new Date(c.date + 'T00:00:00').getDate() : '?'}</span>
            </div>
            <div>
              <h3 class="concert-artist">${this._esc(c.artist)}</h3>
              <div class="concert-meta">${this._esc(c.venue) || 'TBA'}${c.time ? ' · ' + this._esc(c.time) : ''}</div>
            </div>
          </div>
          <div class="concert-right">
            ${att.length ? `<div class="avatar-stack">${avatars}</div>` : ''}
            <button class="btn btn-sm rsvp-btn ${going ? 'going' : ''}" data-concert="${this._escAttr(c.id)}" ${past ? 'disabled' : ''}>
              ${going ? '✓ Going' : "I'm In"}
            </button>
          </div>
        </div>
      </div>`;
    }

    return `<div class="card concert-card ${past ? 'past' : ''}" data-id="${this._escAttr(c.id)}">
      <div class="concert-header">
        <div class="concert-left">
          <div class="concert-date-badge">
            <span class="date-month">${c.date ? new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '?'}</span>
            <span class="date-day">${c.date ? new Date(c.date + 'T00:00:00').getDate() : '?'}</span>
          </div>
          <div>
            <h3 class="concert-artist">${this._esc(c.artist)}</h3>
            <div class="concert-meta">${this._esc(c.venue) || 'TBA'} ${c.city ? '· ' + this._esc(c.city) : ''}</div>
            <div class="concert-date-text">${this._formatDate(c.date)}${c.time ? ' · ' + this._esc(c.time) : ''}
              ${rel ? ` <span class="rel-time ${rel === 'Tonight!' ? 'tonight' : ''}">${this._esc(rel)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="concert-actions">
          ${c.genre ? `<span class="genre-pill">${this._esc(c.genre)}</span>` : ''}
          <button class="btn btn-sm rsvp-btn ${going ? 'going' : ''}" data-concert="${this._escAttr(c.id)}" ${past ? 'disabled' : ''}>
            ${going ? '✓ Going' : "I'm Going"}
          </button>
        </div>
      </div>
      ${att.length || maybes.length ? `<div class="attendees">${avatars}${maybeAvatars}${att.length ? `<span class="att-count">${att.length} going</span>` : ''}${maybes.length ? `<span class="att-count">${maybes.length} maybe</span>` : ''}</div>` : ''}
      ${c.notes ? `<div class="concert-notes">${this._esc(c.notes)}</div>` : ''}
      <div class="concert-footer">
        ${c.ticket_url ? `<a href="${this._escAttr(c.ticket_url)}" target="_blank" rel="noopener" class="btn btn-sm btn-ticket">🎟 Tickets</a>` : ''}
        <button class="btn btn-sm btn-secondary share-btn" data-concert="${this._escAttr(c.id)}">Share</button>
      </div>
    </div>`;
  }

  /* ── tab renders ── */

  _renderFeed() {
    const now = new Date().toISOString().slice(0, 10);
    const concerts = this._filtered();
    const upcoming = concerts.filter(c => c.date >= now);
    const past = concerts.filter(c => c.date < now);

    // Activity feed: RSVPs + upcoming shows mixed
    const feedItems = [];

    // Next show callout
    if (upcoming.length) {
      const next = upcoming[0];
      const going = this._isGoing(next.id);
      const att = this._getAttendees(next.id);
      feedItems.push(`<div class="feed-next-show card">
        <div class="feed-badge">🔥 Next Up</div>
        ${this._concertCard(next)}
      </div>`);
    }

    // Friend activity
    const recentRsvps = [...this._rsvps]
      .filter(r => r.user_name !== this._currentUser)
      .slice(-15)
      .reverse();

    if (recentRsvps.length) {
      const activityHtml = recentRsvps.map(r => {
        const c = this._concerts.find(x => x.id === r.concert_id);
        if (!c) return '';
        return `<div class="feed-activity-item">
          <span class="avatar small">${this._esc(r.user_initials)}</span>
          <span><strong>${this._esc(r.user_name)}</strong> is ${r.status === 'going' ? '✓ going to' : '🤔 maybe for'} <strong>${this._esc(c.artist)}</strong> <span class="feed-date">${this._formatShortDate(c.date)}</span></span>
        </div>`;
      }).filter(Boolean).join('');

      feedItems.push(`<div class="feed-section">
        <h3 class="feed-section-title">👥 Friend Activity</h3>
        ${activityHtml}
      </div>`);
    }

    // Upcoming shows summary
    if (upcoming.length > 1) {
      feedItems.push(`<div class="feed-section">
        <h3 class="feed-section-title">📅 Coming Up</h3>
        ${upcoming.slice(1, 8).map(c => this._concertCard(c, true)).join('')}
        ${upcoming.length > 8 ? `<p class="feed-more">+ ${upcoming.length - 8} more shows</p>` : ''}
      </div>`);
    }

    // Stats
    const myGoing = this._rsvps.filter(r => r.user_name === this._currentUser && r.status === 'going').length;
    const uniqueFriends = new Set(this._rsvps.filter(r => r.user_name !== this._currentUser).map(r => r.user_name)).size;
    feedItems.push(`<div class="feed-stats card">
      <div class="stat"><span class="stat-num">${upcoming.length}</span><span class="stat-label">Upcoming</span></div>
      <div class="stat"><span class="stat-num">${myGoing}</span><span class="stat-label">You're Going</span></div>
      <div class="stat"><span class="stat-num">${uniqueFriends}</span><span class="stat-label">Friends Active</span></div>
      <div class="stat"><span class="stat-num">${this._concerts.length}</span><span class="stat-label">Total Shows</span></div>
    </div>`);

    if (!feedItems.length) return '<cc-empty-state message="No activity yet" icon="🎵"></cc-empty-state>';
    return feedItems.join('');
  }

  _renderList() {
    const concerts = this._filtered();
    if (!concerts.length) return '<cc-empty-state message="No concerts found" icon="🎵"></cc-empty-state>';
    return `<div style="margin-top:8px;">
      <cc-pill-filter label="Show" items='[{"value":"all","label":"All"},{"value":"my","label":"My Shows"},{"value":"friends","label":"Friends Going"}]' value="${this._escAttr(this._filter)}" id="list-filter"></cc-pill-filter>
    </div>` + concerts.map(c => this._concertCard(c)).join('');
  }

  _renderByArtist() {
    const concerts = this._filtered();
    const byArtist = {};
    concerts.forEach(c => { (byArtist[c.artist] = byArtist[c.artist] || []).push(c); });
    const artists = Object.keys(byArtist).sort();
    if (!artists.length) return '<cc-empty-state message="No artists found" icon="🎤"></cc-empty-state>';
    return artists.map(a => `
      <div class="artist-group">
        <h3 class="group-title">${this._esc(a)} <span class="badge">${byArtist[a].length}</span></h3>
        ${byArtist[a].map(c => this._concertCard(c, true)).join('')}
      </div>
    `).join('');
  }

  _renderByVenue() {
    const concerts = this._filtered();
    const byVenue = {};
    concerts.forEach(c => { const v = c.venue || 'TBA'; (byVenue[v] = byVenue[v] || []).push(c); });
    const venues = Object.keys(byVenue).sort();
    if (!venues.length) return '<cc-empty-state message="No venues found" icon="🏛️"></cc-empty-state>';
    return venues.map(v => `
      <div class="venue-group">
        <h3 class="group-title">📍 ${this._esc(v)} <span class="badge">${byVenue[v].length}</span></h3>
        ${byVenue[v].map(c => this._concertCard(c, true)).join('')}
      </div>
    `).join('');
  }

  _renderCalendar() {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const first = new Date(this._calYear, this._calMonth, 1);
    const lastDay = new Date(this._calYear, this._calMonth + 1, 0).getDate();
    const startDay = first.getDay();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const concerts = this._filtered();
    const concertsByDate = {};
    concerts.forEach(c => {
      if (!c.date) return;
      const d = new Date(c.date + 'T00:00:00');
      if (d.getMonth() === this._calMonth && d.getFullYear() === this._calYear) {
        const day = d.getDate();
        (concertsByDate[day] = concertsByDate[day] || []).push(c);
      }
    });

    let cells = '';
    for (let i = 0; i < startDay; i++) cells += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= lastDay; d++) {
      const shows = concertsByDate[d] || [];
      const sel = this._selectedDate === d ? 'selected' : '';
      const hasShows = shows.length ? 'has-shows' : '';
      const isToday = d === todayDate && this._calMonth === todayMonth && this._calYear === todayYear ? 'today' : '';
      const dots = shows.slice(0, 3).map(s => {
        const going = this._isGoing(s.id);
        return `<span class="cal-dot ${going ? 'my-show' : ''}"></span>`;
      }).join('');
      const showCount = shows.length > 3 ? `<span class="cal-overflow">+${shows.length - 3}</span>` : '';
      cells += `<div class="cal-cell ${sel} ${hasShows} ${isToday}" data-day="${d}">
        <span class="cal-num">${d}</span>
        ${dots ? `<div class="cal-dots">${dots}${showCount}</div>` : ''}
      </div>`;
    }

    let selectedShows = '';
    if (this._selectedDate && concertsByDate[this._selectedDate]) {
      selectedShows = `<div class="cal-selected-shows">
        <h3>${months[this._calMonth]} ${this._selectedDate} — ${concertsByDate[this._selectedDate].length} show${concertsByDate[this._selectedDate].length > 1 ? 's' : ''}</h3>
        ${concertsByDate[this._selectedDate].map(c => this._concertCard(c)).join('')}
      </div>`;
    } else if (this._selectedDate) {
      selectedShows = `<div class="cal-selected-shows"><p style="color:var(--muted);font-size:13px;">No shows on ${months[this._calMonth]} ${this._selectedDate}</p></div>`;
    }

    // Show count for this month
    const monthTotal = Object.values(concertsByDate).reduce((a, b) => a + b.length, 0);

    return `
      <div class="calendar-container">
        <div class="cal-header">
          <button class="btn btn-sm cal-nav" id="cal-prev">‹</button>
          <div class="cal-title">
            <h3>${months[this._calMonth]} ${this._calYear}</h3>
            <span class="cal-count">${monthTotal} show${monthTotal !== 1 ? 's' : ''}</span>
          </div>
          <button class="btn btn-sm cal-nav" id="cal-next">›</button>
        </div>
        <div class="cal-grid">
          ${days.map(d => `<div class="cal-day-name">${d}</div>`).join('')}
          ${cells}
        </div>
      </div>
      ${selectedShows}
    `;
  }

  _renderSponsors() {
    if (!this._sponsors.length) return '';
    return `<div class="sponsors-section">
      <div class="sponsors-label">Sponsored By</div>
      <div class="sponsors-grid">
        ${this._sponsors.map(s => {
          const colors = { gold: '#f59e0b', silver: '#94a3b8', bronze: '#cd7f32' };
          return `<a href="${this._escAttr(s.url)}" target="_blank" rel="noopener" class="sponsor-card" style="border-top:2px solid ${colors[s.tier] || 'var(--border)'}">
            <span class="sponsor-tier-badge" style="background:${colors[s.tier]}">${this._esc(s.tier)}</span>
            <strong>${this._esc(s.name)}</strong>
            <span class="sponsor-tagline">${this._esc(s.tagline)}</span>
          </a>`;
        }).join('')}
      </div>
    </div>`;
  }

  /* ── main render ── */

  _render() {
    const genres = this._getGenres();
    const now = new Date().toISOString().slice(0, 10);
    const upcoming = this._concerts.filter(c => c.date >= now).length;
    const myGoing = this._rsvps.filter(r => r.user_name === this._currentUser && r.status === 'going').length;

    this.innerHTML = `
      <style>
        cc-concerts { display:block; max-width:960px; margin:0 auto; padding:1rem; padding-bottom:100px; }

        /* Header */
        .page-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
        .header-stats { display:flex; gap:16px; }
        .header-stat { text-align:center; }
        .header-stat-num { font-size:20px; font-weight:700; color:var(--heading); }
        .header-stat-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:var(--muted); }

        /* Controls */
        .controls { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:16px; }

        /* Concert Cards */
        .concert-card { margin-bottom:12px; padding:16px; transition:transform 0.15s ease, box-shadow 0.15s ease; }
        .concert-card:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,0.2); }
        .concert-card.past { opacity:0.5; }
        .concert-card.compact { padding:12px; }
        .concert-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; }
        .concert-left { display:flex; gap:12px; align-items:flex-start; }
        .concert-right { display:flex; gap:8px; align-items:center; }

        /* Date badge */
        .concert-date-badge { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:6px 10px; text-align:center; min-width:44px; flex-shrink:0; }
        .date-month { display:block; font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--accent); font-weight:600; }
        .date-day { display:block; font-size:20px; font-weight:700; line-height:1.1; color:var(--heading); }

        .concert-artist { margin:0; font-size:17px; line-height:1.3; }
        .concert-meta { color:var(--muted); font-size:13px; margin-top:2px; }
        .concert-date-text { font-size:13px; color:var(--text); margin-top:2px; }
        .concert-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
        .concert-notes { font-size:12px; color:var(--muted); margin-top:8px; font-style:italic; }
        .concert-footer { display:flex; gap:8px; margin-top:10px; }
        .rel-time { font-size:11px; padding:2px 8px; border-radius:10px; background:rgba(245,158,11,0.15); color:var(--accent); font-weight:600; }
        .rel-time.tonight { background:rgba(239,68,68,0.2); color:var(--danger, #ef4444); animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .genre-pill { font-size:11px; padding:3px 10px; border-radius:12px; background:rgba(255,255,255,0.08); color:var(--muted); text-transform:capitalize; }

        /* RSVP button */
        .rsvp-btn { min-width:86px; font-weight:600; transition:all 0.2s; }
        .rsvp-btn.going { background:var(--accent); color:#000; }
        .rsvp-btn:disabled { opacity:0.4; cursor:not-allowed; }

        /* Ticket button */
        .btn-ticket { background:rgba(245,158,11,0.15); color:var(--accent); border:1px solid rgba(245,158,11,0.3); }
        .btn-ticket:hover { background:rgba(245,158,11,0.25); }

        /* Attendees */
        .attendees { display:flex; align-items:center; gap:4px; margin-top:8px; flex-wrap:wrap; }
        .avatar { width:28px; height:28px; border-radius:50%; background:var(--accent); color:#000; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; }
        .avatar.small { width:22px; height:22px; font-size:8px; }
        .avatar.maybe { background:var(--border); color:var(--muted); }
        .avatar-stack { display:flex; }
        .avatar-stack .avatar { margin-left:-6px; border:2px solid var(--card); }
        .avatar-stack .avatar:first-child { margin-left:0; }
        .att-count { font-size:12px; color:var(--muted); margin-left:4px; }

        /* Groups */
        .group-title { font-size:16px; margin:20px 0 8px; display:flex; align-items:center; gap:8px; }
        .badge { font-size:11px; background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:10px; color:var(--muted); }

        /* Calendar */
        .calendar-container { margin-bottom:16px; }
        .cal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .cal-header h3 { margin:0; }
        .cal-title { text-align:center; }
        .cal-count { font-size:12px; color:var(--muted); }
        .cal-nav { font-size:18px; padding:4px 12px; line-height:1; }
        .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
        .cal-day-name { text-align:center; font-size:11px; color:var(--muted); padding:4px; font-weight:600; }
        .cal-cell { text-align:center; padding:8px 4px; border-radius:6px; cursor:pointer; min-height:52px; position:relative; border:1px solid transparent; transition:background 0.15s; }
        .cal-cell.empty { cursor:default; }
        .cal-cell.has-shows { background:rgba(245,158,11,0.08); }
        .cal-cell.selected { border-color:var(--accent); background:rgba(245,158,11,0.15); }
        .cal-cell.today .cal-num { background:var(--accent); color:#000; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; font-weight:700; }
        .cal-cell:not(.empty):hover { background:rgba(245,158,11,0.12); }
        .cal-num { font-size:13px; }
        .cal-dots { display:flex; gap:3px; justify-content:center; margin-top:4px; }
        .cal-dot { width:6px; height:6px; border-radius:50%; background:var(--muted); }
        .cal-dot.my-show { background:var(--accent); }
        .cal-overflow { font-size:9px; color:var(--muted); }
        .cal-selected-shows h3 { font-size:15px; margin:16px 0 8px; }

        /* Feed */
        .feed-next-show { position:relative; margin-bottom:16px; }
        .feed-badge { position:absolute; top:8px; right:8px; font-size:11px; font-weight:700; padding:3px 10px; border-radius:10px; background:rgba(239,68,68,0.2); color:var(--danger, #ef4444); z-index:2; }
        .feed-section { margin-bottom:24px; }
        .feed-section-title { font-size:15px; margin:0 0 12px; color:var(--heading); }
        .feed-activity-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border); font-size:13px; }
        .feed-activity-item:last-child { border-bottom:none; }
        .feed-date { color:var(--muted); font-size:12px; }
        .feed-more { font-size:13px; color:var(--accent); margin-top:8px; }
        .feed-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:20px !important; text-align:center; }
        .stat-num { display:block; font-size:24px; font-weight:700; color:var(--accent); }
        .stat-label { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:var(--muted); }

        /* Sponsors */
        .sponsor-banner { display:flex; gap:10px; align-items:center; padding:10px 16px; border:1px solid var(--border); border-radius:8px; text-decoration:none; color:var(--heading); margin-bottom:16px; font-size:13px; transition:background 0.2s; }
        .sponsor-banner:hover { background:rgba(255,255,255,0.04); }
        .sponsor-tier { font-size:9px; text-transform:uppercase; padding:2px 6px; border-radius:4px; color:#000; font-weight:700; }
        .sponsors-section { margin-top:32px; }
        .sponsors-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--muted); margin-bottom:8px; }
        .sponsors-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
        .sponsor-card { display:flex; flex-direction:column; gap:4px; padding:12px; border-radius:8px; background:var(--card); text-decoration:none; color:var(--heading); font-size:13px; transition:background 0.2s; position:relative; }
        .sponsor-card:hover { background:rgba(255,255,255,0.06); }
        .sponsor-tier-badge { position:absolute; top:8px; right:8px; font-size:9px; text-transform:uppercase; padding:1px 5px; border-radius:3px; color:#000; font-weight:700; }
        .sponsor-tagline { color:var(--muted); font-size:12px; }

        /* FAB */
        .add-btn { position:fixed; bottom:80px; right:20px; width:52px; height:52px; border-radius:50%; background:var(--accent); color:#000; border:none; font-size:26px; cursor:pointer; box-shadow:0 4px 16px rgba(245,158,11,0.4); z-index:50; display:flex; align-items:center; justify-content:center; transition:transform 0.2s; }
        .add-btn:hover { transform:scale(1.1); }
        .add-btn:active { transform:scale(0.95); }

        /* Form */
        .form-group { margin-bottom:12px; }
        .form-group label { display:block; font-size:12px; color:var(--muted); margin-bottom:4px; }
        .form-group input, .form-group textarea, .form-group select { width:100%; padding:8px 10px; background:var(--bg); border:1px solid var(--border); border-radius:6px; color:var(--heading); font-size:14px; box-sizing:border-box; }
        .form-group textarea { min-height:60px; resize:vertical; }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color:var(--accent); outline:none; }

        .btn-sm { font-size:12px; padding:4px 12px; }

        /* Responsive */
        @media(max-width:600px) {
          .concert-header { flex-direction:column; }
          .controls { flex-direction:column; align-items:stretch; }
          .feed-stats { grid-template-columns:repeat(2,1fr); }
          .header-stats { gap:10px; }
          .cal-cell { min-height:40px; padding:4px 2px; }
        }
      </style>

      ${this._sponsorBanner('gold')}

      <cc-page-header icon="🎵" title="Concert Calendar" description="Upcoming shows & events" count="${this._concerts.length}" count-label="shows">
        <div class="header-stats">
          <div class="header-stat">
            <div class="header-stat-num">${upcoming}</div>
            <div class="header-stat-label">Upcoming</div>
          </div>
          <div class="header-stat">
            <div class="header-stat-num">${myGoing}</div>
            <div class="header-stat-label">Going</div>
          </div>
        </div>
      </cc-page-header>

      <div class="controls">
        <cc-search placeholder="Search artists, venues..." value="${this._escAttr(this._search)}"></cc-search>
        <cc-filter-drawer title="Filters" ${this._genre !== 'all' ? 'active' : ''}>
          <cc-pill-dropdown label="Genre" items='${this._escAttr(JSON.stringify(genres.map(g => ({ value: g, label: g === 'all' ? 'All Genres' : g }))))}' value="${this._escAttr(this._genre)}" id="genre-filter"></cc-pill-dropdown>
        </cc-filter-drawer>
      </div>

      <cc-tabs active="feed" no-url>
        <cc-tab name="feed" label="Live Feed">
          <div id="feed-view" style="margin-top:12px;">${this._renderFeed()}</div>
        </cc-tab>
        <cc-tab name="list" label="List">
          <div id="list-view" style="margin-top:8px;">${this._renderList()}</div>
        </cc-tab>
        <cc-tab name="calendar" label="Calendar">
          <div id="calendar-view" style="margin-top:12px;">${this._renderCalendar()}</div>
        </cc-tab>
        <cc-tab name="artist" label="By Artist">
          <div id="artist-view" style="margin-top:12px;">${this._renderByArtist()}</div>
        </cc-tab>
        <cc-tab name="venue" label="By Venue">
          <div id="venue-view" style="margin-top:12px;">${this._renderByVenue()}</div>
        </cc-tab>
      </cc-tabs>

      ${this._renderSponsors()}

      <button class="add-btn" id="add-concert-btn" title="Add Concert">+</button>

      <cc-modal title="Add Concert" size="md" id="add-modal">
        <div class="form-group"><label>Artist *</label><input name="artist" required placeholder="e.g. Phish"></div>
        <div class="form-group"><label>Venue</label><input name="venue" placeholder="e.g. The Fillmore"></div>
        <div class="form-group"><label>City</label><input name="city" value="San Francisco"></div>
        <div class="form-group"><label>Date *</label><input name="date" type="date"></div>
        <div class="form-group"><label>Time</label><input name="time" type="time"></div>
        <div class="form-group"><label>Ticket URL</label><input name="ticket_url" type="url" placeholder="https://..."></div>
        <div class="form-group"><label>Genre</label><select name="genre">
          <option value="">Select genre...</option>
          <option>jam</option><option>rock</option><option>indie</option><option>funk</option>
          <option>soul</option><option>electronic</option><option>psychedelic</option><option>punk</option>
          <option>jazz-fusion</option><option>bluegrass</option><option>neo-soul</option><option>hip-hop</option>
        </select></div>
        <div class="form-group"><label>Notes</label><textarea name="notes" placeholder="Any details..."></textarea></div>
        <div slot="footer">
          <button class="btn btn-primary" id="save-concert">Save Concert</button>
        </div>
      </cc-modal>
    `;

    this._bind();
  }

  /* ── event binding ── */

  _bind() {
    // Search — cc-search fires 'cc-search' event
    this.addEventListener('cc-search', e => {
      this._search = e.detail?.value || '';
      this._updateViews();
    });

    // Genre filter (cc-pill-dropdown fires dropdown-change)
    const genreFilter = this.querySelector('#genre-filter');
    const genreHandler = e => { this._genre = e.detail?.value || 'all'; this._updateViews(); };
    genreFilter?.addEventListener('dropdown-change', genreHandler);
    genreFilter?.addEventListener('pill-change', genreHandler);

    // Tab changes — re-bind dynamic content
    this.querySelector('cc-tabs')?.addEventListener('tab-change', () => {
      requestAnimationFrame(() => this._bindDynamic());
    });

    // Add concert FAB
    this.querySelector('#add-concert-btn')?.addEventListener('click', () => {
      this.querySelector('#add-modal')?.open();
    });

    // Save concert
    this.querySelector('#save-concert')?.addEventListener('click', async () => {
      const modal = this.querySelector('#add-modal');
      const artist = modal.querySelector('[name=artist]').value.trim();
      if (!artist) { window.showToast?.('Artist name is required', 'error'); return; }
      const date = modal.querySelector('[name=date]').value;
      if (!date) { window.showToast?.('Date is required', 'error'); return; }
      const concert = {
        artist,
        venue: modal.querySelector('[name=venue]').value.trim(),
        city: modal.querySelector('[name=city]').value.trim(),
        date,
        time: modal.querySelector('[name=time]').value,
        ticket_url: modal.querySelector('[name=ticket_url]').value.trim(),
        genre: modal.querySelector('[name=genre]').value,
        notes: modal.querySelector('[name=notes]').value.trim(),
        created_by: this._currentUser
      };
      try {
        await this.db.upsertConcert(concert);
        this._concerts = await this.db.getConcerts();
        modal.close();
        this._render();
        window.showToast?.('Concert added! 🎵');
      } catch (err) {
        console.error('Save failed:', err);
        window.showToast?.('Failed to save concert', 'error');
      }
    });

    this._bindDynamic();
  }

  _bindDynamic() {
    // List filter (inside list tab)
    this.querySelector('#list-filter')?.addEventListener('pill-change', e => {
      this._filter = e.detail?.value || 'all';
      this._updateViews();
    });

    // Calendar nav
    this.querySelector('#cal-prev')?.addEventListener('click', () => {
      this._calMonth--;
      if (this._calMonth < 0) { this._calMonth = 11; this._calYear--; }
      this._selectedDate = null;
      this._updateViews();
    });
    this.querySelector('#cal-next')?.addEventListener('click', () => {
      this._calMonth++;
      if (this._calMonth > 11) { this._calMonth = 0; this._calYear++; }
      this._selectedDate = null;
      this._updateViews();
    });

    // Calendar date clicks
    this.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
      cell.addEventListener('click', () => {
        this._selectedDate = parseInt(cell.dataset.day);
        this._updateViews();
      });
    });

    // RSVP buttons
    this.querySelectorAll('.rsvp-btn').forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        const cid = btn.dataset.concert;
        try {
          await this.db.toggleRsvp(cid, this._currentUser, this._currentInitials);
          this._rsvps = await this.db.getAllRsvps();
          this._updateViews();
          window.showToast?.('RSVP updated ✓');
        } catch (err) {
          console.error('RSVP failed:', err);
          window.showToast?.('Failed to update RSVP', 'error');
        }
      });
    });

    // Share buttons
    this.querySelectorAll('.share-btn').forEach(btn => {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', () => {
        const c = this._concerts.find(x => x.id === btn.dataset.concert);
        if (c) {
          const text = `🎵 ${c.artist} at ${c.venue || 'TBA'} — ${this._formatDate(c.date)}`;
          const url = window.location.href;
          if (navigator.share) {
            navigator.share({ title: `${c.artist} Concert`, text, url }).catch(() => {});
          } else {
            navigator.clipboard.writeText(text).then(() => {
              window.showToast?.('Copied to clipboard ✓');
            });
          }
        }
      });
    });
  }

  _updateViews() {
    const lv = this.querySelector('#list-view');
    if (lv) lv.innerHTML = this._renderList();
    const cv = this.querySelector('#calendar-view');
    if (cv) cv.innerHTML = this._renderCalendar();
    const av = this.querySelector('#artist-view');
    if (av) av.innerHTML = this._renderByArtist();
    const vv = this.querySelector('#venue-view');
    if (vv) vv.innerHTML = this._renderByVenue();
    const fv = this.querySelector('#feed-view');
    if (fv) fv.innerHTML = this._renderFeed();
    requestAnimationFrame(() => this._bindDynamic());
  }
}

customElements.define('cc-concerts', CcConcerts);
