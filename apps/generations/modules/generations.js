class CcGenerations extends HTMLElement {
  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
  }

  _escAttr(s) {
    return (s == null ? '' : String(s))
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  connectedCallback() {
    this.questions = [];
    this.allQuestions = [];
    this.current = 0;
    this.scores = {};
    this.state = 'welcome';
    this.selectedGen = null;
    this.quizLength = 20;
    this.passesUsed = 0;
    this.maxFreePass = 2;
    this.correctCount = 0;
    this.totalAnswered = 0;
    this.categoryScores = {};
    this.microGens = {
      greatest:          { name: 'Greatest Generation',   years: '1901–1927', color: '#4a5568', icon: 'shield',       broad: 'Greatest',          desc: 'You resonate with the Greatest Generation — the ones who survived the Great Depression and won World War II. Resilience, sacrifice, and civic duty define your spirit.' },
      silentEarly:       { name: 'Early Silent',          years: '1928–1936', color: '#6b7280', icon: 'radio',        broad: 'Silent',            desc: 'You align with the Early Silent Generation. You grew up during WWII, remember ration books and Victory Gardens, and came of age in a world rebuilding itself.' },
      silentLate:        { name: 'Late Silent',           years: '1937–1945', color: '#78909c', icon: 'music',        broad: 'Silent',            desc: 'You\'re Late Silent Generation — you caught the tail end of WWII as a child, grew up with rock \'n\' roll\'s birth, and were the original "cool" teens of the 1950s.' },
      earlyBoomer:       { name: 'Early Boomer',          years: '1946–1954', color: '#f59e0b', icon: 'sun',          broad: 'Boomer',            desc: 'You\'re an Early Boomer — the Woodstock generation. You lived through the counterculture revolution, Vietnam protests, the Moon landing, and the Summer of Love.' },
      generationJones:   { name: 'Generation Jones',      years: '1955–1964', color: '#d97706', icon: 'star',         broad: 'Boomer/X Cusp',     desc: 'You\'re Generation Jones — too young for Woodstock, too old for MTV\'s launch. You carry a unique blend of Boomer idealism and Gen X pragmatism.' },
      earlyGenX:         { name: 'Early Gen X',           years: '1965–1972', color: '#8b5cf6', icon: 'guitar',       broad: 'Gen X',             desc: 'You\'re Early Gen X — the original latchkey kids. MTV defined your teens, you lived through the Challenger disaster, and grunge was YOUR music.' },
      xennial:           { name: 'Xennial',               years: '1977–1983', color: '#7c3aed', icon: 'disc',         broad: 'X/Millennial Cusp', desc: 'You\'re a Xennial — the "Oregon Trail Generation." You had an analog childhood and a digital young adulthood. Dial-up internet, first email in college.' },
      elderMillennial:   { name: 'Elder Millennial',      years: '1981–1988', color: '#3b82f6', icon: 'smartphone',   broad: 'Millennial',        desc: 'You\'re an Elder Millennial. MySpace page, Y2K, watched 9/11 in school, Facebook required a .edu email. AIM away messages were an art form.' },
      youngerMillennial: { name: 'Younger Millennial',    years: '1989–1994', color: '#2563eb', icon: 'laptop',       broad: 'Millennial',        desc: 'You\'re a Younger Millennial. Early social media, Harry Potter book releases, entered adulthood during the 2008 recession. "Adulting" is hard.' },
      zillennial:        { name: 'Zillennial',            years: '1993–1998', color: '#0ea5e9', icon: 'shuffle',      broad: 'Millennial/Z Cusp', desc: 'You\'re a Zillennial — fluent in both Millennial and Gen Z culture. Vine was your jam, you\'ve been on every platform, and you code-switch effortlessly.' },
      earlyGenZ:         { name: 'Early Gen Z',           years: '1997–2004', color: '#10b981', icon: 'wifi',         broad: 'Gen Z',             desc: 'You\'re Early Gen Z. Grew up with smartphones, Snapchat was your first platform, COVID disrupted your school years. Climate activism defines you.' },
      lateGenZ:          { name: 'Late Gen Z',            years: '2005–2012', color: '#34d399', icon: 'trending-up',  broad: 'Gen Z',             desc: 'You\'re Late Gen Z — TikTok is your native platform, you speak fluent internet, and "rizz" is part of your daily vocabulary.' },
      genAlphaEarly:     { name: 'Early Gen Alpha',       years: '2010–2016', color: '#ec4899', icon: 'bot',          broad: 'Gen Alpha',         desc: 'You\'re Early Gen Alpha — the first truly AI-native generation. Roblox, iPad learning, and YouTube Kids defined your childhood.' },
      genAlphaCore:      { name: 'Core Gen Alpha',        years: '2017+',     color: '#f472b6', icon: 'sparkles',     broad: 'Gen Alpha',         desc: 'You\'re Core Gen Alpha — born into a world of AI, smart homes, and limitless streaming. The future is yours to shape.' }
    };
    this.microGenOrder = Object.keys(this.microGens);
    this.resetScores();
    this.loadQuestions();
  }

  resetScores() {
    this.scores = {};
    Object.keys(this.microGens).forEach(k => this.scores[k] = 0);
    this.passesUsed = 0;
    this.correctCount = 0;
    this.totalAnswered = 0;
    this.categoryScores = {};
  }

  async loadQuestions() {
    try {
      const res = await fetch('data/questions.json');
      this.allQuestions = await res.json();
    } catch(e) {
      this.allQuestions = [];
    }
    this.render();
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  selectGen(genKey) {
    this.selectedGen = genKey;
    this.quizMode = 'multiple-choice';
    this.state = 'choose-mode';
    this.render();
  }

  selectMode(mode) {
    this.quizMode = mode;
    this.state = 'choose-length';
    this.render();
  }

  startQuiz(displayCount) {
    this.resetScores();
    this.current = 0;
    this.quizLength = displayCount;
    // Always prepare 20 questions, spread across micro-generations
    const byTarget = {};
    this.allQuestions.forEach(q => {
      const t = q.targetGen || 'unknown';
      if (!byTarget[t]) byTarget[t] = [];
      byTarget[t].push(q);
    });
    // Pick ~1-2 from each micro-gen, shuffle, fill to 20
    let picked = [];
    const genKeys = this.shuffle(Object.keys(byTarget));
    for (const gk of genKeys) {
      const shuffled = this.shuffle(byTarget[gk]);
      picked.push(...shuffled.slice(0, 2));
    }
    picked = this.shuffle(picked);
    if (picked.length > 20) picked = picked.slice(0, 20);
    // If less than 20, fill from remaining
    if (picked.length < 20) {
      const pickedIds = new Set(picked.map(q => q.id));
      const remaining = this.shuffle(this.allQuestions.filter(q => !pickedIds.has(q.id)));
      picked.push(...remaining.slice(0, 20 - picked.length));
    }
    this.questions = picked.slice(0, 20);
    if (this.quizMode === 'freeform') {
      this.freeformAnswers = [];
      this.state = 'quiz-freeform';
    } else {
      this.state = 'quiz';
    }
    this.render();
  }

  answer(idx) {
    const q = this.questions[this.current];
    this.totalAnswered++;
    const cat = q.category || 'general';
    if (!this.categoryScores[cat]) this.categoryScores[cat] = { correct: 0, total: 0 };
    this.categoryScores[cat].total++;

    if (idx === q.answer) {
      this.correctCount++;
      this.categoryScores[cat].correct++;
      Object.entries(q.weights).forEach(([gen, w]) => { this.scores[gen] = (this.scores[gen] || 0) + w; });
    }
    // Wrong answers give no points — only correct answers shape your profile
    this.advance();
  }

  pass() {
    if (this.quizMode === 'freeform') {
      const q = this.questions[this.current];
      this.freeformAnswers.push({ questionId: q.id, questionText: q.question, answer: null, category: q.category });
    } else {
      this.passesUsed++;
      // Passes just skip — no penalty points (old penalty biased toward oldest gens)
    }
    this.advance();
  }

  toggleMic(btn) {
    if (this._recognition && this._micActive) {
      this._recognition.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition is not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    this._recognition = recognition;
    this._micActive = true;
    btn.classList.add('recording');
    const textarea = this.querySelector('.gen-freeform-input');
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const current = textarea.value;
      const combined = current ? current + ' ' + transcript : transcript;
      textarea.value = combined.slice(0, 100);
      textarea.dispatchEvent(new Event('input'));
    };
    recognition.onend = () => {
      this._micActive = false;
      btn.classList.remove('recording');
    };
    recognition.onerror = () => {
      this._micActive = false;
      btn.classList.remove('recording');
    };
    recognition.start();
  }

  submitFreeformAnswer() {
    const input = this.querySelector('.gen-freeform-input');
    if (!input || !input.value.trim()) return;
    const q = this.questions[this.current];
    this.freeformAnswers.push({ questionId: q.id, questionText: q.question, answer: input.value.trim(), category: q.category });
    this.advance();
  }

  advance() {
    this.current++;
    const limit = Math.min(this.quizLength, this.questions.length);
    if (this.current >= limit) {
      if (this.quizMode === 'freeform') {
        this.state = 'waiting-for-grading';
        this.render();
        this.submitFreeform();
        return;
      }
      this.state = 'results';
    }
    this.render();
    if (this.state === 'results') {
      setTimeout(() => { document.querySelector('cc-confetti')?.fire?.(); }, 300);
    }
  }

  async submitFreeform() {
    const id = `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.submissionId = id;
    try {
      const sb = window.supabase;
      if (sb) {
        await sb.upsert('generation_quiz_submissions', {
          id, mode: 'freeform', selected_gen: this.selectedGen,
          answers: this.freeformAnswers, status: 'pending',
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        });
      }
    } catch (e) { console.error('Submit freeform error', e); }
    this.startPolling();
  }

  startPolling() {
    if (this._pollInterval) clearInterval(this._pollInterval);
    this._pollInterval = setInterval(async () => {
      try {
        const sb = window.supabase;
        if (!sb) return;
        const rows = await sb.select('generation_quiz_submissions', { filters: { id: `eq.${this.submissionId}` } });
        const data = rows && rows[0];
        if (data && data.status === 'complete') {
          clearInterval(this._pollInterval);
          this._pollInterval = null;
          this.freeformResultGen = data.result_gen;
          this.freeformResultData = data.result_data;
          this.state = 'results-freeform';
          this.render();
          setTimeout(() => { document.querySelector('cc-confetti')?.fire?.(); }, 300);
        }
      } catch (e) { console.error('Polling error', e); }
    }, 3000);
  }

  getResults() {
    const total = Object.values(this.scores).reduce((a, b) => a + b, 0) || 1;
    // Shuffle before sorting so ties are broken randomly, not by insertion order
    const entries = Object.entries(this.scores);
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const top5 = sorted.filter(([, s]) => s > 0).slice(0, 5);
    // If no one scored any points, fall back to their self-identified generation
    const winner = top5.length > 0 ? sorted[0][0] : (this.selectedGen || sorted[0][0]);
    return { total, sorted, top5, winner };
  }

  render() {
    if (this.state === 'welcome') return this.renderWelcome();
    if (this.state === 'choose-mode') return this.renderChooseMode();
    if (this.state === 'choose-length') return this.renderChooseLength();
    if (this.state === 'quiz') return this.renderQuiz();
    if (this.state === 'quiz-freeform') return this.renderQuizFreeform();
    if (this.state === 'waiting-for-grading') return this.renderWaitingForGrading();
    if (this.state === 'results') return this.renderResults();
    if (this.state === 'results-freeform') return this.renderResultsFreeform();
  }

  renderChooseMode() {
    const sel = this.microGens[this.selectedGen];
    this.innerHTML = `
      <style>
        .gen-choose{max-width:640px;margin:60px auto;padding:0 20px;text-align:center}
        .gen-choose h2{font-family:var(--serif);font-size:1.8rem;margin-bottom:8px}
        .gen-choose .sel-info{color:var(--muted);margin-bottom:32px;font-size:1rem}
        .gen-choose .sel-badge{display:inline-block;padding:4px 14px;border-radius:99px;font-size:.85rem;font-weight:600;color:#fff;background:${sel.color};margin-bottom:8px}
        .gen-options{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
        .gen-opt{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px 28px;cursor:pointer;transition:all .2s;min-width:200px;max-width:260px;text-align:center;flex:1}
        .gen-opt:hover{border-color:var(--accent);transform:translateY(-4px);box-shadow:0 8px 32px rgba(0,0,0,.3)}
        .gen-opt .opt-icon{width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,.12);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px}
        .gen-opt .opt-title{font-size:1.1rem;font-weight:700;margin-bottom:8px;color:var(--text)}
        .gen-opt .opt-desc{color:var(--muted);font-size:.85rem;line-height:1.5}
        .gen-back{color:var(--muted);cursor:pointer;font-size:.9rem;margin-top:24px;display:inline-block}
        .gen-back:hover{color:var(--text)}
      </style>
      <div class="gen-choose">
        <cc-fade-in>
          <div class="sel-badge">${sel.name}</div>
          <h2>Choose Quiz Mode</h2>
          <p class="sel-info">How do you want to take the quiz?</p>
        </cc-fade-in>
        <cc-fade-in delay="100">
          <div class="gen-options">
            <div class="gen-opt" onclick="this.closest('cc-generations').selectMode('multiple-choice')">
              <div class="opt-icon"><i data-lucide="list-checks" style="width:24px;height:24px;color:var(--accent)"></i></div>
              <div class="opt-title">Multiple Choice</div>
              <div class="opt-desc">Answer questions with 4 options. Instant results!</div>
            </div>
            <div class="gen-opt" onclick="this.closest('cc-generations').selectMode('freeform')">
              <div class="opt-icon"><i data-lucide="pencil" style="width:24px;height:24px;color:var(--accent)"></i></div>
              <div class="opt-title">Free Form</div>
              <div class="opt-desc">Type your own answers. Claudia (AI) will personally analyze your responses and determine your generation. Results in ~1 minute.</div>
            </div>
          </div>
          <div class="gen-back" onclick="this.closest('cc-generations').state='welcome';this.closest('cc-generations').render()">← Change selection</div>
        </cc-fade-in>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  renderQuizFreeform() {
    const q = this.questions[this.current];
    const limit = Math.min(this.quizLength, this.questions.length);
    const pct = ((this.current) / limit * 100).toFixed(0);
    const catIcons = { slang: 'message-circle', events: 'calendar', popCulture: 'tv', lifestyle: 'home', technology: 'cpu' };
    const catLabels = { slang: 'Slang', events: 'Events', popCulture: 'Pop Culture', lifestyle: 'Lifestyle', technology: 'Technology' };
    this.innerHTML = `
      <style>
        .gen-quiz{max-width:640px;margin:40px auto;padding:0 20px}
        .gen-progress{background:var(--border);border-radius:99px;height:8px;margin-bottom:24px;overflow:hidden}
        .gen-progress-bar{height:100%;background:var(--accent);border-radius:99px;transition:width .4s ease}
        .gen-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;color:var(--muted);font-size:.85rem}
        .gen-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px;animation:genSlideIn .35s ease}
        @keyframes genSlideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        .gen-card h2{font-size:1.3rem;margin:0 0 24px;line-height:1.4;font-family:var(--serif)}
        .gen-cat{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;font-size:.75rem;font-weight:600;background:rgba(245,158,11,.15);color:var(--accent);margin-bottom:16px}
        .gen-freeform-wrap{display:flex;flex-direction:column;align-items:center;gap:12px}
        .gen-freeform-input{display:block;width:100%;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px 18px;font-size:1rem;color:var(--text);font-family:inherit;resize:none;outline:none;transition:border-color .2s;box-sizing:border-box}
        .gen-freeform-input:focus{border-color:var(--accent)}
        .gen-mic-btn{width:200px;background:rgba(245,158,11,.1);border:2px solid var(--accent);cursor:pointer;color:var(--accent);padding:14px;border-radius:100px;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.95rem;font-weight:600;font-family:inherit}
        .gen-mic-btn:hover{background:rgba(245,158,11,.2)}
        .gen-mic-btn.recording{color:#ef4444;border-color:#ef4444;background:rgba(239,68,68,.1);animation:genMicPulse 1s ease-in-out infinite}
        @keyframes genMicPulse{0%,100%{opacity:1}50%{opacity:.4}}
        .gen-mic-btn svg{width:28px;height:28px}
        .gen-char-count{text-align:right;font-size:.8rem;color:var(--muted);margin-top:6px;transition:color .2s}
        .gen-char-count.warn{color:#ef4444}
        .gen-submit-btn{display:block;width:100%;text-align:center;background:var(--accent);border:none;border-radius:12px;padding:14px;margin-top:12px;cursor:pointer;color:#fff;font-size:1rem;font-weight:600;font-family:inherit;transition:all .2s}
        .gen-submit-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
        .gen-submit-btn:disabled{opacity:.4;cursor:not-allowed}
        .gen-pass-btn{display:block;width:100%;text-align:center;background:transparent;border:1px dashed var(--border);border-radius:12px;padding:12px;margin-top:8px;cursor:pointer;color:var(--muted);font-size:.9rem;font-family:inherit;transition:all .2s}
        .gen-pass-btn:hover{border-color:var(--muted);color:var(--text)}
      </style>
      <div class="gen-quiz">
        <div class="gen-meta">
          <span>Question ${this.current + 1} of ${limit}</span>
          <span>${pct}% complete</span>
        </div>
        <div class="gen-progress"><div class="gen-progress-bar" style="width:${pct}%"></div></div>
        <div class="gen-card">
          <div class="gen-cat"><i data-lucide="${catIcons[q.category] || 'help-circle'}" style="width:14px;height:14px"></i>${catLabels[q.category] || q.category}</div>
          <h2>${this._esc(q.question)}</h2>
          <div class="gen-freeform-wrap">
            <textarea class="gen-freeform-input" maxlength="100" rows="2" placeholder="Type or tap 🎤 to speak…" oninput="
              const cnt = this.closest('.gen-card').querySelector('.gen-char-count');
              const btn = this.closest('.gen-card').querySelector('.gen-submit-btn');
              cnt.textContent = this.value.length + '/100';
              cnt.className = 'gen-char-count' + (this.value.length >= 90 ? ' warn' : '');
              btn.disabled = !this.value.trim();
            "></textarea>
            <button class="gen-mic-btn" type="button" title="Voice input" onclick="this.closest('cc-generations').toggleMic(this)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              Tap to Speak
            </button>
          </div>
          <div class="gen-char-count">0/100</div>
          <button class="gen-submit-btn" disabled onclick="this.closest('cc-generations').submitFreeformAnswer()">Submit Answer</button>
          <button class="gen-pass-btn" onclick="this.closest('cc-generations').pass()">Pass</button>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
    setTimeout(() => { const input = this.querySelector('.gen-freeform-input'); if (input) input.focus(); }, 50);
  }

  renderWaitingForGrading() {
    this.innerHTML = `
      <style>
        .gen-waiting{max-width:480px;margin:80px auto;padding:0 20px;text-align:center}
        .gen-waiting-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:48px 32px}
        .gen-waiting-icon{width:64px;height:64px;border-radius:50%;background:rgba(245,158,11,.12);display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;animation:genPulse 2s ease-in-out infinite}
        @keyframes genPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.8}}
        .gen-waiting-card h2{font-family:var(--serif);font-size:1.5rem;margin-bottom:8px}
        .gen-waiting-card p{color:var(--muted);font-size:.95rem;margin-bottom:20px}
        .gen-dots{display:inline-flex;gap:6px}
        .gen-dots span{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:genDot 1.4s ease-in-out infinite}
        .gen-dots span:nth-child(2){animation-delay:.2s}
        .gen-dots span:nth-child(3){animation-delay:.4s}
        @keyframes genDot{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}
      </style>
      <div class="gen-waiting">
        <div class="gen-waiting-card">
          <div class="gen-waiting-icon"><i data-lucide="sparkles" style="width:28px;height:28px;color:var(--accent)"></i></div>
          <h2>Claudia is analyzing your answers…</h2>
          <p>This usually takes about a minute</p>
          <div class="gen-dots"><span></span><span></span><span></span></div>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  renderResultsFreeform() {
    const gen = this.freeformResultGen;
    const rd = this.freeformResultData || {};
    const info = this.microGens[gen] || this.microGens[Object.keys(this.microGens)[0]];
    const selectedInfo = this.microGens[this.selectedGen];
    const match = gen === this.selectedGen;
    const matchPct = rd.matchPct || rd.match_pct || 0;
    const analysis = rd.analysis || '';
    const top5 = rd.top5 || [];
    const emojiMap = {shield:'🛡️',radio:'📻',music:'🎵',sun:'☀️',star:'⭐',guitar:'🎸',disc:'💿',smartphone:'📱',laptop:'💻',shuffle:'🔀',wifi:'📶','trending-up':'📈',bot:'🤖',sparkles:'✨'};

    this.innerHTML = `
      <style>
        .gen-results{max-width:640px;margin:40px auto;padding:0 20px;text-align:center}
        .gen-winner{background:var(--card);border:2px solid ${info.color};border-radius:20px;padding:40px 32px;margin-bottom:24px;animation:genPop .5s ease}
        @keyframes genPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        .gen-winner h1{font-family:var(--serif);font-size:2rem;margin:12px 0 4px;color:${info.color}}
        .gen-winner .broad{color:var(--muted);font-size:.85rem;margin-bottom:4px}
        .gen-winner .years{color:var(--muted);font-size:.9rem;margin-bottom:16px}
        .gen-winner p{color:var(--muted);line-height:1.6;font-size:.95rem}
        .gen-winner .pct-badge{display:inline-block;padding:6px 16px;border-radius:99px;font-size:1.1rem;font-weight:700;color:#fff;background:${info.color};margin-bottom:12px}
        .gen-analysis{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:20px;text-align:left;color:var(--muted);line-height:1.7;font-size:.95rem}
        .gen-analysis h3{color:var(--text);margin:0 0 12px;font-size:1rem}
        .gen-comparison{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;font-size:.95rem;color:var(--muted);line-height:1.6}
        .gen-comparison strong{color:var(--text)}
        .gen-comparison .match-icon{font-size:1.4rem;display:block;margin-bottom:8px}
        .gen-bars{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:24px;text-align:left}
        .gen-bars h3{margin:0 0 16px;font-size:1rem}
        .gen-bar-row{margin-bottom:12px}
        .gen-bar-label{display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px}
        .gen-bar-track{background:var(--border);border-radius:99px;height:10px;overflow:hidden}
        .gen-bar-fill{height:100%;border-radius:99px;transition:width .8s ease}
        .gen-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px}
        .gen-actions button{display:inline-flex;align-items:center;gap:8px;cursor:pointer}
        .gen-share-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:12px}
      </style>
      <div class="gen-results">
        <cc-fade-in>
          <div class="gen-winner">
            <div style="width:56px;height:56px;border-radius:50%;background:${info.color}22;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px"><i data-lucide="${info.icon}" style="width:28px;height:28px;color:${info.color}"></i></div>
            <h1>${this._esc(info.name)}</h1>
            ${matchPct ? `<div class="pct-badge">${matchPct}% match</div>` : ''}
            <div class="broad">Part of the broader ${this._esc(info.broad)} generation</div>
            <div class="years">${this._esc(info.years)}</div>
            <p>${this._esc(info.desc)}</p>
          </div>
        </cc-fade-in>

        ${analysis ? `<cc-fade-in delay="100">
          <div class="gen-analysis">
            <h3>🤖 Claudia's Analysis</h3>
            ${this._esc(analysis)}
          </div>
        </cc-fade-in>` : ''}

        <cc-fade-in delay="150">
          <div class="gen-comparison">
            <div class="match-icon">${match ? '✅' : '🔄'}</div>
            ${match
              ? `You said you were <strong style="color:${selectedInfo.color}">${this._esc(selectedInfo.name)}</strong> and Claudia determined you're <strong style="color:${info.color}">${this._esc(info.name)}</strong> — spot on!`
              : `You said you were <strong style="color:${selectedInfo.color}">${this._esc(selectedInfo.name)}</strong>, but Claudia determined you're <strong style="color:${info.color}">${this._esc(info.name)}</strong>. Your answers tell a different story!`
            }
          </div>
        </cc-fade-in>

        ${top5.length ? `<cc-fade-in delay="200">
          <div class="gen-bars">
            <h3>Micro-Generation Breakdown</h3>
            ${top5.map(item => {
              const g = this.microGens[item.gen] || { name: item.gen, color: '#888', years: '' };
              return `<div class="gen-bar-row">
                <div class="gen-bar-label"><span>${this._esc(g.name)} ${g.years ? `<span style="font-size:.75rem;color:var(--muted)">${this._esc(g.years)}</span>` : ''}</span><span style="color:${g.color};font-weight:600">${item.pct}%</span></div>
                <div class="gen-bar-track"><div class="gen-bar-fill" style="width:${item.pct}%;background:${g.color}"></div></div>
              </div>`;
            }).join('')}
          </div>
        </cc-fade-in>` : ''}

        <cc-fade-in delay="300">
          <div class="gen-actions">
            <button class="btn btn-primary" onclick="this.closest('cc-generations').state='welcome';this.closest('cc-generations').render()"><i data-lucide="rotate-ccw" style="width:16px;height:16px"></i> Retake Quiz</button>
            <button class="btn btn-primary gen-share-img-btn" onclick="this.closest('cc-generations').shareAsImageFreeform()" style="background:${info.color};border-color:${info.color}"><i data-lucide="image" style="width:16px;height:16px"></i> Share as Image</button>
            <button class="btn btn-secondary gen-pdf-btn" onclick="this.closest('cc-generations').downloadPDFFreeform()"><i data-lucide="file-text" style="width:16px;height:16px"></i> Download PDF</button>
          </div>
          <div class="gen-share-row" data-gen-name="${this._escAttr(info.name)}">
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="twitter">𝕏 Share</button>
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="facebook">Facebook</button>
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="linkedin">LinkedIn</button>
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="copy">📋 Copy Link</button>
          </div>
        </cc-fade-in>
      </div>`;
    this._bindShareButtons();
    if (window.lucide) lucide.createIcons();
  }

  _buildShareCardHTMLFreeform() {
    const gen = this.freeformResultGen;
    const rd = this.freeformResultData || {};
    const info = this.microGens[gen] || {};
    const selectedInfo = this.microGens[this.selectedGen];
    const match = gen === this.selectedGen;
    const matchPct = rd.matchPct || rd.match_pct || 0;
    const top5 = (rd.top5 || []).slice(0, 3);
    const emojiMap = {shield:'🛡️',radio:'📻',music:'🎵',sun:'☀️',star:'⭐',guitar:'🎸',disc:'💿',smartphone:'📱',laptop:'💻',shuffle:'🔀',wifi:'📶','trending-up':'📈',bot:'🤖',sparkles:'✨'};
    return `<div id="gen-share-card" style="width:600px;padding:40px;background:#1a1a2e;border-radius:24px;border:2px solid ${info.color};font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;position:fixed;left:-9999px;top:0;z-index:99999">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:8px">🧬 Micro-Generations Quiz (Free Form)</div>
        <div style="width:64px;height:64px;border-radius:50%;background:${info.color}33;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
          <span style="font-size:28px">${emojiMap[info.icon] || '🧬'}</span>
        </div>
        <div style="font-size:2rem;font-weight:800;color:${info.color};margin-bottom:4px">${info.name}</div>
        ${matchPct ? `<div style="display:inline-block;padding:4px 14px;border-radius:99px;font-size:.9rem;font-weight:700;color:#fff;background:${info.color};margin-bottom:8px">${matchPct}% match</div>` : ''}
        <div style="color:#94a3b8;font-size:.85rem">${info.years} · ${info.broad}</div>
      </div>
      ${top5.length ? `<div style="margin-bottom:20px">${top5.map(item => {
        const g = this.microGens[item.gen] || { name: item.gen, color: '#888' };
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px"><span>${g.name}</span><span style="color:${g.color};font-weight:700">${item.pct}%</span></div>
          <div style="background:#2d2d44;border-radius:99px;height:10px;overflow:hidden"><div style="height:100%;width:${item.pct}%;background:${g.color};border-radius:99px"></div></div>
        </div>`;
      }).join('')}</div>` : ''}
      <div style="text-align:center;padding-top:12px;border-top:1px solid #2d2d44">
        <div style="color:#94a3b8;font-size:.8rem">${match ? '✅' : '🔄'} Said: ${selectedInfo.name} → AI Result: ${info.name}</div>
        <div style="color:#64748b;font-size:.75rem;margin-top:8px">generations.adam-harris.alphaclaw.app</div>
      </div>
    </div>`;
  }

  async shareAsImageFreeform() {
    const btn = this.querySelector('.gen-share-img-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
    try {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this._buildShareCardHTMLFreeform();
      document.body.appendChild(wrapper);
      const card = document.getElementById('gen-share-card');
      const h2c = await this._loadHtml2Canvas();
      const canvas = await h2c(card, { backgroundColor: '#1a1a2e', scale: 2, useCORS: true });
      wrapper.remove();
      const info = this.microGens[this.freeformResultGen] || {};
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'my-generation-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Micro-Generations Quiz', text: `I got ${info.name} on the Micro-Generations Quiz!`, url: location.href, files: [file] });
      } else {
        const link = document.createElement('a');
        link.download = 'my-generation-result.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch(e) { console.error('Share error', e); }
    finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="image" style="width:16px;height:16px"></i> Share as Image'; if(window.lucide) lucide.createIcons(); }
    }
  }

  downloadPDFFreeform() {
    const btn = this.querySelector('.gen-pdf-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generating PDF…'; }
    const gen = this.freeformResultGen;
    const rd = this.freeformResultData || {};
    const info = this.microGens[gen] || {};
    const selectedInfo = this.microGens[this.selectedGen];
    const match = gen === this.selectedGen;
    const matchPct = rd.matchPct || rd.match_pct || 0;
    const analysis = rd.analysis || '';
    const top5 = rd.top5 || [];

    const top5bars = top5.map(item => {
      const g = this.microGens[item.gen] || { name: item.gen, color: '#888', years: '' };
      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span>${g.name}${g.years ? ` (${g.years})` : ''}</span><span style="color:${g.color};font-weight:700">${item.pct}%</span></div>
        <div style="background:#e2e8f0;border-radius:99px;height:12px;overflow:hidden"><div style="height:100%;width:${item.pct}%;background:${g.color};border-radius:99px"></div></div>
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>My Micro-Generation Result</title>
    <style>
      @page{margin:40px 50px}*{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Georgia,'Times New Roman',serif;color:#1e293b;background:#fff;padding:40px 50px}
      .header{text-align:center;border-bottom:3px solid ${info.color};padding-bottom:20px;margin-bottom:24px}
      .header h1{font-size:28px;color:${info.color};margin:8px 0 4px}
      .header .subtitle{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px}
      .header .pct{display:inline-block;padding:4px 16px;border-radius:99px;background:${info.color};color:#fff;font-size:16px;font-weight:700;margin:8px 0}
      .header .meta{font-size:13px;color:#64748b}
      .section{margin-bottom:20px}
      .section h2{font-size:16px;margin-bottom:10px;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      .desc{font-size:14px;line-height:1.7;color:#475569;margin-bottom:16px}
      .comparison{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:14px;color:#475569;margin-bottom:16px;text-align:center}
      .comparison strong{color:#1e293b}
      .footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    </style></head><body>
      <div class="header">
        <div class="subtitle">🧬 Micro-Generations Quiz — Free Form Results</div>
        <h1>${info.name}</h1>
        ${matchPct ? `<div class="pct">${matchPct}% match</div>` : ''}
        <div class="meta">${info.years} · ${info.broad} generation</div>
      </div>
      <div class="section"><p class="desc">${info.desc}</p></div>
      <div class="comparison">
        ${match
          ? `You said you were <strong>${selectedInfo.name}</strong> and Claudia determined you're <strong>${info.name}</strong> — spot on!`
          : `You said you were <strong>${selectedInfo.name}</strong>, but Claudia determined you're <strong>${info.name}</strong>.`}
      </div>
      ${analysis ? `<div class="section"><h2>🤖 Claudia's Analysis</h2><p class="desc">${this._esc(analysis)}</p></div>` : ''}
      ${top5.length ? `<div class="section"><h2>Micro-Generation Breakdown</h2>${top5bars}</div>` : ''}
      <div class="footer">Generated at generations.adam-harris.alphaclaw.app · ${new Date().toLocaleDateString()}</div>
    </body></html>`;

    const printWin = window.open('', '_blank', 'width=700,height=900');
    printWin.document.write(html);
    printWin.document.close();
    printWin.onload = () => { printWin.print(); };
    setTimeout(() => { try { printWin.print(); } catch(e) {} }, 500);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="file-text" style="width:16px;height:16px"></i> Download PDF'; if(window.lucide) lucide.createIcons(); }
  }

  renderWelcome() {
    const genEntries = Object.entries(this.microGens);
    this.innerHTML = `
      <style>
        .gen-welcome{max-width:760px;margin:60px auto;padding:0 20px;text-align:center}
        .gen-welcome h1{font-family:var(--serif);font-size:2.4rem;margin-bottom:8px}
        .gen-welcome .subtitle{color:var(--muted);margin-bottom:24px;font-size:1.1rem;line-height:1.6}
        .gen-welcome .step-label{font-size:1rem;color:var(--accent);font-weight:600;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px}
        .gen-pick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;text-align:left;margin-bottom:24px}
        .gen-pick-item{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .2s}
        .gen-pick-item:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.2)}
        .gen-pick-item .gp-name{font-weight:700;font-size:.9rem;margin-bottom:2px}
        .gen-pick-item .gp-years{color:var(--muted);font-size:.78rem}
        .gen-pick-item .gp-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}
      </style>
      <div class="gen-welcome">
        <cc-fade-in>
          <h1>What Micro-Generation Are You?</h1>
          <p class="subtitle">Not just "Gen X" or "Millennial" — discover your <strong>micro-generation</strong>. Are you a Xennial? Generation Jones? A Zillennial? Let's find out.</p>
        </cc-fade-in>
        <cc-fade-in delay="100">
          <div class="step-label">Step 1: Which micro-generation do you THINK you are?</div>
          <div class="gen-pick-grid">
            ${genEntries.map(([key, g]) => `
              <div class="gen-pick-item" onclick="this.closest('cc-generations').selectGen('${key}')">
                <div class="gp-name"><span class="gp-dot" style="background:${this._esc(g.color)}"></span>${this._esc(g.name)}</div>
                <div class="gp-years">${this._esc(g.years)}</div>
              </div>
            `).join('')}
          </div>
        </cc-fade-in>
      </div>`;
  }

  renderChooseLength() {
    const sel = this.microGens[this.selectedGen];
    this.innerHTML = `
      <style>
        .gen-choose{max-width:640px;margin:60px auto;padding:0 20px;text-align:center}
        .gen-choose h2{font-family:var(--serif);font-size:1.8rem;margin-bottom:8px}
        .gen-choose .sel-info{color:var(--muted);margin-bottom:32px;font-size:1rem}
        .gen-choose .sel-badge{display:inline-block;padding:4px 14px;border-radius:99px;font-size:.85rem;font-weight:600;color:#fff;background:${sel.color};margin-bottom:8px}
        .gen-options{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
        .gen-opt{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px 28px;cursor:pointer;transition:all .2s;min-width:160px;text-align:center}
        .gen-opt:hover{border-color:var(--accent);transform:translateY(-4px);box-shadow:0 8px 32px rgba(0,0,0,.3)}
        .gen-opt .num{font-size:2.4rem;font-weight:800;color:var(--accent);display:block;margin-bottom:4px}
        .gen-opt .label{color:var(--muted);font-size:.9rem}
        .gen-back{color:var(--muted);cursor:pointer;font-size:.9rem;margin-top:24px;display:inline-block}
        .gen-back:hover{color:var(--text)}
      </style>
      <div class="gen-choose">
        <cc-fade-in>
          <div class="sel-badge">${sel.name}</div>
          <h2>You think you're ${sel.name}</h2>
          <p class="sel-info">Let's see if the quiz agrees. How many questions?</p>
        </cc-fade-in>
        <cc-fade-in delay="100">
          <div class="gen-options">
            <div class="gen-opt" onclick="this.closest('cc-generations').startQuiz(10)"><span class="num">10</span><span class="label">Quick</span></div>
            <div class="gen-opt" onclick="this.closest('cc-generations').startQuiz(20)"><span class="num">20</span><span class="label">Full</span></div>
          </div>
          <div class="gen-back" onclick="this.closest('cc-generations').state='welcome';this.closest('cc-generations').render()">← Change selection</div>
        </cc-fade-in>
      </div>`;
  }

  renderQuiz() {
    const q = this.questions[this.current];
    const limit = Math.min(this.quizLength, this.questions.length);
    const pct = ((this.current) / limit * 100).toFixed(0);
    const catIcons = { slang: 'message-circle', events: 'calendar', popCulture: 'tv', lifestyle: 'home', technology: 'cpu' };
    const catLabels = { slang: 'Slang', events: 'Events', popCulture: 'Pop Culture', lifestyle: 'Lifestyle', technology: 'Technology' };
    this.innerHTML = `
      <style>
        .gen-quiz{max-width:640px;margin:40px auto;padding:0 20px}
        .gen-progress{background:var(--border);border-radius:99px;height:8px;margin-bottom:24px;overflow:hidden}
        .gen-progress-bar{height:100%;background:var(--accent);border-radius:99px;transition:width .4s ease}
        .gen-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;color:var(--muted);font-size:.85rem}
        .gen-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:32px;animation:genSlideIn .35s ease}
        @keyframes genSlideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        .gen-card h2{font-size:1.3rem;margin:0 0 24px;line-height:1.4;font-family:var(--serif)}
        .gen-option{display:block;width:100%;text-align:left;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:10px;cursor:pointer;transition:all .2s;font-size:1rem;color:var(--text);font-family:inherit}
        .gen-option:hover{border-color:var(--accent);background:rgba(245,158,11,.08);transform:translateX(4px)}
        .gen-cat{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;font-size:.75rem;font-weight:600;background:rgba(245,158,11,.15);color:var(--accent);margin-bottom:16px}
        .gen-pass-btn{display:block;width:100%;text-align:center;background:transparent;border:1px dashed var(--border);border-radius:12px;padding:12px;margin-top:8px;cursor:pointer;color:var(--muted);font-size:.9rem;font-family:inherit;transition:all .2s}
        .gen-pass-btn:hover{border-color:var(--muted);color:var(--text)}
      </style>
      <div class="gen-quiz">
        <div class="gen-meta">
          <span>Question ${this.current + 1} of ${limit}</span>
          <span>${pct}% complete</span>
        </div>
        <div class="gen-progress"><div class="gen-progress-bar" style="width:${pct}%"></div></div>
        <div class="gen-card">
          <div class="gen-cat"><i data-lucide="${catIcons[q.category] || 'help-circle'}" style="width:14px;height:14px"></i>${catLabels[q.category] || q.category}</div>
          <h2>${this._esc(q.question)}</h2>
          ${q.options.map((o, i) => `<button class="gen-option" onclick="this.closest('cc-generations').answer(${i})">${this._esc(o)}</button>`).join('')}
          <button class="gen-pass-btn" onclick="this.closest('cc-generations').pass()">Pass</button>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  _getResultData() {
    const { total, sorted, top5, winner } = this.getResults();
    const info = this.microGens[winner];
    const second = sorted[1] && sorted[1][1] > 0 ? { key: sorted[1][0], ...this.microGens[sorted[1][0]], pct: Math.round(sorted[1][1] / total * 100) } : null;
    const third = sorted[2] && sorted[2][1] > 0 ? { key: sorted[2][0], ...this.microGens[sorted[2][0]], pct: Math.round(sorted[2][1] / total * 100) } : null;
    const winnerPct = Math.round(sorted[0][1] / total * 100);
    const selectedInfo = this.microGens[this.selectedGen];
    const match = winner === this.selectedGen;
    const limit = Math.min(this.quizLength, this.questions.length);
    const accuracy = this.totalAnswered > 0 ? Math.round(this.correctCount / this.totalAnswered * 100) : 0;
    let bestCat = null, bestCatPct = 0;
    const catLabels = { slang: 'Slang', events: 'Events', popCulture: 'Pop Culture', lifestyle: 'Lifestyle', technology: 'Technology' };
    Object.entries(this.categoryScores).forEach(([cat, s]) => {
      if (s.total > 0) { const p = s.correct / s.total; if (p > bestCatPct) { bestCatPct = p; bestCat = cat; } }
    });
    return { total, sorted, top5, winner, info, second, third, winnerPct, selectedInfo, match, limit, accuracy, bestCat, bestCatPct, catLabels };
  }

  async _loadHtml2Canvas() {
    if (window.html2canvas) return window.html2canvas;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = () => resolve(window.html2canvas);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  _buildShareCardHTML(d) {
    const top3 = d.top5.slice(0, 3);
    return `<div id="gen-share-card" style="width:600px;padding:40px;background:#1a1a2e;border-radius:24px;border:2px solid ${d.info.color};font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;position:fixed;left:-9999px;top:0;z-index:99999">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:8px">🧬 Micro-Generations Quiz</div>
        <div style="width:64px;height:64px;border-radius:50%;background:${d.info.color}33;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
          <span style="font-size:28px">${{shield:'🛡️',radio:'📻',music:'🎵',sun:'☀️',star:'⭐',guitar:'🎸',disc:'💿',smartphone:'📱',laptop:'💻',shuffle:'🔀',wifi:'📶','trending-up':'📈',bot:'🤖',sparkles:'✨'}[d.info.icon] || '🧬'}</span>
        </div>
        <div style="font-size:2rem;font-weight:800;color:${d.info.color};margin-bottom:4px">${d.info.name}</div>
        <div style="display:inline-block;padding:4px 14px;border-radius:99px;font-size:.9rem;font-weight:700;color:#fff;background:${d.info.color};margin-bottom:8px">${d.winnerPct}% match</div>
        <div style="color:#94a3b8;font-size:.85rem">${d.info.years} · ${d.info.broad}</div>
      </div>
      <div style="margin-bottom:20px">
        ${top3.map(([gen, score]) => {
          const g = this.microGens[gen];
          const pct = d.total > 0 ? Math.round(score / d.total * 100) : 0;
          return `<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px"><span>${g.name}</span><span style="color:${g.color};font-weight:700">${pct}%</span></div>
            <div style="background:#2d2d44;border-radius:99px;height:10px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${g.color};border-radius:99px"></div></div>
          </div>`;
        }).join('')}
      </div>
      <div style="text-align:center;padding-top:12px;border-top:1px solid #2d2d44">
        <div style="color:#94a3b8;font-size:.8rem">${d.match ? '✅' : '🔄'} Said: ${d.selectedInfo.name} → Tested: ${d.info.name}</div>
        <div style="color:#64748b;font-size:.75rem;margin-top:8px">generations.adam-harris.alphaclaw.app</div>
      </div>
    </div>`;
  }

  async _captureShareImage() {
    const d = this._getResultData();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this._buildShareCardHTML(d);
    document.body.appendChild(wrapper);
    const card = document.getElementById('gen-share-card');
    try {
      const h2c = await this._loadHtml2Canvas();
      const canvas = await h2c(card, { backgroundColor: '#1a1a2e', scale: 2, useCORS: true });
      return canvas;
    } finally {
      wrapper.remove();
    }
  }

  async shareAsImage() {
    const btn = this.querySelector('.gen-share-img-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
    try {
      const canvas = await this._captureShareImage();
      const d = this._getResultData();
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const file = new File([blob], 'my-generation-result.png', { type: 'image/png' });
      const shareText = `I got ${d.info.name} on the Micro-Generations Quiz! Take it here:`;
      const shareUrl = location.href;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: 'Micro-Generations Quiz', text: shareText, url: shareUrl, files: [file] });
      } else {
        // Fallback: download image and show social links
        const link = document.createElement('a');
        link.download = 'my-generation-result.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        this._showSocialLinks(d);
      }
    } catch(e) {
      if (e.name !== 'AbortError') {
        const d = this._getResultData();
        this._showSocialLinks(d);
      }
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="image" style="width:16px;height:16px"></i> Share as Image'; if(window.lucide) lucide.createIcons(); }
    }
  }

  _showSocialLinks(d) {
    const existing = this.querySelector('.gen-social-popup');
    if (existing) { existing.remove(); return; }
    const shareText = 'I got ' + d.info.name + ' on the Micro-Generations Quiz!';
    const shareUrl = location.href;
    const textEnc = encodeURIComponent(shareText);
    const urlEnc = encodeURIComponent(shareUrl);
    const popup = document.createElement('div');
    popup.className = 'gen-social-popup';
    popup.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;margin-top:12px;animation:genPop .3s ease">
        <div style="font-size:.85rem;color:var(--muted);margin-bottom:12px">Share your result:</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a href="https://twitter.com/intent/tweet?text=${this._escAttr(textEnc)}&url=${this._escAttr(urlEnc)}" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size:.85rem;padding:8px 14px;text-decoration:none">𝕏 Twitter</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${this._escAttr(urlEnc)}&quote=${this._escAttr(textEnc)}" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size:.85rem;padding:8px 14px;text-decoration:none">Facebook</a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${this._escAttr(urlEnc)}" target="_blank" rel="noopener" class="btn btn-secondary" style="font-size:.85rem;padding:8px 14px;text-decoration:none">LinkedIn</a>
          <button class="btn btn-secondary" style="font-size:.85rem;padding:8px 14px" data-action="copy-popup">📋 Copy Link</button>
        </div>
      </div>`;
    this.querySelector('.gen-share-row').after(popup);
    popup.querySelector('[data-action="copy-popup"]').addEventListener('click', () => {
      navigator.clipboard.writeText(shareText + ' ' + shareUrl);
      window.showToast?.('Copied!');
      popup.remove();
    });
  }

  async downloadPDF() {
    const btn = this.querySelector('.gen-pdf-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generating PDF…'; }
    const d = this._getResultData();
    // Build a print-friendly document in a hidden iframe
    const top3bars = d.top5.slice(0, 5).map(([gen, score]) => {
      const g = this.microGens[gen];
      const pct = d.total > 0 ? Math.round(score / d.total * 100) : 0;
      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span>${g.name} (${g.years})</span><span style="color:${g.color};font-weight:700">${pct}%</span></div>
        <div style="background:#e2e8f0;border-radius:99px;height:12px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${g.color};border-radius:99px"></div></div>
      </div>`;
    }).join('');

    const bestCatStr = d.bestCat ? `<tr><td style="padding:6px 0;color:#64748b">Strongest Category</td><td style="padding:6px 0;font-weight:600;text-align:right">${d.catLabels[d.bestCat] || d.bestCat} (${Math.round(d.bestCatPct * 100)}%)</td></tr>` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>My Micro-Generation Result</title>
    <style>
      @page{margin:40px 50px}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Georgia,'Times New Roman',serif;color:#1e293b;background:#fff;padding:40px 50px}
      .header{text-align:center;border-bottom:3px solid ${d.info.color};padding-bottom:20px;margin-bottom:24px}
      .header h1{font-size:28px;color:${d.info.color};margin:8px 0 4px}
      .header .subtitle{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px}
      .header .pct{display:inline-block;padding:4px 16px;border-radius:99px;background:${d.info.color};color:#fff;font-size:16px;font-weight:700;margin:8px 0}
      .header .meta{font-size:13px;color:#64748b}
      .section{margin-bottom:20px}
      .section h2{font-size:16px;margin-bottom:10px;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
      .desc{font-size:14px;line-height:1.7;color:#475569;margin-bottom:16px}
      .comparison{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:14px;color:#475569;margin-bottom:16px;text-align:center}
      .comparison strong{color:#1e293b}
      table.stats{width:100%;border-collapse:collapse;font-size:14px}
      table.stats td{padding:6px 0;border-bottom:1px solid #f1f5f9}
      table.stats tr:last-child td{border-bottom:none}
      .footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    </style></head><body>
      <div class="header">
        <div class="subtitle">🧬 Micro-Generations Quiz Results</div>
        <h1>${d.info.name}</h1>
        <div class="pct">${d.winnerPct}% match</div>
        <div class="meta">${d.info.years} · ${d.info.broad} generation</div>
      </div>
      <div class="section">
        <p class="desc">${d.info.desc}</p>
      </div>
      <div class="comparison">
        ${d.match
          ? `You said you were <strong>${d.selectedInfo.name}</strong> and tested as <strong>${d.info.name}</strong> — spot on!`
          : `You said you were <strong>${d.selectedInfo.name}</strong>, but tested as <strong>${d.info.name}</strong>.`}
      </div>
      <div class="section">
        <h2>Micro-Generation Breakdown</h2>
        ${top3bars}
      </div>
      <div class="section">
        <h2>📊 Stats</h2>
        <table class="stats">
          <tr><td style="color:#64748b">Questions Answered</td><td style="font-weight:600;text-align:right">${this.totalAnswered} / ${d.limit}</td></tr>
          <tr><td style="color:#64748b">Accuracy Rate</td><td style="font-weight:600;text-align:right">${d.accuracy}%</td></tr>
          <tr><td style="color:#64748b">Passes Used</td><td style="font-weight:600;text-align:right">${this.passesUsed}</td></tr>
          ${bestCatStr}
        </table>
      </div>
      ${d.second || d.third ? `<div class="section"><h2>Runner-Up Generations</h2>
        ${d.second ? `<p style="font-size:14px;margin-bottom:6px"><strong style="color:${d.second.color}">2nd: ${d.second.name}</strong> (${d.second.pct}%) — ${d.second.years}</p>` : ''}
        ${d.third ? `<p style="font-size:14px"><strong style="color:${d.third.color}">3rd: ${d.third.name}</strong> (${d.third.pct}%) — ${d.third.years}</p>` : ''}
      </div>` : ''}
      <div class="footer">Generated at generations.adam-harris.alphaclaw.app · ${new Date().toLocaleDateString()}</div>
    </body></html>`;

    const printWin = window.open('', '_blank', 'width=700,height=900');
    printWin.document.write(html);
    printWin.document.close();
    printWin.onload = () => { printWin.print(); };
    // Fallback if onload doesn't fire
    setTimeout(() => { try { printWin.print(); } catch(e) {} }, 500);

    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="file-text" style="width:16px;height:16px"></i> Download PDF'; if(window.lucide) lucide.createIcons(); }
  }

  renderResults() {
    const d = this._getResultData();
    const { info, second, third, winnerPct, selectedInfo, match, limit, accuracy, bestCat, bestCatPct, catLabels, top5, total } = d;

    this.innerHTML = `
      <style>
        .gen-results{max-width:640px;margin:40px auto;padding:0 20px;text-align:center}
        .gen-winner{background:var(--card);border:2px solid ${info.color};border-radius:20px;padding:40px 32px;margin-bottom:24px;animation:genPop .5s ease}
        @keyframes genPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        .gen-winner h1{font-family:var(--serif);font-size:2rem;margin:12px 0 4px;color:${info.color}}
        .gen-winner .broad{color:var(--muted);font-size:.85rem;margin-bottom:4px}
        .gen-winner .years{color:var(--muted);font-size:.9rem;margin-bottom:16px}
        .gen-winner p{color:var(--muted);line-height:1.6;font-size:.95rem}
        .gen-winner .pct-badge{display:inline-block;padding:6px 16px;border-radius:99px;font-size:1.1rem;font-weight:700;color:#fff;background:${info.color};margin-bottom:12px}
        .gen-comparison{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;font-size:.95rem;color:var(--muted);line-height:1.6}
        .gen-comparison strong{color:var(--text)}
        .gen-comparison .match-icon{font-size:1.4rem;display:block;margin-bottom:8px}
        .gen-podium{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
        .gen-podium-item{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center}
        .gen-podium-item .place{font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:4px}
        .gen-podium-item .pname{font-weight:700;font-size:.95rem}
        .gen-podium-item .ppct{font-size:1.2rem;font-weight:800;margin-top:4px}
        .gen-stats{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:20px;text-align:left}
        .gen-stats h3{margin:0 0 12px;font-size:1rem}
        .gen-stat-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:.9rem}
        .gen-stat-row:last-child{border-bottom:none}
        .gen-stat-row .label{color:var(--muted)}
        .gen-stat-row .value{font-weight:600}
        .gen-bars{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:24px;text-align:left}
        .gen-bars h3{margin:0 0 16px;font-size:1rem}
        .gen-bar-row{margin-bottom:12px}
        .gen-bar-label{display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px}
        .gen-bar-track{background:var(--border);border-radius:99px;height:10px;overflow:hidden}
        .gen-bar-fill{height:100%;border-radius:99px;transition:width .8s ease}
        .gen-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px}
        .gen-actions button,.gen-actions .btn{display:inline-flex;align-items:center;gap:8px;cursor:pointer}
        .gen-share-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:12px}
      </style>
      <div class="gen-results">
        <cc-fade-in>
          <div class="gen-winner">
            <div style="width:56px;height:56px;border-radius:50%;background:${info.color}22;display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px"><i data-lucide="${info.icon}" style="width:28px;height:28px;color:${info.color}"></i></div>
            <h1>${this._esc(info.name)}</h1>
            <div class="pct-badge">${winnerPct}% match</div>
            <div class="broad">Part of the broader ${this._esc(info.broad)} generation</div>
            <div class="years">${this._esc(info.years)}</div>
            <p>${this._esc(info.desc)}</p>
          </div>
        </cc-fade-in>

        <cc-fade-in delay="100">
          <div class="gen-comparison">
            <div class="match-icon">${match ? '✅' : '🔄'}</div>
            ${match
              ? `You said you were <strong style="color:${selectedInfo.color}">${this._esc(selectedInfo.name)}</strong> and you tested as <strong style="color:${info.color}">${this._esc(info.name)}</strong> — spot on! You know yourself well.`
              : `You said you were <strong style="color:${selectedInfo.color}">${this._esc(selectedInfo.name)}</strong>, but you tested as <strong style="color:${info.color}">${this._esc(info.name)}</strong>. Your cultural touchstones tell a different story!`
            }
          </div>
        </cc-fade-in>

        ${second || third ? `<cc-fade-in delay="150">
          <div class="gen-podium">
            ${second ? `<div class="gen-podium-item">
              <div class="place">2nd Place</div>
              <div class="pname" style="color:${second.color}">${second.name}</div>
              <div class="ppct" style="color:${second.color}">${second.pct}%</div>
            </div>` : ''}
            ${third ? `<div class="gen-podium-item">
              <div class="place">3rd Place</div>
              <div class="pname" style="color:${third.color}">${third.name}</div>
              <div class="ppct" style="color:${third.color}">${third.pct}%</div>
            </div>` : ''}
          </div>
        </cc-fade-in>` : ''}

        <cc-fade-in delay="200">
          <div class="gen-stats">
            <h3>📊 Your Stats</h3>
            <div class="gen-stat-row"><span class="label">Questions Answered</span><span class="value">${this.totalAnswered} / ${limit}</span></div>
            <div class="gen-stat-row"><span class="label">Accuracy Rate</span><span class="value">${accuracy}%</span></div>
            <div class="gen-stat-row"><span class="label">Passes Used</span><span class="value">${this.passesUsed}</span></div>
            ${bestCat ? `<div class="gen-stat-row"><span class="label">Strongest Category</span><span class="value">${catLabels[bestCat] || bestCat} (${Math.round(bestCatPct * 100)}%)</span></div>` : ''}
          </div>
        </cc-fade-in>

        <cc-fade-in delay="300">
          <div class="gen-bars">
            <h3>Micro-Generation Breakdown</h3>
            ${top5.map(([gen, score]) => {
              const g = this.microGens[gen];
              const pct = total > 0 ? Math.round(score / total * 100) : 0;
              return `<div class="gen-bar-row">
                <div class="gen-bar-label"><span>${this._esc(g.name)} <span style="font-size:.75rem;color:var(--muted)">${this._esc(g.years)}</span></span><span style="color:${g.color};font-weight:600">${pct}%</span></div>
                <div class="gen-bar-track"><div class="gen-bar-fill" style="width:${pct}%;background:${g.color}"></div></div>
              </div>`;
            }).join('')}
          </div>
        </cc-fade-in>

        <cc-fade-in delay="400">
          <div class="gen-actions">
            <button class="btn btn-primary" onclick="this.closest('cc-generations').state='welcome';this.closest('cc-generations').render()"><i data-lucide="rotate-ccw" style="width:16px;height:16px"></i> Retake Quiz</button>
            <button class="btn btn-primary gen-share-img-btn" onclick="this.closest('cc-generations').shareAsImage()" style="background:${info.color};border-color:${info.color}"><i data-lucide="image" style="width:16px;height:16px"></i> Share as Image</button>
            <button class="btn btn-secondary gen-pdf-btn" onclick="this.closest('cc-generations').downloadPDF()"><i data-lucide="file-text" style="width:16px;height:16px"></i> Download PDF</button>
          </div>
          <div class="gen-share-row" data-gen-name="${this._escAttr(info.name)}">
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="twitter">𝕏 Share</button>
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="facebook">Facebook</button>
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="linkedin">LinkedIn</button>
            <button class="btn btn-secondary" style="font-size:.85rem" data-action="copy">📋 Copy Link</button>
          </div>
        </cc-fade-in>
      </div>`;
    this._bindShareButtons();
    if (window.lucide) lucide.createIcons();
  }

  _bindShareButtons() {
    const row = this.querySelector('.gen-share-row');
    if (!row) return;
    const genName = row.dataset.genName || '';
    const shareText = 'I got ' + genName + ' on the Micro-Generations Quiz!';
    const shareUrl = location.href;
    row.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'twitter') {
          window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(shareUrl), '_blank', 'noopener');
        } else if (action === 'facebook') {
          window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl), '_blank', 'noopener');
        } else if (action === 'linkedin') {
          window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(shareUrl), '_blank', 'noopener');
        } else if (action === 'copy') {
          navigator.clipboard.writeText(shareText + ' ' + shareUrl);
          window.showToast?.('Link copied!');
        }
      });
    });
  }
}
customElements.define('cc-generations', CcGenerations);
