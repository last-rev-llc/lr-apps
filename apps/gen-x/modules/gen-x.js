class GenX extends HTMLElement {
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
  _escAttr(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  connectedCallback() {
    this.loadData();
  }

  async loadData() {
    try {
      const r = await fetch('data/slang.json');
      this.slang = await r.json();
      this.filtered = [...this.slang];
      this.render();
    } catch (e) {
      console.error('GenX load error:', e);
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
    const colors = ['var(--red,#ef4444)','var(--orange,#f97316)','var(--yellow,#eab308)','#84cc16','var(--green,#22c55e)','var(--cyan,#06b6d4)','var(--purple,#8b5cf6)','var(--pink,#ec4899)','#f43f5e','var(--green,#10b981)'];
    const c = colors[score - 1] || 'var(--purple,#8b5cf6)';
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-size:11px;color:var(--muted);">Vibe</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="width:${score * 10}%;height:100%;background:${c};border-radius:3px;"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:${c};">${score}/10</span>
    </div>`;
  }

  categoryColor(cat) {
    const m = { 'Approval': '#22c55e', 'Insult': '#ef4444', 'Reaction': '#eab308', 'Lifestyle': '#8b5cf6', 'Disapproval': '#f97316', 'Greeting': '#06b6d4', 'Internet Culture': '#ec4899' };
    return m[cat] || '#6b7280';
  }

  categoryEmoji(cat) {
    const m = { 'Approval': '🤙', 'Insult': '💀', 'Reaction': '⚡', 'Lifestyle': '🛹', 'Disapproval': '👎', 'Greeting': '🤝', 'Internet Culture': '📺' };
    return m[cat] || '📝';
  }

  render() {
    const tabs = [
      { id: 'dictionary', label: '📖 Dictionary', icon: '📖' },
      { id: 'translator', label: '🔄 Translator', icon: '🔄' },
      { id: 'quiz', label: '📼 Slang Quiz', icon: '📼' },
      { id: 'trending', label: '🔥 Trending', icon: '🔥' }
    ];

    this.innerHTML = `
      <style>
        .gx-wrap{max-width:1100px;margin:20px auto;padding:0 16px;}
        .gx-header{text-align:center;margin-bottom:28px;}
        .gx-header h1{font-family:var(--serif);font-size:2.2rem;margin:0;}
        .gx-header p{color:var(--muted);margin:4px 0 0;}
        .gx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .gx-term{font-size:1.3rem;font-weight:800;margin:0 0 4px;}
        .gx-def{color:var(--text);font-size:14px;line-height:1.5;margin:8px 0;}
        .gx-example{font-style:italic;color:var(--muted);font-size:13px;background:rgba(255,255,255,.04);padding:8px 12px;border-radius:8px;margin:8px 0;}
        .gx-origin{font-size:11px;color:var(--muted);margin-top:8px;}
        .gx-aliases{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
        .gx-alias{font-size:11px;padding:2px 8px;background:rgba(255,255,255,.06);border-radius:6px;color:var(--muted);}
        .gx-cat-badge{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .gx-translator{max-width:700px;margin:0 auto;}
        .gx-textarea{width:100%;min-height:120px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:15px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;}
        .gx-textarea:focus{border-color:var(--accent);}
        .gx-dir-toggle{display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--border);}
        .gx-dir-btn{flex:1;padding:10px;text-align:center;background:var(--card-bg);cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;border:none;color:var(--text);}
        .gx-dir-btn.active{background:var(--accent);color:#000;}
        .gx-quiz-card{max-width:600px;margin:0 auto;text-align:center;}
        .gx-quiz-q{font-size:1.4rem;font-weight:700;margin:20px 0;font-family:var(--serif);}
        .gx-quiz-options{display:grid;gap:10px;margin:20px 0;}
        .gx-quiz-opt{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-size:14px;text-align:left;transition:all .2s;}
        .gx-quiz-opt:hover{border-color:var(--accent);background:rgba(245,158,11,.08);}
        .gx-quiz-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.15);}
        .gx-quiz-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.15);}
        .gx-quiz-progress{display:flex;gap:6px;justify-content:center;margin:20px 0;}
        .gx-quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);}
        .gx-quiz-dot.done{background:#22c55e;}
        .gx-quiz-dot.current{background:var(--accent);box-shadow:0 0 8px var(--accent);}
        .gx-quiz-dot.wrong-dot{background:#ef4444;}
        .gx-quiz-score{font-size:3rem;font-weight:900;margin:10px 0;}
        .gx-trending-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
        .gx-trend-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
        .gx-trend-card:hover{border-color:var(--accent);transform:translateY(-3px);}
        .gx-trend-term{font-size:1.1rem;font-weight:800;margin:0 0 4px;}
        .gx-trend-score{font-size:2rem;font-weight:900;opacity:.2;position:absolute;top:8px;right:12px;}
        .gx-trend-bar{height:4px;border-radius:2px;margin-top:10px;}
        .gx-count{font-size:13px;color:var(--muted);margin:16px 0 0;text-align:center;}
        @media(max-width:600px){.gx-grid{grid-template-columns:1fr;}.gx-trending-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}}
      </style>
      <div class="gx-wrap">
        <cc-fade-in>
        <div class="gx-header">
          <h1>📼 Gen X Slang Dictionary</h1>
          <p>Whatever, dude — this is the most phat slang reference, fo' shizzle</p>
        </div>
        </cc-fade-in>
        <div style="display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;">
          ${tabs.map(t => `<button class="pill ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div id="gx-content"></div>
      </div>
    `;

    this.querySelectorAll('.pill[data-tab]').forEach(t => {
      t.addEventListener('click', () => {
        this.activeTab = t.dataset.tab;
        if (t.dataset.tab === 'quiz' && !this.quizState) this.startQuiz();
        this.render();
      });
    });

    const content = this.querySelector('#gx-content');
    if (this.activeTab === 'dictionary') this.renderDictionary(content);
    else if (this.activeTab === 'translator') this.renderTranslator(content);
    else if (this.activeTab === 'quiz') this.renderQuiz(content);
    else if (this.activeTab === 'trending') this.renderTrending(content);
  }

  renderDictionary(el) {
    this.filterSlang();
    const catItems = this.categories.map(c => c === 'all' ? {value:'all',label:'All'} : {value:c,label:c});
    el.innerHTML = `
      <cc-search placeholder="Search slang terms..." value="${this._escAttr(this.searchTerm)}"></cc-search>
      <cc-pill-dropdown label="Category" items='${this._escAttr(JSON.stringify(catItems))}' value="${this._escAttr(this.activeCategory)}"></cc-pill-dropdown>
      <div class="gx-count">${this.filtered.length} term${this.filtered.length !== 1 ? 's' : ''} found</div>
      <cc-stagger animation="fade-up" delay="60">
      <div class="gx-grid" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="gx-term">${this._esc(s.term)}</div>
              <span class="gx-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gx-def">${this._esc(s.definition)}</div>
            <div class="gx-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gx-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gx-aliases">${s.aliases.map(a => `<span class="gx-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
      </cc-stagger>
    `;
    if (!this.filtered.length) {
      const container = el.querySelector('.gx-grid') || el.querySelector('.view-list') || el.querySelector('.view-expanded');
      if (container) container.innerHTML = `<cc-empty-state message="No slang found for that search. That's totally bogus." icon="😵"></cc-empty-state>`;
    }

    el.querySelector('cc-search').addEventListener('cc-search', e => {
      this.searchTerm = e.detail.value;
      this.filterSlang();
      this.renderDictionary(el);
    });
    el.querySelector('cc-pill-dropdown').addEventListener('dropdown-change', e => {
      this.activeCategory = e.detail.value;
      this.filterSlang();
      this.renderDictionary(el);
    });

    el.querySelectorAll('.card[data-id]').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const eqText = s.equivalents?.genAlpha || '';
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gx-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gx-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gx-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gx-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gx-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gx-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${eqText ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(139,92,246,.08);border-left:3px solid #8b5cf6;border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">🔄 Gen Alpha Says</div>
              <div style="font-size:15px;font-weight:700;color:#8b5cf6;">${this._esc(eqText)}</div>
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
      <div class="gx-translator">
        <div class="gx-dir-toggle">
          <button class="gx-dir-btn ${this._transDir === 'to-gen' ? 'active' : ''}" data-dir="to-gen">English → Gen X 📼</button>
          <button class="gx-dir-btn ${this._transDir === 'from-gen' ? 'active' : ''}" data-dir="from-gen">Gen X → English 📚</button>
        </div>
        <textarea class="gx-textarea" placeholder="${this._transDir === 'to-gen' ? 'Type normal English here...' : 'Type Gen X slang here...'}">${this._esc(this._transInput || '')}</textarea>
        <div style="text-align:center;">
          <button class="btn btn-primary">Translate 🤙</button>
        </div>
        <div class="gx-result-box" id="gx-trans-result">${this._transResult || '<span style="color:var(--muted);">Translation will appear here, dude</span>'}</div>
      </div>
    `;
    el.querySelectorAll('.gx-dir-btn').forEach(b => {
      b.addEventListener('click', () => { this._transDir = b.dataset.dir; this.renderTranslator(el); });
    });
    el.querySelector('.btn-primary').addEventListener('click', () => {
      const input = el.querySelector('.gx-textarea').value.trim();
      this._transInput = input;
      if (!input) { this._transResult = '<span style="color:var(--muted);">Type something first, homeslice</span>'; this.renderTranslator(el); return; }
      this._transResult = this._transDir === 'to-gen' ? this.translateToGen(input) : this.translateFromGen(input);
      this.renderTranslator(el);
    });
  }

  translateToGen(text) {
    const map = {
      'good': 'dope', 'great': 'da bomb', 'amazing': 'phat', 'cool': 'fly',
      'awesome': 'radical', 'really': 'hella', 'very': 'mad',
      'suspicious': 'sketchy', 'lying': 'bogus', 'truth': 'word',
      'agree': 'word', 'okay': 'aight', 'yes': 'word',
      'funny': 'hella funny', 'hilarious': 'I\'m dying, dude',
      'attractive': 'fly', 'charming': 'smooth player',
      'weird': 'trippin\'', 'strange': 'buggin\'',
      'average': 'whatever', 'mediocre': 'wack',
      'show off': 'frontin\'', 'brag': 'flexin\'',
      'gossip': 'the 411', 'drama': 'mad drama',
      'embarrassing': 'bogus', 'awkward': 'sketch',
      'independent': 'keepin\' it real', 'confident': 'all that and a bag of chips',
      'delusional': 'trippin\' hard',
      'phase': 'era', 'energy': 'vibe',
      'win': 'booyah', 'lose': 'bummer', 'loss': 'total bummer',
      'serious': 'fo\' real', 'honestly': 'keeping it real',
      'perfect': 'da bomb', 'excellent': 'stellar',
      'bad': 'wack', 'terrible': 'totally bogus',
      'food': 'grub', 'eat': 'chow down',
      'throw': 'chuck', 'beautiful': 'fly',
      'fan': 'groupie', 'obsessed': 'mad into it',
      'crazy': 'gnarly', 'chaotic': 'illin\'',
      'stop': 'take a chill pill', 'calm down': 'chill out',
      'handsome': 'fine', 'pretty': 'bangin\'',
      'impressive': 'sick', 'talented': 'got mad skills',
      'obviously': 'duh', 'secretly': 'on the DL',
      'disgusting': 'grody', 'turn off': 'gag me with a spoon',
      'compliment': 'props', 'praise': 'mad props',
      'caught': 'busted', 'evidence': 'proof',
      'special': 'phat', 'unique': 'fresh',
      'friend': 'homeslice', 'friends': 'crew',
      'leave': 'bounce', 'go': 'jet',
      'relax': 'chill', 'party': 'off the hook',
      'shoes': 'kicks', 'jewelry': 'bling',
      'hello': 'yo', 'hi': 'wassup', 'hey': 'yo',
      'no': 'NOT!', 'fake': 'psych!',
      'excited': 'stoked', 'happy': 'stoked'
    };

    const safe = this._esc(text);
    let result = safe.toLowerCase();
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    for (const [eng, gen] of sorted) {
      const re = new RegExp(`\\b${this._esc(eng)}\\b`, 'gi');
      result = result.replace(re, `<strong>${this._esc(gen)}</strong>`);
    }
    if (result === safe.toLowerCase()) {
      return `<strong>${safe}</strong> is already hella Gen X, dude 🤙`;
    }
    return result + ' 🤙';
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
        result = result.replace(re, `<strong title="${this._escAttr(def)}">[${this._esc(def.split('.')[0].trim())}]</strong>`);
      }
    }
    if (!found) return `Hmm, couldn't find any Gen X terms in there. Maybe try: ${this.slang.slice(0, 5).map(s => this._esc(s.term)).join(', ')}`;
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
      current: 0,
      score: 0,
      answered: [],
      done: false
    };
  }

  renderQuiz(el) {
    if (!this.quizState) { this.startQuiz(); }
    const q = this.quizState;

    if (q.done) {
      const pct = Math.round((q.score / q.questions.length) * 100);
      let title, msg;
      if (pct >= 90) { title = '🤙 TOTALLY RADICAL'; msg = 'You\'re keeping it so real. You lived through the 90s and it shows. Mad props.'; }
      else if (pct >= 70) { title = '🎸 Certified Gen X'; msg = 'You\'re all that and a bag of chips. Solid knowledge, homeslice.'; }
      else if (pct >= 50) { title = '📼 Getting There'; msg = 'Not bad but you need to rewatch some 90s movies. Pop in a VHS tape.'; }
      else if (pct >= 30) { title = '😬 Kinda Bogus'; msg = 'You\'re buggin\' out. Time to binge some Clueless and Wayne\'s World.'; }
      else { title = '💀 Total Poser'; msg = 'You have zero Gen X cred. Talk to the hand. Go watch some MTV.'; }

      el.innerHTML = `
        <div class="gx-quiz-card">
          <div class="gx-quiz-progress">${q.answered.map(a => `<div class="gx-quiz-dot ${a ? 'done' : 'wrong-dot'}"></div>`).join('')}</div>
          <h2 style="font-family:var(--serif);margin-top:24px;">${title}</h2>
          <div class="gx-quiz-score">${q.score}/${q.questions.length}</div>
          <p style="color:var(--muted);font-size:15px;margin:8px 0 24px;">${msg}</p>
          <p style="font-size:13px;color:var(--muted);">Gen X Cred Level: ${pct}%</p>
          <div style="height:8px;background:var(--border);border-radius:4px;margin:8px 0 24px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'};border-radius:4px;"></div>
          </div>
          <button class="btn btn-primary" id="gx-quiz-restart">Try Again 🔁</button>
        </div>
      `;
      el.querySelector('#gx-quiz-restart').addEventListener('click', () => { this.startQuiz(); this.renderQuiz(el); });
      return;
    }

    const curr = q.questions[q.current];
    const answered = q.answered.length > q.current;

    el.innerHTML = `
      <div class="gx-quiz-card">
        <div class="gx-quiz-progress">
          ${q.questions.map((_, i) => {
            let cls = 'gx-quiz-dot';
            if (i < q.answered.length) cls += q.answered[i] ? ' done' : ' wrong-dot';
            else if (i === q.current) cls += ' current';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <p style="color:var(--muted);font-size:13px;margin:16px 0 0;">Question ${q.current + 1} of ${q.questions.length}</p>
        <div class="gx-quiz-q">What does "${this._esc(curr.term)}" mean?</div>
        <div class="gx-quiz-options">
          ${curr.options.map(o => {
            let cls = 'gx-quiz-opt';
            if (answered) {
              if (o.id === curr.correctId) cls += ' correct';
              else if (q._lastPick === o.id) cls += ' wrong';
            }
            return `<button class="${cls}" data-id="${this._escAttr(o.id)}" ${answered ? 'disabled' : ''}>${this._esc(o.def)}</button>`;
          }).join('')}
        </div>
        ${answered ? `<button class="btn btn-primary" id="gx-quiz-next">${q.current < q.questions.length - 1 ? 'Next →' : 'See Results 🏆'}</button>` : ''}
      </div>
    `;

    if (!answered) {
      el.querySelectorAll('.gx-quiz-opt').forEach(btn => {
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

    const nextBtn = el.querySelector('#gx-quiz-next');
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
        <p style="color:var(--muted);font-size:14px;">The dopest Gen X slang, ranked by vibe score</p>
      </div>
      <div class="gx-trending-grid">
        ${top.map((s, i) => `
          <div class="gx-trend-card" title="${this._escAttr(s.definition)}" data-id="${this._escAttr(s.id)}">
            <div class="gx-trend-score">${s.vibeScore}</div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">#${i + 1}</div>
            <div class="gx-trend-term">${this._esc(s.term)}</div>
            <span class="gx-cat-badge" style="font-size:10px;background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <div class="gx-trend-bar" style="background:linear-gradient(90deg,${this.categoryColor(s.category)},transparent);"></div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.gx-trend-card').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gx-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gx-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gx-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gx-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gx-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gx-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${s.equivalents?.genAlpha ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(139,92,246,.08);border-left:3px solid #8b5cf6;border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">🔄 Gen Alpha Says</div>
              <div style="font-size:15px;font-weight:700;color:#8b5cf6;">${this._esc(s.equivalents.genAlpha)}</div>
            </div>` : ''}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }
}

customElements.define('gen-x', GenX);
