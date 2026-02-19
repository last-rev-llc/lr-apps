class GenBoomers extends HTMLElement {
  constructor() {
    super();
    this.slang = [];
    this.filtered = [];
    this.activeTab = 'dictionary';
    this.searchTerm = '';
    this.activeCategory = 'all';
    this.quizState = null;
  }

  connectedCallback() { this.loadData(); }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  _escAttr(s) {
    return (s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async loadData() {
    try {
      const r = await fetch('data/slang.json');
      this.slang = await r.json();
      this.filtered = [...this.slang];
      this.render();
    } catch (e) {
      console.error('GenBoomers load error:', e);
      this.innerHTML = `<cc-empty-state message="Failed to load slang data" icon="😵"></cc-empty-state>`;
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
    const c = colors[score - 1] || '#ff6347';
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-size:11px;color:var(--muted);">Vibe</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="width:${score * 10}%;height:100%;background:${c};border-radius:3px;"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:${c};">${score}/10</span>
    </div>`;
  }

  categoryColor(cat) {
    const m = { 'Approval': '#22c55e', 'Disapproval': '#ef4444', 'Reaction': '#eab308', 'Lifestyle': '#ff6347', 'Compliment': '#ec4899', 'Greeting': '#06b6d4' };
    return m[cat] || '#6b7280';
  }

  render() {
    const tabs = [
      { id: 'dictionary', label: '📖 Dictionary' },
      { id: 'translator', label: '🔄 Translator' },
      { id: 'quiz', label: '🌸 Slang Quiz' },
      { id: 'trending', label: '🔥 Trending' }
    ];

    this.innerHTML = `
      <style>
        .gb-wrap{--app-accent:#ff6347;--app-accent-06:color-mix(in srgb,var(--app-accent) 6%,transparent);--app-accent-08:color-mix(in srgb,var(--app-accent) 8%,transparent);--app-accent-12:color-mix(in srgb,var(--app-accent) 12%,transparent);--app-violet:var(--violet,#8b5cf6);max-width:1100px;margin:20px auto;padding:0 16px;}
        .gb-header{text-align:center;margin-bottom:28px;}
        .gb-header h1{font-family:var(--serif);font-size:2.2rem;margin:0;}
        .gb-header p{color:var(--muted);margin:4px 0 0;}
        .gb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .gb-term{font-size:1.3rem;font-weight:800;margin:0 0 4px;}
        .gb-def{color:var(--text);font-size:14px;line-height:1.5;margin:8px 0;}
        .gb-example{font-style:italic;color:var(--muted);font-size:13px;background:var(--app-accent-06);padding:8px 12px;border-radius:8px;margin:8px 0;}
        .gb-origin{font-size:11px;color:var(--muted);margin-top:8px;}
        .gb-aliases{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
        .gb-alias{font-size:11px;padding:2px 8px;background:var(--app-accent-06);border-radius:6px;color:var(--muted);}
        .gb-cat-badge{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .gb-translator{max-width:700px;margin:0 auto;}
        .gb-textarea{width:100%;min-height:120px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:15px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;}
        .gb-textarea:focus{border-color:var(--app-accent);}
        .gb-dir-toggle{display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--border);}
        .gb-dir-btn{flex:1;padding:10px;text-align:center;background:var(--card-bg);cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;border:none;color:var(--text);}
        .gb-dir-btn.active{background:var(--app-accent);color:#fff;}
        .gb-quiz-card{max-width:600px;margin:0 auto;text-align:center;}
        .gb-quiz-q{font-size:1.4rem;font-weight:700;margin:20px 0;font-family:var(--serif);}
        .gb-quiz-options{display:grid;gap:10px;margin:20px 0;}
        .gb-quiz-opt{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-size:14px;text-align:left;transition:all .2s;}
        .gb-quiz-opt:hover{border-color:var(--app-accent);background:var(--app-accent-08);}
        .gb-quiz-opt.correct{border-color:var(--green,#22c55e);background:rgba(34,197,94,.15);}
        .gb-quiz-opt.wrong{border-color:var(--danger,#ef4444);background:rgba(239,68,68,.15);}
        .gb-quiz-progress{display:flex;gap:6px;justify-content:center;margin:20px 0;}
        .gb-quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);}
        .gb-quiz-dot.done{background:var(--green,#22c55e);}
        .gb-quiz-dot.current{background:var(--app-accent);box-shadow:0 0 8px var(--app-accent);}
        .gb-quiz-dot.wrong-dot{background:var(--danger,#ef4444);}
        .gb-quiz-score{font-size:3rem;font-weight:900;margin:10px 0;}
        .gb-trending-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
        .gb-trend-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
        .gb-trend-card:hover{border-color:var(--app-accent);transform:translateY(-3px);}
        .gb-trend-term{font-size:1.1rem;font-weight:800;margin:0 0 4px;}
        .gb-trend-score{font-size:2rem;font-weight:900;opacity:.2;position:absolute;top:8px;right:12px;}
        .gb-trend-bar{height:4px;border-radius:2px;margin-top:10px;}
        .gb-count{font-size:13px;color:var(--muted);margin:16px 0 0;text-align:center;}
        .gb-result-box{margin-top:20px;padding:20px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);min-height:60px;line-height:1.7;font-size:15px;}
        @media(max-width:600px){.gb-grid{grid-template-columns:1fr;}.gb-trending-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}}
      </style>
      <div class="gb-wrap">
        <cc-fade-in>
        <div class="gb-header">
          <h1>🌸 Boomer Slang Dictionary</h1>
          <p>Far out — the grooviest slang from the flower power generation</p>
        </div>
        </cc-fade-in>
        <div style="display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;">
          ${tabs.map(t => `<button class="pill ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div id="gb-content"></div>
      </div>
    `;

    this.querySelectorAll('.pill[data-tab]').forEach(t => {
      t.addEventListener('click', () => {
        this.activeTab = t.dataset.tab;
        if (t.dataset.tab === 'quiz' && !this.quizState) this.startQuiz();
        this.render();
      });
    });

    const content = this.querySelector('#gb-content');
    if (this.activeTab === 'dictionary') this.renderDictionary(content);
    else if (this.activeTab === 'translator') this.renderTranslator(content);
    else if (this.activeTab === 'quiz') this.renderQuiz(content);
    else if (this.activeTab === 'trending') this.renderTrending(content);
  }

  renderDictionary(el) {
    this.filterSlang();
    const catItems = this.categories.map(c => c === 'all' ? {value:'all',label:'All'} : {value:c,label:c});
    el.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <cc-search placeholder="Search groovy slang terms..." value="${this._escAttr(this.searchTerm)}"></cc-search>
        <cc-view-toggle app="gen-boomers" value="${this._dictView || 'cards'}"></cc-view-toggle>
      </div>
      <cc-pill-dropdown label="Category" items='${this._escAttr(JSON.stringify(catItems))}' value="${this._escAttr(this.activeCategory)}"></cc-pill-dropdown>
      <div class="gb-count">${this.filtered.length} term${this.filtered.length !== 1 ? 's' : ''} found</div>
      ${(this._dictView || 'cards') === 'list' ? `<div class="view-list" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="list-row" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <span class="row-name">${this._esc(s.term)}</span>
            <span class="gb-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};flex-shrink:0;font-size:11px;padding:2px 8px;border-radius:10px;">${this._esc(s.category)}</span>
            <span class="row-desc">${this._esc(s.definition)}</span>
            <span style="font-size:12px;color:var(--muted);flex-shrink:0;">🔥 ${s.vibeScore}/10</span>
          </div>
        `).join('')}
      </div>`
      : (this._dictView) === 'expanded' ? `<div class="view-expanded" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="expanded-card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
              <div class="gb-term">${this._esc(s.term)}</div>
              <span class="gb-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gb-def">${this._esc(s.definition)}</div>
            <div class="gb-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gb-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gb-aliases">${s.aliases.map(a => `<span class="gb-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>`
      : `<cc-stagger animation="fade-up" delay="60">
      <div class="gb-grid" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="gb-term">${this._esc(s.term)}</div>
              <span class="gb-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gb-def">${this._esc(s.definition)}</div>
            <div class="gb-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gb-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gb-aliases">${s.aliases.map(a => `<span class="gb-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
      </cc-stagger>`}
    `;
    if (!this.filtered.length) {
      const container = el.querySelector('.gb-grid') || el.querySelector('.view-list') || el.querySelector('.view-expanded');
      if (container) container.innerHTML = `<cc-empty-state message="No slang found. That's a real drag, man." icon="😵"></cc-empty-state>`;
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
        const eqAlpha = s.equivalents?.genAlpha || '';
        const eqX = s.equivalents?.genX || '';
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', this._escAttr(s.term));
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gb-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gb-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gb-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gb-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gb-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gb-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${eqAlpha ? `<div style="margin-top:16px;padding:12px 16px;background:var(--app-accent-08);border-left:3px solid var(--app-accent);border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">🔄 Gen Alpha Says</div>
              <div style="font-size:15px;font-weight:700;color:var(--app-accent);">${this._esc(eqAlpha)}</div>
            </div>` : ''}
            ${eqX ? `<div style="margin-top:8px;padding:12px 16px;background:color-mix(in srgb,var(--app-violet) 8%,transparent);border-left:3px solid var(--app-violet);border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">📼 Gen X Says</div>
              <div style="font-size:15px;font-weight:700;color:var(--app-violet);">${this._esc(eqX)}</div>
            </div>` : ''}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }

  renderTranslator(el) {
    this._transDir = this._transDir || 'to-boomer';
    el.innerHTML = `
      <div class="gb-translator">
        <div class="gb-dir-toggle">
          <button class="gb-dir-btn ${this._transDir === 'to-boomer' ? 'active' : ''}" data-dir="to-boomer">English → Boomer 🌸</button>
          <button class="gb-dir-btn ${this._transDir === 'from-boomer' ? 'active' : ''}" data-dir="from-boomer">Boomer → English 📚</button>
        </div>
        <textarea class="gb-textarea" placeholder="${this._transDir === 'to-boomer' ? 'Type normal English here...' : 'Type Boomer slang here...'}">${this._esc(this._transInput || '')}</textarea>
        <div style="text-align:center;margin-top:16px;">
          <button class="btn btn-primary" style="background:var(--app-accent);">Translate ✌️</button>
        </div>
        <div class="gb-result-box" id="gb-trans-result">${this._transResult || '<span style="color:var(--muted);">Translation will appear here, man</span>'}</div>
      </div>
    `;
    el.querySelectorAll('.gb-dir-btn').forEach(b => {
      b.addEventListener('click', () => { this._transDir = b.dataset.dir; this.renderTranslator(el); });
    });
    el.querySelector('.btn-primary').addEventListener('click', () => {
      const input = el.querySelector('.gb-textarea').value.trim();
      this._transInput = input;
      if (!input) { this._transResult = '<span style="color:var(--muted);">Type something first, man</span>'; this.renderTranslator(el); return; }
      this._transResult = this._transDir === 'to-boomer' ? this.translateToBoomer(input) : this.translateFromBoomer(input);
      this.renderTranslator(el);
    });
  }

  translateToBoomer(text) {
    const map = {
      'cool': 'groovy', 'awesome': 'far out', 'great': 'out of sight', 'good': 'solid',
      'amazing': 'outta sight', 'excellent': 'boss', 'impressive': 'far out',
      'agree': 'right on', 'yes': 'right on', 'okay': 'solid',
      'money': 'bread', 'cash': 'bread', 'clothes': 'threads', 'outfit': 'threads',
      'apartment': 'pad', 'house': 'pad', 'home': 'pad',
      'relax': 'hang loose', 'chill': 'mellow out',
      'boring': 'a drag', 'lame': 'a drag', 'disappointing': 'a bummer',
      'police': 'the fuzz', 'cops': 'the fuzz',
      'leave': 'split', 'go': 'split',
      'talk': 'rap', 'chat': 'rap',
      'dance': 'boogie', 'party': 'boogie down',
      'attractive': 'foxy', 'hot': 'stone cold fox', 'beautiful': 'foxy',
      'understand': 'dig it', 'like': 'dig it', 'enjoy': 'dig',
      'goodbye': 'peace out', 'bye': 'peace out',
      'hello': 'what\u2019s happening', 'hi': 'hey man',
      'serious': 'heavy', 'intense': 'heavy',
      'weird': 'trippy', 'strange': 'far out',
      'fake': 'bogus', 'terrible': 'bogus',
      'government': 'The Man', 'authority': 'The Man',
      'person': 'cat', 'guy': 'cat', 'man': 'cat',
      'girlfriend': 'old lady', 'wife': 'old lady',
      'boyfriend': 'old man', 'husband': 'old man',
      'conventional': 'square', 'uncool': 'square',
      'tense': 'uptight', 'nervous': 'uptight',
      'tell me': 'lay it on me', 'really': 'far out',
      'excited': 'freaking out', 'panicking': 'freaking out',
      'happy': 'groovy', 'friend': 'brother'
    };

    let result = this._esc(text.toLowerCase());
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    for (const [eng, boomer] of sorted) {
      const re = new RegExp(`\\b${eng}\\b`, 'gi');
      result = result.replace(re, `<strong>${this._esc(boomer)}</strong>`);
    }
    if (result === this._esc(text.toLowerCase())) {
      return `<strong>${this._esc(text)}</strong> is already pretty groovy, man ✌️`;
    }
    return result + ' ✌️';
  }

  translateFromBoomer(text) {
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
        result = result.replace(re, `<strong title="${this._escAttr(def)}">[${this._esc(def.split('.')[0].trim())}]</strong>`);
      }
    }
    if (!found) return `Can't dig any Boomer terms in there, man. Try: ${this.slang.slice(0, 5).map(s => this._esc(s.term)).join(', ')}`;
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
      if (pct >= 90) { title = '✌️ TOTALLY FAR OUT'; msg = 'You lived through the Summer of Love and it shows. Right on, brother!'; }
      else if (pct >= 70) { title = '🌸 Certified Boomer'; msg = 'You\'re hip to the lingo. Solid knowledge, man.'; }
      else if (pct >= 50) { title = '☮️ Getting Groovy'; msg = 'Not bad but you need to listen to more Hendrix and Janis.'; }
      else if (pct >= 30) { title = '😬 Kinda Square'; msg = 'You\'re uptight, man. Time to mellow out with some vinyl.'; }
      else { title = '💀 Total Square'; msg = 'You have zero Boomer cred. Go watch Easy Rider and come back.'; }

      el.innerHTML = `
        <div class="gb-quiz-card">
          <div class="gb-quiz-progress">${q.answered.map(a => `<div class="gb-quiz-dot ${a ? 'done' : 'wrong-dot'}"></div>`).join('')}</div>
          <h2 style="font-family:var(--serif);margin-top:24px;">${title}</h2>
          <div class="gb-quiz-score">${q.score}/${q.questions.length}</div>
          <p style="color:var(--muted);font-size:15px;margin:8px 0 24px;">${msg}</p>
          <p style="font-size:13px;color:var(--muted);">Flower Power Level: ${pct}%</p>
          <div style="height:8px;background:var(--border);border-radius:4px;margin:8px 0 24px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${pct >= 70 ? 'var(--green,#22c55e)' : pct >= 50 ? 'var(--yellow,#eab308)' : 'var(--danger,#ef4444)'};border-radius:4px;"></div>
          </div>
          <button class="btn btn-primary" style="background:var(--app-accent);" id="gb-quiz-restart">Try Again 🔁</button>
        </div>
      `;
      el.querySelector('#gb-quiz-restart').addEventListener('click', () => { this.startQuiz(); this.renderQuiz(el); });
      return;
    }

    const curr = q.questions[q.current];
    const answered = q.answered.length > q.current;

    el.innerHTML = `
      <div class="gb-quiz-card">
        <div class="gb-quiz-progress">
          ${q.questions.map((_, i) => {
            let cls = 'gb-quiz-dot';
            if (i < q.answered.length) cls += q.answered[i] ? ' done' : ' wrong-dot';
            else if (i === q.current) cls += ' current';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <p style="color:var(--muted);font-size:13px;margin:16px 0 0;">Question ${q.current + 1} of ${q.questions.length}</p>
        <div class="gb-quiz-q">What does "${this._esc(curr.term)}" mean?</div>
        <div class="gb-quiz-options">
          ${curr.options.map(o => {
            let cls = 'gb-quiz-opt';
            if (answered) {
              if (o.id === curr.correctId) cls += ' correct';
              else if (q._lastPick === o.id) cls += ' wrong';
            }
            return `<button class="${cls}" data-id="${this._escAttr(o.id)}" ${answered ? 'disabled' : ''}>${this._esc(o.def)}</button>`;
          }).join('')}
        </div>
        ${answered ? `<button class="btn btn-primary" style="background:var(--app-accent);" id="gb-quiz-next">${q.current < q.questions.length - 1 ? 'Next →' : 'See Results 🏆'}</button>` : ''}
      </div>
    `;

    if (!answered) {
      el.querySelectorAll('.gb-quiz-opt').forEach(btn => {
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

    const nextBtn = el.querySelector('#gb-quiz-next');
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
        <h2 style="font-family:var(--serif);margin:0;">🔥 Trending Wall</h2>
        <p style="color:var(--muted);font-size:14px;">The grooviest Boomer slang, ranked by vibe score</p>
      </div>
      <div class="gb-trending-grid">
        ${top.map((s, i) => `
          <div class="gb-trend-card" title="${this._escAttr(s.definition)}" data-id="${this._escAttr(s.id)}">
            <div class="gb-trend-score">${s.vibeScore}</div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">#${i + 1}</div>
            <div class="gb-trend-term">${this._esc(s.term)}</div>
            <span class="gb-cat-badge" style="font-size:10px;background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <div class="gb-trend-bar" style="background:linear-gradient(90deg,${this.categoryColor(s.category)},transparent);"></div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.gb-trend-card').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', this._escAttr(s.term));
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gb-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gb-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gb-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gb-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gb-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gb-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${s.equivalents?.genAlpha ? `<div style="margin-top:16px;padding:12px 16px;background:var(--app-accent-08);border-left:3px solid var(--app-accent);border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">🔄 Gen Alpha Says</div>
              <div style="font-size:15px;font-weight:700;color:var(--app-accent);">${this._esc(s.equivalents.genAlpha)}</div>
            </div>` : ''}
            ${s.equivalents?.genX ? `<div style="margin-top:8px;padding:12px 16px;background:color-mix(in srgb,var(--app-violet) 8%,transparent);border-left:3px solid var(--app-violet);border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">📼 Gen X Says</div>
              <div style="font-size:15px;font-weight:700;color:var(--app-violet);">${this._esc(s.equivalents.genX)}</div>
            </div>` : ''}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }
}

customElements.define('gen-boomers', GenBoomers);
