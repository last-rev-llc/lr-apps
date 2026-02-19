class GenSilent extends HTMLElement {
  constructor() {
    super();
    this.slang = [];
    this.filtered = [];
    this.activeTab = 'dictionary';
    this.searchTerm = '';
    this.activeCategory = 'all';
    this.quizState = null;
  }

  _esc(s) { if (s == null) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  _escAttr(s) { if (s == null) return ''; return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  connectedCallback() { this.loadData(); }

  async loadData() {
    try {
      const r = await fetch('data/slang.json');
      this.slang = await r.json();
      this.filtered = [...this.slang];
      this.render();
    } catch (e) {
      window.showToast?.('Failed to load slang data', 4000);
      this.innerHTML = `<cc-empty-state message="Failed to load slang data" icon="📻"></cc-empty-state>`;
    }
  }

  get categories() {
    return ['all', ...new Set(this.slang.map(s => s.category))];
  }

  filterSlang() {
    let r = [...this.slang];
    if (this.activeCategory !== 'all') r = r.filter(s => s.category === this.activeCategory);
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      r = r.filter(s =>
        s.term.toLowerCase().includes(q) ||
        s.definition.toLowerCase().includes(q) ||
        (s.aliases || []).some(a => a.toLowerCase().includes(q))
      );
    }
    this.filtered = r;
  }

  vibeBar(score) {
    const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#06b6d4','#8b5cf6','#ec4899','#f43f5e','#10b981'];
    const c = colors[score - 1] || '#b8860b';
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-size:11px;color:var(--muted);">Vibe</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="width:${score * 10}%;height:100%;background:${c};border-radius:3px;"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:${c};">${score}/10</span>
    </div>`;
  }

  categoryColor(cat) {
    const m = { 'Approval': '#22c55e', 'Insult': '#ef4444', 'Reaction': '#eab308', 'Lifestyle': '#8b5cf6', 'Disapproval': '#f97316', 'Greeting': '#06b6d4', 'Romance': '#ec4899' };
    return m[cat] || '#b8860b';
  }

  render() {
    const tabs = [
      { id: 'dictionary', label: 'Dictionary', icon: 'book-open' },
      { id: 'translator', label: 'Translator', icon: 'languages' },
      { id: 'quiz', label: 'Slang Quiz', icon: 'brain' },
      { id: 'trending', label: 'Trending', icon: 'flame' }
    ];

    this.innerHTML = `
      <style>
        .gs-wrap{max-width:1100px;margin:20px auto;padding:0 16px;}
        .gs-header{text-align:center;margin-bottom:28px;}
        .gs-header h1{font-family:var(--serif);font-size:2.2rem;margin:0;color:#b8860b;}
        .gs-header p{color:var(--muted);margin:4px 0 0;}
        .gs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .gs-term{font-size:1.3rem;font-weight:800;margin:0 0 4px;color:#b8860b;}
        .gs-def{color:var(--text);font-size:14px;line-height:1.5;margin:8px 0;}
        .gs-example{font-style:italic;color:var(--muted);font-size:13px;background:rgba(184,134,11,.06);padding:8px 12px;border-radius:8px;margin:8px 0;border-left:3px solid rgba(184,134,11,.3);}
        .gs-origin{font-size:11px;color:var(--muted);margin-top:8px;}
        .gs-aliases{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
        .gs-alias{font-size:11px;padding:2px 8px;background:rgba(184,134,11,.1);border-radius:6px;color:var(--muted);}
        .gs-cat-badge{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .gs-equiv{margin-top:12px;padding:10px 14px;background:rgba(184,134,11,.06);border-left:3px solid #b8860b;border-radius:0 8px 8px 0;font-size:12px;}
        .gs-equiv-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
        .gs-equiv-items{display:flex;gap:8px;flex-wrap:wrap;}
        .gs-equiv-tag{padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;}
        .gs-translator{max-width:700px;margin:0 auto;}
        .gs-textarea{width:100%;min-height:120px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:15px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;}
        .gs-textarea:focus{border-color:#b8860b;}
        .gs-dir-toggle{display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--border);}
        .gs-dir-btn{flex:1;padding:10px;text-align:center;background:var(--card-bg);cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;border:none;color:var(--text);}
        .gs-dir-btn.active{background:#b8860b;color:#000;}
        .gs-result-box{margin-top:20px;padding:20px;border-radius:12px;background:var(--card-bg);border:1px solid var(--border);min-height:60px;font-size:15px;line-height:1.6;}
        .gs-quiz-card{max-width:600px;margin:0 auto;text-align:center;}
        .gs-quiz-q{font-size:1.4rem;font-weight:700;margin:20px 0;font-family:var(--serif);color:#b8860b;}
        .gs-quiz-options{display:grid;gap:10px;margin:20px 0;}
        .gs-quiz-opt{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-size:14px;text-align:left;transition:all .2s;}
        .gs-quiz-opt:hover{border-color:#b8860b;background:rgba(184,134,11,.08);}
        .gs-quiz-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.15);}
        .gs-quiz-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.15);}
        .gs-quiz-progress{display:flex;gap:6px;justify-content:center;margin:20px 0;}
        .gs-quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);}
        .gs-quiz-dot.done{background:#22c55e;}
        .gs-quiz-dot.current{background:#b8860b;box-shadow:0 0 8px rgba(184,134,11,.6);}
        .gs-quiz-dot.wrong-dot{background:#ef4444;}
        .gs-quiz-score{font-size:3rem;font-weight:900;margin:10px 0;color:#b8860b;}
        .gs-trending-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
        .gs-trend-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
        .gs-trend-card:hover{border-color:#b8860b;transform:translateY(-3px);}
        .gs-trend-term{font-size:1.1rem;font-weight:800;margin:0 0 4px;}
        .gs-trend-score{font-size:2rem;font-weight:900;opacity:.2;position:absolute;top:8px;right:12px;}
        .gs-trend-bar{height:4px;border-radius:2px;margin-top:10px;}
        .gs-count{font-size:13px;color:var(--muted);margin:16px 0 0;text-align:center;}
        .gs-tab-icon{width:16px;height:16px;vertical-align:middle;margin-right:4px;}
        @media(max-width:600px){.gs-grid{grid-template-columns:1fr;}.gs-trending-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}}
      </style>
      <div class="gs-wrap">
        <cc-fade-in>
        <div class="gs-header">
          <h1>Silent Generation Slang Dictionary</h1>
          <p>Swell terms from the Greatest Generation — 1940s & 1950s lingo, daddy-o</p>
        </div>
        </cc-fade-in>
        <div style="display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;">
          ${tabs.map(t => `<button class="pill ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}" style="${this.activeTab === t.id ? 'background:#b8860b;color:#000;' : ''}">${t.label}</button>`).join('')}
        </div>
        <div id="gs-content"></div>
      </div>
    `;

    this.querySelectorAll('.pill[data-tab]').forEach(t => {
      t.addEventListener('click', () => {
        this.activeTab = t.dataset.tab;
        if (t.dataset.tab === 'quiz' && !this.quizState) this.startQuiz();
        this.render();
      });
    });

    const content = this.querySelector('#gs-content');
    if (this.activeTab === 'dictionary') this.renderDictionary(content);
    else if (this.activeTab === 'translator') this.renderTranslator(content);
    else if (this.activeTab === 'quiz') this.renderQuiz(content);
    else if (this.activeTab === 'trending') this.renderTrending(content);
  }

  renderEquivalents(eq) {
    if (!eq) return '';
    const labels = { genAlpha: 'Gen Alpha', genX: 'Gen X', genZ: 'Gen Z', genY: 'Millennial', boomer: 'Boomer' };
    const colors = { genAlpha: '#22c55e', genX: '#8b5cf6', genZ: '#06b6d4', genY: '#ec4899', boomer: '#f97316' };
    const items = Object.entries(eq).filter(([,v]) => v);
    if (!items.length) return '';
    return `<div class="gs-equiv">
      <div class="gs-equiv-label">Cross-Generational Equivalents</div>
      <div class="gs-equiv-items">
        ${items.map(([k, v]) => `<span class="gs-equiv-tag" style="background:${colors[k] || '#b8860b'}22;color:${colors[k] || '#b8860b'};">${this._esc(labels[k] || k)}: ${this._esc(v)}</span>`).join('')}
      </div>
    </div>`;
  }

  renderDictionary(el) {
    this.filterSlang();
    const catItems = this.categories.map(c => c === 'all' ? {value:'all',label:'All'} : {value:c,label:c});
    el.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <cc-search placeholder="Search slang terms..." value="${this._escAttr(this.searchTerm)}"></cc-search>
        <cc-view-toggle app="gen-silent" value="${this._dictView || 'cards'}"></cc-view-toggle>
      </div>
      <cc-pill-dropdown label="Category" items='${this._escAttr(JSON.stringify(catItems))}' value="${this._escAttr(this.activeCategory)}"></cc-pill-dropdown>
      <div class="gs-count">${this.filtered.length} term${this.filtered.length !== 1 ? 's' : ''} found</div>
      ${(this._dictView || 'cards') === 'list' ? `<div class="view-list" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="list-row" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <span class="row-name">${this._esc(s.term)}</span>
            <span class="gs-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};flex-shrink:0;font-size:11px;padding:2px 8px;border-radius:10px;">${this._esc(s.category)}</span>
            <span class="row-desc">${this._esc(s.definition)}</span>
            <span style="font-size:12px;color:var(--muted);flex-shrink:0;">🔥 ${s.vibeScore}/10</span>
          </div>
        `).join('')}
      </div>`
      : (this._dictView) === 'expanded' ? `<div class="view-expanded" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="expanded-card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
              <div class="gs-term">${this._esc(s.term)}</div>
              <span class="gs-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gs-def">${this._esc(s.definition)}</div>
            <div class="gs-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gs-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gs-aliases">${s.aliases.map(a => `<span class="gs-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>`
      : `<cc-stagger animation="fade-up" delay="60">
      <div class="gs-grid" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="gs-term">${this._esc(s.term)}</div>
              <span class="gs-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gs-def">${this._esc(s.definition)}</div>
            <div class="gs-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gs-origin">Origin: ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gs-aliases">${s.aliases.map(a => `<span class="gs-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${this.renderEquivalents(s.equivalents)}
          </div>
        `).join('')}
      </div>
      </cc-stagger>`}
    `;
    if (!this.filtered.length) {
      const grid = el.querySelector('.gs-grid') || el.querySelector('.view-list') || el.querySelector('.view-expanded');
      if (grid) grid.innerHTML = `<cc-empty-state message="No slang found. That's a real drag." icon="📻"></cc-empty-state>`;
    }

    el.querySelector('cc-search').addEventListener('cc-search', e => {
      this.searchTerm = e.detail.value;
      this.filterSlang();
      this.renderDictionary(el);
    });
    const vt = el.querySelector('cc-view-toggle');
    if (vt) vt.addEventListener('cc-view-change', e => {
      this._dictView = e.detail.view;
      this.renderDictionary(el);
    });
    el.querySelector('cc-pill-dropdown').addEventListener('dropdown-change', e => {
      this.activeCategory = e.detail.value;
      this.filterSlang();
      this.renderDictionary(el);
    });

    el.querySelectorAll('.card[data-id], .list-row[data-id], .expanded-card[data-id]').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gs-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gs-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gs-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gs-origin" style="margin-top:12px;">Origin: ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">Era: ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gs-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gs-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${this.renderEquivalents(s.equivalents)}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }

  renderTranslator(el) {
    this._transDir = this._transDir || 'to-gen';
    el.innerHTML = `
      <div class="gs-translator">
        <div class="gs-dir-toggle">
          <button class="gs-dir-btn ${this._transDir === 'to-gen' ? 'active' : ''}" data-dir="to-gen">Modern English → Silent Gen</button>
          <button class="gs-dir-btn ${this._transDir === 'from-gen' ? 'active' : ''}" data-dir="from-gen">Silent Gen → Modern English</button>
        </div>
        <textarea class="gs-textarea" placeholder="${this._transDir === 'to-gen' ? 'Type normal English here...' : 'Type Silent Gen slang here...'}">${this._transInput || ''}</textarea>
        <div style="text-align:center;margin-top:16px;">
          <button class="btn btn-primary" style="background:#b8860b;">Translate</button>
        </div>
        <div class="gs-result-box" id="gs-trans-result">${this._transResult || '<span style="color:var(--muted);">Translation will appear here, daddy-o</span>'}</div>
      </div>
    `;
    el.querySelectorAll('.gs-dir-btn').forEach(b => {
      b.addEventListener('click', () => { this._transDir = b.dataset.dir; this.renderTranslator(el); });
    });
    el.querySelector('.btn-primary').addEventListener('click', () => {
      const input = el.querySelector('.gs-textarea').value.trim();
      this._transInput = input;
      if (!input) { this._transResult = '<span style="color:var(--muted);">Type something first, will ya?</span>'; this.renderTranslator(el); return; }
      this._transResult = this._transDir === 'to-gen' ? this.translateToGen(input) : this.translateFromGen(input);
      this.renderTranslator(el);
    });
  }

  translateToGen(text) {
    const map = {
      'good': 'swell', 'great': 'the bee\'s knees', 'amazing': 'the cat\'s meow',
      'cool': 'keen', 'awesome': 'swell', 'excellent': 'cooking with gas',
      'attractive': 'a real dreamboat', 'handsome': 'a dreamboat', 'pretty': 'a dish',
      'beautiful': 'a real looker', 'hot': 'hubba hubba',
      'money': 'lettuce', 'dollars': 'clams', 'cash': 'dough',
      'car': 'jalopy', 'old car': 'heap', 'vehicle': 'jalopy',
      'clothes': 'threads', 'outfit': 'glad rags',
      'legs': 'gams', 'cigarette': 'gasper',
      'dance': 'sock hop', 'party': 'shindig',
      'leave': 'scram', 'go away': 'take a powder', 'get out': 'beat it',
      'boring': 'a drag', 'lame': 'a real drag', 'dull': 'what a drag',
      'nervous': 'got the heebie-jeebies', 'scared': 'got the willies',
      'honest': 'on the level', 'truthful': 'on the level',
      'friend': 'pal', 'buddy': 'daddy-o', 'dude': 'daddy-o',
      'woman': 'dame', 'girl': 'doll', 'guy': 'cat',
      'man': 'fella', 'boyfriend': 'steady', 'girlfriend': 'steady gal',
      'dating': 'going steady', 'kissing': 'necking',
      'fun': 'a gas', 'exciting': 'a real gas',
      'child': 'ankle biter', 'children': 'ankle biters', 'kids': 'ankle biters',
      'fancy': 'ritzy', 'luxurious': 'swanky', 'expensive': 'ritzy',
      'bald': 'chrome dome',
      'talking too much': 'bumping gums', 'gossip': 'bumping gums',
      'trouble': 'behind the eight ball', 'problem': 'in a jam',
      'lucky': 'pennies from heaven', 'fortunate': 'made in the shade',
      'successful': 'made in the shade', 'easy': 'made in the shade',
      'uncool': 'square', 'boring person': 'fuddy-duddy', 'nerd': 'square',
      'hello': 'hiya', 'hi': 'hiya', 'hey': 'say, daddy-o',
      'yes': 'you bet', 'no': 'no dice', 'okay': 'okey-dokey',
      'really': 'gee whiz', 'wow': 'hubba hubba', 'surprised': 'well I\'ll be',
      'bad': 'crummy', 'terrible': 'lousy', 'awful': 'the pits'
    };

    let result = this._esc(text.toLowerCase());
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    for (const [eng, gen] of sorted) {
      const re = new RegExp(`\\b${eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(re, `<strong style="color:#b8860b;">${this._esc(gen)}</strong>`);
    }
    if (result === text.toLowerCase()) {
      return `<strong>${this._esc(text)}</strong> — well, that's already swell as is, daddy-o!`;
    }
    return result;
  }

  translateFromGen(text) {
    const map = {};
    for (const s of this.slang) {
      map[s.term.toLowerCase()] = s.definition;
      for (const a of (s.aliases || [])) {
        if (a) map[a.toLowerCase()] = s.definition;
      }
    }
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    let result = this._esc(text);
    let found = false;
    for (const [slang, def] of sorted) {
      const re = new RegExp(`\\b${slang.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (re.test(result)) {
        found = true;
        result = result.replace(re, `<strong style="color:#b8860b;" title="${this._escAttr(def)}">[${this._esc(def.split('.')[0].trim())}]</strong>`);
      }
    }
    if (!found) return `Gee whiz, couldn't find any Silent Gen terms in there. Try: ${this.slang.slice(0, 5).map(s => this._esc(s.term)).join(', ')}`;
    return result;
  }

  startQuiz() {
    const shuffled = [...this.slang].sort(() => Math.random() - 0.5).slice(0, 10);
    this.quizState = {
      questions: shuffled.map(s => {
        const wrong = this.slang.filter(x => x.id !== s.id).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [s, ...wrong].sort(() => Math.random() - 0.5);
        return { term: s.term, correctId: s.id, options: options.map(o => ({ id: o.id, def: o.definition })) };
      }),
      current: 0, score: 0, answered: [], done: false
    };
  }

  renderQuiz(el) {
    if (!this.quizState) this.startQuiz();
    const q = this.quizState;

    if (q.done) {
      const pct = Math.round((q.score / q.questions.length) * 100);
      let title, msg;
      if (pct >= 90) { title = 'Real Hep Cat!'; msg = 'You\'re the bee\'s knees — a true master of Silent Gen lingo. Swell job!'; }
      else if (pct >= 70) { title = 'Cooking with Gas!'; msg = 'You know your stuff, daddy-o. Almost made in the shade.'; }
      else if (pct >= 50) { title = 'Getting There, Pal'; msg = 'Not bad, but you need to hit the soda fountain and study up.'; }
      else if (pct >= 30) { title = 'A Bit Square'; msg = 'Gee whiz, you\'ve got some learning to do. Hit the books!'; }
      else { title = 'Total Square'; msg = 'You\'re cruisin\' for a bruisin\' with scores like that. Time to study, fuddy-duddy!'; }

      el.innerHTML = `
        <div class="gs-quiz-card">
          <div class="gs-quiz-progress">${q.answered.map(a => `<div class="gs-quiz-dot ${a ? 'done' : 'wrong-dot'}"></div>`).join('')}</div>
          <h2 style="font-family:var(--serif);margin-top:24px;color:#b8860b;">${title}</h2>
          <div class="gs-quiz-score">${q.score}/${q.questions.length}</div>
          <p style="color:var(--muted);font-size:15px;margin:8px 0 24px;">${msg}</p>
          <p style="font-size:13px;color:var(--muted);">Silent Gen Cred: ${pct}%</p>
          <div style="height:8px;background:var(--border);border-radius:4px;margin:8px 0 24px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'};border-radius:4px;"></div>
          </div>
          <button class="btn btn-primary" id="gs-quiz-restart" style="background:#b8860b;">Try Again</button>
        </div>
      `;
      el.querySelector('#gs-quiz-restart').addEventListener('click', () => { this.startQuiz(); this.renderQuiz(el); });
      return;
    }

    const curr = q.questions[q.current];
    const answered = q.answered.length > q.current;

    el.innerHTML = `
      <div class="gs-quiz-card">
        <div class="gs-quiz-progress">
          ${q.questions.map((_, i) => {
            let cls = 'gs-quiz-dot';
            if (i < q.answered.length) cls += q.answered[i] ? ' done' : ' wrong-dot';
            else if (i === q.current) cls += ' current';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <p style="color:var(--muted);font-size:13px;margin:16px 0 0;">Question ${q.current + 1} of ${q.questions.length}</p>
        <div class="gs-quiz-q">What does "${this._esc(curr.term)}" mean?</div>
        <div class="gs-quiz-options">
          ${curr.options.map(o => {
            let cls = 'gs-quiz-opt';
            if (answered) {
              if (o.id === curr.correctId) cls += ' correct';
              else if (q._lastPick === o.id) cls += ' wrong';
            }
            return `<button class="${cls}" data-id="${this._escAttr(o.id)}" ${answered ? 'disabled' : ''}>${this._esc(o.def)}</button>`;
          }).join('')}
        </div>
        ${answered ? `<button class="btn btn-primary" id="gs-quiz-next" style="background:#b8860b;">${q.current < q.questions.length - 1 ? 'Next' : 'See Results'}</button>` : ''}
      </div>
    `;

    if (!answered) {
      el.querySelectorAll('.gs-quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const picked = btn.dataset.id;
          const correct = picked === curr.correctId;
          q._lastPick = picked;
          if (correct) q.score++;
          q.answered.push(correct);
          this.renderQuiz(el);
        });
      });
    }

    const nextBtn = el.querySelector('#gs-quiz-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        q.current++;
        if (q.current >= q.questions.length) q.done = true;
        this.renderQuiz(el);
      });
    }
  }

  renderTrending(el) {
    const sorted = [...this.slang].sort((a, b) => b.vibeScore - a.vibeScore);
    const top = sorted.slice(0, 20);
    el.innerHTML = `
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="font-family:var(--serif);margin:0;color:#b8860b;">Trending Wall</h2>
        <p style="color:var(--muted);font-size:14px;">The swellest Silent Gen slang, ranked by vibe score</p>
      </div>
      <div class="gs-trending-grid">
        ${top.map((s, i) => `
          <div class="gs-trend-card" title="${this._escAttr(s.definition)}" data-id="${this._escAttr(s.id)}">
            <div class="gs-trend-score">${s.vibeScore}</div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">#${i + 1}</div>
            <div class="gs-trend-term">${this._esc(s.term)}</div>
            <span class="gs-cat-badge" style="font-size:10px;background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <div class="gs-trend-bar" style="background:linear-gradient(90deg,${this.categoryColor(s.category)},transparent);"></div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.gs-trend-card').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gs-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gs-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gs-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gs-origin" style="margin-top:12px;">Origin: ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">Era: ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gs-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gs-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${this.renderEquivalents(s.equivalents)}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }
}

customElements.define('gen-silent', GenSilent);
