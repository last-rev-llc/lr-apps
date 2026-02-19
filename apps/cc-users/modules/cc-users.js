// ─── Users Directory (CRM Enhanced) ──────────────────────────────────────
class CcUsers extends HTMLElement {
  connectedCallback() {
    this._users = [];
    this._slack = [];
    this._prs = [];
    this._search = '';
    this.addEventListener('cc-search', e => { this._search = e.detail.value; this._saveParams(); this._render(); });
    this._typeFilter = 'all';
    this._companyFilter = 'all';
    this._expandedId = null;
    this._view = localStorage.getItem('cc-view-cc-users') || (window.innerWidth <= 768 ? 'list' : 'cards');
    this._restoreParams();
    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  _escAttr(s) { return (s || '').toString().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  _restoreParams() {
    const p = (typeof CC !== 'undefined' && CC.getParams) ? CC.getParams() : {};
    if (p.q) this._search = p.q;
    if (p.type) this._typeFilter = p.type;
    if (p.company) this._companyFilter = p.company;
    if (p.user) this._expandedId = p.user;
  }

  _saveParams() {
    if (typeof CC !== 'undefined' && CC.setParams) {
      CC.setParams({
        q: this._search || null,
        type: this._typeFilter === 'all' ? null : this._typeFilter,
        company: this._companyFilter === 'all' ? null : this._companyFilter,
        user: this._expandedId || null
      });
    }
  }

  async _load() {
    // Try Supabase first, fall back to JSON file
    let loaded = false;
    if (window.supabase) {
      try {
        this._users = await window.supabase.select('users', { order: 'name.asc' });
        loaded = true;
      } catch (e) { console.warn('cc-users: Supabase fetch failed, falling back to JSON', e); }
    }
    if (!loaded) {
      const src = this.getAttribute('src') || 'data/users.json';
      try {
        const usersR = await fetch(src);
        this._users = await usersR.json();
      } catch (e) { console.error('cc-users: failed to load users', e); }
    }
    try {
      const slackR = await fetch('data/slack.json');
      if (slackR.ok) {
        const slackData = await slackR.json();
        this._slack = Array.isArray(slackData) ? slackData : (slackData.messages || slackData.items || []);
      }
    } catch {}
    try {
      const prsR = await fetch('data/prs.json');
      if (prsR.ok) {
        const prsData = await prsR.json();
        this._prs = Array.isArray(prsData) ? prsData : (prsData.prs || prsData.items || []);
      }
    } catch {}
    try {
      const pendingR = await fetch('data/pending-matches.json');
      if (pendingR.ok) this._pending = await pendingR.json();
    } catch {}
    try {
      this._render();
    } catch (e) {
      console.error('cc-users render error:', e);
      this.innerHTML = `<div class="panel" style="padding:20px"><h2>Render Error</h2><pre style="color:var(--red);font-size:12px">${e.message}\n${e.stack}</pre></div>`;
    }
  }

  _setSearch(val) { this._search = val; this._saveParams(); this._render(); }
  _setType(val) { this._typeFilter = val; this._saveParams(); this._render(); }
  _setCompany(val) { this._companyFilter = val; this._saveParams(); this._render(); }
  _setView(val) { this._view = val; this._render(); }

  _getUserOverrides(userId) {
    const all = window.UserPrefs ? window.UserPrefs.get('userOverrides', {}) : JSON.parse(localStorage.getItem('userOverrides') || '{}');
    return all[userId] || {};
  }

  _saveUserField(userId, field, value) {
    const all = window.UserPrefs ? window.UserPrefs.get('userOverrides', {}) : JSON.parse(localStorage.getItem('userOverrides') || '{}');
    if (!all[userId]) all[userId] = {};
    all[userId][field] = value;
    if (window.UserPrefs) { window.UserPrefs.set('userOverrides', all); }
    else { localStorage.setItem('userOverrides', JSON.stringify(all)); }
    if (field === 'alias' || field === 'nickname') {
      const user = this._users.find(u => u.id === userId);
      CCTrigger(`CRM update: ${user?.name || userId} ${field} set to "${value}". Update users.json with this ${field}.`, {silent:true});
    }
    window.showToast && window.showToast(`💾 Saved ${field}`, 2000);
  }

  _insightsHtml(user) {
    if (!user.insights) return '';
    const ins = user.insights;
    const confColor = {high:'var(--green)',medium:'var(--yellow)',low:'var(--red)'}[ins.confidence] || 'var(--muted)';
    const section = (icon, title, body) => `<div class="ins-section"><h4 class="ins-heading">${icon} ${title}</h4>${body}</div>`;
    const pill = (text) => `<span class="badge ins-badge">${this._esc(text)}</span>`;

    let html = '';

    const analyzedDate = ins.analyzedAt ? this._friendlyAgo(ins.analyzedAt) : '';
    const sources = (ins.sourcesUsed || []).map(s => s.split(':')[0]).filter(Boolean);
    html += `<div class="ins-meta" style="margin-bottom:16px">
      <span style="color:${confColor};font-weight:600;text-transform:capitalize">${ins.confidence || 'unknown'} confidence</span>
      ${analyzedDate ? `<span>Analyzed ${analyzedDate}</span>` : ''}
      ${ins.updatedAt && ins.updatedAt !== ins.analyzedAt ? `<span>Updated ${this._friendlyAgo(ins.updatedAt)}</span>` : ''}
      ${sources.length ? `<span>Sources: ${sources.join(', ')}</span>` : ''}
    </div>`;

    if (ins.topicsToAvoid?.length) {
      html += `<div class="ins-avoid"><strong>🚫 Topics to Avoid:</strong> ${ins.topicsToAvoid.map(t => this._esc(t)).join(', ')}</div>`;
    }

    if (ins.summary) {
      html += section('📋', 'Summary', `<p class="ins-summary">${this._esc(ins.summary)}</p>`);
    }

    if (ins.style) {
      const s = ins.style;
      const stylePills = [
        s.formality && `🎩 ${s.formality}`,
        s.tone && `🗣️ ${s.tone}`,
        s.verbosity && `📝 ${s.verbosity}`,
        s.emojiUse && `😀 emoji: ${s.emojiUse}`,
        s.responseSpeed && `⚡ ${s.responseSpeed}`,
        s.preferredChannel && `📱 ${s.preferredChannel}`,
        s.bestTimeToReach && `🕐 ${s.bestTimeToReach}`,
      ].filter(Boolean);
      if (stylePills.length) {
        html += section('💬', 'Communication Style', `<div class="ins-pills">${stylePills.map(p => pill(p)).join('')}</div>`);
      }
    }

    if (ins.bestApproach) {
      html += section('🎯', 'Best Approach', `<p class="ins-approach">${this._esc(ins.bestApproach)}</p>`);
    }

    if (ins.personality) {
      const p = ins.personality;
      let personalityHtml = '<div class="ins-pills" style="margin-bottom:8px">';
      if (p.decisionStyle) personalityHtml += pill('🧭 ' + p.decisionStyle);
      if (p.detailOrientation) personalityHtml += pill('🔍 ' + p.detailOrientation);
      if (p.conflictStyle) personalityHtml += pill('⚖️ ' + p.conflictStyle);
      personalityHtml += '</div>';
      if (p.motivators?.length || p.stressors?.length) {
        personalityHtml += '<div class="ins-grid">';
        if (p.motivators?.length) personalityHtml += `<div><div class="ins-sublabel">✅ Motivators</div><ul class="ins-list">${p.motivators.map(m => `<li>${this._esc(m)}</li>`).join('')}</ul></div>`;
        if (p.stressors?.length) personalityHtml += `<div><div class="ins-sublabel">⚠️ Stressors</div><ul class="ins-list">${p.stressors.map(m => `<li>${this._esc(m)}</li>`).join('')}</ul></div>`;
        personalityHtml += '</div>';
      }
      html += section('🧩', 'Personality', personalityHtml);
    }

    if (ins.interests) {
      const i = ins.interests;
      let intHtml = '<div class="ins-grid">';
      if (i.professional?.length) intHtml += `<div><div class="ins-sublabel">💼 Professional</div><div class="ins-pills">${i.professional.map(t => pill(t)).join('')}</div></div>`;
      if (i.personal?.length) intHtml += `<div><div class="ins-sublabel">🎮 Personal</div><div class="ins-pills">${i.personal.map(t => pill(t)).join('')}</div></div>`;
      intHtml += '</div>';
      html += section('💡', 'Interests', intHtml);
    }

    if (ins.conversationStarters?.length) {
      html += section('🗨️', 'Conversation Starters', `<ul class="ins-starters">${ins.conversationStarters.map(s => `<li>${this._esc(s)}</li>`).join('')}</ul>`);
    }

    return html;
  }

  _getRejected() { return window.UserPrefs ? window.UserPrefs.get('rejectedMatches', {}) : JSON.parse(localStorage.getItem('rejectedMatches') || '{}'); }

  _getPendingFiltered() {
    const rejected = this._getRejected();
    return (this._pending || []).filter(p => {
      const key = `${p.userId}:${p.match.platform}:${p.match.handle}`;
      return p.status === 'pending' && !rejected[key];
    });
  }

  async _approveMatch(idx) {
    const pending = this._getPendingFiltered();
    const match = pending[idx];
    if (!match) return;
    const user = this._users.find(u => u.id === match.userId);
    if (user) {
      if (!user.socials) user.socials = [];
      user.socials.push({ platform: match.match.platform, url: match.match.url, handle: match.match.handle });
    }
    const orig = this._pending.find(p => p.userId === match.userId && p.match.handle === match.match.handle);
    if (orig) orig.status = 'approved';
    CCTrigger(`Social match APPROVED: ${match.userName} → ${match.match.platform}:${match.match.handle} (${match.match.url}). Update their socials in users.json and remove from pending-matches.json.`, {silent:true});
    window.showToast && window.showToast(`✅ Approved ${match.match.platform} match for ${match.userName}`, 3000);
    this._render();
  }

  _rejectMatch(idx) {
    const pending = this._getPendingFiltered();
    const match = pending[idx];
    if (!match) return;
    const key = `${match.userId}:${match.match.platform}:${match.match.handle}`;
    const rejected = this._getRejected();
    rejected[key] = true;
    if (window.UserPrefs) { window.UserPrefs.set('rejectedMatches', rejected); }
    else { localStorage.setItem('rejectedMatches', JSON.stringify(rejected)); }
    CCTrigger(`Social match REJECTED: ${match.userName} → ${match.match.platform}:${match.match.handle}. Do NOT suggest this match again. Remove from pending-matches.json.`, {silent:true});
    window.showToast && window.showToast(`❌ Rejected ${match.match.platform} match for ${match.userName}`, 3000);
    this._render();
  }

  _downloadPdf(userId) {
    const user = this._users.find(u => u.id === userId);
    if (!user) return;
    const esc = s => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
    const escAttr = s => (s || '').toString().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const company = (user.companies || []).find(c => c.current);
    const companyName = company ? company.name : '';
    const companyRole = company ? company.role : '';
    const avatarUrl = user.avatar || user.githubAvatar || '';
    const initials = esc((user.name||'?').split(' ').map(n=>n[0]).join('').slice(0,2));
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const ins = user.insights || {};
    const style = ins.style || {};
    const interests = ins.interests || {};
    const fileTitle = `Profile - ${user.name || 'Unknown'}${companyName ? ' - ' + companyName : ''}`;

    // --- Helper to build a section ---
    const section = (title, content, opts = {}) => {
      if (!content) return '';
      const cls = opts.full ? ' full' : '';
      return `<div class="section${cls}"><div class="section-header"><h3>${title}</h3></div><div class="section-body">${content}</div></div>`;
    };

    // --- Contact & Social ---
    const contactPairs = [
      user.email && ['✉ Email', user.email],
      user.phone && ['📞 Phone', user.phone],
      user.location && ['📍 Location', user.location],
      user.timezone && ['🕐 Timezone', user.timezone.split('/').pop().replace(/_/g,' ')],
      user.slackHandle && ['💬 Slack', '@' + user.slackHandle],
      user.githubHandle && ['⌨ GitHub', user.githubHandle],
      ...((user.handles || []).map(h => h && [h.platform, h.handle])),
      ...((user.socials || []).map(s => s && [s.platform, s.handle])),
    ].filter(Boolean);
    const contactHtml = contactPairs.length ? section('Contact & Social',
      `<div class="kv-grid">${contactPairs.map(([k,v]) => `<div class="kv-label">${esc(k)}</div><div class="kv-value">${esc(v)}</div>`).join('')}</div>`) : '';

    // --- Companies ---
    const companiesHtml = (user.companies || []).length ? section('Companies',
      `<div class="companies">${(user.companies || []).map(c => `<div class="company-row">
        <span class="company-name">${esc(c.name)}${c.role ? ' — ' + esc(c.role) : ''}</span>
        <span class="badge ${c.current ? 'badge-green' : ''}">${c.current ? 'Current' : 'Past'}</span>
      </div>`).join('')}</div>`) : '';

    // --- About / Bio ---
    const notesHtml = user.notes ? section('About', `<p>${esc(user.notes)}</p>`, { full: true }) : '';

    // --- Communication Style ---
    let commHtml = '';
    if (Object.keys(style).length) {
      const meter = (label, value) => {
        if (!value) return '';
        const levels = { low: 1, medium: 2, high: 3, formal: 3, casual: 1, neutral: 2, concise: 1, moderate: 2, verbose: 3, fast: 3, slow: 1 };
        const lv = levels[(value || '').toLowerCase()] || 2;
        const dots = [1,2,3].map(i => `<span class="dot ${i <= lv ? 'active' : ''}"></span>`).join('');
        return `<div class="meter-row"><span class="meter-label">${esc(label)}</span><span class="meter-dots">${dots}</span><span class="meter-value">${esc(value)}</span></div>`;
      };
      const meters = [
        meter('Formality', style.formality),
        meter('Tone', style.tone),
        meter('Verbosity', style.verbosity),
        meter('Emoji Use', style.emojiUse),
        meter('Response Speed', style.responseSpeed),
      ].filter(Boolean).join('');

      const statPairs = [
        style.preferredChannel && ['Preferred Channel', style.preferredChannel],
        style.bestTimeToReach && ['Best Time to Reach', style.bestTimeToReach],
        style.timezone && ['Timezone', style.timezone],
        style.avgWordsPerMessage && ['Avg Words/Msg', String(style.avgWordsPerMessage)],
        style.medianWordsPerMessage && ['Median Words/Msg', String(style.medianWordsPerMessage)],
        user.slackMsgCount && ['Slack Messages', String(user.slackMsgCount)],
      ].filter(Boolean);
      const statsHtml = statPairs.length ? `<div class="kv-grid sm">${statPairs.map(([k,v]) => `<div class="kv-label">${esc(k)}</div><div class="kv-value">${esc(v)}</div>`).join('')}</div>` : '';

      commHtml = section('Communication Style', meters + statsHtml);
    }

    // --- Personality Insights ---
    let personalityParts = [];
    if (ins.summary) personalityParts.push(`<p>${esc(ins.summary)}</p>`);
    if (ins.bestApproach) personalityParts.push(`<div class="callout"><strong>Best Approach:</strong> ${esc(ins.bestApproach)}</div>`);
    const personalityHtml = personalityParts.length ? section('Personality Insights', personalityParts.join(''), { full: true }) : '';

    // --- Interests & Topics ---
    let interestParts = [];
    if ((interests.professional || []).length) interestParts.push(`<div class="interest-group"><h4>Professional</h4><div class="tags">${interests.professional.map(i => `<span class="tag">${esc(i)}</span>`).join('')}</div></div>`);
    if ((interests.personal || []).length) interestParts.push(`<div class="interest-group"><h4>Personal</h4><div class="tags">${interests.personal.map(i => `<span class="tag tag-blue">${esc(i)}</span>`).join('')}</div></div>`);
    if ((interests.sharedWithAdam || []).length) interestParts.push(`<div class="interest-group"><h4>Shared with Adam</h4><div class="tags">${interests.sharedWithAdam.map(i => `<span class="tag tag-green">${esc(i)}</span>`).join('')}</div></div>`);
    const interestsHtml = interestParts.length ? section('Interests & Topics', interestParts.join(''), { full: true }) : '';

    // --- Conversation Starters ---
    const startersHtml = (ins.conversationStarters || []).length ? section('Conversation Starters',
      `<ul>${ins.conversationStarters.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`, { full: true }) : '';

    // --- Education & Certifications ---
    let eduParts = [];
    if ((user.education || []).length) eduParts.push(...user.education.map(e =>
      `<div class="company-row"><span class="company-name">${esc(e.school || e.institution || '')}${e.degree ? ' — ' + esc(e.degree) : ''}${e.field ? ', ' + esc(e.field) : ''}</span>${e.year ? `<span class="badge">${esc(String(e.year))}</span>` : ''}</div>`));
    if ((user.certifications || []).length) eduParts.push(...user.certifications.map(c =>
      `<div class="company-row"><span class="company-name">${esc(typeof c === 'string' ? c : c.name || '')}</span>${c.year ? `<span class="badge">${esc(String(c.year))}</span>` : ''}</div>`));
    const educationHtml = eduParts.length ? section('Education & Certifications', eduParts.join('')) : '';

    // --- Skills & Tags ---
    const tagsHtml = (user.tags || []).length ? section('Skills & Tags',
      `<div class="tags">${(user.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`) : '';

    // --- Projects ---
    const projectsHtml = (user.projects || []).length ? section('Projects',
      `<div class="tags">${(user.projects || []).map(p => `<span class="tag tag-purple">${esc(typeof p === 'string' ? p : p.name || '')}</span>`).join('')}</div>`) : '';

    const typeBadge = user.type ? `<span class="type-badge">${esc(user.type)}</span>` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(fileTitle)}</title>
<style>
  @page { margin: 0; size: letter; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5; font-size: 12px; }

  /* Hero */
  .hero { background: linear-gradient(135deg, #0a0e1a 0%, #1a2332 50%, #1e293b 100%); padding: 36px 44px 32px; display: flex; align-items: center; gap: 24px; }
  .avatar { width: 88px; height: 88px; border-radius: 50%; border: 3px solid rgba(245,158,11,0.6); object-fit: cover; flex-shrink: 0; }
  .avatar-placeholder { width: 88px; height: 88px; border-radius: 50%; border: 3px solid rgba(245,158,11,0.6); background: linear-gradient(135deg, #334155, #475569); display: flex; align-items: center; justify-content: center; color: #f59e0b; font-size: 32px; font-weight: 700; flex-shrink: 0; }
  .hero-info { color: #fff; }
  .hero-name { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }
  .hero-title { font-size: 14px; color: #94a3b8; margin-top: 4px; }
  .hero-company { font-size: 13px; color: #f59e0b; margin-top: 2px; font-weight: 500; }
  .type-badge { display: inline-block; background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.8px; border: 1px solid rgba(245,158,11,0.3); }

  /* Grid body */
  .body { padding: 20px 44px 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }

  /* Sections */
  .section { break-inside: avoid; }
  .section.full { grid-column: 1 / -1; }
  .section-header { background: linear-gradient(90deg, #0a0e1a, #1e293b); padding: 5px 14px; border-radius: 4px; margin-bottom: 8px; }
  .section-header h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #f59e0b; font-weight: 700; margin: 0; }
  .section-body { padding: 0 4px 4px; }
  .section-body p { font-size: 12px; color: #475569; line-height: 1.6; }

  /* Key-value grid */
  .kv-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 14px; }
  .kv-grid.sm { margin-top: 8px; }
  .kv-label { font-size: 11px; color: #64748b; font-weight: 600; white-space: nowrap; }
  .kv-value { font-size: 11px; color: #1e293b; }

  /* Companies */
  .companies { display: flex; flex-direction: column; gap: 4px; }
  .company-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 3px 0; }
  .company-name { font-weight: 500; }
  .badge { font-size: 9px; padding: 2px 8px; border-radius: 8px; background: #e2e8f0; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-green { background: #d1fae5; color: #059669; }

  /* Tags */
  .tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { font-size: 10px; background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 12px; font-weight: 600; }
  .tag-blue { background: #dbeafe; color: #1e40af; }
  .tag-green { background: #d1fae5; color: #065f46; }
  .tag-purple { background: #ede9fe; color: #5b21b6; }

  /* Meters */
  .meter-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; }
  .meter-label { font-size: 11px; color: #64748b; font-weight: 600; width: 100px; }
  .meter-dots { display: flex; gap: 4px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #e2e8f0; }
  .dot.active { background: #f59e0b; }
  .meter-value { font-size: 10px; color: #1e293b; font-weight: 500; text-transform: capitalize; }

  /* Callout */
  .callout { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 8px 12px; font-size: 12px; color: #475569; margin-top: 8px; border-radius: 0 4px 4px 0; line-height: 1.6; }

  /* Interest groups */
  .interest-group { margin-bottom: 8px; }
  .interest-group:last-child { margin-bottom: 0; }
  .interest-group h4 { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }

  /* Lists */
  ul { padding-left: 18px; font-size: 12px; color: #475569; }
  ul li { margin-bottom: 3px; line-height: 1.5; }

  /* Footer */
  .footer { text-align: center; padding: 12px 44px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 8px; letter-spacing: 0.5px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
  <div class="hero">
    ${avatarUrl ? `<img class="avatar" src="${escAttr(avatarUrl)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="avatar-placeholder" style="display:none">${initials}</div>` : `<div class="avatar-placeholder">${initials}</div>`}
    <div class="hero-info">
      <div class="hero-name">${esc(user.name)} ${typeBadge}</div>
      ${user.title ? `<div class="hero-title">${esc(user.title)}</div>` : ''}
      ${companyName ? `<div class="hero-company">${esc(companyName)}${companyRole ? ' — ' + esc(companyRole) : ''}</div>` : ''}
    </div>
  </div>
  <div class="body">
    ${contactHtml}${companiesHtml}${notesHtml}${commHtml}${personalityHtml}${interestsHtml}${startersHtml}${educationHtml}${tagsHtml}${projectsHtml}
  </div>
  <div class="footer">Generated from Command Center · ${esc(today)}</div>
</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:816px;height:1056px;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    const prevTitle = document.title;
    document.title = fileTitle;
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => { document.title = prevTitle; iframe.remove(); }, 2000);
    }, 500);
  }

  _openUser(id) {
    this._expandedId = id; this._modalTab = 'overview'; this._saveParams();
    const user = this._users.find(u => u.id === id);
    this._loadSocialFeed(id).then(() => {});
    if (user?.githubHandle) this._loadGithubRepos(user.githubHandle).then(() => {});
    this._render();
  }
  _closeUser() { this._expandedId = null; this._modalTab = 'overview'; this._saveParams(); }
  _setModalTab(tab) { this._modalTab = tab; }

  _getUserSlack(user) {
    if (!user || !this._slack.length) return [];
    return this._slack.filter(m =>
      (m.username || '').toLowerCase() === (user.slackHandle || '').toLowerCase() ||
      m.channel === user.slackId
    ).slice(0, 10);
  }

  _getUserPRs(user) {
    if (!user || !this._prs.length) return [];
    return this._prs.filter(p => {
      const author = typeof p.author === 'object' ? (p.author?.login || p.author?.name || '') : (p.author || '');
      return author.toLowerCase() === (user.githubHandle || '').toLowerCase();
    }).slice(0, 10);
  }

  _timeAgo(ts) {
    if (!ts) return '';
    const d = typeof ts === 'number' || /^\d+\.\d+$/.test(ts) ? new Date(parseFloat(ts) * 1000) : new Date(ts);
    const diffH = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (diffH < 1) return 'just now';
    if (diffH < 24) return diffH + 'h ago';
    return Math.floor(diffH / 24) + 'd ago';
  }

  _friendlyAgo(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d)) return '';
    const mins = (Date.now() - d.getTime()) / 60000;
    if (mins < 1) return 'just now';
    if (mins < 60) return Math.round(mins) + 'm ago';
    const hrs = mins / 60;
    if (hrs < 24) return Math.round(hrs) + 'h ago';
    const days = hrs / 24;
    if (days < 1.5) return '1 day ago';
    if (days < 14) return Math.round(days) + ' days ago';
    const weeks = days / 7;
    if (weeks < 8) return Math.round(weeks) + ' weeks ago';
    const months = days / 30.44;
    if (months < 1.5) return '1 month ago';
    if (months < 12) return Math.round(months) + ' months ago';
    const years = days / 365.25;
    if (years < 1.5) return '1 year ago';
    // Round to nearest half year
    const hy = Math.round(years * 2) / 2;
    return (hy % 1 === 0 ? hy : hy.toFixed(1).replace('.0','')) + ' years ago';
  }

  _formatMsg(text, max) {
    return window.CCSlack ? CCSlack.format(text, max || 200) : this._esc((text || '').substring(0, 200));
  }

  _brandIcon(platform, size) {
    return window.CCIcons ? window.CCIcons.get(platform, size) : '';
  }

  _socialIcon(platform) {
    return this._brandIcon(platform, 14);
  }

  _socialIconsHtml(user, inline) {
    if (!user.socials || !user.socials.length) return '';
    const links = user.socials.map(s =>
      `<a href="${this._escAttr(s.url)}" target="_blank" rel="noopener" class="user-social-link" title="${this._escAttr(s.platform + ': ' + s.handle)}">${this._socialIcon(s.platform)}</a>`
    ).join('');
    return `<div class="user-social-icons">${links}</div>`;
  }

  _socialTabHtml(user) {
    const socials = user.socials || [];
    if (!socials.length) {
      return '<cc-empty-state message="No social profiles linked" icon="🌐" animation="none"></cc-empty-state>';
    }

    const cacheKey = `social-feed-${user.id}`;
    const cached = this._socialFeeds?.[cacheKey];
    let html = '<div class="social-feed">';

    socials.forEach(s => {
      const icon = this._brandIcon(s.platform, 18);
      const platformLabel = s.platform.charAt(0).toUpperCase() + s.platform.slice(1);
      const posts = cached?.[s.platform] || [];

      html += `<div class="social-feed-section">
        <div class="social-feed-header">
          <h3 class="social-feed-title">${icon} ${this._esc(platformLabel)}</h3>
          <a href="${this._escAttr(s.url)}" target="_blank" rel="noopener" class="social-feed-link">@${this._esc(s.handle)} ↗</a>
        </div>`;

      if (posts.length) {
        html += posts.map(p => `<div class="card social-post">
          <div class="social-post-text">${this._esc((p.text || '').slice(0, 280))}${(p.text || '').length > 280 ? '…' : ''}</div>
          ${p.media ? `<div class="social-post-media"><img src="${this._escAttr(p.media)}" onerror="this.style.display='none'"></div>` : ''}
          <div class="social-post-footer">
            <span class="social-post-time">${p.date ? this._timeAgo(p.date) : ''}</span>
            <div class="social-post-stats">
              ${p.likes != null ? `<span>❤️ ${p.likes}</span>` : ''}
              ${p.comments != null ? `<span>💬 ${p.comments}</span>` : ''}
              ${p.shares != null ? `<span>🔁 ${p.shares}</span>` : ''}
            </div>
            ${p.url ? `<a href="${this._escAttr(p.url)}" target="_blank" rel="noopener" class="social-post-link">View post ↗</a>` : ''}
          </div>
        </div>`).join('');
      } else {
        html += `<div class="no-data-box">
          <div class="no-data-box-msg">No cached posts yet</div>
          <a href="${this._escAttr(s.url)}" target="_blank" rel="noopener" class="btn btn-sm btn-icon" title="View ${this._esc(platformLabel)} Profile"><i data-lucide="external-link" style="width:14px;height:14px"></i></a>
        </div>`;
      }

      html += '</div>';
    });

    html += `<div style="text-align:center;padding:8px 0">
      <button class="btn-refresh" data-action="fetch-social" data-id="${this._escAttr(user.id)}" title="Refresh social feeds"><i data-lucide="refresh-cw"></i></button>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">Feed data is fetched via the agent and cached locally</div>
    </div>`;
    html += '</div>';
    return html;
  }

  _fetchSocialFeeds(userId) {
    const user = this._users.find(u => u.id === userId);
    if (!user?.socials?.length) return;
    const platforms = user.socials.map(s => `${s.platform}: ${s.url}`).join(', ');
    CCTrigger(`Fetch latest social media posts for ${user.name} (${platforms}). Save results to apps/command-center/data/social-feeds/${userId}.json as {platform: [{text, date, url, media, likes, comments, shares}]}. Max 5 posts per platform.`);
    window.showToast && window.showToast('🔄 Requesting social feeds from agent...', 3000);
  }

  async _loadSocialFeed(userId) {
    if (!this._socialFeeds) this._socialFeeds = {};
    const cacheKey = `social-feed-${userId}`;
    try {
      const r = await fetch(`data/social-feeds/${userId}.json`);
      if (r.ok) this._socialFeeds[cacheKey] = await r.json();
    } catch {}
  }

  _profileCompleteness(user) {
    const checks = [
      { label: 'Name', done: !!user.name },
      { label: 'Email', done: !!user.email },
      { label: 'Title', done: !!user.title },
      { label: 'Avatar', done: !!user.avatar },
      { label: 'Company', done: (user.companies || []).some(c => c.current && c.name !== 'Unknown') },
      { label: 'Slack', done: !!user.slackHandle },
      { label: 'GitHub', done: !!user.githubHandle },
      { label: 'Socials', done: (user.socials || []).length > 0 },
      { label: 'Timezone', done: !!user.timezone },
      { label: 'Phone', done: !!user.phone },
      { label: 'Insights', done: !!user.insights },
      { label: 'Notes', done: !!(user.notes || this._getUserOverrides(user.id).myNotes) },
    ];
    const done = checks.filter(c => c.done).length;
    const pct = Math.round((done / checks.length) * 100);
    return { checks, done, total: checks.length, pct };
  }

  _profileBarHtml(pct) {
    const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
    return `<div class="profile-bar"><div class="profile-bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
  }

  _profileSummaryHtml(user) {
    const { checks, done, total, pct } = this._profileCompleteness(user);
    const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
    const missing = checks.filter(c => !c.done).map(c => c.label);
    return `<div class="profile-summary">
      <div class="profile-summary-row">
        <div class="profile-summary-info">
          <span class="profile-summary-label">Profile</span>
          <span class="profile-summary-pct" style="color:${color}">${pct}%</span>
          ${missing.length ? `<span class="profile-summary-missing">Missing: ${missing.join(', ')}</span>` : '<span class="profile-summary-complete">✓ Complete</span>'}
          ${(user.lastResearchedAt || user.updatedAt) ? `<span class="profile-summary-updated"><i data-lucide="clock" style="width:11px;height:11px"></i> Updated ${this._friendlyAgo(user.lastResearchedAt || user.updatedAt)}</span>` : ''}
        </div>
        <div class="action-row">
          <button class="btn btn-sm btn-icon" data-action="refresh" data-id="${this._escAttr(user.id)}" title="Research &amp; analyze this person"><i data-lucide="refresh-cw" style="width:14px;height:14px"></i></button>
        </div>
      </div>
      <div class="profile-bar" style="position:relative;height:4px;border-radius:4px"><div class="profile-bar-fill" style="width:${pct}%;background:${color};border-radius:4px"></div></div>
    </div>`;
  }

  _runResearch(userId) {
    const user = this._users.find(u => u.id === userId);
    if (!user) return;
    const ctx = [
      user.name,
      user.email ? `email: ${user.email}` : '',
      user.slackHandle ? `slack: @${user.slackHandle}` : '',
      user.githubHandle ? `github: ${user.githubHandle}` : '',
      (user.socials || []).map(s => `${s.platform}: ${s.url}`).join(', '),
      this._getCurrentCompany(user) ? `company: ${this._getCurrentCompany(user)}` : '',
    ].filter(Boolean).join(', ');
    CCTrigger(`Run full people research on: ${user.name} (${ctx}). Use the people-research skill. Search Slack messages, GitHub activity, web/LinkedIn. Update their entry in users.json with any new info found (title, phone, timezone, socials, companies, avatar, tags, notes). Merge with existing data, don't overwrite good data with blanks.`);
    window.showToast && window.showToast(`🔍 Researching ${user.name}...`, 3000);
  }

  _runAnalysis(userId) {
    const user = this._users.find(u => u.id === userId);
    if (!user) return;
    CCTrigger(`Run personality insights analysis on: ${user.name} (Slack ID: ${user.slackId || 'unknown'}, GitHub: ${user.githubHandle || 'unknown'}). Use the personality-insights skill. Gather their Slack messages, GitHub activity, and any social data. Generate communication style profile, interests, conversation starters, best approach, topics to avoid. Save the insights object to their entry in users.json under the "insights" key. If they already have insights, merge and refresh — don't lose existing good data.`);
    window.showToast && window.showToast(`🧠 Analyzing ${user.name}...`, 3000);
  }

  _runFullRefresh(userId) {
    const user = this._users.find(u => u.id === userId);
    if (!user) return;
    const ctx = [
      user.name,
      user.email ? `email: ${user.email}` : '',
      user.slackHandle ? `slack: @${user.slackHandle}` : '',
      user.githubHandle ? `github: ${user.githubHandle}` : '',
      (user.socials || []).map(s => `${s.platform}: ${s.url}`).join(', '),
      this._getCurrentCompany(user) ? `company: ${this._getCurrentCompany(user)}` : '',
    ].filter(Boolean).join(', ');
    CCTrigger(`Run full people research AND personality insights for: ${user.name} (${ctx}). First, use the people-research skill to search Slack messages, GitHub activity, web/LinkedIn and update their entry in users.json with any new info found. Then, use the personality-insights skill to generate/refresh their communication style profile, interests, conversation starters, best approach, and topics to avoid — save under the "insights" key in users.json. Merge with existing data, don't overwrite good data with blanks.`);
    window.showToast && window.showToast(`🔄 Refreshing ${user.name} — research + insights...`, 3000);
  }

  _githubTabHtml(user, prList) {
    const handle = user.githubHandle;
    let html = '';

    if (handle) {
      const repos = this._githubRepos?.[handle] || [];
      html += `<div class="social-feed-header" style="margin-bottom:12px">
        <h3 class="social-feed-title">${this._brandIcon('github',18)} Public Repos</h3>
        <div class="flex gap-2 align-center">
          <a href="https://github.com/${this._esc(handle)}?tab=repositories" target="_blank" rel="noopener" class="social-feed-link">View all ↗</a>
          <button class="btn-refresh" data-action="fetch-repos" data-handle="${this._escAttr(handle)}" title="Refresh repos"><i data-lucide="refresh-cw"></i></button>
        </div>
      </div>`;

      if (repos.length) {
        html += repos.map(r => {
          const lang = r.language ? `<span class="badge">${this._esc(r.language)}</span>` : '';
          const stars = r.stars ? `<span class="repo-card-stat">⭐ ${r.stars}</span>` : '';
          const forks = r.forks ? `<span class="repo-card-stat">🔀 ${r.forks}</span>` : '';
          return `<div class="card repo-card">
            <div class="repo-card-header">
              <a href="${this._escAttr(r.url || `https://github.com/${handle}/${r.name}`)}" target="_blank" rel="noopener" class="repo-card-name">${this._esc(r.name)}</a>
              <div class="repo-card-stats">${lang} ${stars} ${forks}</div>
            </div>
            ${r.description ? `<div class="repo-card-desc">${this._esc(r.description)}</div>` : ''}
            ${r.topics?.length ? `<div class="repo-card-topics">${r.topics.map(t => `<span class="badge" style="font-size:9px">${this._esc(t)}</span>`).join('')}</div>` : ''}
          </div>`;
        }).join('');
      } else {
        html += `<div class="no-data-box" style="margin-bottom:16px">
          <div class="no-data-box-msg">No cached repos</div>
          <button class="btn-refresh" data-action="fetch-repos" data-handle="${this._escAttr(handle)}" title="Fetch repos"><i data-lucide="refresh-cw"></i></button>
        </div>`;
      }
    }

    html += `<h3 class="social-feed-title" style="margin:16px 0 12px">${this._brandIcon('github',18)} Recent Pull Requests</h3>
      <ul style="list-style:none;padding:0;margin:0">${prList}</ul>`;

    return html;
  }

  async _loadGithubRepos(handle) {
    if (!handle) return;
    if (!this._githubRepos) this._githubRepos = {};
    try {
      const r = await fetch(`data/github-repos/${handle}.json`);
      if (r.ok) this._githubRepos[handle] = await r.json();
    } catch {}
  }

  _fetchGithubRepos(handle) {
    if (!handle) return;
    CCTrigger(`Fetch public GitHub repos for user "${handle}". Use GitHub API: gh api "users/${handle}/repos?type=public&sort=updated&per_page=100" --jq '[.[] | {name,description,language,url:.html_url,stars:.stargazers_count,forks:.forks_count,topics,updated:.updated_at}]'. Save results as JSON array to apps/command-center/data/github-repos/${handle}.json. These repos reveal personal interests — note anything relevant for personality insights.`);
    window.showToast && window.showToast(`🔄 Fetching repos for ${handle}...`, 3000);
  }

  _socialDetailHtml(user) {
    if (!user.socials || !user.socials.length) return '';
    const links = user.socials.map(s =>
      `<div class="detail-item">${this._socialIcon(s.platform)} <a href="${this._escAttr(s.url)}" target="_blank" rel="noopener">${this._esc(s.platform)} — ${this._esc(s.handle)}</a></div>`
    ).join('');
    return `<h3 class="section-heading">Social Profiles</h3>${links}`;
  }

  _getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  _getCompanies() {
    const companies = new Set();
    this._users.forEach(u => (u.companies || []).forEach(c => { if (c.current && c.name !== 'Unknown') companies.add(c.name); }));
    return [...companies].sort();
  }

  _getCurrentCompany(user) {
    const c = (user.companies || []).find(c => c.current);
    return c ? c.name : '';
  }

  _getTypeBadge(type) {
    const labels = { internal: 'Internal', client: 'Client', partner: 'Partner', other: 'Other' };
    return `<span class="badge user-type-badge user-type-${type}">${labels[type] || type}</span>`;
  }

  _avatarHtml(u, size) {
    const sz = size || 44;
    const fs = Math.round(sz * 0.36);
    if (u.avatar) {
      return `<img src="${this._escAttr(u.avatar)}" alt="" class="avatar" style="width:${sz}px;height:${sz}px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="avatar-initials" style="width:${sz}px;height:${sz}px;font-size:${fs}px;display:none">${this._getInitials(u.name)}</div>`;
    }
    return `<div class="avatar-initials" style="width:${sz}px;height:${sz}px;font-size:${fs}px">${this._getInitials(u.name)}</div>`;
  }

  _filtered() {
    let users = [...this._users];
    if (this._typeFilter !== 'all') {
      users = users.filter(u => u.type === this._typeFilter);
    }
    if (this._companyFilter !== 'all') {
      users = users.filter(u => (u.companies || []).some(c => c.name === this._companyFilter));
    }
    if (this._search) {
      const q = this._search.toLowerCase();
      users = users.filter(u => {
        const ov = this._getUserOverrides(u.id);
        return (u.name || '').toLowerCase().includes(q) ||
          (u.title || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.slackHandle || '').toLowerCase().includes(q) ||
          (u.githubHandle || '').toLowerCase().includes(q) ||
          this._getCurrentCompany(u).toLowerCase().includes(q) ||
          (u.alias || ov.alias || '').toLowerCase().includes(q) ||
          (u.nickname || ov.nickname || '').toLowerCase().includes(q);
      });
    }
    return users;
  }

  _renderCompactRows(users) {
    if (!users.length) return '<cc-empty-state message="No users found" icon="👥" animation="none"></cc-empty-state>';
    const rows = users.map(u => {
      const company = this._getCurrentCompany(u);
      return `<div class="user-compact-row" data-action="open" data-id="${this._escAttr(u.id)}">
        <div class="user-compact-avatar">${this._avatarHtml(u, 28)}</div>
        <div class="user-compact-name">${this._esc(u.name)}</div>
        <div class="user-compact-company">${this._esc(company)}</div>
        <div class="user-compact-email">${u.email ? `${this._brandIcon('email',12)} ${this._esc(u.email)}` : ''}</div>
        <div class="user-compact-socials">${this._socialIconsHtml(u, true)}</div>
        <div class="user-compact-type">${this._getTypeBadge(u.type)}</div>
      </div>`;
    }).join('');
    return `<div class="user-list-compact">
      <div class="user-compact-header">
        <div class="user-compact-avatar"></div>
        <div class="user-compact-name">Name</div>
        <div class="user-compact-company">Company</div>
        <div class="user-compact-email">Email</div>
        <div class="user-compact-type">Type</div>
      </div>
      ${rows}
    </div>`;
  }

  _renderCardGrid(users) {
    if (!users.length) return '<cc-empty-state message="No users found" icon="👥" animation="none"></cc-empty-state>';
    return `<div class="user-grid">${users.map(u => {
      const company = this._getCurrentCompany(u);
      const { pct } = this._profileCompleteness(u);
      return `<div class="card user-card" data-action="open" data-id="${this._escAttr(u.id)}">
        <div class="user-card-top">
          <div class="user-avatar">${this._avatarHtml(u, 44)}</div>
          <div class="user-card-info">
            <div class="user-card-name">${this._esc(u.name)}</div>
            <div class="user-card-role">${this._esc(u.title || '')}</div>
          </div>
          ${this._getTypeBadge(u.type)}
        </div>
        <div class="user-card-meta">
          ${company ? `<span class="user-meta-tag"><i data-lucide="building-2" style="width:12px;height:12px"></i> ${this._esc(company)}</span>` : ''}
        </div>
        <div class="user-card-links">
          ${u.slackHandle ? `<a href="https://lastrev.slack.com/team/${this._esc(u.slackId || '')}" target="_blank" rel="noopener" style="text-decoration:none"><span class="badge badge-icon">${this._brandIcon('slack',12)} @${this._esc(u.slackHandle)}</span></a>` : ''}
          ${u.githubHandle ? `<a href="https://github.com/${this._esc(u.githubHandle)}" target="_blank" rel="noopener" style="text-decoration:none"><span class="badge badge-icon">${this._brandIcon('github',12)} ${this._esc(u.githubHandle)}</span></a>` : ''}
          ${u.email ? `<a href="mailto:${this._esc(u.email)}" style="text-decoration:none"><span class="badge badge-icon">${this._brandIcon('email',12)} ${this._esc(u.email)}</span></a>` : ''}
        </div>
        ${this._socialIconsHtml(u)}
        ${this._profileBarHtml(pct)}
        ${(u.lastResearchedAt || u.updatedAt) ? `<div class="user-card-updated"><i data-lucide="clock" style="width:11px;height:11px"></i> Updated ${this._friendlyAgo(u.lastResearchedAt || u.updatedAt)}</div>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  _render() {
    const users = this._filtered();
    const companies = this._getCompanies();
    const expandedUser = this._expandedId ? this._users.find(u => u.id === this._expandedId) : null;

    const counts = { all: this._users.length, internal: 0, client: 0, partner: 0, other: 0 };
    this._users.forEach(u => { if (counts[u.type] !== undefined) counts[u.type]++; });

    const typeItems = ['all', 'internal', 'client', 'partner', 'other'].map(t => ({
      value: t, label: t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1), count: counts[t]
    }));

    const companyItems = [{ value: 'all', label: 'All Companies' }, ...companies.map(c => ({ value: c, label: c }))];

    const isCards = this._view === 'cards';
    const viewToggle = `<cc-view-toggle app="cc-users" default="cards"></cc-view-toggle>`;

    const contentHtml = (this._view === 'cards') ? this._renderCardGrid(users) : this._renderCompactRows(users);

    // Pending matches queue
    const pendingMatches = this._getPendingFiltered();
    const pendingHtml = pendingMatches.length ? `
      <div class="panel" style="margin-bottom:16px;border:1px solid rgba(245,158,11,0.3)">
        <div class="panel-header">🔍 Pending Social Matches <span class="badge">${pendingMatches.length}</span></div>
        <div class="scrollable-body" style="max-height:300px">
          ${pendingMatches.map((p, i) => {
            const user = this._users.find(u => u.id === p.userId);
            const slackImg = user?.avatar || '';
            const matchImg = p.match.profileImage || '';
            const platformIcons = {linkedin:'🔗',twitter:'𝕏',github:'🐙',facebook:'f',instagram:'📷',youtube:'▶️'};
            const scoreClass = p.score >= 80 ? 'match-score-high' : p.score >= 60 ? 'match-score-mid' : 'match-score-low';
            return `<div class="entity-row">
              <div class="flex gap-2 align-center">
                ${slackImg ? `<img src="${this._escAttr(slackImg)}" class="avatar" style="width:36px;height:36px">` : `<div class="user-avatar" style="width:36px;height:36px;font-size:13px">${this._getInitials(p.userName)}</div>`}
                <span style="font-size:18px">↔</span>
                ${matchImg ? `<img src="${this._escAttr(matchImg)}" class="avatar" style="width:36px;height:36px">` : `<div class="avatar-initials" style="width:36px;height:36px;font-size:14px">${platformIcons[p.match.platform] || '?'}</div>`}
              </div>
              <div class="entity-body">
                <div class="person-name">${this._esc(p.userName)}</div>
                <div class="entity-meta">${platformIcons[p.match.platform] || ''} ${this._esc(p.match.platform)} — <a href="${this._escAttr(p.match.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${this._esc(p.match.handle || p.match.profileName || '')}</a></div>
                ${p.match.profileTitle ? `<div class="entity-meta">${this._esc(p.match.profileTitle)}${p.match.profileCompany ? ' at ' + this._esc(p.match.profileCompany) : ''}</div>` : ''}
              </div>
              <div class="entity-actions">
                <span class="badge ${scoreClass}">${p.score}%</span>
                <button class="btn btn-sm btn-icon btn-approve" data-action="approve" data-idx="${i}" title="Approve match"><i data-lucide="check" style="width:14px;height:14px"></i></button>
                <button class="btn btn-sm btn-icon btn-reject" data-action="reject" data-idx="${i}" title="Reject match"><i data-lucide="x" style="width:14px;height:14px"></i></button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>` : '';

    // Modal
    let modalHtml = '';
    if (expandedUser) {
      const msgs = this._getUserSlack(expandedUser);
      const prs = this._getUserPRs(expandedUser);

      const companiesHtml = (expandedUser.companies || []).map(c =>
        `<div class="company-row${!c.current ? ' past' : ''}">
          <i data-lucide="building-2" style="width:14px;height:14px;color:var(--accent)"></i>
          <span style="font-size:13px">${this._esc(c.name)}${c.role ? ' — ' + this._esc(c.role) : ''}</span>
          ${c.current ? '<span class="badge" style="background:rgba(16,185,129,.15);color:var(--green);font-size:9px">Current</span>' : '<span class="badge" style="font-size:9px">Past</span>'}
        </div>`
      ).join('');

      const slackList = msgs.length ? msgs.map(m => `<li class="slack-item">
        <div class="slack-item-header">
          <span class="slack-item-channel">#${m.channel || 'dm'}</span>
          <span class="slack-item-time">${this._timeAgo(m.ts)}</span>
        </div>
        <div class="slack-item-text">${this._formatMsg(m.text, 200)}</div>
      </li>`).join('') : '<li class="slack-item" style="color:var(--muted);font-size:13px">No recent messages</li>';

      const prList = prs.length ? prs.map(p => {
        const urlParts = (p.url || '').match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);
        const prRepo = p.repo || (urlParts ? urlParts[1].split('/')[1] : '');
        const author = typeof p.author === 'object' ? (p.author?.login || '') : (p.author || '');
        return window.CCGitHubPR ? CCGitHubPR.render({ url: p.url, title: p.title, repo: prRepo, author, body: p.body }) : `<div>${this._esc(p.title)}</div>`;
      }).join('') : '<cc-empty-state message="No recent PRs" icon="🔀" animation="none"></cc-empty-state>';

      const tz = expandedUser.timezone || '';
      const localTime = tz ? new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }) : '';

      const userOverrides = this._getUserOverrides(expandedUser.id);
      const aliasVal = userOverrides.alias || expandedUser.alias || '';
      const nicknameVal = userOverrides.nickname || expandedUser.nickname || '';
      const myNotes = userOverrides.myNotes || '';
      const aliasDisplay = [aliasVal, nicknameVal].filter(Boolean).map(a => `"${this._esc(a)}"`).join(', ');

      const modalTab = this._modalTab || 'overview';

      const overviewContent = `
          <h3 class="section-heading">Companies</h3>
          ${companiesHtml}
          <div class="detail-meta" style="margin-top:16px">
            ${expandedUser.email ? `<div class="detail-item">${this._brandIcon('email',14)} <a href="mailto:${expandedUser.email}">${this._esc(expandedUser.email)}</a></div>` : ''}
            ${expandedUser.personalEmail && expandedUser.personalEmail !== expandedUser.email ? `<div class="detail-item">${this._brandIcon('email',14)} <a href="mailto:${expandedUser.personalEmail}" style="opacity:.6">${this._esc(expandedUser.personalEmail)} <span style="font-size:10px">(personal)</span></a></div>` : ''}
            ${expandedUser.phone ? `<div class="detail-item">${this._brandIcon('phone',14)} <a href="tel:${expandedUser.phone}">${this._esc(expandedUser.phone)}</a></div>` : ''}
            ${expandedUser.slackHandle ? `<div class="detail-item">${this._brandIcon('slack',14)} <a href="https://lastrev.slack.com/team/${this._esc(expandedUser.slackId || '')}" target="_blank" rel="noopener">@${this._esc(expandedUser.slackHandle)}</a></div>` : ''}
            ${expandedUser.githubHandle ? `<div class="detail-item">${this._brandIcon('github',14)} <a href="https://github.com/${expandedUser.githubHandle}" target="_blank" rel="noopener">${this._esc(expandedUser.githubHandle)}</a></div>` : ''}
            ${tz ? `<div class="detail-item">${this._brandIcon('clock',14)} ${tz.split('/').pop().replace(/_/g,' ')} (${localTime})</div>` : ''}
          </div>
          ${expandedUser.notes ? `<div class="notes-block">${this._esc(expandedUser.notes)}</div>` : ''}
          ${(expandedUser.tags || []).length ? `<div class="tags-row">${expandedUser.tags.map(t => `<span class="badge">${this._esc(t)}</span>`).join('')}</div>` : ''}
          <div class="field-group">
            <div class="field-item">
              <label class="field-label">Alias Name</label>
              <input type="text" value="${this._escAttr(aliasVal)}" placeholder="e.g. Max Techera"
                data-user-id="${this._escAttr(expandedUser.id)}" data-field="alias"
                class="input crm-field">
            </div>
            <div class="field-item">
              <label class="field-label">Nickname</label>
              <input type="text" value="${this._escAttr(nicknameVal)}" placeholder="e.g. Max"
                data-user-id="${this._escAttr(expandedUser.id)}" data-field="nickname"
                class="input crm-field">
            </div>
          </div>
          <div style="margin-top:12px">
            <label class="field-label">My Notes</label>
            <textarea rows="3" placeholder="Your private notes about this person..."
              data-user-id="${this._escAttr(expandedUser.id)}" data-field="myNotes"
              class="textarea-notes crm-field">${this._esc(myNotes)}</textarea>
          </div>
          ${this._socialDetailHtml(expandedUser)}`;

      const insightsContent = expandedUser.insights ? this._insightsHtml(expandedUser) : '<cc-empty-state message="No personality insights yet" icon="🧠" animation="none"></cc-empty-state>';

      const socialContent = this._socialTabHtml(expandedUser);

      const slackContent = `<h3 class="section-heading-lg">${this._brandIcon('slack',18)} Recent Slack Messages</h3>
          <ul style="list-style:none;padding:0;margin:0">${slackList}</ul>`;

      const githubContent = this._githubTabHtml(expandedUser, prList);

      const emailContent = '<cc-empty-state message="Email integration not connected" icon="📧" animation="none"></cc-empty-state>';

      modalHtml = `<cc-modal title="${this._escAttr(expandedUser.name)}" size="lg" open>
        <div class="user-detail">
          ${this._profileSummaryHtml(expandedUser)}
          <div class="user-detail-header" style="margin-top:16px">
            <div style="position:relative">${this._avatarHtml(expandedUser, 64)}</div>
            <div>
              <h2 style="margin:0;font-size:20px;color:var(--text)">${this._esc(expandedUser.name)} ${this._getTypeBadge(expandedUser.type)} <button class="btn btn-sm btn-icon" data-action="pdf" data-id="${this._escAttr(expandedUser.id)}" title="Download Profile PDF" style="margin-left:8px;vertical-align:middle"><i data-lucide="file-down" style="width:14px;height:14px"></i></button></h2>
              ${aliasDisplay ? `<div style="color:var(--accent);font-size:12px;margin-top:2px;font-style:italic">aka ${aliasDisplay}</div>` : ''}
              <div style="color:var(--muted);font-size:14px;margin-top:2px">${this._esc(expandedUser.title || '')}</div>
            </div>
          </div>
          <cc-tabs active="${modalTab}" no-url style="margin-top:12px">
            <cc-tab name="overview" label="Overview">
              ${overviewContent}
            </cc-tab>
            <cc-tab name="insights" label="Insights">
              ${insightsContent}
            </cc-tab>
            <cc-tab name="social" label="Social">
              ${socialContent}
            </cc-tab>
            <cc-tab name="slack" label="Slack">
              ${slackContent}
            </cc-tab>
            <cc-tab name="github" label="GitHub">
              ${githubContent}
            </cc-tab>
            <cc-tab name="email" label="Email">
              ${emailContent}
            </cc-tab>
          </cc-tabs>
        </div>
      </cc-modal>`;
    }

    this.innerHTML = `
      <cc-page-header icon="👥" title="Team Directory" description="Team members & contacts" count="${users.length}" count-label="people">
          ${viewToggle}
      </cc-page-header>
      <div class="filters" style="display:flex;gap:12px;align-items:center;">
        <cc-search placeholder="Search name, email, company, title..." value="${this._escAttr(this._search)}" input-style="flex:1;"></cc-search>
        <cc-filter-drawer title="Filters" ${this._typeFilter !== 'All' || this._companyFilter !== 'All' ? 'active' : ''}>
          <cc-pill-dropdown label="Type" items='${JSON.stringify(typeItems).replace(/'/g, "&#39;")}' value="${this._typeFilter}"></cc-pill-dropdown>
          <cc-pill-dropdown label="Company" items='${JSON.stringify(companyItems).replace(/'/g, "&#39;")}' value="${this._companyFilter}"></cc-pill-dropdown>
        </cc-filter-drawer>
      </div>
      ${pendingHtml}
      ${contentHtml}
      ${modalHtml}`;
    setTimeout(() => {
      window.refreshIcons && window.refreshIcons();
      // Delegated click handler for data-action buttons (XSS-safe)
      this.querySelectorAll('[data-action]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = el.dataset.action;
          const id = el.dataset.id;
          const handle = el.dataset.handle;
          if (action === 'open') this._openUser(id);
          else if (action === 'pdf') this._downloadPdf(id);
          else if (action === 'refresh') this._runFullRefresh(id);
          else if (action === 'fetch-social') this._fetchSocialFeeds(id);
          else if (action === 'fetch-repos') this._fetchGithubRepos(handle);
          else if (action === 'approve') this._approveMatch(parseInt(el.dataset.idx));
          else if (action === 'reject') this._rejectMatch(parseInt(el.dataset.idx));
        });
      });
      const viewToggle = this.querySelector('cc-view-toggle');
      if (viewToggle) viewToggle.addEventListener('cc-view-change', (e) => { this._view = e.detail.view === 'list' ? 'list' : 'cards'; this._render(); });
      const typeDd = this.querySelector('cc-pill-dropdown[label="Type"]');
      if (typeDd) typeDd.addEventListener('dropdown-change', (e) => this._setType(e.detail.value));
      const companyDd = this.querySelector('cc-pill-dropdown[label="Company"]');
      if (companyDd) companyDd.addEventListener('dropdown-change', (e) => this._setCompany(e.detail.value));
      this.querySelectorAll('.crm-field').forEach(el => {
        el.addEventListener('change', () => {
          this._saveUserField(el.dataset.userId, el.dataset.field, el.value);
        });
      });
      const modal = this.querySelector('cc-modal');
      if (modal) {
        modal.addEventListener('modal-close', () => this._closeUser(), { once: true });
        const tabs = modal.querySelector('cc-tabs');
        if (tabs) {
          tabs.addEventListener('tab-change', (e) => {
            this._modalTab = e.detail.tab;
            if (e.detail.tab === 'social' && this._expandedId) {
              this._loadSocialFeed(this._expandedId);
            }
            if (e.detail.tab === 'github' && this._expandedId) {
              const u = this._users.find(u => u.id === this._expandedId);
              if (u?.githubHandle) this._loadGithubRepos(u.githubHandle);
            }
          });
        }
      }
    }, 0);
  }
}
customElements.define('cc-users', CcUsers);
