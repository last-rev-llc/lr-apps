class GenZ extends HTMLElement {
  static BOOMER_MAP = {
    'vibe-check': "What's the 411",
    'no-cap': 'Swear on my life',
    'slaps': 'Groovy / Jammin',
    'hits-different': "There's nothing quite like it",
    'bet': 'You got it',
    'simp': 'Whipped / Lovesick',
    'karen': 'Difficult customer',
    'ok-boomer': 'Kids these days',
    'cheugy': 'Square / Dated',
    'understood-the-assignment': 'Knocked it out of the park',
    'rent-free': 'On my mind 24/7',
    'main-character': 'Center of attention',
    'its-giving': "It's very / It looks like",
    'ate': 'Nailed it',
    'periodt': 'Case closed',
    'bestie': 'Pal / Buddy',
    'slay': 'You go girl',
    'unalive': '[the actual word]',
    'ick': 'Turn-off / Deal-breaker',
    'beige-flag': 'Quirky but harmless',
    'red-flag': 'Warning sign / Bad news',
    'green-flag': 'Keeper',
    'situationship': "It's complicated",
    'gaslighting': 'Lying through their teeth',
    'love-bombing': 'Coming on too strong',
    'quiet-quitting': 'Doing the bare minimum',
    'soft-launch': 'Keeping it private',
    'hard-launch': 'Making it official',
    'roman-empire': "Can't get it off my mind",
    'girl-dinner': "That's not a real meal",
    'girl-math': "That doesn't add up",
    'delulu': 'Pipe dream / Wishful thinking',
    'aura': 'Reputation / Presence',
    'core-memory': 'One for the books',
    'bussin': 'Delicious / Top-notch',
    'sus': 'Fishy / Shady',
    'living-for-this': 'Really enjoying this',
    'toxic': 'Bad news',
    'caught-in-4k': 'Caught red-handed'
  };

  constructor() {
    super();
    this.slang = [];
    this.filtered = [];
    this.activeTab = 'dictionary';
    this.searchTerm = '';
    this.activeCategory = 'all';
    this.quizState = null;
  }

  _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  _escAttr(s) { return this._esc(s).replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

  connectedCallback() { this.loadData(); }

  async loadData() {
    try {
      // Try DB first, fall back to JSON
      if (window.GenZDB) {
        this.db = await GenZDB.init();
        const rows = await this.db.getAll();
        if (rows.length) {
          this.slang = rows.map(r => ({
            ...r,
            vibeScore: r.vibe_score ?? r.vibeScore ?? 0,
          }));
        }
      }
      if (!this.slang.length) {
        const src = this.getAttribute('src') || 'data/slang.json';
        const r = await fetch(src);
        this.slang = await r.json();
      }
      this.filtered = [...this.slang];
      this.render();
    } catch (e) {
      console.error('GenZ load error:', e);
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
    const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#06b6d4','#8b5cf6','#e040fb','#f43f5e','#10b981'];
    const c = colors[score - 1] || '#e040fb';
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-size:11px;color:var(--muted);">Vibe</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="width:${score * 10}%;height:100%;background:${c};border-radius:3px;"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:${c};">${score}/10</span>
    </div>`;
  }

  categoryColor(cat) {
    const m = { compliment: '#22c55e', insult: '#ef4444', reaction: '#eab308', lifestyle: '#e040fb', 'internet culture': '#06b6d4', dating: '#f472b6' };
    return m[cat] || '#6b7280';
  }

  render() {
    const tabs = [
      { id: 'dictionary', label: '📖 Dictionary' },
      { id: 'translator', label: '🔄 Translator' },
      { id: 'quiz', label: '💅 Quiz' },
      { id: 'trending', label: '🔥 Trending' }
    ];

    this.innerHTML = `
      <style>
        .gz-wrap{max-width:1100px;margin:20px auto;padding:0 16px;}
        .gz-header{text-align:center;margin-bottom:28px;}
        .gz-header h1{font-family:var(--serif);font-size:2.2rem;margin:0;}
        .gz-header p{color:var(--muted);margin:4px 0 0;}
        .gz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .gz-term{font-size:1.3rem;font-weight:800;margin:0 0 4px;}
        .gz-def{color:var(--text);font-size:14px;line-height:1.5;margin:8px 0;}
        .gz-example{font-style:italic;color:var(--muted);font-size:13px;background:rgba(224,64,251,.06);padding:8px 12px;border-radius:8px;margin:8px 0;}
        .gz-origin{font-size:11px;color:var(--muted);margin-top:8px;}
        .gz-aliases{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
        .gz-alias{font-size:11px;padding:2px 8px;background:rgba(224,64,251,.08);border-radius:6px;color:var(--muted);}
        .gz-cat-badge{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .gz-translator{max-width:700px;margin:0 auto;}
        .gz-textarea{width:100%;min-height:120px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:15px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;}
        .gz-textarea:focus{border-color:#e040fb;}
        .gz-dir-toggle{display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--border);}
        .gz-dir-btn{flex:1;padding:10px;text-align:center;background:var(--card);cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;border:none;color:var(--text);}
        .gz-dir-btn.active{background:#e040fb;color:#000;}
        .gz-result-box{margin-top:20px;padding:20px;border-radius:12px;border:1px solid var(--border);background:var(--card);font-size:15px;line-height:1.6;}
        .gz-quiz-card{max-width:600px;margin:0 auto;text-align:center;}
        .gz-quiz-q{font-size:1.4rem;font-weight:700;margin:20px 0;font-family:var(--serif);}
        .gz-quiz-options{display:grid;gap:10px;margin:20px 0;}
        .gz-quiz-opt{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:14px;text-align:left;transition:all .2s;}
        .gz-quiz-opt:hover{border-color:#e040fb;background:rgba(224,64,251,.08);}
        .gz-quiz-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.15);}
        .gz-quiz-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.15);}
        .gz-quiz-progress{display:flex;gap:6px;justify-content:center;margin:20px 0;}
        .gz-quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);}
        .gz-quiz-dot.done{background:#22c55e;}
        .gz-quiz-dot.current{background:#e040fb;box-shadow:0 0 8px #e040fb;}
        .gz-quiz-dot.wrong-dot{background:#ef4444;}
        .gz-quiz-score{font-size:3rem;font-weight:900;margin:10px 0;}
        .gz-trending-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
        .gz-trend-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
        .gz-trend-card:hover{border-color:#e040fb;transform:translateY(-3px);}
        .gz-trend-term{font-size:1.1rem;font-weight:800;margin:0 0 4px;}
        .gz-trend-score{font-size:2rem;font-weight:900;opacity:.2;position:absolute;top:8px;right:12px;}
        .gz-trend-bar{height:4px;border-radius:2px;margin-top:10px;}
        .gz-count{font-size:13px;color:var(--muted);margin:16px 0 0;text-align:center;}
        @media(max-width:600px){.gz-grid{grid-template-columns:1fr;}.gz-trending-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}}
      </style>
      <div class="gz-wrap">
        <cc-fade-in>
        <div class="gz-header">
          <h1>💅 Gen Z Slang Dictionary</h1>
          <p>No cap, this is the definitive guide to Gen Z speak, periodt.</p>
        </div>
        </cc-fade-in>
        <div style="display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;">
          ${tabs.map(t => `<button class="pill ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div id="gz-content"></div>
      </div>
    `;

    this.querySelectorAll('.pill[data-tab]').forEach(t => {
      t.addEventListener('click', () => {
        this.activeTab = t.dataset.tab;
        if (t.dataset.tab === 'quiz' && !this.quizState) this.startQuiz();
        this.render();
      });
    });

    const content = this.querySelector('#gz-content');
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
        <cc-search placeholder="Search Gen Z slang..." value="${this._escAttr(this.searchTerm)}"></cc-search>
        <cc-view-toggle app="gen-z" value="${this._dictView || 'cards'}"></cc-view-toggle>
      </div>
      <cc-pill-dropdown label="Category" items='${JSON.stringify(catItems)}' value="${this.activeCategory}"></cc-pill-dropdown>
      <div class="gz-count">${this.filtered.length} term${this.filtered.length !== 1 ? 's' : ''} found</div>
      ${(this._dictView || 'cards') === 'list' ? `<div class="view-list" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="list-row" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <span class="row-name">${this._esc(s.term)}</span>
            <span class="gz-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};flex-shrink:0;font-size:11px;padding:2px 8px;border-radius:10px;">${this._esc(s.category)}</span>
            <span class="row-desc">${this._esc(s.definition)}</span>
            <span style="font-size:12px;color:var(--muted);flex-shrink:0;">🔥 ${s.vibeScore}/10</span>
          </div>
        `).join('')}
      </div>`
      : (this._dictView) === 'expanded' ? `<div class="view-expanded" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="expanded-card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
              <div class="gz-term">${this._esc(s.term)}</div>
              <span class="gz-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gz-def">${this._esc(s.definition)}</div>
            <div class="gz-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gz-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gz-aliases">${s.aliases.map(a => `<span class="gz-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>`
      : `<cc-stagger animation="fade-up" delay="60">
      <div class="gz-grid" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="gz-term">${this._esc(s.term)}</div>
              <span class="gz-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gz-def">${this._esc(s.definition)}</div>
            <div class="gz-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gz-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gz-aliases">${s.aliases.map(a => `<span class="gz-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
      </cc-stagger>`}
    `;
    if (!this.filtered.length) {
      const emptyTarget = el.querySelector('.gz-grid') || el.querySelector('.view-list') || el.querySelector('.view-expanded');
      if (emptyTarget) emptyTarget.innerHTML = `<cc-empty-state message="No slang found — that's lowkey mid." icon="😵"></cc-empty-state>`;
    }

    el.querySelector('cc-search').addEventListener('cc-search', e => {
      this.searchTerm = e.detail.value;
      this.renderDictionary(el);
    });
    const vt = el.querySelector('cc-view-toggle');
    if (vt) vt.addEventListener('cc-view-change', e => {
      this._dictView = e.detail.view;
      this.renderDictionary(el);
    });
    el.querySelector('cc-pill-dropdown').addEventListener('dropdown-change', e => {
      this.activeCategory = e.detail.value;
      this.renderDictionary(el);
    });

    el.querySelectorAll('.card[data-id], .list-row[data-id], .expanded-card[data-id]').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const boomerText = GenZ.BOOMER_MAP[s.id] || '';
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gz-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gz-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gz-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gz-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gz-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gz-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${s.equivalents ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(224,64,251,.08);border-left:3px solid #e040fb;border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">🔄 Cross-Generational</div>
              ${Object.entries(s.equivalents).map(([gen, eq]) => `<div style="font-size:13px;margin:2px 0;"><strong style="color:#e040fb;">${this._esc(gen)}:</strong> ${this._esc(eq)}</div>`).join('')}
            </div>` : ''}
            ${boomerText ? `<div style="margin-top:12px;padding:12px 16px;background:rgba(245,158,11,.08);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">👴 Boomers Said</div>
              <div style="font-size:15px;font-weight:700;color:#f59e0b;">${this._esc(boomerText)}</div>
            </div>` : ''}
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
      <div class="gz-translator">
        <div class="gz-dir-toggle">
          <button class="gz-dir-btn ${this._transDir === 'to-gen' ? 'active' : ''}" data-dir="to-gen">English → Gen Z 💅</button>
          <button class="gz-dir-btn ${this._transDir === 'from-gen' ? 'active' : ''}" data-dir="from-gen">Gen Z → English 📚</button>
        </div>
        <textarea class="gz-textarea" placeholder="${this._transDir === 'to-gen' ? 'Type normal English here...' : 'Type Gen Z slang here...'}">${this._esc(this._transInput || '')}</textarea>
        <div style="text-align:center;margin-top:16px;">
          <button class="btn btn-primary" style="background:#e040fb;">Translate 💅</button>
        </div>
        <div class="gz-result-box" id="gz-trans-result">${this._transResult || '<span style="color:var(--muted);">Translation will appear here bestie</span>'}</div>
      </div>
    `;
    el.querySelectorAll('.gz-dir-btn').forEach(b => {
      b.addEventListener('click', () => { this._transDir = b.dataset.dir; this.renderTranslator(el); });
    });
    el.querySelector('.btn-primary').addEventListener('click', () => {
      const input = el.querySelector('.gz-textarea').value.trim();
      this._transInput = input;
      if (!input) { this._transResult = '<span style="color:var(--muted);">Type something first bestie</span>'; this.renderTranslator(el); return; }
      this._transResult = this._transDir === 'to-gen' ? this.translateToGen(input) : this.translateFromGen(input);
      this.renderTranslator(el);
    });
  }

  translateToGen(text) {
    const map = {
      'good': 'bussin', 'great': 'slaps', 'amazing': 'slay', 'cool': 'no cap fire',
      'awesome': 'hits different', 'really': 'fr fr', 'very': 'lowkey',
      'suspicious': 'sus', 'lying': 'capping', 'truth': 'no cap',
      'agree': 'bet', 'okay': 'bet', 'yes': 'bet',
      'funny': 'sending me 💀', 'hilarious': "I'm dead 💀",
      'attractive': 'got rizz', 'charming': 'W rizz',
      'weird': 'sus ngl', 'strange': 'giving ick',
      'average': 'mid', 'mediocre': 'mid af',
      'show off': 'flex', 'brag': 'flexing',
      'gossip': 'tea ☕', 'drama': 'the tea is piping hot',
      'embarrassing': 'cringe', 'awkward': 'giving me the ick',
      'independent': 'main character energy', 'confident': 'understood the assignment',
      'delusional': 'delulu (but delulu is the solulu)',
      'phase': 'era', 'energy': 'aura',
      'win': 'W', 'lose': 'L', 'loss': 'L',
      'serious': 'no cap', 'honestly': 'ngl',
      'perfect': 'ate and left no crumbs', 'excellent': 'understood the assignment',
      'bad': 'L', 'terrible': 'massive L',
      'throw': 'yeet', 'beautiful': 'snatched',
      'fan': 'stan', 'obsessed': 'living for this rent free',
      'boyfriend': 'situationship', 'relationship': 'situationship',
      'compliment': 'hype up', 'praise': 'gassing up',
      'caught': 'caught in 4K', 'evidence': '4K footage',
      'special': 'hits different', 'unique': 'hits different fr',
      'manipulate': 'gaslight gatekeep girlboss',
      'snack': 'girl dinner', 'dinner': 'girl dinner',
      'overthinking': 'living rent free in my head',
      'obsession': 'my roman empire'
    };

    const escaped = this._esc(text);
    let result = escaped.toLowerCase();
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    for (const [eng, gen] of sorted) {
      const re = new RegExp(`\\b${eng}\\b`, 'gi');
      result = result.replace(re, `<strong style="color:#e040fb">${this._esc(gen)}</strong>`);
    }
    if (result === escaped.toLowerCase()) {
      return `<strong>${escaped}</strong> is already giving main character energy ngl 💅`;
    }
    return result + ' 💅';
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
        result = result.replace(re, `<strong style="color:#e040fb" title="${this._escAttr(def)}">[${this._esc(def.split('.')[0].trim())}]</strong>`);
      }
    }
    if (!found) return `Hmm bestie, couldn't find any Gen Z terms in there. Try: ${this.slang.slice(0, 5).map(s => this._esc(s.term)).join(', ')}`;
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
      if (pct >= 90) { title = '💅 CERTIFIED GEN Z'; msg = "You understood the assignment bestie. No cap, you ate and left no crumbs."; }
      else if (pct >= 70) { title = '🔥 Lowkey Iconic'; msg = "You're giving main character energy. Not perfect but it slaps."; }
      else if (pct >= 50) { title = '😤 Beige Flag'; msg = "Mid performance bestie. You need more TikTok time."; }
      else if (pct >= 30) { title = '😬 Giving Ick'; msg = "That's lowkey embarrassing. Are you a millennial in disguise?"; }
      else { title = '💀 OK Boomer'; msg = "You have zero Gen Z knowledge. Touch your phone, not grass."; }

      el.innerHTML = `
        <div class="gz-quiz-card">
          <div class="gz-quiz-progress">${q.answered.map(a => `<div class="gz-quiz-dot ${a ? 'done' : 'wrong-dot'}"></div>`).join('')}</div>
          <h2 style="font-family:var(--serif);margin-top:24px;">${title}</h2>
          <div class="gz-quiz-score">${q.score}/${q.questions.length}</div>
          <p style="color:var(--muted);font-size:15px;margin:8px 0 24px;">${msg}</p>
          <p style="font-size:13px;color:var(--muted);">Gen Z Level: ${pct}%</p>
          <div style="height:8px;background:var(--border);border-radius:4px;margin:8px 0 24px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'};border-radius:4px;"></div>
          </div>
          <button class="btn btn-primary" style="background:#e040fb;" id="gz-quiz-restart">Try Again 🔁</button>
        </div>
      `;
      el.querySelector('#gz-quiz-restart').addEventListener('click', () => { this.startQuiz(); this.renderQuiz(el); });
      return;
    }

    const curr = q.questions[q.current];
    const answered = q.answered.length > q.current;

    el.innerHTML = `
      <div class="gz-quiz-card">
        <div class="gz-quiz-progress">
          ${q.questions.map((_, i) => {
            let cls = 'gz-quiz-dot';
            if (i < q.answered.length) cls += q.answered[i] ? ' done' : ' wrong-dot';
            else if (i === q.current) cls += ' current';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <p style="color:var(--muted);font-size:13px;margin:16px 0 0;">Question ${q.current + 1} of ${q.questions.length}</p>
        <div class="gz-quiz-q">What does "${this._esc(curr.term)}" mean?</div>
        <div class="gz-quiz-options">
          ${curr.options.map(o => {
            let cls = 'gz-quiz-opt';
            if (answered) {
              if (o.id === curr.correctId) cls += ' correct';
              else if (q._lastPick === o.id) cls += ' wrong';
            }
            return `<button class="${cls}" data-id="${this._escAttr(o.id)}" ${answered ? 'disabled' : ''}>${this._esc(o.def)}</button>`;
          }).join('')}
        </div>
        ${answered ? `<button class="btn btn-primary" style="background:#e040fb;" id="gz-quiz-next">${q.current < q.questions.length - 1 ? 'Next →' : 'See Results 💅'}</button>` : ''}
      </div>
    `;

    if (!answered) {
      el.querySelectorAll('.gz-quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          q._lastPick = btn.dataset.id;
          q.answered.push(btn.dataset.id === curr.correctId);
          if (btn.dataset.id === curr.correctId) q.score++;
          this.renderQuiz(el);
        });
      });
    }

    const nextBtn = el.querySelector('#gz-quiz-next');
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
        <p style="color:var(--muted);font-size:14px;">The hottest Gen Z slang ranked by vibe score</p>
      </div>
      <div class="gz-trending-grid">
        ${top.map((s, i) => `
          <div class="gz-trend-card" title="${this._escAttr(s.definition)}" data-id="${this._escAttr(s.id)}">
            <div class="gz-trend-score">${s.vibeScore}</div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">#${i + 1}</div>
            <div class="gz-trend-term">${this._esc(s.term)}</div>
            <span class="gz-cat-badge" style="font-size:10px;background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <div class="gz-trend-bar" style="background:linear-gradient(90deg,${this.categoryColor(s.category)},transparent);"></div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.gz-trend-card').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gz-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gz-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gz-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gz-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }
}

customElements.define('gen-z', GenZ);
