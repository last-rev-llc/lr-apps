/**
 * <cc-docs> — Developer documentation renderer with syntax highlighting,
 * copy-to-clipboard, auto-generated TOC, and callout support.
 *
 * API:
 *   <cc-docs src="docs.json"></cc-docs>           — Load from JSON
 *   <cc-docs>{ sections: [...] }</cc-docs>        — Inline JSON
 *   <cc-docs app="my-app" title="My App" icon="🚀">
 *     <cc-docs-section title="Getting Started">
 *       markdown-ish content...
 *     </cc-docs-section>
 *   </cc-docs>
 *
 * JSON section format:
 *   { title, id?, icon?, content?, subsections?: [{ title, content }],
 *     attributes?: [{ name, type, default, description }],
 *     code?: { lang, content }, codeBlocks?: [{ lang, title?, content }] }
 *
 * Content supports:
 *   ```lang\n...\n```  — syntax-highlighted code blocks
 *   | col | col |      — tables
 *   > **Note:** ...    — callouts (Note, Warning, Tip, Info)
 *   # / ## / ###       — headings
 *   - list items
 *   **bold** *italic* `code`
 */
(function () {
  if (customElements.get('cc-docs')) return;

  /* ── Lightweight syntax highlighter ── */
  const HL = {
    rules: {
      js: [
        [/(\/\/.*)/g, 'cmt'],
        [/(\/\*[\s\S]*?\*\/)/g, 'cmt'],
        [/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, 'str'],
        [/\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|default|new|this|async|await|try|catch|throw|typeof|instanceof|in|of|switch|case|break|continue|do|yield|super|static|get|set)\b/g, 'kw'],
        [/\b(true|false|null|undefined|NaN|Infinity)\b/g, 'lit'],
        [/\b(\d+\.?\d*)\b/g, 'num'],
        [/\b(document|window|console|Array|Object|String|Number|Boolean|Promise|Map|Set|JSON|Math|Date|Error|RegExp|Symbol)\b/g, 'bi'],
        [/([\{\}\[\]\(\)])/g, 'punc'],
      ],
      html: [
        [/(&lt;\/?[\w-]+)/g, 'tag'],
        [/([\w-]+)=/g, 'attr'],
        [/("(?:[^"\\]|\\.)*")/g, 'str'],
        [/(&lt;!--[\s\S]*?--&gt;)/g, 'cmt'],
      ],
      css: [
        [/(\/\*[\s\S]*?\*\/)/g, 'cmt'],
        [/([.#][\w-]+)/g, 'sel'],
        [/([\w-]+)\s*:/g, 'prop'],
        [/:\s*([^;{]+)/g, 'val'],
        [/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, 'str'],
      ],
      sql: [
        [/(--.*)/g, 'cmt'],
        [/('(?:[^'\\]|\\.)*')/g, 'str'],
        [/\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|DISTINCT|UNION|ALL|EXISTS|IN|BETWEEN|LIKE|IS|CASE|WHEN|THEN|ELSE|END|PRIMARY|KEY|REFERENCES|FOREIGN|DEFAULT|UNIQUE|CHECK|CASCADE|TEXT|INTEGER|BOOLEAN|JSONB|TIMESTAMPTZ|SERIAL|BIGINT|VARCHAR)\b/gi, 'kw'],
        [/\b(\d+\.?\d*)\b/g, 'num'],
      ],
      json: [
        [/("(?:[^"\\]|\\.)*")\s*:/g, 'prop'],
        [/:\s*("(?:[^"\\]|\\.)*")/g, 'str'],
        [/\b(true|false|null)\b/g, 'lit'],
        [/\b(\d+\.?\d*)\b/g, 'num'],
      ],
      bash: [
        [/(#.*)/g, 'cmt'],
        [/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, 'str'],
        [/\b(sudo|cd|ls|mkdir|rm|cp|mv|cat|echo|grep|find|chmod|chown|curl|wget|npm|npx|node|git|docker)\b/g, 'kw'],
        [/(\$[\w]+)/g, 'bi'],
      ],
    },
    highlight(code, lang) {
      let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const l = lang?.toLowerCase().replace('javascript', 'js').replace('typescript', 'js').replace('sh', 'bash').replace('shell', 'bash') || '';
      const rules = this.rules[l] || this.rules[l.split(/\s/)[0]];
      if (!rules) return escaped;
      // Apply rules with placeholder approach to avoid double-matching
      let tokens = [];
      let idx = 0;
      for (const [re, cls] of rules) {
        re.lastIndex = 0;
        escaped = escaped.replace(re, (m, g1) => {
          const tok = `\x00${idx}\x00`;
          tokens.push([tok, `<span class="hl-${cls}">${g1}</span>${m.slice(g1.length)}`]);
          idx++;
          return tok;
        });
      }
      for (const [tok, repl] of tokens) {
        escaped = escaped.split(tok).join(repl);
      }
      return escaped;
    }
  };

  /* ── Markdown-ish content parser ── */
  function parseContent(raw) {
    if (!raw) return '';
    let html = '';
    const lines = raw.split('\n');
    let i = 0;
    let inList = false;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inList) { html += '</ul>'; inList = false; }
        const lang = line.trim().slice(3).trim();
        let code = '';
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          code += (code ? '\n' : '') + lines[i];
          i++;
        }
        i++; // skip closing ```
        html += codeBlock(code, lang);
        continue;
      }

      // Tables
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (inList) { html += '</ul>'; inList = false; }
        let tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        html += parseTable(tableLines);
        continue;
      }

      // Callouts: > **Note:** ... or > **Warning:** ...
      if (/^>\s*\*\*(Note|Warning|Tip|Info|Caution)\b/.test(line.trim())) {
        if (inList) { html += '</ul>'; inList = false; }
        const match = line.trim().match(/^>\s*\*\*(Note|Warning|Tip|Info|Caution):?\*\*:?\s*(.*)/i);
        if (match) {
          const type = match[1].toLowerCase();
          let body = match[2];
          i++;
          while (i < lines.length && lines[i].trim().startsWith('>')) {
            body += ' ' + lines[i].trim().slice(1).trim();
            i++;
          }
          const icons = { note: 'ℹ️', warning: '⚠️', tip: '💡', info: 'ℹ️', caution: '🔴' };
          html += `<div class="cc-docs-callout cc-docs-callout-${type}"><span class="cc-docs-callout-icon">${icons[type] || 'ℹ️'}</span><div><strong>${match[1]}</strong> ${inlineFormat(body)}</div></div>`;
          continue;
        }
      }

      // Headings
      const hMatch = line.match(/^(#{1,4})\s+(.+)/);
      if (hMatch) {
        if (inList) { html += '</ul>'; inList = false; }
        const level = hMatch[1].length + 1; // offset by 1 since section title is h2
        html += `<h${level}>${inlineFormat(hMatch[2])}</h${level}>`;
        i++;
        continue;
      }

      // List items
      if (/^\s*[-*]\s+/.test(line)) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${inlineFormat(line.replace(/^\s*[-*]\s+/, ''))}</li>`;
        i++;
        continue;
      }

      // Numbered list
      if (/^\s*\d+\.\s+/.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        // Collect all numbered items
        let olHtml = '<ol>';
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          olHtml += `<li>${inlineFormat(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`;
          i++;
        }
        olHtml += '</ol>';
        html += olHtml;
        continue;
      }

      // Empty line
      if (!line.trim()) {
        if (inList) { html += '</ul>'; inList = false; }
        i++;
        continue;
      }

      // Paragraph
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${inlineFormat(line)}</p>`;
      i++;
    }
    if (inList) html += '</ul>';
    return html;
  }

  function inlineFormat(text) {
    return text
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  }

  function codeBlock(code, lang) {
    const highlighted = HL.highlight(code, lang);
    const langLabel = lang || 'text';
    return `<div class="cc-docs-code"><div class="cc-docs-code-header"><span class="cc-docs-code-lang">${langLabel}</span><button class="cc-docs-copy" onclick="this.ccDocsCopy()" title="Copy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button></div><pre><code>${highlighted}</code></pre></div>`;
  }

  function parseTable(lines) {
    if (lines.length < 2) return '';
    const parseRow = l => l.split('|').slice(1, -1).map(c => c.trim());
    const headers = parseRow(lines[0]);
    // Skip separator row (|---|---|)
    const startRow = lines[1].includes('---') ? 2 : 1;
    let html = '<div class="cc-docs-table-wrap"><table class="cc-docs-table"><thead><tr>';
    for (const h of headers) html += `<th>${inlineFormat(h)}</th>`;
    html += '</tr></thead><tbody>';
    for (let r = startRow; r < lines.length; r++) {
      const cells = parseRow(lines[r]);
      html += '<tr>';
      for (let c = 0; c < cells.length; c++) html += `<td>${inlineFormat(cells[c] || '')}</td>`;
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }

  function attrsTable(attrs) {
    if (!attrs || !attrs.length) return '';
    let html = '<div class="cc-docs-table-wrap"><table class="cc-docs-table"><thead><tr><th>Attribute</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>';
    for (const a of attrs) {
      html += `<tr><td><code>${a.name}</code></td><td><code>${a.type || 'string'}</code></td><td>${a.default || '—'}</td><td>${inlineFormat(a.description || '')}</td></tr>`;
    }
    html += '</tbody></table></div>';
    return html;
  }

  /* ── Styles ── */
  const STYLES = `
    :host { display: block; }
    *, *::before, *::after { box-sizing: border-box; }

    .cc-docs-root { display: flex; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }

    /* Sidebar */
    .cc-docs-sidebar {
      width: 280px; background: var(--card, #0f1225); border-right: 1px solid var(--border, #1e293b);
      position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.1) transparent;
    }
    .cc-docs-sidebar-inner { padding: 24px 16px; }
    .cc-docs-sidebar-title { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; padding: 0 8px; }
    .cc-docs-sidebar-title h2 { font-family: var(--serif, Georgia, serif); font-size: 17px; font-weight: 700; margin: 0; color: var(--heading, #f8fafc); }
    .cc-docs-sidebar-title .icon { font-size: 20px; }

    .cc-docs-toc-group { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted, #64748b); margin: 20px 0 6px 8px; }
    .cc-docs-toc a {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 10px; color: var(--muted, #64748b); text-decoration: none; font-size: 13px;
      font-weight: 500; border-radius: 6px; margin-bottom: 1px; transition: all 0.15s;
    }
    .cc-docs-toc a:hover, .cc-docs-toc a.active { background: color-mix(in srgb, var(--accent, #f59e0b) 12%, transparent); color: var(--accent, #f59e0b); }
    .cc-docs-toc a.sub { padding-left: 26px; font-size: 12px; }

    /* Content */
    .cc-docs-content { flex: 1; padding: 48px 56px; max-width: 900px; overflow-x: hidden; }
    .cc-docs-content h1 { font-family: var(--serif, Georgia, serif); font-size: 32px; font-weight: 700; margin: 0 0 8px; color: var(--heading, #f8fafc); }
    .cc-docs-content .subtitle { color: var(--muted, #64748b); font-size: 15px; margin: 0 0 40px; }

    .cc-docs-section { margin-bottom: 56px; scroll-margin-top: 24px; }
    .cc-docs-section > h2 {
      font-family: var(--serif, Georgia, serif); font-size: 24px; font-weight: 700;
      border-bottom: 2px solid var(--accent, #f59e0b); padding-bottom: 10px; margin: 0 0 20px;
      color: var(--heading, #f8fafc);
    }
    .cc-docs-section h3 { font-size: 17px; font-weight: 600; margin: 28px 0 12px; color: var(--heading, #f8fafc); }
    .cc-docs-section h4 { font-size: 14px; font-weight: 600; margin: 20px 0 8px; color: var(--heading, #f8fafc); }

    .cc-docs-section p { font-size: 14px; line-height: 1.7; color: #cbd5e1; margin: 0 0 12px; }
    .cc-docs-section ul, .cc-docs-section ol { font-size: 14px; line-height: 1.8; color: #cbd5e1; padding-left: 20px; margin: 0 0 16px; }
    .cc-docs-section li { margin-bottom: 4px; }
    .cc-docs-section a { color: var(--accent, #f59e0b); text-decoration: none; }
    .cc-docs-section a:hover { text-decoration: underline; }
    .cc-docs-section code { background: rgba(255,255,255,.06); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; color: var(--accent, #f59e0b); }
    .cc-docs-section strong { color: #f1f5f9; }

    /* Code blocks */
    .cc-docs-code { background: #0a0e1a; border: 1px solid var(--border, #1e293b); border-radius: 8px; margin: 12px 0 16px; overflow: hidden; }
    .cc-docs-code-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: rgba(255,255,255,.03); border-bottom: 1px solid var(--border, #1e293b); }
    .cc-docs-code-lang { font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--muted, #64748b); letter-spacing: 0.5px; }
    .cc-docs-copy { background: none; border: 1px solid var(--border, #1e293b); border-radius: 4px; padding: 4px 6px; cursor: pointer; color: var(--muted, #64748b); transition: all .15s; display: flex; align-items: center; }
    .cc-docs-copy:hover { color: var(--accent, #f59e0b); border-color: var(--accent, #f59e0b); }
    .cc-docs-copy.copied { color: #22c55e; border-color: #22c55e; }
    .cc-docs-code pre { margin: 0; padding: 16px; overflow-x: auto; font-size: 13px; line-height: 1.6; }
    .cc-docs-code code { background: none; padding: 0; color: #e2e8f0; font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 13px; }

    /* Syntax highlighting */
    .hl-kw { color: #c084fc; font-weight: 600; }
    .hl-str { color: #86efac; }
    .hl-cmt { color: #4a5568; font-style: italic; }
    .hl-num { color: #f59e0b; }
    .hl-lit { color: #f59e0b; }
    .hl-bi { color: #67e8f9; }
    .hl-punc { color: #94a3b8; }
    .hl-tag { color: #f472b6; }
    .hl-attr { color: #67e8f9; }
    .hl-sel { color: #c084fc; }
    .hl-prop { color: #67e8f9; }
    .hl-val { color: #86efac; }

    /* Tables */
    .cc-docs-table-wrap { overflow-x: auto; margin: 12px 0 16px; }
    .cc-docs-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .cc-docs-table th { text-align: left; padding: 8px 12px; background: var(--card, #0f1225); border: 1px solid var(--border, #1e293b); color: var(--muted, #64748b); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .cc-docs-table td { padding: 8px 12px; border: 1px solid var(--border, #1e293b); color: #cbd5e1; }
    .cc-docs-table td:first-child code { color: var(--accent, #f59e0b); font-weight: 600; }

    /* Callouts */
    .cc-docs-callout { display: flex; gap: 12px; padding: 14px 16px; border-radius: 8px; margin: 12px 0 16px; font-size: 13px; line-height: 1.6; }
    .cc-docs-callout-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    .cc-docs-callout-note { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.25); }
    .cc-docs-callout-info { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.25); }
    .cc-docs-callout-tip { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); }
    .cc-docs-callout-warning { background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25); }
    .cc-docs-callout-caution { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); }

    /* Mobile */
    @media (max-width: 768px) {
      .cc-docs-root { flex-direction: column; }
      .cc-docs-sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid var(--border, #1e293b); }
      .cc-docs-sidebar-inner { display: flex; flex-wrap: wrap; gap: 4px; padding: 16px; }
      .cc-docs-sidebar-title { width: 100%; margin-bottom: 8px; }
      .cc-docs-toc-group { width: 100%; margin: 8px 0 2px; }
      .cc-docs-toc a { padding: 4px 8px; font-size: 12px; }
      .cc-docs-content { padding: 24px 16px; }
    }
  `;

  class CCDocs extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      const src = this.getAttribute('src');
      if (src) {
        fetch(src).then(r => r.json()).then(data => this._render(data));
      } else {
        // Try inline JSON or child sections
        const text = this.textContent.trim();
        if (text.startsWith('{') || text.startsWith('[')) {
          try {
            const data = JSON.parse(text);
            this.textContent = '';
            this._render(Array.isArray(data) ? { sections: data } : data);
          } catch (e) {
            this._render(this._parseAttr());
          }
        } else {
          this._render(this._parseAttr());
        }
      }
    }

    _parseAttr() {
      const s = this.getAttribute('sections');
      if (s) {
        try { return { sections: JSON.parse(s) }; } catch (e) {}
      }
      return { sections: [] };
    }

    _render(data) {
      const title = data.title || this.getAttribute('title') || 'Documentation';
      const icon = data.icon || this.getAttribute('icon') || '📖';
      const subtitle = data.subtitle || this.getAttribute('subtitle') || '';
      const sections = data.sections || [];
      const links = data.links || [];

      // Build TOC
      let tocHtml = '';
      let contentHtml = '';

      if (sections.length) {
        tocHtml += '<div class="cc-docs-toc-group">Sections</div>';
      }

      for (const sec of sections) {
        const id = sec.id || sec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const secIcon = sec.icon || '';
        tocHtml += `<a href="#${id}" data-target="${id}">${secIcon ? secIcon + ' ' : ''}${sec.title}</a>`;

        // Subsection TOC entries
        if (sec.subsections) {
          for (const sub of sec.subsections) {
            const subId = id + '-' + sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            tocHtml += `<a href="#${subId}" class="sub" data-target="${subId}">${sub.title}</a>`;
          }
        }

        // Build section content
        let secContent = '';
        if (sec.content) secContent += parseContent(sec.content);
        if (sec.attributes) {
          secContent += '<h3>Attributes</h3>' + attrsTable(sec.attributes);
        }
        if (sec.code) {
          secContent += codeBlock(sec.code.content, sec.code.lang);
        }
        if (sec.codeBlocks) {
          for (const cb of sec.codeBlocks) {
            if (cb.title) secContent += `<h3>${cb.title}</h3>`;
            secContent += codeBlock(cb.content, cb.lang);
          }
        }
        if (sec.subsections) {
          for (const sub of sec.subsections) {
            const subId = id + '-' + sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            secContent += `<div id="${subId}" style="scroll-margin-top:24px"><h3>${sub.title}</h3>`;
            if (sub.content) secContent += parseContent(sub.content);
            if (sub.attributes) secContent += attrsTable(sub.attributes);
            if (sub.code) secContent += codeBlock(sub.code.content, sub.code.lang);
            if (sub.codeBlocks) {
              for (const cb of sub.codeBlocks) {
                if (cb.title) secContent += `<h4>${cb.title}</h4>`;
                secContent += codeBlock(cb.content, cb.lang);
              }
            }
            secContent += '</div>';
          }
        }

        contentHtml += `<section id="${id}" class="cc-docs-section"><h2>${secIcon ? secIcon + ' ' : ''}${sec.title}</h2>${secContent}</section>`;
      }

      // Links
      if (links.length) {
        tocHtml += '<div class="cc-docs-toc-group">Links</div>';
        for (const l of links) {
          tocHtml += `<a href="${l.url}" target="_blank">${l.icon || '↗'} ${l.label}</a>`;
        }
      }

      this.shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        <div class="cc-docs-root">
          <nav class="cc-docs-sidebar">
            <div class="cc-docs-sidebar-inner">
              <div class="cc-docs-sidebar-title"><span class="icon">${icon}</span><h2>${title}</h2></div>
              <div class="cc-docs-toc">${tocHtml}</div>
            </div>
          </nav>
          <main class="cc-docs-content">
            <h1>${icon} ${title}</h1>
            ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
            ${contentHtml}
          </main>
        </div>
      `;

      // Wire up copy buttons
      this.shadowRoot.querySelectorAll('.cc-docs-copy').forEach(btn => {
        btn.ccDocsCopy = () => {
          const code = btn.closest('.cc-docs-code').querySelector('code').textContent;
          navigator.clipboard.writeText(code).then(() => {
            btn.classList.add('copied');
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
            setTimeout(() => {
              btn.classList.remove('copied');
              btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
            }, 2000);
          });
        };
      });

      // Wire up TOC clicks for smooth scroll
      this.shadowRoot.querySelectorAll('.cc-docs-toc a[data-target]').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const target = this.shadowRoot.getElementById(a.dataset.target);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      // Scroll spy
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.shadowRoot.querySelectorAll('.cc-docs-toc a').forEach(a => a.classList.remove('active'));
            const link = this.shadowRoot.querySelector(`.cc-docs-toc a[data-target="${entry.target.id}"]`);
            if (link) link.classList.add('active');
          }
        }
      }, { threshold: 0.3 });

      this.shadowRoot.querySelectorAll('.cc-docs-section, [id][style*="scroll-margin"]').forEach(s => observer.observe(s));
    }
  }

  customElements.define('cc-docs', CCDocs);
})();
