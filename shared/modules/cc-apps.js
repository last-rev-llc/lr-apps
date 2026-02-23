// ─── App Prompt Viewer — Shows the detailed recreation prompt for a single app ─────────
class CcApps extends HTMLElement {
  connectedCallback() {
    this._appId = this.getAttribute('app') || '';
    this._copied = false;
    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const sb = window.supabase;
    if (!sb) { this.innerHTML = '<p style="color:var(--text-muted);padding:2rem;">Supabase not connected.</p>'; return; }
    if (!this._appId) { this.innerHTML = '<p style="color:var(--text-muted);padding:2rem;">No app specified. Add <code>app="app-id"</code> attribute.</p>'; return; }
    try {
      const rows = await sb.select('apps', { filters: { id: `eq.${this._appId}` }, limit: 1 });
      this._app = rows && rows[0] ? rows[0] : null;
      this._render();
    } catch(e) {
      console.error('Failed to load app:', e);
      this.innerHTML = '<p style="color:var(--text-muted);padding:2rem;">Failed to load app prompt.</p>';
    }
  }

  async _copy() {
    if (!this._app || !this._app.prompt) return;
    try {
      await navigator.clipboard.writeText(this._app.prompt);
    } catch(e) {
      const ta = document.createElement('textarea');
      ta.value = this._app.prompt;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    this._copied = true;
    this._render();
    setTimeout(() => { this._copied = false; this._render(); }, 2000);
  }

  async _download() {
    if (!this._app || !this._app.prompt) return;
    const blob = new Blob([this._app.prompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this._appId}-prompt.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _renderMarkdown(text) {
    // Lightweight markdown: headers, bold, italic, code blocks, inline code, lists, links
    let html = this._esc(text);
    // Code blocks first
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="cc-apps-codeblock"><code>$2</code></pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="cc-apps-inline-code">$1</code>');
    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    // Paragraphs (double newlines)
    html = html.replace(/\n\n/g, '</p><p>');
    // Single newlines in non-block context
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  _render() {
    const app = this._app;
    if (!app) {
      this.innerHTML = `
        <div class="cc-apps-empty">
          <div class="cc-apps-empty-icon">📝</div>
          <h2>No prompt yet</h2>
          <p>This app doesn't have a recreation prompt in the database yet.</p>
          <p style="color:var(--text-muted);font-size:0.85rem;">Expected app ID: <code>${this._esc(this._appId)}</code></p>
        </div>`;
      return;
    }

    const hasPrompt = !!(app.prompt && app.prompt.trim());
    const copyLabel = this._copied ? '✅ Copied!' : '📋 Copy Prompt';

    this.innerHTML = `
      <div class="cc-apps-viewer">
        <div class="cc-apps-header">
          <div class="cc-apps-title-row">
            <span class="cc-apps-icon">${app.icon || '📦'}</span>
            <div>
              <h1 class="cc-apps-title">${this._esc(app.title || this._appId)}</h1>
              ${app.description ? `<p class="cc-apps-desc">${this._esc(app.description)}</p>` : ''}
            </div>
          </div>
          ${hasPrompt ? `
          <div class="cc-apps-actions">
            <button class="cc-apps-btn cc-apps-btn-copy" data-action="copy">${copyLabel}</button>
            <button class="cc-apps-btn cc-apps-btn-dl" data-action="download">⬇ Download .md</button>
          </div>` : ''}
        </div>

        ${hasPrompt ? `
          <div class="cc-apps-prompt-body">
            ${this._renderMarkdown(app.prompt)}
          </div>
        ` : `
          <div class="cc-apps-empty">
            <div class="cc-apps-empty-icon">📝</div>
            <h2>Prompt not written yet</h2>
            <p>A detailed recreation prompt for this app hasn't been created yet. It will be generated during the next nightly review.</p>
          </div>
        `}
      </div>`;

    // Bind buttons
    this.querySelectorAll('[data-action="copy"]').forEach(b => b.onclick = () => this._copy());
    this.querySelectorAll('[data-action="download"]').forEach(b => b.onclick = () => this._download());
  }
}

if (!customElements.get('cc-apps')) customElements.define('cc-apps', CcApps);

// ─── Styles ─────────────────────────────────────────────────────────
(() => {
  if (document.getElementById('cc-apps-styles')) return;
  const s = document.createElement('style');
  s.id = 'cc-apps-styles';
  s.textContent = `
    .cc-apps-viewer {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .cc-apps-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
      flex-wrap: wrap;
    }
    .cc-apps-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .cc-apps-icon {
      font-size: 2rem;
    }
    .cc-apps-title {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text, #fff);
    }
    .cc-apps-desc {
      margin: 0.25rem 0 0;
      color: var(--text-muted, rgba(255,255,255,0.6));
      font-size: 0.9rem;
    }
    .cc-apps-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }
    .cc-apps-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, rgba(255,255,255,0.15));
      border-radius: 8px;
      background: var(--glass-bg, rgba(255,255,255,0.06));
      color: var(--text, #fff);
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .cc-apps-btn:hover {
      background: rgba(255,255,255,0.12);
    }
    .cc-apps-btn-copy {
      min-width: 130px;
    }
    .cc-apps-prompt-body {
      background: var(--glass-bg, rgba(255,255,255,0.04));
      border: 1px solid var(--border, rgba(255,255,255,0.08));
      border-radius: 12px;
      padding: 2rem;
      line-height: 1.7;
      color: var(--text, rgba(255,255,255,0.9));
      font-size: 0.95rem;
    }
    .cc-apps-prompt-body h1 { font-size: 1.4rem; margin: 1.5rem 0 0.75rem; color: var(--text, #fff); }
    .cc-apps-prompt-body h2 { font-size: 1.2rem; margin: 1.5rem 0 0.5rem; color: var(--text, #fff); }
    .cc-apps-prompt-body h3 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; color: var(--text, #fff); }
    .cc-apps-prompt-body h4 { font-size: 0.95rem; margin: 1rem 0 0.5rem; color: var(--text, #fff); }
    .cc-apps-prompt-body ul { padding-left: 1.5rem; margin: 0.5rem 0; }
    .cc-apps-prompt-body li { margin: 0.25rem 0; }
    .cc-apps-prompt-body hr { border: none; border-top: 1px solid var(--border, rgba(255,255,255,0.1)); margin: 1.5rem 0; }
    .cc-apps-prompt-body p { margin: 0.5rem 0; }
    .cc-apps-prompt-body strong { color: var(--text, #fff); }
    .cc-apps-prompt-body a { color: var(--accent, #60a5fa); text-decoration: none; }
    .cc-apps-prompt-body a:hover { text-decoration: underline; }
    .cc-apps-codeblock {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0.75rem 0;
    }
    .cc-apps-codeblock code {
      color: var(--text, rgba(255,255,255,0.85));
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .cc-apps-inline-code {
      background: rgba(255,255,255,0.08);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.88em;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .cc-apps-empty {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted, rgba(255,255,255,0.5));
    }
    .cc-apps-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .cc-apps-empty h2 { color: var(--text, #fff); margin: 0 0 0.5rem; }
    @media (max-width: 600px) {
      .cc-apps-viewer { padding: 1rem; }
      .cc-apps-header { flex-direction: column; }
      .cc-apps-prompt-body { padding: 1rem; }
    }
  `;
  document.head.appendChild(s);
})();
