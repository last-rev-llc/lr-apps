/* <cc-slack-msg> — Shared Slack message renderer
   Properly formats Slack mrkdwn: @mentions, #channels, links, bold, italic, code, blockquotes.
   Resolves user IDs to names via window._ccSlackUsers lookup.

   Usage as element:
     <cc-slack-msg text="Hey <@UH1NCNA81> check <#C123|general>" max="200"></cc-slack-msg>

   Usage as JS helper (for template literals):
     CCSlack.format(text, maxLen)     — returns formatted HTML string
     CCSlack.plain(text, maxLen)      — returns plain text (stripped)
     CCSlack.setUsers(usersMap)       — set {userId: name} lookup
     CCSlack.resolveUser(id)          — resolve a single user ID
*/
(function() {
  // User lookup: { 'UH1NCNA81': 'Adam Harris', ... }
  const _users = {};

  function resolveUser(id) {
    if (_users[id]) return _users[id];
    // Check window-level users data (loaded by cc-slack module)
    if (window._ccSlackUsers) {
      const u = window._ccSlackUsers[id];
      if (u) return u;
    }
    return null;
  }

  function format(text, maxLen) {
    if (!text) return '';
    let s = text;

    // Slack user mentions: <@UH1NCNA81> or <@UH1NCNA81|Adam Harris>
    s = s.replace(/<@([A-Z0-9]+)\|([^>]+)>/g, (_, id, name) => {
      if (window.CCUserPill) return CCUserPill.mentionHtml(id, name);
      return `<span class="slack-mention">@${esc(name)}</span>`;
    });
    s = s.replace(/<@([A-Z0-9]+)>/g, (_, id) => {
      const name = resolveUser(id) || id;
      if (window.CCUserPill) return CCUserPill.mentionHtml(id, name);
      return `<span class="slack-mention">@${esc(name)}</span>`;
    });

    // Slack channel refs: <#C123|general>
    s = s.replace(/<#[A-Z0-9]+\|([^>]+)>/g, (_, name) => {
      return `<span class="slack-channel-ref">#${esc(name)}</span>`;
    });
    s = s.replace(/<#([A-Z0-9]+)>/g, (_, id) => {
      return `<span class="slack-channel-ref">#${esc(id)}</span>`;
    });

    // Slack special commands: <!here>, <!channel>, <!everyone>
    s = s.replace(/<!(here|channel|everyone)>/g, (_, cmd) => {
      return `<span class="slack-mention">@${cmd}</span>`;
    });

    // Links: <https://url|Label> or <https://url>
    s = s.replace(/<(https?:[^|>]+)\|([^>]+)>/g, (_, url, label) => {
      return `<a href="${esc(url)}" target="_blank" rel="noopener" class="slack-link">${esc(label)}</a>`;
    });
    s = s.replace(/<(https?:[^>]+)>/g, (_, url) => {
      const short = url.length > 50 ? url.slice(0, 47) + '...' : url;
      return `<a href="${esc(url)}" target="_blank" rel="noopener" class="slack-link">${esc(short)}</a>`;
    });

    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code class="slack-code">$1</code>');

    // Bold: *text*
    s = s.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

    // Italic: _text_
    s = s.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em>$1</em>');

    // Strikethrough: ~text~
    s = s.replace(/~([^~]+)~/g, '<del>$1</del>');

    // Blockquote: > at start of line
    s = s.replace(/^&gt;\s?(.+)$/gm, '<span class="slack-quote">$1</span>');

    // Truncate
    if (maxLen && s.length > maxLen) {
      // Truncate on the plain text length, not HTML
      const plain = s.replace(/<[^>]+>/g, '');
      if (plain.length > maxLen) {
        s = s.substring(0, maxLen + (s.length - plain.length)) + '…';
      }
    }

    return s;
  }

  function plain(text, maxLen) {
    if (!text) return '';
    let s = text;
    s = s.replace(/<@([A-Z0-9]+)\|([^>]+)>/g, '@$2');
    s = s.replace(/<@([A-Z0-9]+)>/g, (_, id) => '@' + (resolveUser(id) || 'user'));
    s = s.replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1');
    s = s.replace(/<#([A-Z0-9]+)>/g, '#channel');
    s = s.replace(/<!(here|channel|everyone)>/g, '@$1');
    s = s.replace(/<(https?:[^|>]+)\|([^>]+)>/g, '$2');
    s = s.replace(/<(https?:[^>]+)>/g, '$1');
    if (maxLen && s.length > maxLen) s = s.substring(0, maxLen) + '…';
    return s;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  // Public API
  window.CCSlack = {
    format,
    plain,
    setUsers(map) { Object.assign(_users, map); },
    resolveUser,
  };

  class CcSlackMsg extends HTMLElement {
    static get observedAttributes() { return ['text', 'max']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }
    _render() {
      const text = this.getAttribute('text') || '';
      const max = parseInt(this.getAttribute('max')) || 0;
      this.innerHTML = format(text, max);
    }
  }

  customElements.define('cc-slack-msg', CcSlackMsg);
})();
