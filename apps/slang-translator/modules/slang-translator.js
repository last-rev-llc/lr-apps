class SlangTranslator extends HTMLElement {
  static GEN_X_MAP = {
    'skibidi':'Gnarly / Radical','rizz':'Game / Mack Daddy','bussin':'Da Bomb / Phat',
    'no-cap':'Word / Keeping It Real','sus':'Sketchy','slay':'Fly / All That',
    'bet':'Word / Aight','mid':'Wack / Whatever','brainrot':'Couch Potato / Vegging Out',
    'fanum-tax':'Bogart','ohio':'Twilight Zone','sigma':'Lone Wolf',
    'gyatt':'Schwing','mewing':'Keeping It Real','aura':'Vibe',
    'ratio':'Diss / Burn','cap':'NOT! / Psych!','delulu':"Trippin'",
    'w':'Booyah','l':'Bummer','npc':'Scrub / Poser','goat':'All That and a Bag of Chips',
    'fire':'Da Bomb / Dope','drip':'Fly / Fresh','hits-different':'Phat / Tight',
    'vibe-check':"What's the 411",'ate':'Killed It / Nailed It',
    'ick':'Gag Me with a Spoon','stan':'Groupie / Super Fan',
    'ghosting':'Bounce / Dip','yeet':'Chuck / Hurl','flex':"Frontin' / Showing Off",
    'simp':'Whipped','based':'Radical / Keeping It Real','lowkey':'On the DL',
    'highkey':'Totally / Hella','sending-me':'Cracking Up',
    'understood-the-assignment':'Nailed It','main-character':'All That',
    'touch-grass':'Take a Chill Pill','rent-free':'Living In Your Head',
    'caught-in-4k':'Busted','periodt':'Word / Fo Shizzle'
  };

  constructor() {
    super();
    this.allSlang = [];
    this.filtered = [];
    this.searchTerm = '';
    this.activeCategory = 'all';
    this.activeGeneration = 'all';
    this.quizState = null;
  }

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  }

  _escAttr(str) {
    return (str ?? '').toString().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  connectedCallback() { this.loadData(); }

  async loadData() {
    try {
      this.db = await SlangTranslatorDB.init();
      this.allSlang = await this.db.getAll();
      this.filtered = [...this.allSlang];
      this.render();
    } catch (e) {
      console.error('SlangTranslator load error:', e);
      this.innerHTML = '<cc-empty-state message="Failed to load slang data" icon="alert-circle"></cc-empty-state>';
    }
  }

  get categories() {
    return ['all', ...new Set(this.allSlang.map(s => s.category).filter(Boolean))];
  }

  filterSlang() {
    let r = [...this.allSlang];
    if (this.activeGeneration !== 'all') r = r.filter(s => s.generation === this.activeGeneration);
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
    const pct = score * 10;
    const hue = (score - 1) * 12; // 0=red through green
    return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
      <span style="font-size:11px;color:var(--muted);">Vibe</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:3px;"></div>
      </div>
      <span style="font-size:12px;font-weight:700;color:var(--accent);">${score}/10</span>
    </div>`;
  }

  genBadge(gen) {
    if (gen === 'gen-alpha') return '<span class="st-gen-badge st-gen-alpha">Gen Alpha</span>';
    return '<span class="st-gen-badge st-gen-x">Gen X</span>';
  }

  categoryColor(cat) {
    const m = { 'compliment':'var(--green, #22c55e)','Approval':'var(--green, #22c55e)',
      'insult':'var(--red, #ef4444)','Insult':'var(--red, #ef4444)',
      'reaction':'var(--yellow, #eab308)','Reaction':'var(--yellow, #eab308)',
      'lifestyle':'var(--purple, #8b5cf6)','Lifestyle':'var(--purple, #8b5cf6)',
      'internet culture':'var(--cyan, #06b6d4)','Internet Culture':'var(--pink, #ec4899)',
      'Disapproval':'var(--orange, #f97316)','Greeting':'var(--cyan, #06b6d4)' };
    return m[cat] || 'var(--muted, #6b7280)';
  }

  getEquivalent(s) {
    if (s.generation === 'gen-alpha') return SlangTranslator.GEN_X_MAP[s.id] ? { gen: 'Gen X', text: SlangTranslator.GEN_X_MAP[s.id] } : null;
    if (s.generation === 'gen-x' && s.equivalents?.genAlpha) return { gen: 'Gen Alpha', text: s.equivalents.genAlpha };
    return null;
  }

  slangCard(s) {
    const eq = this.getEquivalent(s);
    const cc = this.categoryColor(s.category);
    const vs = s.vibeScore || s.vibe_score || 0;
    return `<div class="card st-slang-card" data-id="${this._escAttr(s.id)}" data-gen="${this._escAttr(s.generation)}" style="cursor:pointer;">
      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;flex-wrap:wrap;">
        <div class="st-term">${this._esc(s.term)}</div>
        <div style="display:flex;gap:6px;align-items:center;">
          ${this.genBadge(s.generation)}
          <span class="st-cat-badge" style="background:${cc}22;color:${cc};">${this._esc(s.category)}</span>
        </div>
      </div>
      <div class="st-def">${this._esc(s.definition)}</div>
      <div class="st-example">"${this._esc(s.example)}"</div>
      ${this.vibeBar(vs)}
      <div class="st-origin">${this._esc(s.origin)} · ${this._esc(s.era)}</div>
      ${(s.aliases||[]).length ? `<div class="st-aliases">${s.aliases.map(a=>`<span class="st-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
      ${eq ? `<div class="st-equiv st-equiv-${s.generation === 'gen-alpha' ? 'x' : 'a'}">${this._esc(eq.gen)} equivalent: <strong>${this._esc(eq.text)}</strong></div>` : ''}
    </div>`;
  }

  showCardModal(s) {
    const eq = this.getEquivalent(s);
    const cc = this.categoryColor(s.category);
    const vs = s.vibeScore || s.vibe_score || 0;
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', s.term);
    modal.setAttribute('size', 'sm');
    modal.innerHTML = `<div style="padding:8px;">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">${this.genBadge(s.generation)}<span class="st-cat-badge" style="background:${cc}22;color:${cc};">${this._esc(s.category)}</span></div>
      <p style="color:var(--text);font-size:14px;line-height:1.5;">${this._esc(s.definition)}</p>
      <div class="st-example">"${this._esc(s.example)}"</div>
      ${this.vibeBar(vs)}
      <div class="st-origin" style="margin-top:12px;">${this._esc(s.origin)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px;">${this._esc(s.era)}</div>
      ${(s.aliases||[]).length ? `<div class="st-aliases" style="margin-top:8px;">${s.aliases.map(a=>`<span class="st-alias">${this._esc(a)}</span>`).join('')}</div>` : ''}
      ${eq ? `<div class="st-equiv st-equiv-${s.generation==='gen-alpha'?'x':'a'}" style="margin-top:16px;">${this._esc(eq.gen)} equivalent: <strong>${this._esc(eq.text)}</strong></div>` : ''}
    </div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.open());
  }

  render() {
    this.innerHTML = `
      <style>
        .st-wrap{max-width:1200px;margin:20px auto;padding:0 16px;}
        .st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin-top:16px;}
        .st-term{font-size:1.3rem;font-weight:800;margin:0;}
        .st-def{color:var(--text);font-size:14px;line-height:1.5;margin:8px 0;}
        .st-example{font-style:italic;color:var(--muted);font-size:13px;background:color-mix(in srgb, var(--text) 4%, transparent);padding:8px 12px;border-radius:8px;margin:8px 0;}
        .st-origin{font-size:11px;color:var(--muted);margin-top:8px;}
        .st-aliases{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
        .st-alias{font-size:11px;padding:2px 8px;background:color-mix(in srgb, var(--text) 6%, transparent);border-radius:6px;color:var(--muted);}
        .st-cat-badge{display:inline-block;font-size:11px;padding:3px 10px;border-radius:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
        .st-gen-badge{display:inline-block;font-size:10px;padding:3px 10px;border-radius:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
        .st-gen-alpha{background:rgba(139,92,246,.15);color:#a78bfa;}
        .st-gen-x{background:rgba(245,158,11,.15);color:#fbbf24;}
        .st-equiv{font-size:12px;padding:10px 14px;border-radius:0 8px 8px 0;margin-top:10px;}
        .st-equiv-x{background:rgba(245,158,11,.08);border-left:3px solid #f59e0b;color:#fbbf24;}
        .st-equiv-a{background:rgba(139,92,246,.08);border-left:3px solid #8b5cf6;color:#a78bfa;}
        .st-translator{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;max-width:900px;margin:0 auto;align-items:start;}
        .st-trans-panel{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;}
        .st-textarea{width:100%;min-height:160px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:14px;font-family:inherit;resize:vertical;outline:none;box-sizing:border-box;}
        .st-textarea:focus{border-color:var(--accent);}
        .st-swap-btn{background:var(--card);border:1px solid var(--border);border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text);font-size:18px;transition:all .2s;margin-top:40px;}
        .st-swap-btn:hover{border-color:var(--accent);transform:rotate(180deg);}
        .st-trans-result{margin-top:12px;padding:16px;background:rgba(255,255,255,.03);border-radius:12px;min-height:60px;line-height:1.6;font-size:14px;}
        .st-trans-result strong{color:#a78bfa;font-weight:700;}
        .st-pairs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(500px,1fr));gap:20px;margin-top:20px;}
        .st-pair{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:stretch;}
        .st-pair-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;}
        .st-pair-arrow{display:flex;align-items:center;font-size:20px;color:var(--muted);}
        .st-quiz-card{max-width:600px;margin:0 auto;text-align:center;}
        .st-quiz-q{font-size:1.3rem;font-weight:700;margin:20px 0;font-family:var(--serif);}
        .st-quiz-options{display:grid;gap:10px;margin:20px 0;}
        .st-quiz-opt{padding:14px 20px;border-radius:10px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:14px;text-align:left;transition:all .2s;}
        .st-quiz-opt:hover{border-color:var(--accent);}
        .st-quiz-opt.correct{border-color:#22c55e;background:rgba(34,197,94,.15);}
        .st-quiz-opt.wrong{border-color:#ef4444;background:rgba(239,68,68,.15);}
        .st-quiz-progress{display:flex;gap:6px;justify-content:center;margin:20px 0;}
        .st-quiz-dot{width:10px;height:10px;border-radius:50%;background:var(--border);}
        .st-quiz-dot.done{background:#22c55e;}.st-quiz-dot.current{background:var(--accent);box-shadow:0 0 8px var(--accent);}.st-quiz-dot.wrong-dot{background:#ef4444;}
        .st-count{font-size:13px;color:var(--muted);margin:16px 0 0;text-align:center;}
        @media(max-width:700px){.st-grid{grid-template-columns:1fr;}.st-translator{grid-template-columns:1fr;}.st-swap-btn{margin:0 auto;transform:rotate(90deg);}.st-pairs-grid{grid-template-columns:1fr;}.st-pair{grid-template-columns:1fr;}.st-pair-arrow{justify-content:center;transform:rotate(90deg);}}
      </style>
      <div class="st-wrap">
        <cc-fade-in>
          <cc-page-header icon="🗣️" title="Slang Translator" description="Gen Alpha & Gen Z slang decoder"></cc-page-header>
        </cc-fade-in>
        <cc-tabs active="dictionary">
          <cc-tab name="dictionary" label="Dictionary" icon="book-open"></cc-tab>
          <cc-tab name="translator" label="Translator" icon="languages"></cc-tab>
          <cc-tab name="compare" label="Compare" icon="columns-2"></cc-tab>
          <cc-tab name="quiz" label="Quiz" icon="brain"></cc-tab>
        </cc-tabs>
        <div id="st-content" style="margin-top:20px;"></div>
      </div>`;

    this.querySelector('cc-tabs').addEventListener('tab-change', e => {
      if (e.detail.tab === 'quiz' && !this.quizState) this.startQuiz();
      this._renderTab(e.detail.tab);
    });
    this._renderTab(this.querySelector('cc-tabs').getAttribute('active') || 'dictionary');
  }

  _renderTab(tab) {
    const el = this.querySelector('#st-content');
    if (tab === 'dictionary') this.renderDictionary(el);
    else if (tab === 'translator') this.renderTranslatorTab(el);
    else if (tab === 'compare') this.renderCompare(el);
    else if (tab === 'quiz') this.renderQuiz(el);
  }

  renderDictionary(el) {
    this.filterSlang();
    const catItems = this.categories.map(c => c === 'all' ? {value:'all',label:'All'} : {value:c,label:c});
    const genItems = [{value:'all',label:'All'},{value:'gen-alpha',label:'Gen Alpha'},{value:'gen-x',label:'Gen X'}];
    el.innerHTML = `
      <cc-search placeholder="Search all slang terms..." value="${this._escAttr(this.searchTerm)}"></cc-search>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
        <cc-pill-filter id="st-gen-filter" label="Generation" items='${this._escAttr(JSON.stringify(genItems))}' value="${this._escAttr(this.activeGeneration)}"></cc-pill-filter>
        <cc-pill-dropdown id="st-cat-filter" label="Category" items='${this._escAttr(JSON.stringify(catItems))}' value="${this._escAttr(this.activeCategory)}"></cc-pill-dropdown>
      </div>
      <div class="st-count">${this.filtered.length} term${this.filtered.length !== 1 ? 's' : ''} found</div>
      <cc-stagger animation="fade-up" delay="40">
        <div class="st-grid">${this.filtered.map(s => this.slangCard(s)).join('')}</div>
      </cc-stagger>`;
    if (!this.filtered.length) el.querySelector('.st-grid').innerHTML = '<cc-empty-state message="No slang found for that filter combo." icon="search"></cc-empty-state>';

    el.querySelector('cc-search').addEventListener('cc-search', e => { this.searchTerm = e.detail.value; this.renderDictionary(el); });
    el.querySelector('#st-gen-filter').addEventListener('pill-change', e => { this.activeGeneration = e.detail.value; this.renderDictionary(el); });
    el.querySelector('#st-cat-filter').addEventListener('dropdown-change', e => { this.activeCategory = e.detail.value; this.renderDictionary(el); });
    el.querySelectorAll('.st-slang-card').forEach(c => c.addEventListener('click', () => {
      const s = this.allSlang.find(x => x.id === c.dataset.id && x.generation === c.dataset.gen);
      if (s) this.showCardModal(s);
    }));
  }

  renderTranslatorTab(el) {
    this._transDir = this._transDir || 'alpha-to-x';
    const isA2X = this._transDir === 'alpha-to-x';
    el.innerHTML = `
      <div class="st-translator">
        <div class="st-trans-panel">
          <div style="font-weight:700;margin-bottom:12px;color:${isA2X ? '#a78bfa' : '#fbbf24'};">${isA2X ? 'Gen Alpha' : 'Gen X'}</div>
          <textarea class="st-textarea" placeholder="Type or paste ${isA2X ? 'Gen Alpha' : 'Gen X'} slang here...">${this._transInput || ''}</textarea>
        </div>
        <button class="st-swap-btn" title="Swap direction">&#8644;</button>
        <div class="st-trans-panel">
          <div style="font-weight:700;margin-bottom:12px;color:${isA2X ? '#fbbf24' : '#a78bfa'};">${isA2X ? 'Gen X' : 'Gen Alpha'}</div>
          <div class="st-trans-result">${this._transResult || '<span style="color:var(--muted);">Translation appears here...</span>'}</div>
        </div>
      </div>`;
    el.querySelector('.st-swap-btn').addEventListener('click', () => {
      this._transDir = isA2X ? 'x-to-alpha' : 'alpha-to-x';
      this._transResult = ''; this._transInput = '';
      this.renderTranslatorTab(el);
    });
    const ta = el.querySelector('.st-textarea');
    let debounce;
    ta.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this._transInput = ta.value;
        if (!ta.value.trim()) { this._transResult = ''; this.renderTranslatorTab(el); return; }
        this._transResult = isA2X ? this._translateAlphaToX(ta.value) : this._translateXToAlpha(ta.value);
        el.querySelector('.st-trans-result').innerHTML = this._transResult;
      }, 300);
    });
  }

  _translateAlphaToX(text) {
    const genAlpha = this.allSlang.filter(s => s.generation === 'gen-alpha');
    const map = {};
    for (const s of genAlpha) {
      const eq = SlangTranslator.GEN_X_MAP[s.id];
      if (eq) { map[s.term.toLowerCase()] = eq; for (const a of (s.aliases||[])) if (a) map[a.toLowerCase()] = eq; }
    }
    return this._applyMap(text, map, '#fbbf24');
  }

  _translateXToAlpha(text) {
    const genX = this.allSlang.filter(s => s.generation === 'gen-x');
    const map = {};
    for (const s of genX) {
      if (s.equivalents?.genAlpha) { map[s.term.toLowerCase()] = s.equivalents.genAlpha; for (const a of (s.aliases||[])) if (a) map[a.toLowerCase()] = s.equivalents.genAlpha; }
    }
    return this._applyMap(text, map, '#a78bfa');
  }

  _applyMap(text, map, color) {
    const sorted = Object.entries(map).sort((a,b) => b[0].length - a[0].length);
    // Escape user input first to prevent XSS
    let result = this._esc(text);
    let found = false;
    for (const [term, equiv] of sorted) {
      const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'gi');
      if (re.test(result)) {
        found = true;
        result = result.replace(re, `<strong style="color:${color};" title="${this._escAttr(equiv)}">${this._esc(equiv)}</strong>`);
      }
    }
    if (!found) return '<span style="color:var(--muted);">No recognized slang terms found. Try typing some slang!</span>';
    return result;
  }

  renderCompare(el) {
    const genAlpha = this.allSlang.filter(s => s.generation === 'gen-alpha');
    const genX = this.allSlang.filter(s => s.generation === 'gen-x');
    const pairs = [];
    for (const [alphaId, xText] of Object.entries(SlangTranslator.GEN_X_MAP)) {
      const alphaEntry = genAlpha.find(s => s.id === alphaId);
      if (!alphaEntry) continue;
      // Try to find matching gen-x entry
      const xTerms = xText.split('/').map(t => t.trim().toLowerCase());
      const xEntry = genX.find(s => xTerms.some(t => s.term.toLowerCase().includes(t)));
      pairs.push({ alpha: alphaEntry, xText, xEntry });
    }

    el.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <p style="color:var(--muted);font-size:14px;">See how the same ideas are expressed across generations</p>
      </div>
      <cc-stagger animation="fade-up" delay="60">
      <div class="st-pairs-grid">
        ${pairs.map(p => `
          <div class="st-pair">
            <div class="st-pair-card" style="border-top:3px solid #8b5cf6;">
              <div class="st-gen-badge st-gen-alpha" style="margin-bottom:8px;">Gen Alpha</div>
              <div class="st-term">${this._esc(p.alpha.term)}</div>
              <div style="font-size:13px;color:var(--muted);margin-top:4px;">${this._esc(p.alpha.definition.substring(0, 80))}${p.alpha.definition.length > 80 ? '...' : ''}</div>
              ${this.vibeBar(p.alpha.vibeScore || p.alpha.vibe_score || 0)}
            </div>
            <div class="st-pair-arrow">&#8596;</div>
            <div class="st-pair-card" style="border-top:3px solid #f59e0b;">
              <div class="st-gen-badge st-gen-x" style="margin-bottom:8px;">Gen X</div>
              <div class="st-term">${this._esc(p.xEntry ? p.xEntry.term : p.xText)}</div>
              <div style="font-size:13px;color:var(--muted);margin-top:4px;">${p.xEntry ? this._esc(p.xEntry.definition.substring(0, 80)) + (p.xEntry.definition.length > 80 ? '...' : '') : 'Classic Gen X expression'}</div>
              ${p.xEntry ? this.vibeBar(p.xEntry.vibeScore || p.xEntry.vibe_score || 0) : ''}
            </div>
          </div>`).join('')}
      </div>
      </cc-stagger>`;
  }

  startQuiz() {
    const genAlpha = this.allSlang.filter(s => s.generation === 'gen-alpha' && SlangTranslator.GEN_X_MAP[s.id]);
    const genX = this.allSlang.filter(s => s.generation === 'gen-x' && s.equivalents?.genAlpha);
    const pool = [];
    // Mix both directions
    for (const s of genAlpha.sort(() => Math.random()-.5).slice(0,5)) {
      const correct = SlangTranslator.GEN_X_MAP[s.id];
      const wrongs = Object.values(SlangTranslator.GEN_X_MAP).filter(v => v !== correct).sort(() => Math.random()-.5).slice(0,3);
      pool.push({ question: `What's the Gen X equivalent of "${s.term}"?`, correct, options: [correct,...wrongs].sort(() => Math.random()-.5), badge: 'gen-alpha' });
    }
    for (const s of genX.sort(() => Math.random()-.5).slice(0,5)) {
      const correct = s.equivalents.genAlpha;
      const others = genX.filter(x => x.id !== s.id && x.equivalents?.genAlpha).map(x => x.equivalents.genAlpha);
      const wrongs = others.sort(() => Math.random()-.5).slice(0,3);
      if (wrongs.length < 3) { const fallbacks = ['Skibidi','Rizz','Bussin','No Cap','Sus','Slay'].filter(f => f !== correct && !wrongs.includes(f)); wrongs.push(...fallbacks.slice(0, 3 - wrongs.length)); }
      pool.push({ question: `What's the Gen Alpha equivalent of "${s.term}"?`, correct, options: [correct,...wrongs].sort(() => Math.random()-.5), badge: 'gen-x' });
    }
    this.quizState = { questions: pool.sort(() => Math.random()-.5).slice(0,10), current: 0, score: 0, answered: [], done: false };
    if (this.quizState.questions.length === 0) this.quizState = null;
  }

  renderQuiz(el) {
    if (!this.quizState) { this.startQuiz(); if (!this.quizState) { el.innerHTML = '<cc-empty-state message="Not enough cross-generation data for quiz" icon="brain"></cc-empty-state>'; return; } }
    const q = this.quizState;
    if (q.done) {
      const pct = Math.round((q.score / q.questions.length) * 100);
      let title, msg;
      if (pct >= 80) { title = 'Cross-Gen Master'; msg = 'You speak both generations fluently. Impressive range.'; }
      else if (pct >= 60) { title = 'Bilingual Vibes'; msg = 'Solid knowledge across generations. Almost there.'; }
      else if (pct >= 40) { title = 'Getting There'; msg = 'You know your own generation but need to study the other.'; }
      else { title = 'Generation Gap'; msg = 'Time to brush up on both eras of slang!'; }
      el.innerHTML = `<div class="st-quiz-card">
        <div class="st-quiz-progress">${q.answered.map(a => `<div class="st-quiz-dot ${a ? 'done' : 'wrong-dot'}"></div>`).join('')}</div>
        <h2 style="font-family:var(--serif);margin-top:24px;">${title}</h2>
        <div style="font-size:3rem;font-weight:900;margin:10px 0;">${q.score}/${q.questions.length}</div>
        <p style="color:var(--muted);font-size:15px;margin:8px 0 24px;">${msg}</p>
        <div style="height:8px;background:var(--border);border-radius:4px;margin:8px 0 24px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${pct>=60?'#22c55e':pct>=40?'#eab308':'#ef4444'};border-radius:4px;"></div>
        </div>
        <button class="btn btn-primary" id="st-quiz-restart">Try Again</button>
      </div>`;
      el.querySelector('#st-quiz-restart').addEventListener('click', () => { this.startQuiz(); this.renderQuiz(el); });
      return;
    }
    const curr = q.questions[q.current];
    const answered = q.answered.length > q.current;
    el.innerHTML = `<div class="st-quiz-card">
      <div class="st-quiz-progress">${q.questions.map((_,i) => {
        let cls = 'st-quiz-dot';
        if (i < q.answered.length) cls += q.answered[i] ? ' done' : ' wrong-dot';
        else if (i === q.current) cls += ' current';
        return `<div class="${cls}"></div>`;
      }).join('')}</div>
      <p style="color:var(--muted);font-size:13px;margin:16px 0 0;">Question ${q.current+1} of ${q.questions.length}</p>
      <div style="margin:12px 0;">${curr.badge === 'gen-alpha' ? this.genBadge('gen-alpha') : this.genBadge('gen-x')}</div>
      <div class="st-quiz-q">${this._esc(curr.question)}</div>
      <div class="st-quiz-options">${curr.options.map(o => {
        let cls = 'st-quiz-opt';
        if (answered) { if (o === curr.correct) cls += ' correct'; else if (q._lastPick === o) cls += ' wrong'; }
        return `<button class="${cls}" data-val="${this._escAttr(o)}" ${answered ? 'disabled' : ''}>${this._esc(o)}</button>`;
      }).join('')}</div>
      ${answered ? `<button class="btn btn-primary" id="st-quiz-next">${q.current < q.questions.length-1 ? 'Next' : 'See Results'}</button>` : ''}
    </div>`;
    if (!answered) {
      el.querySelectorAll('.st-quiz-opt').forEach(btn => btn.addEventListener('click', () => {
        const picked = btn.dataset.val;
        q._lastPick = picked;
        if (picked === curr.correct) q.score++;
        q.answered.push(picked === curr.correct);
        this.renderQuiz(el);
      }));
    }
    const next = el.querySelector('#st-quiz-next');
    if (next) next.addEventListener('click', () => { q.current++; if (q.current >= q.questions.length) q.done = true; this.renderQuiz(el); });
  }
}

customElements.define('slang-translator', SlangTranslator);
