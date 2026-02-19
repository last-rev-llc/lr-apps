// ─── Slack ────────────────────────────────────────────────
class CcSlack extends HTMLElement {
  _esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  connectedCallback() {
    this._loadUsers().then(() => this._load());
    // Re-render once CCUserPill becomes available (async component loading)
    this._waitForPills();
  }

  _waitForPills() {
    if (window.CCUserPill) {
      if (this._users?.length) CCUserPill.setUsers(this._users);
      return;
    }
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      if (window.CCUserPill) {
        clearInterval(check);
        if (this._users?.length) CCUserPill.setUsers(this._users);
        if (this._data) this._render(this._data);
      }
      if (attempts > 20) clearInterval(check);
    }, 200);
  }

  async _loadUsers() {
    try {
      const r = await fetch('/data/users.json');
      if (r.ok) {
        this._users = await r.json();
        // Feed user IDs → names into shared CCSlack formatter
        if (window.CCSlack) {
          const map = {};
          this._users.forEach(u => { if (u.slackId && u.name) map[u.slackId] = u.name; });
          CCSlack.setUsers(map);
          window._ccSlackUsers = map;
        }
        // Feed into user-pill component
        if (window.CCUserPill) CCUserPill.setUsers(this._users);
      } else { this._users = []; }
    } catch { this._users = []; }
  }

  _resolveChannel(ch) {
    if (!ch || !ch.match(/^[A-Z0-9]+$/)) return { label: ch ? '#' + ch : '#dm', link: null };
    const u = (this._users || []).find(u => u.slackId === ch);
    // DMs link to the DM conversation; channels link to the channel
    const slackBase = 'https://app.slack.com/client/';
    // We don't have the workspace ID readily, so use slack:// deep link
    const link = `https://lastrev.slack.com/archives/${ch}`;
    if (u) return { label: 'DM: ' + u.name.split(' ')[0], link };
    return { label: '#' + ch, link };
  }

  _getExcluded() { return window.UserPrefs ? window.UserPrefs.get('excludedSlack', []) : (() => { try { return JSON.parse(localStorage.getItem('excludedSlack') || '[]'); } catch { return []; } })(); }

  _toggleExclude(id) {
    const ex = this._getExcluded();
    const idx = ex.indexOf(id);
    if (idx === -1) ex.push(id); else ex.splice(idx, 1);
    (window.UserPrefs ? window.UserPrefs.set('excludedSlack', ex) : localStorage.setItem('excludedSlack', JSON.stringify(ex)));
    this._render(this._data);
  }

  _showAll() { window.UserPrefs ? window.UserPrefs.set('excludedSlack', []) : localStorage.removeItem('excludedSlack'); this._render(this._data); }

  _timeAgo(ts) {
    const diffH = Math.floor((new Date() - new Date(parseFloat(ts) * 1000)) / 3600000);
    if (diffH < 1) return 'just now';
    if (diffH < 24) return diffH + 'h ago';
    return Math.floor(diffH / 24) + 'd ago';
  }

  _strip(text) {
    return window.CCSlack ? CCSlack.format(text, 200) : (text || '').substring(0, 200);
  }

  async _refresh() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src + '?t=' + Date.now())).json();
      this._render(this._data);
    } catch (e) { console.error('cc-slack refresh:', e); }
  }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json();
      this._render(this._data);
      if (window.UserPrefs && UserPrefs.ready) UserPrefs.ready.then(() => this._render(this._data));
    } catch (e) { console.error('cc-slack:', e); }
  }

  _render(allMsgs) {
    const filtered = allMsgs.filter(m => !(m.username || '').toLowerCase().includes('alphaclaw'));
    const excludedSlack = this._getExcluded();
    const msgs = filtered.filter(m => !excludedSlack.includes(m.permalink || m.ts));
    const slackHidden = filtered.length - msgs.length;
    const countText = msgs.length + (slackHidden ? ` (${slackHidden} hidden)` : '');
    const showAllBtn = slackHidden > 0
      ? `<li style="padding:8px 0;text-align:center"><button onclick="this.closest('cc-slack')._showAll()" style="background:none;border:1px solid var(--border);color:var(--accent);font-size:12px;padding:4px 12px;border-radius:6px;cursor:pointer">Show ${slackHidden} hidden</button></li>`
      : '';
    if (msgs.length === 0 && slackHidden === 0) {
      this.innerHTML = `<div class="panel full-width"><div class="panel-header"><i data-lucide="message-square"></i> Slack Messages <span class="badge">0</span> <button class="btn-refresh" onclick="this.closest('cc-slack')._refresh()" title="Refresh Slack messages"><i data-lucide="refresh-cw"></i></button></div><cc-empty-state message="Inbox zero" icon="🎉"></cc-empty-state></div>`;
      setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
      return;
    }
    // Build user lookup for pills
    const usersByName = {};
    (this._users || []).forEach(u => { if (u.name) usersByName[u.name.toLowerCase()] = u; });

    this.innerHTML = `
      <div class="panel full-width">
        <div class="panel-header"><i data-lucide="message-square"></i> Slack Messages <span class="badge">${countText}</span> <button class="btn-refresh" onclick="this.closest('cc-slack')._refresh()" title="Refresh Slack messages"><i data-lucide="refresh-cw"></i></button></div>
        <div class="scrollable-body"><ul class="slack-list">${msgs.slice(0, 25).map(m => {
          const text = this._strip(m.text);
          const link = m.permalink ? `<a href="${m.permalink}" target="_blank">Open →</a>` : '';
          const msgId = (m.permalink || m.ts).replace(/'/g, "\\'");
          const ch = this._resolveChannel(m.channel);
          const chHtml = ch.link
            ? `<a href="${ch.link}" target="_blank" rel="noopener" class="slack-channel">${ch.label}</a>`
            : `<span class="slack-channel">${ch.label}</span>`;
          // Resolve user for pill
          const uMatch = usersByName[(m.username || '').toLowerCase()];
          const pillHtml = window.CCUserPill
            ? CCUserPill.html({ name: m.username || 'unknown', avatar: uMatch ? uMatch.avatar : null, size: 20 })
            : `<span class="slack-username">${m.username || 'unknown'}</span>`;
          return `<li class="slack-item">
            <div class="slack-info">
              <div class="slack-header-row">
                ${pillHtml}
                ${chHtml}
              </div>
              <div class="slack-text">${text} ${link}</div>
            </div>
            <div class="slack-time">${this._timeAgo(m.ts)}</div>
            <button class="pr-exclude-btn" onclick="this.closest('cc-slack')._toggleExclude('${msgId}')" title="Hide this message"><i data-lucide="x"></i></button>
          </li>`;
        }).join('')}${showAllBtn}</ul></div>
      </div>`;
    setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
  }
}
customElements.define('cc-slack', CcSlack);
