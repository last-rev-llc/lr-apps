class GenY extends HTMLElement {
  constructor() {
    super();
    this.slang = [];
    this.filtered = [];
    this.activeTab = 'dictionary';
    this.searchTerm = '';
    this.activeCategory = 'all';
    this.quizState = null;
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  _escAttr(s) {
    return (s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  connectedCallback() { this.loadData(); }

  async loadData() {
    try {
      const r = await fetch('data/slang.json');
      this.slang = await r.json();
      this.filtered = [...this.slang];
      this.render();
    } catch (e) {
      window.showToast?.('Failed to load slang data');
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
    const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#06b6d4','#1da1f2','#8b5cf6','#ec4899','#10b981'];
    const c = colors[score - 1] || 'var(--accent)';
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-size:11px;color:var(--muted);">Vibe</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="width:${score * 10}%;height:100%;background:${c};border-radius:3px;"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:${c};">${score}/10</span>
    </div>`;
  }

  static CAT_COLORS = { 'Approval': '#22c55e', 'Insult': '#ef4444', 'Reaction': '#eab308', 'Lifestyle': '#1da1f2', 'Disapproval': '#f97316', 'Greeting': '#06b6d4', 'Internet Culture': '#ec4899', 'Relationships': '#8b5cf6' };

  categoryColor(cat) {
    return GenY.CAT_COLORS[cat] || '#6b7280';
  }

  render() {
    const tabs = [
      { id: 'dictionary', label: '📖 Dictionary' },
      { id: 'translator', label: '🔄 Translator' },
      { id: 'quiz', label: '📱 Slang Quiz' },
      { id: 'trending', label: '🔥 Trending' }
    ];

    this.innerHTML = `
      <style>
        gen-y{--accent:#1da1f2;}
        .gy-wrap{max-width:1100px;margin:20px auto;padding:0 16px;}
        .gy-header{text-align:center;margin-bottom:28px;}
        .gy-header h1{font-family:var(--serif);font-size:2.2rem;margin:0;}
        .gy-header p{color:var(--muted);margin:4px 0 0;}
        .gy-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
        .gy-term{font-size:1.3rem;font-weight:800;margin:0 0 4px;}
        .gy-def{color:var(--text);font-size:14px;line-height:1.5;margin:8px 0;}
        .gy-example{font-style:italic;color:var(--muted);font-size:13px;background:rgba(29,161,242,.06);padding:8px 12px;border-radius:8px;margin:8px 0;}
        .gy-origin{font-size:11px;color:var(--muted);margin-top:8px;}
        .gy-aliases{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
        .gy-alias{font-size:11px;padding:2px 8px;background:rgba(255,255,255,.06);border-radius:6px;color:var(--muted);}
        .gy-cat-badge{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .gy-translator{max-width:700px;margin:0 auto;}
        .gy-textarea{width:100%;min-height:120px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:15px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;}
        .gy-textarea:focus{border-color:var(--accent);}
        .gy-dir-toggle{display:flex;gap:0;margin-bottom:20px;border-radius:10px;overflow:hidden;border:1px solid var(--border);}
        .gy-dir-btn{flex:1;padding:10px;text-align:center;background:var(--card-bg);cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;border:none;color:var(--text);}
        .gy-dir-btn.active{background:var(--accent);color:#fff;}
        .gy-quiz-card{max-width:600px;margin:0 auto;text-align:center;}
        .gy-quiz-q{font-size:1.4rem;font-weight:700;margin:20px 0;font-family:var(--serif);}
        .gy-quiz-options{display:grid;gap:10px;margin:20px 0;}
        .gy-quiz-opt{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card-bg);cursor:pointer;font-size:14px;text-align:left;transition:all .2s;}
        .gy-quiz-opt:hover{border-color:var(--accent);background:rgba(29,161,242,.08);}
        .gy-quiz-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.15);}
        .gy-quiz-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.15);}
        .gy-quiz-progress{display:flex;gap:6px;justify-content:center;margin:20px 0;}
        .gy-quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);}
        .gy-quiz-dot.done{background:#22c55e;}
        .gy-quiz-dot.current{background:var(--accent);box-shadow:0 0 8px var(--accent);}
        .gy-quiz-dot.wrong-dot{background:#ef4444;}
        .gy-quiz-score{font-size:3rem;font-weight:900;margin:10px 0;}
        .gy-trending-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
        .gy-trend-card{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
        .gy-trend-card:hover{border-color:var(--accent);transform:translateY(-3px);}
        .gy-trend-term{font-size:1.1rem;font-weight:800;margin:0 0 4px;}
        .gy-trend-score{font-size:2rem;font-weight:900;opacity:.2;position:absolute;top:8px;right:12px;}
        .gy-trend-bar{height:4px;border-radius:2px;margin-top:10px;}
        .gy-count{font-size:13px;color:var(--muted);margin:16px 0 0;text-align:center;}
        .gy-result-box{margin-top:20px;padding:20px;border-radius:12px;border:1px solid var(--border);background:var(--card-bg);line-height:1.8;font-size:15px;}
        @media(max-width:600px){.gy-grid{grid-template-columns:1fr;}.gy-trending-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}}
      </style>
      <div class="gy-wrap">
        <cc-fade-in>
        <div class="gy-header">
          <h1>📱 Millennial Slang Dictionary</h1>
          <p>TBH, this is the most lit slang reference. I can't even. 💀</p>
        </div>
        </cc-fade-in>
        <div style="display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;">
          ${tabs.map(t => `<button class="pill ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div id="gy-content"></div>
      </div>
    `;

    this.querySelectorAll('.pill[data-tab]').forEach(t => {
      t.addEventListener('click', () => {
        this.activeTab = t.dataset.tab;
        if (t.dataset.tab === 'quiz' && !this.quizState) this.startQuiz();
        this.render();
      });
    });

    const content = this.querySelector('#gy-content');
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
        <cc-search placeholder="Search slang terms..." value="${this._escAttr(this.searchTerm)}"></cc-search>
        <cc-view-toggle app="gen-y" value="${this._dictView || 'cards'}"></cc-view-toggle>
      </div>
      <cc-pill-dropdown label="Category" items='${this._escAttr(JSON.stringify(catItems))}' value="${this._escAttr(this.activeCategory)}"></cc-pill-dropdown>
      <div class="gy-count">${this.filtered.length} term${this.filtered.length !== 1 ? 's' : ''} found</div>
      ${(this._dictView || 'cards') === 'list' ? `<div class="view-list" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="list-row" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <span class="row-name">${this._esc(s.term)}</span>
            <span class="gy-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};flex-shrink:0;font-size:11px;padding:2px 8px;border-radius:10px;">${this._esc(s.category)}</span>
            <span class="row-desc">${this._esc(s.definition)}</span>
            <span style="font-size:12px;color:var(--muted);flex-shrink:0;">🔥 ${s.vibeScore}/10</span>
          </div>
        `).join('')}
      </div>`
      : (this._dictView) === 'expanded' ? `<div class="view-expanded" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="expanded-card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
              <div class="gy-term">${this._esc(s.term)}</div>
              <span class="gy-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gy-def">${this._esc(s.definition)}</div>
            <div class="gy-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gy-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gy-aliases">${s.aliases.map(a => `<span class="gy-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>`
      : `<cc-stagger animation="fade-up" delay="60">
      <div class="gy-grid" style="margin-top:16px;">
        ${this.filtered.sort((a, b) => b.vibeScore - a.vibeScore).map(s => `
          <div class="card" data-id="${this._escAttr(s.id)}" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="gy-term">${this._esc(s.term)}</div>
              <span class="gy-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            </div>
            <div class="gy-def">${this._esc(s.definition)}</div>
            <div class="gy-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gy-origin">📍 ${this._esc(s.origin)} · ${this._esc(s.era)}</div>
            ${s.aliases && s.aliases.length ? `<div class="gy-aliases">${s.aliases.map(a => `<span class="gy-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
      </cc-stagger>`}
    `;
    if (!this.filtered.length) {
      const container = el.querySelector('.gy-grid') || el.querySelector('.view-list') || el.querySelector('.view-expanded');
      if (container) container.innerHTML = `<cc-empty-state message="No slang found. That's lowkey embarrassing." icon="😵"></cc-empty-state>`;
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
        const eqText = s.equivalents?.genAlpha || '';
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gy-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gy-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gy-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gy-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gy-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gy-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${eqText ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(29,161,242,.08);border-left:3px solid var(--accent);border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">🔄 Gen Alpha Says</div>
              <div style="font-size:15px;font-weight:700;color:var(--accent);">${this._esc(eqText)}</div>
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
      <div class="gy-translator">
        <div class="gy-dir-toggle">
          <button class="gy-dir-btn ${this._transDir === 'to-gen' ? 'active' : ''}" data-dir="to-gen">English → Millennial 📱</button>
          <button class="gy-dir-btn ${this._transDir === 'from-gen' ? 'active' : ''}" data-dir="from-gen">Millennial → English 📚</button>
        </div>
        <textarea class="gy-textarea" placeholder="${this._transDir === 'to-gen' ? 'Type normal English here...' : 'Type millennial slang here...'}">${this._transInput || ''}</textarea>
        <div style="text-align:center;margin-top:16px;">
          <button class="btn btn-primary" style="background:var(--accent);">Translate 📱</button>
        </div>
        <div class="gy-result-box" id="gy-trans-result">${this._transResult || '<span style="color:var(--muted);">Translation will appear here, fam</span>'}</div>
      </div>
    `;
    el.querySelectorAll('.gy-dir-btn').forEach(b => {
      b.addEventListener('click', () => { this._transDir = b.dataset.dir; this.renderTranslator(el); });
    });
    el.querySelector('.btn-primary').addEventListener('click', () => {
      const input = el.querySelector('.gy-textarea').value.trim();
      this._transInput = input;
      if (!input) { this._transResult = '<span style="color:var(--muted);">Type something first, fam</span>'; this.renderTranslator(el); return; }
      this._transResult = this._transDir === 'to-gen' ? this.translateToGen(input) : this.translateFromGen(input);
      this.renderTranslator(el);
    });
  }

  translateToGen(text) {
    const map = {
      'good': 'lit', 'great': 'fire', 'amazing': 'I can\'t even',
      'cool': 'lit', 'awesome': 'savage', 'really': 'lowkey',
      'very': 'AF', 'suspicious': 'sus', 'truth': 'tea',
      'agree': 'same', 'okay': 'bet', 'yes': 'yaas',
      'funny': 'dead 💀', 'hilarious': 'I\'m literally dead',
      'attractive': 'snatched', 'gossip': 'tea',
      'show off': 'flexing', 'brag': 'weird flex but ok',
      'embarrassing': 'cringe', 'awkward': 'yikes',
      'angry': 'salty', 'bitter': 'salty AF',
      'boyfriend': 'bae', 'girlfriend': 'bae',
      'friends': 'squad', 'friend': 'fam',
      'perfect': 'on fleek', 'excellent': 'slay',
      'bad': 'trash', 'terrible': 'basic',
      'upset': 'shook', 'shocked': 'shook',
      'excited': 'I can\'t even', 'happy': 'living my best life',
      'ignore': 'ghosting', 'leaving': 'I\'m out',
      'fan': 'stan', 'obsessed': 'stanning',
      'insult': 'throwing shade', 'response': 'clap back',
      'evidence': 'receipts', 'proof': 'receipts',
      'transformation': 'glow up', 'improve': 'glow up',
      'mainstream': 'basic', 'unoriginal': 'basic AF',
      'dramatic': 'extra', 'over the top': 'so extra',
      'hungry': 'hangry', 'risky': 'YOLO',
      'honestly': 'TBH', 'seriously': 'literally',
      'hello': 'hey fam', 'hi': 'hey fam',
      'no': 'I can\'t even', 'fake': 'cancelled',
      'scared': 'shook', 'beautiful': 'slay queen'
    };
    const safe = this._esc(text);
    let result = safe.toLowerCase();
    const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
    for (const [eng, gen] of sorted) {
      const re = new RegExp(`\\b${eng}\\b`, 'gi');
      result = result.replace(re, `<strong>${this._esc(gen)}</strong>`);
    }
    if (result === safe.toLowerCase()) return `<strong>${safe}</strong> is already pretty millennial, fam 📱`;
    return result + ' 💀';
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
    if (!found) return `Hmm, couldn't find any millennial terms in there. Maybe try: ${this.slang.slice(0, 5).map(s => this._esc(s.term)).join(', ')}`;
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
      if (pct >= 90) { title = '📱 YAAS QUEEN'; msg = 'You\'re literally a millennial slang icon. I can\'t even. Squad goals.'; }
      else if (pct >= 70) { title = '🔥 Certified Millennial'; msg = 'Your slang game is on fleek. TBH, that was savage AF.'; }
      else if (pct >= 50) { title = '📖 Getting There'; msg = 'Not bad but you need more avocado toast and Twitter time.'; }
      else if (pct >= 30) { title = '😬 Lowkey Struggling'; msg = 'Are you sure you\'re not a boomer? Time to study up, fam.'; }
      else { title = '💀 Total FOMO'; msg = 'You missed the entire millennial era. I\'m shook. Go binge some early 2010s Twitter.'; }

      el.innerHTML = `
        <div class="gy-quiz-card">
          <div class="gy-quiz-progress">${q.answered.map(a => `<div class="gy-quiz-dot ${a ? 'done' : 'wrong-dot'}"></div>`).join('')}</div>
          <h2 style="font-family:var(--serif);margin-top:24px;">${title}</h2>
          <div class="gy-quiz-score">${q.score}/${q.questions.length}</div>
          <p style="color:var(--muted);font-size:15px;margin:8px 0 24px;">${msg}</p>
          <p style="font-size:13px;color:var(--muted);">Millennial Cred: ${pct}%</p>
          <div style="height:8px;background:var(--border);border-radius:4px;margin:8px 0 24px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'};border-radius:4px;"></div>
          </div>
          <button class="btn btn-primary" style="background:var(--accent);" id="gy-quiz-restart">Try Again 🔁</button>
        </div>
      `;
      el.querySelector('#gy-quiz-restart').addEventListener('click', () => { this.startQuiz(); this.renderQuiz(el); });
      return;
    }

    const curr = q.questions[q.current];
    const answered = q.answered.length > q.current;

    el.innerHTML = `
      <div class="gy-quiz-card">
        <div class="gy-quiz-progress">
          ${q.questions.map((_, i) => {
            let cls = 'gy-quiz-dot';
            if (i < q.answered.length) cls += q.answered[i] ? ' done' : ' wrong-dot';
            else if (i === q.current) cls += ' current';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <p style="color:var(--muted);font-size:13px;margin:16px 0 0;">Question ${q.current + 1} of ${q.questions.length}</p>
        <div class="gy-quiz-q">What does "${this._esc(curr.term)}" mean?</div>
        <div class="gy-quiz-options">
          ${curr.options.map(o => {
            let cls = 'gy-quiz-opt';
            if (answered) {
              if (o.id === curr.correctId) cls += ' correct';
              else if (q._lastPick === o.id) cls += ' wrong';
            }
            return `<button class="${cls}" data-id="${this._escAttr(o.id)}" ${answered ? 'disabled' : ''}>${this._esc(o.def)}</button>`;
          }).join('')}
        </div>
        ${answered ? `<button class="btn btn-primary" style="background:var(--accent);" id="gy-quiz-next">${q.current < q.questions.length - 1 ? 'Next →' : 'See Results 🏆'}</button>` : ''}
      </div>
    `;

    if (!answered) {
      el.querySelectorAll('.gy-quiz-opt').forEach(btn => {
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

    const nextBtn = el.querySelector('#gy-quiz-next');
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
        <p style="color:var(--muted);font-size:14px;">The most lit millennial slang, ranked by vibe score</p>
      </div>
      <div class="gy-trending-grid">
        ${top.map((s, i) => `
          <div class="gy-trend-card" title="${this._escAttr(s.definition)}" data-id="${this._escAttr(s.id)}">
            <div class="gy-trend-score">${s.vibeScore}</div>
            <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">#${i + 1}</div>
            <div class="gy-trend-term">${this._esc(s.term)}</div>
            <span class="gy-cat-badge" style="font-size:10px;background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <div class="gy-trend-bar" style="background:linear-gradient(90deg,${this.categoryColor(s.category)},transparent);"></div>
          </div>
        `).join('')}
      </div>
    `;

    el.querySelectorAll('.gy-trend-card').forEach(c => {
      c.addEventListener('click', () => {
        const s = this.slang.find(x => x.id === c.dataset.id);
        if (!s) return;
        const modal = document.createElement('cc-modal');
        modal.setAttribute('title', s.term);
        modal.setAttribute('size', 'sm');
        modal.innerHTML = `
          <div style="padding:8px;">
            <span class="gy-cat-badge" style="background:${this.categoryColor(s.category)}22;color:${this.categoryColor(s.category)};">${this._esc(s.category)}</span>
            <p class="gy-def" style="margin-top:12px;">${this._esc(s.definition)}</p>
            <div class="gy-example">"${this._esc(s.example)}"</div>
            ${this.vibeBar(s.vibeScore)}
            <div class="gy-origin" style="margin-top:12px;">📍 ${this._esc(s.origin)}</div>
            <div style="margin-top:4px;font-size:11px;color:var(--muted);">🕐 ${this._esc(s.era)}</div>
            ${s.aliases?.length ? `<div class="gy-aliases" style="margin-top:8px;">${s.aliases.map(a => `<span class="gy-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
            ${s.equivalents?.genAlpha ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(29,161,242,.08);border-left:3px solid var(--accent);border-radius:0 8px 8px 0;">
              <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">🔄 Gen Alpha Says</div>
              <div style="font-size:15px;font-weight:700;color:var(--accent);">${this._esc(s.equivalents.genAlpha)}</div>
            </div>` : ''}
          </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.open());
      });
    });
  }
}

customElements.define('gen-y', GenY);
