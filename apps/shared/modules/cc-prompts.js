// ─── Prompts (shared: video + text prompt cards) ─────────
class CcPrompts extends HTMLElement {
  connectedCallback() {
    const p = (window.CC && CC.getParams) ? CC.getParams() : {};
    this._activeCat = p.category || 'All';
    this._searchQuery = p.q || '';
    this._load();
  }

  _syncUrl() {
    if (window.CC && CC.setParams) CC.setParams({
      category: this._activeCat === 'All' ? null : this._activeCat,
      q: this._searchQuery || null
    });
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      this._data = await (await fetch(src)).json();
      this._render();
    } catch (e) {
      console.error('cc-prompts:', e);
      this.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px;">Failed to load prompts.</p>';
    }
  }

  _setCat(c) {
    this._activeCat = c;
    this._syncUrl();
    this._render();
  }

  _setSearch(q) {
    this._searchQuery = q;
    this._syncUrl();
    this._render();
  }

  _copyPrompt(idx) {
    const p = this._data[idx];
    if (!p) return;
    navigator.clipboard.writeText(p.prompt).then(() => {
      const toast = document.querySelector('cc-toast');
      if (toast && toast.show) toast.show('Copied to clipboard!', 'success');
      const btn = this.querySelector(`#cp-copy-${idx}`);
      if (btn) {
        btn.innerHTML = '<i data-lucide="check"></i>';
        setTimeout(() => { btn.innerHTML = '<i data-lucide="clipboard"></i>'; if(window.refreshIcons)refreshIcons(); }, 2000);
      }
    }).catch(() => {});
  }

  _render() {
    const esc = this._esc.bind(this);
    const data = this._data || [];
    const q = (this._searchQuery || '').toLowerCase().trim();

    // Build categories
    const cats = [...new Set(data.map(p => p.category))];

    // Filter
    let filtered = data;
    if (this._activeCat !== 'All') filtered = filtered.filter(p => p.category === this._activeCat);
    if (q) filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (p.category || '').toLowerCase().includes(q)
    );

    // Group by category
    const grouped = {};
    filtered.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });

    const isVideo = (p) => !!(p.model || p.frameMode || p.duration);

    const badgeHtml = (p) => {
      let b = '';
      if (p.model) b += `<span class="cp-badge cp-badge-model">${esc(p.model)}</span>`;
      if (p.workflow) b += `<span class="cp-badge cp-badge-workflow">${esc(p.workflow)}</span>`;
      if (p.frameMode) b += `<span class="cp-badge cp-badge-frame">${esc(p.frameMode)}</span>`;
      if (p.duration) b += `<span class="cp-badge cp-badge-duration">${esc(p.duration)}</span>`;
      return b;
    };

    const tagHtml = (p) => {
      if (!p.tags || !p.tags.length) return '';
      return `<div class="cp-tags">${p.tags.map(t => `<span class="cp-tag">${esc(t)}</span>`).join('')}</div>`;
    };

    const frameHtml = (p) => {
      if (!p.startFrame && !p.endFrame) return '';
      let h = '<div class="cp-frames">';
      if (p.startFrame) h += `<div class="cp-frame-slot"><div class="cp-frame-label">Start Frame</div><div class="cp-frame-img"><img src="${esc(p.startFrame)}" alt="${esc(p.title)} - Start Frame" loading="lazy"></div></div>`;
      if (p.endFrame) h += `<div class="cp-frame-slot"><div class="cp-frame-label">End Frame</div><div class="cp-frame-img"><img src="${esc(p.endFrame)}" alt="${esc(p.title)} - End Frame" loading="lazy"></div></div>`;
      h += '</div>';
      return h;
    };

    const notesHtml = (p) => {
      if (!p.cameraNotes && !p.motionNotes && !p.whyModel) return '';
      let h = '<div class="cp-notes">';
      if (p.whyModel) h += `<p><strong>Why ${esc(p.model)}:</strong> ${esc(p.whyModel)}</p>`;
      if (p.cameraNotes) h += `<p><strong>Camera Notes:</strong> ${esc(p.cameraNotes)}</p>`;
      if (p.motionNotes) h += `<p><strong>Motion:</strong> ${esc(p.motionNotes)}</p>`;
      h += '</div>';
      return h;
    };

    const globalIdx = (p) => data.indexOf(p);

    let cardsHtml = '';
    for (const [cat, items] of Object.entries(grouped)) {
      cardsHtml += `<div class="cp-section"><h2 class="cp-section-title">${esc(cat)}</h2></div>`;
      cardsHtml += '<div class="cp-grid">';
      items.forEach(p => {
        const idx = globalIdx(p);
        cardsHtml += `
        <div class="cp-card">
          <div class="cp-card-header">
            <div class="cp-title">${p.icon ? p.icon + ' ' : ''}${esc(p.title)}</div>
            <button class="cp-copy-btn" id="cp-copy-${idx}" onclick="this.closest('cc-prompts')._copyPrompt(${idx})" title="Copy Prompt"><i data-lucide="clipboard"></i></button>
          </div>
          <div class="cp-badges">${badgeHtml(p)}</div>
          ${tagHtml(p)}
          <div class="cp-prompt-text">${esc(p.prompt)}</div>
          ${notesHtml(p)}
          ${frameHtml(p)}
        </div>`;
      });
      cardsHtml += '</div>';
    }

    if (!filtered.length) {
      cardsHtml = '<div class="cp-empty">No prompts match your filter.</div>';
    }

    this.innerHTML = `
<style>
.cp-container{max-width:1200px;margin:0 auto;padding:0 1rem;}
.cp-header{text-align:center;margin:40px 0 24px;}
.cp-header h1{font-family:var(--serif,Georgia,serif);margin:0 0 8px;}
.cp-header p{color:var(--muted);margin:0;}
.cp-controls{display:flex;flex-wrap:wrap;gap:.75rem;margin-bottom:24px;align-items:center;}
.cp-search{flex:1;min-width:200px;padding:.6rem 1rem;border-radius:8px;border:1px solid var(--border,#334155);background:var(--glass-bg,rgba(255,255,255,.04));color:var(--text,#e2e8f0);font-size:.95rem;backdrop-filter:blur(8px);}
.cp-search:focus{outline:none;border-color:var(--accent);}
.cp-pills{display:flex;flex-wrap:wrap;gap:.5rem;}
.cp-pill{padding:.4rem .9rem;border-radius:20px;border:1px solid var(--border,#334155);background:transparent;color:var(--muted);cursor:pointer;font-size:.85rem;transition:all .2s;}
.cp-pill:hover,.cp-pill.active{background:var(--accent);color:#000;border-color:var(--accent);}
.cp-section-title{font-family:var(--serif,Georgia,serif);font-size:1.4rem;color:var(--heading,var(--text));margin:2rem 0 .75rem;padding-bottom:.5rem;border-bottom:2px solid var(--accent);}
.cp-grid{display:grid;grid-template-columns:1fr;gap:1.25rem;margin-bottom:1rem;}
.cp-card{background:var(--glass-bg,rgba(255,255,255,.04));border:1px solid var(--glass-border,var(--border,#334155));border-radius:14px;padding:1.5rem;backdrop-filter:blur(12px);transition:transform .15s,box-shadow .15s;}
.cp-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3);}
.cp-card-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;}
.cp-title{font-weight:700;font-size:1.1rem;color:var(--text);}
.cp-copy-btn{padding:.35rem;border-radius:6px;border:none;background:none;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:color .15s,background .15s;}
.cp-copy-btn:hover{color:var(--accent);background:rgba(255,255,255,.08);}
.cp-copy-btn [data-lucide]{width:18px;height:18px;}
.cp-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.cp-badge{padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
.cp-badge-model{background:rgba(251,191,36,.2);color:#fbbf24;border:1px solid rgba(251,191,36,.3);}
.cp-badge-workflow{background:rgba(139,92,246,.2);color:#8b5cf6;border:1px solid rgba(139,92,246,.3);}
.cp-badge-frame{background:rgba(34,197,94,.2);color:#22c55e;border:1px solid rgba(34,197,94,.3);}
.cp-badge-duration{background:rgba(156,163,175,.2);color:#9ca3af;border:1px solid rgba(156,163,175,.3);}
.cp-tags{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:10px;}
.cp-tag{font-size:.7rem;padding:.15rem .5rem;border-radius:4px;background:rgba(255,255,255,.06);color:var(--muted);}
.cp-prompt-text{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:16px;font-family:'SF Mono',Monaco,'Fira Code',monospace;font-size:.82rem;line-height:1.6;color:#e5e7eb;white-space:pre-wrap;word-break:break-word;margin-bottom:12px;}
.cp-notes{margin-bottom:12px;}
.cp-notes p{margin:8px 0;font-size:13px;color:rgba(255,255,255,.7);}
.cp-notes strong{color:#fbbf24;}
.cp-frames{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;}
@media(max-width:600px){.cp-frames{grid-template-columns:1fr;}}
.cp-frame-slot{text-align:center;}
.cp-frame-label{font-size:12px;font-weight:600;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;}
.cp-frame-img{background:rgba(0,0,0,.3);border:2px dashed rgba(255,255,255,.1);border-radius:10px;padding:6px;min-height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.cp-frame-img img{max-width:100%;height:auto;border-radius:6px;}
.cp-empty{text-align:center;color:var(--muted);padding:60px 20px;font-size:1rem;}
@media(max-width:600px){
  .cp-controls{flex-direction:column;}
  .cp-card-header{flex-direction:column;gap:8px;}
}
</style>
<div class="cp-container">
  <div class="cp-controls">
    <input type="text" class="cp-search" placeholder="🔍 Search prompts…" value="${esc(this._searchQuery)}" autocomplete="off">
    <div class="cp-pills">
      <button class="cp-pill${this._activeCat === 'All' ? ' active' : ''}" data-cat="All">All</button>
      ${cats.map(c => `<button class="cp-pill${this._activeCat === c ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
  </div>
  ${cardsHtml}
</div>`;

    if (window.refreshIcons) refreshIcons();

    // Wire events
    this.querySelector('.cp-search')?.addEventListener('input', e => this._setSearch(e.target.value));
    this.querySelectorAll('.cp-pill').forEach(pill => {
      pill.addEventListener('click', () => this._setCat(pill.dataset.cat));
    });
  }
}
customElements.define('cc-prompts', CcPrompts);
