/* <cc-user-pill> — Compact avatar + name pill
   Shows a small avatar (with initials fallback) and a name label.

   Attributes:
     name       — Display name (required unless user-id resolves)
     avatar     — Avatar image URL (optional; falls back to initials)
     size       — sm (16px), md (20px, default), lg (28px) or number in px
     href       — Optional link URL (wraps pill in <a>)
     user-id    — Slack user ID; auto-resolves name/avatar from users cache
     subtitle   — Tooltip subtitle (e.g. title @ company)
     clickable  — If present, pill emits 'pill-click' event with { userId, name }
     variant    — 'ghost' (no background), 'accent' (accent border)

   CSS classes from theme.css:
     .user-pill, .user-pill-sm, .user-pill-lg, .user-pill-ghost, .user-pill-accent
     .user-pill-avatar, .user-pill-avatar-img, .user-pill-initials, .user-pill-name

   Static helpers:
     CCUserPill.setUsers(arr|map)     — cache users for ID-based lookup
     CCUserPill.resolve(id)           — get cached user object by ID
     CCUserPill.html(opts)            — returns pill HTML string for template literals
     CCUserPill.initials(name)        — returns initials string
     CCUserPill.mentionHtml(id,name)  — inline mention pill (for cc-slack-msg)
     CCUserPill.ready                 — Promise that resolves when users are loaded
*/
(function () {
  let _usersById = {};
  let _usersByName = {};
  let _usersByGithub = {};
  let _loaded = false;
  let _readyResolve;
  const _readyPromise = new Promise(r => { _readyResolve = r; });

  function setUsers(arr) {
    if (Array.isArray(arr)) {
      arr.forEach(u => {
        if (u.slackId) _usersById[u.slackId] = u;
        if (u.id) _usersById[u.id] = u;
        if (u.name) _usersByName[u.name.toLowerCase()] = u;
        if (u.githubHandle) _usersByGithub[u.githubHandle.toLowerCase()] = u;
      });
    } else if (arr && typeof arr === 'object') {
      Object.assign(_usersById, arr);
    }
    _loaded = true;
    _readyResolve();
  }

  function resolve(userId) { return _usersById[userId] || null; }
  function resolveByName(name) { return _usersByName[(name || '').toLowerCase()] || null; }
  function resolveByGithub(handle) { return _usersByGithub[(handle || '').toLowerCase()] || null; }

  // Auto-fetch users.json if not yet loaded
  let _fetchPromise = null;
  function ensureUsers() {
    if (_loaded) return _readyPromise;
    if (_fetchPromise) return _fetchPromise;
    _fetchPromise = (async () => {
      try {
        // Try multiple common paths
        for (const path of ['/data/users.json', '../command-center/data/users.json']) {
          try {
            const r = await fetch(path);
            if (r.ok) { setUsers(await r.json()); return; }
          } catch {}
        }
      } catch {}
      _loaded = true;
      _readyResolve();
    })();
    return _fetchPromise;
  }

  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name[0].toUpperCase();
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function sizeToPixels(size) {
    if (size === 'sm') return 16;
    if (size === 'lg') return 28;
    if (size === 'md' || !size) return 20;
    const n = parseInt(size);
    return isNaN(n) ? 20 : n;
  }

  function sizeClass(size) {
    if (size === 'sm') return ' user-pill-sm';
    if (size === 'lg') return ' user-pill-lg';
    return '';
  }

  function pillHTML(opts = {}) {
    let { name, avatar, size, href, userId, subtitle, clickable, variant, githubHandle } = opts;
    const px = sizeToPixels(size);

    // Resolve from cache
    if (userId) {
      const u = resolve(userId);
      if (u) { name = name || u.name; avatar = avatar || u.avatar; subtitle = subtitle || buildSubtitle(u); }
    }
    if (githubHandle && !name) {
      const u = resolveByGithub(githubHandle);
      if (u) { name = name || u.name; avatar = avatar || u.avatar; userId = userId || u.slackId; subtitle = subtitle || buildSubtitle(u); }
    }
    if (!avatar && name) {
      const u = resolveByName(name);
      if (u) { avatar = u.avatar; userId = userId || u.slackId; subtitle = subtitle || buildSubtitle(u); }
    }
    name = name || 'Unknown';

    const cls = 'user-pill' + sizeClass(size)
      + (variant === 'ghost' ? ' user-pill-ghost' : '')
      + (variant === 'accent' ? ' user-pill-accent' : '')
      + (clickable ? ' user-pill-clickable' : '');

    const tooltipAttr = subtitle ? ` title="${esc(subtitle)}"` : '';
    const dataAttr = userId ? ` data-user-id="${esc(userId)}"` : '';

    const avatarPart = avatar
      ? `<img class="user-pill-avatar-img" src="${esc(avatar)}" alt="" width="${px}" height="${px}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<span class="user-pill-initials" style="display:none">${initials(name)}</span>`
      : `<span class="user-pill-initials">${initials(name)}</span>`;

    const inner = `<span class="user-pill-avatar">${avatarPart}</span><span class="user-pill-name">${esc(name)}</span>`;

    if (href) {
      return `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener"${tooltipAttr}${dataAttr}>${inner}</a>`;
    }
    return `<span class="${cls}"${tooltipAttr}${dataAttr}>${inner}</span>`;
  }

  // Small inline mention (for inside message text — no border, subtle bg)
  function mentionHtml(userId, fallbackName) {
    const u = resolve(userId);
    const name = u ? u.name : (fallbackName || userId);
    const avatar = u ? u.avatar : null;
    const px = 16;
    const avatarPart = avatar
      ? `<img class="user-pill-avatar-img" src="${esc(avatar)}" alt="" width="${px}" height="${px}" onerror="this.parentElement.innerHTML=''">`
      : '';
    return `<span class="user-pill user-pill-mention" data-user-id="${esc(userId)}">${avatarPart ? `<span class="user-pill-avatar">${avatarPart}</span>` : ''}@${esc(name)}</span>`;
  }

  function buildSubtitle(u) {
    const parts = [];
    if (u.title) parts.push(u.title);
    const company = u.companies?.find(c => c.current)?.name || u.company;
    if (company) parts.push(company);
    return parts.join(' · ');
  }

  window.CCUserPill = {
    setUsers,
    resolve,
    resolveByName,
    resolveByGithub,
    html: pillHTML,
    mentionHtml,
    initials,
    ensureUsers,
    ready: _readyPromise,
  };

  class CcUserPill extends HTMLElement {
    static get observedAttributes() { return ['name', 'avatar', 'size', 'href', 'user-id', 'subtitle', 'variant']; }

    connectedCallback() {
      ensureUsers().then(() => this._render());
      this._render(); // render immediately with what we have
    }

    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const clickable = this.hasAttribute('clickable');
      this.innerHTML = pillHTML({
        name: this.getAttribute('name'),
        avatar: this.getAttribute('avatar'),
        size: this.getAttribute('size') || 'md',
        href: this.getAttribute('href'),
        userId: this.getAttribute('user-id'),
        subtitle: this.getAttribute('subtitle'),
        clickable,
        variant: this.getAttribute('variant'),
      });
      if (clickable) {
        this.querySelector('.user-pill')?.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('pill-click', {
            bubbles: true,
            detail: { userId: this.getAttribute('user-id'), name: this.getAttribute('name') }
          }));
        });
      }
    }
  }

  customElements.define('cc-user-pill', CcUserPill);
})();
