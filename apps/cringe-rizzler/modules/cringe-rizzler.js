function escapeAttr(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function esc(str) {
  const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
}

class CringeRizzler extends HTMLElement {
  static SLANG = {
    'rizz': 'Charisma or charm, especially romantic',
    'sigma': 'Independent, lone-wolf type personality',
    'skibidi': 'Chaotic, absurd, or cool (context-dependent)',
    'bussin': 'Really good, especially food',
    'no cap': 'No lie, for real',
    'fr fr': 'For real for real — emphasis on truthfulness',
    'mid': 'Average, mediocre, nothing special',
    'sus': 'Suspicious or sketchy',
    'slay': 'To do something exceptionally well',
    'bet': 'Agreement — "okay" or "sounds good"',
    'brainrot': 'When too much internet rots your brain',
    'gyatt': 'Exclamation of surprise/attraction',
    'mewing': 'Jawline exercise technique (or pretending to)',
    'aura': 'Your overall vibe or energy points',
    'ratio': 'Getting more replies than likes (a diss)',
    'delulu': 'Delusional',
    'npc': 'Someone who acts like a background character',
    'goat': 'Greatest of all time',
    'drip': 'Stylish outfit or accessories',
    'yeet': 'To throw something with force',
    'simp': 'Someone who does too much for their crush',
    'based': 'Unapologetically yourself, not caring what others think',
    'lowkey': 'Secretly, subtly, on the down-low',
    'highkey': 'Openly, obviously, very much',
    'fanum tax': 'Taking a portion of someone else\'s food',
    'ohio': 'A place where weird/cursed things happen',
    'cap': 'A lie',
    'ate': 'Did an amazing job — "ate and left no crumbs"',
    'understood the assignment': 'Perfectly executed what was needed',
    'main character': 'Acting like the protagonist of life',
    'rent free': 'Living in someone\'s head without paying',
    'caught in 4k': 'Caught red-handed with evidence',
    'periodt': 'Period — end of discussion, final word',
    'glazing': 'Excessively praising or complimenting someone',
    'mogging': 'Outshining someone in looks',
    'looksmaxxing': 'Trying to maximize your physical appearance',
    'ick': 'A sudden turn-off or feeling of disgust',
    'cook': 'Let someone do their thing — "let him cook"',
    'W': 'A win',
    'L': 'A loss'
  };

  static SCENARIOS = [
    'texting my kids',
    'at the office meeting',
    'family dinner',
    'parent-teacher conference',
    'neighborhood BBQ',
    'grocery store checkout',
    'calling tech support',
    'writing a birthday card',
    'leaving a Yelp review',
    'coaching little league'
  ];

  constructor() {
    super();
    this.activeTab = 'phrases';
    this.currentPhrase = null;
    this.currentMeme = null;
    this.generating = false;
    this.saved = [];
    this.filterType = 'all';
    // Meme template state
    this.memeTemplates = [];
    this.memeIndex = -1;
    this.memeCaption = '';
    this.memeScenario = '';
    this.memeTerms = [];
    this._memeImg = null;
  }

  connectedCallback() { this.init(); }

  async init() {
    try {
      this.db = await CringeRizzlerDB.init();
      this.saved = await this.db.getAll();
    } catch (e) { console.error('DB init error:', e); this.saved = []; }
    // Pre-load meme templates
    this.loadMemeTemplates();
    this.render();
  }

  async loadMemeTemplates() {
    try {
      const r = await fetch('https://api.imgflip.com/get_memes');
      const d = await r.json();
      if (d.success) this.memeTemplates = d.data.memes.slice(0, 100);
    } catch (e) { console.error('Failed to load meme templates', e); }
  }

  async generatePhrase() {
    if (this.generating) return;
    this.generating = true;
    this.render();
    try {
      const terms = Object.keys(CringeRizzler.SLANG);
      const pick = () => terms[Math.floor(Math.random() * terms.length)];
      const chosen = [pick(), pick(), pick()].filter((v, i, a) => a.indexOf(v) === i);
      const slangList = chosen.map(t => `"${t}" (${CringeRizzler.SLANG[t]})`).join(', ');

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window._oaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You generate hilariously cringeworthy phrases that a Gen X dad or Boomer would say while badly misusing Gen Alpha slang. The humor comes from the mismatch — like a dad at a BBQ saying "this brisket is giving sigma rizz, no cap fr fr." Keep it PG, keep it short (1-2 sentences max), and make it painfully funny. Just return the phrase, nothing else.' },
            { role: 'user', content: `Generate a cringe phrase using these Gen Alpha terms: ${slangList}. The speaker is a middle-aged parent trying way too hard to be cool.` }
          ],
          max_tokens: 150,
          temperature: 1
        })
      });
      const data = await resp.json();
      const phrase = data.choices?.[0]?.message?.content?.trim();
      if (!phrase) throw new Error('No phrase generated');
      this.currentPhrase = { text: phrase, terms: chosen.map(t => ({ term: t, def: CringeRizzler.SLANG[t] })) };
    } catch (e) {
      console.error('Generate error:', e);
      window.showToast?.('Failed to generate phrase — check API key');
    }
    this.generating = false;
    this.render();
  }

  async generateMeme(scenario) {
    if (this.generating) return;
    this.generating = true;
    this.memeScenario = scenario;
    this.render();
    try {
      const terms = Object.keys(CringeRizzler.SLANG);
      const pick = () => terms[Math.floor(Math.random() * terms.length)];
      const chosen = [pick(), pick()].filter((v, i, a) => a.indexOf(v) === i);
      this.memeTerms = chosen;

      const captionResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window._oaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Generate a short, funny meme caption for a Gen X parent badly using Gen Alpha slang. Return ONLY two lines separated by a newline: the top text on line 1 and bottom text on line 2. Keep each line under 8 words. Classic meme format.' },
            { role: 'user', content: `Scenario: "${scenario}". Use slang: ${chosen.join(', ')}` }
          ],
          max_tokens: 60, temperature: 1
        })
      });
      const captionData = await captionResp.json();
      const raw = captionData.choices?.[0]?.message?.content?.trim() || 'WHEN THE DAD SAYS BUSSIN\nNO CAP FR FR';
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      this.memeTopText = lines[0] || '';
      this.memeBottomText = lines[1] || '';
      this.memeCaption = raw;

      // Pick a random starting template
      if (this.memeTemplates.length) {
        this.memeIndex = Math.floor(Math.random() * this.memeTemplates.length);
      }

      this.currentMeme = { caption: this.memeCaption, scenario, terms: chosen };
    } catch (e) {
      console.error('Meme generate error:', e);
      window.showToast?.('Failed to generate caption — check API key');
    }
    this.generating = false;
    this.render();
    // Load the first template image after render
    if (this.memeIndex >= 0) {
      this._loadMemeTemplate();
    }
  }

  _loadMemeTemplate() {
    const tpl = this.memeTemplates[this.memeIndex];
    if (!tpl) return;
    this._memeImg = new Image();
    this._memeImg.crossOrigin = 'anonymous';
    this._memeImg.onload = () => this._drawMemeCanvas();
    this._memeImg.onerror = () => {
      this._memeImg = new Image();
      this._memeImg.onload = () => this._drawMemeCanvas();
      this._memeImg.src = tpl.url;
    };
    this._memeImg.src = tpl.url;
    // Update name & counter
    const nameEl = this.querySelector('#meme-tpl-name');
    const ctrEl = this.querySelector('#meme-tpl-counter');
    if (nameEl) nameEl.textContent = esc(tpl.name);
    if (ctrEl) ctrEl.textContent = `${this.memeIndex + 1} of ${this.memeTemplates.length}`;
  }

  _drawMemeCanvas() {
    const canvas = this.querySelector('#cringe-meme-canvas');
    if (!canvas || !this._memeImg || !this._memeImg.complete) return;
    const ctx = canvas.getContext('2d');
    const img = this._memeImg;
    canvas.width = img.naturalWidth || 600;
    canvas.height = img.naturalHeight || 600;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const fs = 48 * (canvas.width / 600);
    ctx.font = `bold ${fs}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = fs / 12;
    ctx.lineJoin = 'round';

    if (this.memeTopText) this._drawMemeText(ctx, this.memeTopText.toUpperCase(), canvas.width / 2, fs + 10, canvas.width - 20, fs);
    if (this.memeBottomText) this._drawMemeText(ctx, this.memeBottomText.toUpperCase(), canvas.width / 2, canvas.height - 15, canvas.width - 20, fs, true);
  }

  _drawMemeText(ctx, text, x, y, maxW, fs, fromBottom = false) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const lineH = fs * 1.1;
    let startY = fromBottom ? y - (lines.length - 1) * lineH : y;
    for (const l of lines) {
      ctx.strokeText(l, x, startY);
      ctx.fillText(l, x, startY);
      startY += lineH;
    }
  }

  cycleMemeTemplate(dir) {
    if (!this.memeTemplates.length) return;
    this.memeIndex = (this.memeIndex + dir + this.memeTemplates.length) % this.memeTemplates.length;
    this._loadMemeTemplate();
  }

  downloadMeme() {
    const canvas = this.querySelector('#cringe-meme-canvas');
    if (!canvas) return;
    try {
      const tpl = this.memeTemplates[this.memeIndex];
      const link = document.createElement('a');
      link.download = 'cringe-' + (tpl?.name || 'meme').replace(/\s+/g, '-').toLowerCase() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      window.showToast?.('CORS blocked download. Try right-clicking the canvas to save.', 'error');
    }
  }

  async savePhrase() {
    if (!this.currentPhrase || !this.db) return;
    const id = `phrase-${Date.now()}`;
    await this.db.upsert({ id, type: 'phrase', content: this.currentPhrase.text, slang_terms: this.currentPhrase.terms });
    this.saved = await this.db.getAll();
    window.showToast?.('Phrase saved to collection');
    this.render();
  }

  async saveMeme() {
    if (!this.currentMeme || !this.db) return;
    const canvas = this.querySelector('#cringe-meme-canvas');
    let imageUrl = '';
    try { imageUrl = canvas?.toDataURL('image/png') || ''; } catch (e) { /* cors */ }
    const id = `meme-${Date.now()}`;
    await this.db.upsert({ id, type: 'meme', content: this.memeCaption, image_url: imageUrl, scenario: this.memeScenario, slang_terms: this.memeTerms });
    this.saved = await this.db.getAll();
    window.showToast?.('Meme saved to collection');
    this.render();
  }

  async deleteItem(id) {
    if (!this.db) return;
    await this.db.remove(id);
    this.saved = await this.db.getAll();
    window.showToast?.('Deleted');
    this.render();
  }

  renderPhraseTab() {
    return `
      <div style="max-width:700px;margin:0 auto;">
        <cc-fade-in>
          <div class="card" style="text-align:center;padding:32px 24px;">
            ${this.generating ? `
              <div style="padding:40px 0;">
                <i data-lucide="loader-2" style="width:32px;height:32px;color:var(--accent);animation:spin 1s linear infinite;"></i>
                <p style="color:var(--muted);margin-top:12px;">Generating maximum cringe...</p>
              </div>
            ` : this.currentPhrase ? `
              <div style="font-size:1.4rem;font-weight:700;line-height:1.5;font-family:var(--serif);margin-bottom:20px;">${esc(this.currentPhrase.text)}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;">
                ${this.currentPhrase.terms.map(t => `
                  <span class="badge" style="background:rgba(var(--accent-rgb,245,158,11),.15);color:var(--accent);padding:6px 12px;border-radius:8px;font-size:12px;">
                    ${esc(t.term)} — <span style="opacity:.7">${esc(t.def)}</span>
                  </span>
                `).join('')}
              </div>
              <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">
                <button class="btn btn-primary btn-sm" data-action="save-phrase"><i data-lucide="heart" style="width:14px;height:14px;"></i> Save</button>
              </div>
              <cc-share text="${escapeAttr(this.currentPhrase.text)}" url="https://cringe-rizzler.adam-harris.alphaclaw.app"></cc-share>
            ` : `
              <div style="padding:24px 0;">
                <i data-lucide="message-circle-warning" style="width:48px;height:48px;color:var(--muted);opacity:.4;"></i>
                <p style="color:var(--muted);margin-top:12px;">Hit the button to generate your first cringe phrase</p>
              </div>
            `}
          </div>
        </cc-fade-in>
        <div style="text-align:center;margin-top:20px;">
          <button class="btn btn-primary" data-action="generate-phrase" ${this.generating ? 'disabled' : ''}>
            <i data-lucide="sparkles" style="width:16px;height:16px;"></i> Generate New Phrase
          </button>
        </div>
      </div>`;
  }

  renderMemeTab() {
    const hasMeme = this.currentMeme && this.memeIndex >= 0;
    return `
      <style>
        .cr-meme-cycle{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:12px}
        .cr-meme-cycle-btn{width:44px;height:44px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--heading);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .cr-meme-cycle-btn:hover{border-color:var(--accent);color:var(--accent);background:rgba(245,158,11,.1)}
        .cr-meme-canvas-wrap{background:var(--card);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .cr-meme-canvas-wrap canvas{max-width:100%;border-radius:8px}
      </style>
      <div style="max-width:700px;margin:0 auto;">
        <p style="color:var(--muted);text-align:center;margin-bottom:16px;">Pick a scenario → get a cringe caption → cycle through classic meme templates</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:24px;">
          ${CringeRizzler.SCENARIOS.map(s => `
            <button class="btn btn-secondary btn-sm" data-scenario="${escapeAttr(s)}" ${this.generating ? 'disabled' : ''} style="text-align:left;">
              <i data-lucide="image" style="width:14px;height:14px;flex-shrink:0;"></i> ${s}
            </button>
          `).join('')}
        </div>
        ${this.generating ? `
          <div class="card" style="text-align:center;padding:40px 24px;">
            <i data-lucide="loader-2" style="width:32px;height:32px;color:var(--accent);animation:spin 1s linear infinite;"></i>
            <p style="color:var(--muted);margin-top:12px;">Generating cringe caption...</p>
          </div>
        ` : hasMeme ? `
          <cc-fade-in>
          <div class="card" style="padding:20px;text-align:center;">
            <div class="cr-meme-cycle">
              <button class="cr-meme-cycle-btn" data-action="meme-prev" title="Previous template">‹</button>
              <div style="min-width:0;">
                <div id="meme-tpl-name" style="font-weight:700;font-family:var(--serif);font-size:16px;">${esc(this.memeTemplates[this.memeIndex]?.name || '')}</div>
                <div id="meme-tpl-counter" style="font-size:12px;color:var(--muted);">${this.memeIndex + 1} of ${this.memeTemplates.length}</div>
              </div>
              <button class="cr-meme-cycle-btn" data-action="meme-next" title="Next template">›</button>
            </div>
            <div class="cr-meme-canvas-wrap">
              <canvas id="cringe-meme-canvas" width="600" height="600"></canvas>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:16px;">Scenario: ${esc(this.memeScenario)}</div>
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">
              <button class="btn btn-primary btn-sm" data-action="save-meme"><i data-lucide="heart" style="width:14px;height:14px;"></i> Save</button>
              <button class="btn btn-secondary btn-sm" data-action="download-meme"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</button>
            </div>
            <cc-share text="${escapeAttr(this.memeCaption)}" url="https://cringe-rizzler.adam-harris.alphaclaw.app"></cc-share>
          </div>
          </cc-fade-in>
        ` : ''}
      </div>`;
  }

  renderSavedTab() {
    const filtered = this.filterType === 'all' ? this.saved : this.saved.filter(s => s.type === this.filterType);
    const filterItems = [
      { value: 'all', label: 'All', count: this.saved.length },
      { value: 'phrase', label: 'Phrases', count: this.saved.filter(s => s.type === 'phrase').length },
      { value: 'meme', label: 'Memes', count: this.saved.filter(s => s.type === 'meme').length }
    ];
    return `
      <div style="max-width:800px;margin:0 auto;">
        <cc-pill-filter label="Type" items='${escapeAttr(JSON.stringify(filterItems))}' value="${escapeAttr(this.filterType)}"></cc-pill-filter>
        ${!filtered.length ? `<cc-empty-state message="No saved items yet. Generate some cringe first!" icon="📭"></cc-empty-state>` : `
          <cc-stagger animation="fade-up" delay="60">
          <div style="display:grid;gap:12px;margin-top:16px;">
            ${filtered.map(item => `
              <div class="card cringe-saved-item" style="padding:16px;" data-saved-id="${escapeAttr(item.id)}">
                <div class="cringe-saved-layout">
                  <div class="cringe-saved-content">
                    <span class="badge" style="background:${item.type === 'phrase' ? 'rgba(var(--violet-rgb,139,92,246),.15)' : 'rgba(var(--blue-rgb,59,130,246),.15)'};color:${item.type === 'phrase' ? 'var(--violet,#8b5cf6)' : 'var(--blue,#3b82f6)'};margin-bottom:8px;">${item.type}</span>
                    ${item.image_url ? `<img src="${escapeAttr(item.image_url)}" alt="Meme" style="max-width:200px;border-radius:8px;margin:8px 0;display:block;">` : ''}
                    <div style="font-weight:600;margin-top:4px;">${esc(item.content || '')}</div>
                    ${item.scenario ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;">Scenario: ${esc(item.scenario)}</div>` : ''}
                    <div style="font-size:11px;color:var(--muted);margin-top:6px;">${new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                  <div class="cringe-saved-actions">
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${escapeAttr(item.id)}" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                  </div>
                  <div class="cringe-saved-share">
                    <cc-share text="${escapeAttr(item.content || '')}" url="https://cringe-rizzler.adam-harris.alphaclaw.app"${item.image_url ? ` image-url="${escapeAttr(item.image_url)}"` : ''}></cc-share>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          </cc-stagger>
        `}
      </div>`;
  }

  render() {
    const hadMeme = this.currentMeme && this.memeIndex >= 0;
    this.innerHTML = `
      <style>
        .cr-wrap{max-width:1100px;margin:20px auto;padding:0 16px;}
        .cr-header{text-align:center;margin-bottom:24px;}
        .cr-header h1{font-family:var(--serif);font-size:2rem;margin:0;}
        .cr-header p{color:var(--muted);margin:4px 0 0;font-size:14px;}
        @keyframes spin{to{transform:rotate(360deg);}}

        /* Saved items responsive layout */
        .cringe-saved-layout {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-areas: 
            "content actions"
            "share share";
          gap: 12px;
          align-items: start;
        }
        .cringe-saved-content { grid-area: content; min-width: 0; }
        .cringe-saved-actions { 
          grid-area: actions; 
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        .cringe-saved-share { 
          grid-area: share;
          justify-self: start;
        }

        /* Desktop layout - share box in actions column */
        @media (min-width: 640px) {
          .cringe-saved-layout {
            grid-template-columns: 1fr auto;
            grid-template-areas: "content actions";
          }
          .cringe-saved-actions {
            gap: 8px;
          }
          .cringe-saved-share {
            grid-area: actions;
            justify-self: end;
          }
        }
      </style>
      <div class="cr-wrap">
        <cc-fade-in>
          <cc-page-header icon="💀" title="Cringe Rizzler" description="Embarrass Gen Alpha with hilariously bad slang usage"></cc-page-header>
        </cc-fade-in>
        <cc-tabs active="${this.activeTab}">
          <cc-tab name="phrases" label="Daily Phrases" icon="message-circle">
            ${this.renderPhraseTab()}
          </cc-tab>
          <cc-tab name="memes" label="Meme Generator" icon="image">
            ${this.renderMemeTab()}
          </cc-tab>
          <cc-tab name="saved" label="Saved Collection" icon="bookmark">
            ${this.renderSavedTab()}
          </cc-tab>
        </cc-tabs>
      </div>
    `;

    window.refreshIcons?.();

    // Tab change
    this.querySelector('cc-tabs')?.addEventListener('tab-change', e => {
      this.activeTab = e.detail.tab;
      this.render();
    });

    // Phrase actions
    this.querySelector('[data-action="generate-phrase"]')?.addEventListener('click', () => this.generatePhrase());
    this.querySelector('[data-action="save-phrase"]')?.addEventListener('click', () => this.savePhrase());

    // Meme scenario buttons
    this.querySelectorAll('[data-scenario]').forEach(b => {
      b.addEventListener('click', () => this.generateMeme(b.dataset.scenario));
    });
    this.querySelector('[data-action="save-meme"]')?.addEventListener('click', () => this.saveMeme());
    this.querySelector('[data-action="download-meme"]')?.addEventListener('click', () => this.downloadMeme());
    this.querySelector('[data-action="meme-prev"]')?.addEventListener('click', () => this.cycleMemeTemplate(-1));
    this.querySelector('[data-action="meme-next"]')?.addEventListener('click', () => this.cycleMemeTemplate(1));

    // Saved tab
    this.querySelector('cc-pill-filter')?.addEventListener('pill-change', e => {
      this.filterType = e.detail.value;
      this.render();
    });
    this.querySelectorAll('[data-action="delete"]').forEach(b => {
      b.addEventListener('click', () => this.deleteItem(b.dataset.id));
    });

    // Re-draw meme canvas if we had one
    if (hadMeme && this.memeIndex >= 0) {
      this._loadMemeTemplate();
    }
  }
}

customElements.define('cringe-rizzler', CringeRizzler);
