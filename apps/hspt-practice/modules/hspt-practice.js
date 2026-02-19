const SECTIONS = {
  verbal: { name: 'Verbal Skills', icon: '🗣️', time: 16, count: 60, types: ['analogy', 'logic', 'classification'] },
  quantitative: { name: 'Quantitative Skills', icon: '🔢', time: 30, count: 52, types: ['sequence', 'reasoning', 'geometric', 'comparison'] },
  reading: { name: 'Reading', icon: '📖', time: 25, count: 62, types: ['comprehension'] },
  mathematics: { name: 'Mathematics', icon: '📐', time: 45, count: 64, types: ['arithmetic', 'algebra', 'geometry', 'measurement', 'word_problem', 'fraction', 'percent', 'ratio', 'probability'] },
  language: { name: 'Language', icon: '✍️', time: 25, count: 60, types: ['capitalization', 'punctuation', 'grammar', 'spelling', 'usage', 'composition'] }
};

class CcHsptPractice extends HTMLElement {
  constructor() {
    super();
    this.data = null;
    this.state = 'menu'; // menu | quiz | results | review | history
    this.section = null;
    this.questions = [];
    this.passages = {};
    this.answers = {};
    this.currentQ = 0;
    this.timer = null;
    this.timeLeft = 0;
    this.startTime = 0;
    this.sessions = [];
    this.chart = null;
  }

  connectedCallback() {
    this.loadData();
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  _escAttr(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async loadData() {
    try {
      const r = await fetch('data.json');
      this.data = await r.json();
    } catch (e) {
      this.innerHTML = '<div style="padding:40px"><cc-empty-state message="Failed to load question data" icon="⚠️" animation="none"></cc-empty-state></div>';
      window.showToast?.('Failed to load question data', 4000);
      return;
    }
    await this.loadSessions();
    this.render();
  }

  async loadSessions() {
    // Try Supabase first
    try {
      const sb = window.supabase;
      if (sb) {
        const { data, error } = await sb.from('hspt_sessions').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        if (data) { this.sessions = data; return; }
      }
    } catch (e) {
      // Supabase unavailable — fall back to localStorage silently
    }
    // Fallback to localStorage
    try {
      this.sessions = JSON.parse(localStorage.getItem('hspt_sessions') || '[]');
    } catch (e) { this.sessions = []; }
  }

  async saveSession(session) {
    try {
      const sb = window.supabase;
      if (sb) {
        const { error } = await sb.from('hspt_sessions').insert([session]);
        if (error) throw error;
      }
    } catch (e) {
      window.showToast?.('Failed to save session — saved locally', 3000);
    }
    // Always save to localStorage as fallback
    this.sessions.unshift(session);
    try { localStorage.setItem('hspt_sessions', JSON.stringify(this.sessions.slice(0, 50))); } catch (e) {}
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  getQuestions(sectionKey) {
    const cfg = SECTIONS[sectionKey];
    if (sectionKey === 'reading') {
      // Pick random passages until we have enough questions
      const shuffled = this.shuffle(this.data.passages);
      const qs = [];
      this.passages = {};
      for (const p of shuffled) {
        if (qs.length >= cfg.count) break;
        for (const q of p.questions) {
          q._passageId = p.id;
          q._passageTitle = p.title;
          q._passageText = p.text;
          qs.push(q);
        }
        this.passages[p.id] = p;
      }
      return qs.slice(0, cfg.count);
    }
    return this.shuffle(this.data[sectionKey]).slice(0, cfg.count);
  }

  startQuiz(sectionKey) {
    this.section = sectionKey;
    this.questions = this.getQuestions(sectionKey);
    this.answers = {};
    this.currentQ = 0;
    this.timeLeft = SECTIONS[sectionKey].time * 60;
    this.startTime = Date.now();
    this.state = 'quiz';
    this.render();
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finishQuiz();
        return;
      }
      const el = this.querySelector('.hspt-timer');
      if (el) {
        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        el.textContent = `${m}:${String(s).padStart(2, '0')}`;
        el.classList.toggle('warning', this.timeLeft < 60);
      }
    }, 1000);
  }

  finishQuiz() {
    clearInterval(this.timer);
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    const score = this.questions.reduce((s, q, i) => s + (this.answers[i] === q.answer ? 1 : 0), 0);
    const total = this.questions.length;
    const session = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      section: this.section,
      score,
      total,
      percentage: Math.round(score / total * 100),
      time_spent: timeSpent,
      answers: this.answers
    };
    this.currentSession = session;
    this.saveSession(session);
    this.state = 'results';
    this.render();
    window.showToast?.(`Score: ${score}/${total} (${session.percentage}%)`, 4000);
  }

  render() {
    switch (this.state) {
      case 'menu': this.renderMenu(); break;
      case 'quiz': this.renderQuiz(); break;
      case 'results': this.renderResults(); break;
      case 'review': this.renderReview(); break;
      case 'history': this.renderHistory(); break;
    }
  }

  renderMenu() {
    const sectionCards = Object.entries(SECTIONS).map(([key, s]) => `
      <div class="card" style="cursor:pointer" tabindex="0" role="button" data-section="${this._escAttr(key)}">
        <div style="font-size:2rem;margin-bottom:8px">${this._esc(s.icon)}</div>
        <h3>${this._esc(s.name)}</h3>
        <p style="color:var(--muted);font-size:.9rem">${s.count} questions · ${s.time} minutes</p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">
          ${s.types.map(t => `<span class="badge">${this._esc(t)}</span>`).join('')}
        </div>
      </div>
    `).join('');

    const recentSessions = this.sessions.slice(0, 5);
    const recentHtml = recentSessions.length ? recentSessions.map(s => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px">
        <div>
          <strong>${this._esc(SECTIONS[s.section]?.icon || '')} ${this._esc(SECTIONS[s.section]?.name || s.section)}</strong>
          <span style="color:var(--muted);font-size:.85rem;margin-left:8px">${this._esc(new Date(s.created_at).toLocaleDateString())}</span>
        </div>
        <div><span class="badge" style="font-size:1rem">${this._esc(s.percentage)}%</span></div>
      </div>
    `).join('') : '<cc-empty-state message="No practice sessions yet" icon="📝"></cc-empty-state>';

    this.innerHTML = `
      <div style="max-width:960px;margin:0 auto;padding:20px">
        <cc-fade-in>
          <h1 style="font-family:var(--serif);margin-bottom:8px">📝 HSPT Practice</h1>
          <p style="color:var(--muted);margin-bottom:24px">Choose a section to start practicing</p>
        </cc-fade-in>
        <div class="section-grid">${sectionCards}</div>
        <div style="margin-top:32px;display:flex;justify-content:space-between;align-items:center">
          <h2 style="font-family:var(--serif)">Recent Sessions</h2>
          ${this.sessions.length ? `<button class="btn btn-sm btn-secondary" id="view-history">View All</button>` : ''}
        </div>
        <div style="margin-top:12px">${recentHtml}</div>
      </div>
    `;

    this.querySelectorAll('[data-section]').forEach(el => {
      const start = () => this.startQuiz(el.dataset.section);
      el.addEventListener('click', start);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } });
    });
    this.querySelector('#view-history')?.addEventListener('click', () => { this.state = 'history'; this.render(); });
  }

  renderQuiz() {
    const q = this.questions[this.currentQ];
    const cfg = SECTIONS[this.section];
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    const progress = ((this.currentQ + 1) / this.questions.length * 100).toFixed(1);
    const letters = ['A', 'B', 'C', 'D'];

    const passageHtml = q._passageText ? `
      <div class="passage-text"><strong>${this._esc(q._passageTitle || 'Reading Passage')}</strong><br><br>${this._esc(q._passageText)}</div>
    ` : '';

    this.innerHTML = `
      <div style="max-width:760px;margin:0 auto;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h2 style="font-family:var(--serif);margin:0">${this._esc(cfg.icon)} ${this._esc(cfg.name)}</h2>
          <span class="hspt-timer${this.timeLeft < 60 ? ' warning' : ''}">${m}:${String(s).padStart(2, '0')}</span>
        </div>
        <div class="hspt-progress-bar"><div class="hspt-progress-fill" style="width:${progress}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:.85rem;color:var(--muted);margin-bottom:16px">
          <span>Question ${this.currentQ + 1} of ${this.questions.length}</span>
          <span>${Object.keys(this.answers).length} answered</span>
        </div>
        ${passageHtml}
        <div class="card" style="margin-bottom:16px">
          <p style="font-size:1.05rem;line-height:1.6;margin-bottom:16px"><strong>Q${this.currentQ + 1}.</strong> ${this._esc(q.question)}</p>
          ${q.options.map((opt, i) => `
            <div class="hspt-option${this.answers[this.currentQ] === letters[i] ? ' selected' : ''}" data-answer="${this._escAttr(letters[i])}" tabindex="0" role="button" aria-label="Option ${this._escAttr(letters[i])}: ${this._escAttr(opt)}">
              <strong>${letters[i]}.</strong> ${this._esc(opt)}
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <button class="btn btn-secondary" id="prev-q" ${this.currentQ === 0 ? 'disabled' : ''}>← Previous</button>
          <div style="display:flex;gap:8px">
            <button class="btn btn-danger" id="finish-quiz">Finish</button>
            <button class="btn btn-primary" id="next-q">${this.currentQ === this.questions.length - 1 ? 'Finish →' : 'Next →'}</button>
          </div>
        </div>
        <details style="margin-top:8px"><summary style="cursor:pointer;color:var(--muted);font-size:.85rem">Question Navigator</summary>
          <div class="hspt-nav-dots" style="margin-top:8px">
            ${this.questions.map((_, i) => `<div class="hspt-nav-dot${this.answers[i] !== undefined ? ' answered' : ''}${i === this.currentQ ? ' current' : ''}" data-qi="${this._escAttr(i)}" tabindex="0" role="button" aria-label="Question ${i + 1}${this.answers[i] !== undefined ? ' (answered)' : ''}">${i + 1}</div>`).join('')}
          </div>
        </details>
      </div>
    `;

    this.querySelectorAll('.hspt-option').forEach(el => {
      const select = () => {
        this.answers[this.currentQ] = el.dataset.answer;
        this.querySelectorAll('.hspt-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
      };
      el.addEventListener('click', select);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); } });
    });
    this.querySelector('#prev-q')?.addEventListener('click', () => { this.currentQ--; this.renderQuiz(); });
    this.querySelector('#next-q')?.addEventListener('click', () => {
      if (this.currentQ >= this.questions.length - 1) this.finishQuiz();
      else { this.currentQ++; this.renderQuiz(); }
    });
    this.querySelector('#finish-quiz')?.addEventListener('click', () => {
      if (confirm('Finish this practice session?')) this.finishQuiz();
    });
    this.querySelectorAll('.hspt-nav-dot').forEach(el => {
      const nav = () => { this.currentQ = parseInt(el.dataset.qi); this.renderQuiz(); };
      el.addEventListener('click', nav);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav(); } });
    });
  }

  renderResults() {
    const s = this.currentSession;
    const cfg = SECTIONS[s.section];
    const timeM = Math.floor(s.time_spent / 60);
    const timeS = s.time_spent % 60;

    // Type breakdown
    const byType = {};
    this.questions.forEach((q, i) => {
      const t = q.type || 'general';
      if (!byType[t]) byType[t] = { correct: 0, total: 0 };
      byType[t].total++;
      if (this.answers[i] === q.answer) byType[t].correct++;
    });

    // Difficulty breakdown
    const byDiff = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } };
    this.questions.forEach((q, i) => {
      const d = q.difficulty || 1;
      byDiff[d].total++;
      if (this.answers[i] === q.answer) byDiff[d].correct++;
    });

    this.innerHTML = `
      <div style="max-width:760px;margin:0 auto;padding:20px">
        <cc-fade-in>
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="font-family:var(--serif)">${cfg.icon} ${cfg.name} — Results</h1>
            <div class="score-circle">
              <span class="pct">${s.percentage}%</span>
              <span style="font-size:.85rem;color:var(--muted)">${s.score}/${s.total}</span>
            </div>
            <p style="color:var(--muted)">Completed in ${timeM}m ${timeS}s</p>
          </div>
        </cc-fade-in>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px">
          <div class="card">
            <h3>By Question Type</h3>
            ${Object.entries(byType).map(([t, v]) => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
                <span class="badge">${this._esc(t)}</span>
                <span>${v.correct}/${v.total} (${v.total ? Math.round(v.correct / v.total * 100) : 0}%)</span>
              </div>
            `).join('')}
          </div>
          <div class="card">
            <h3>By Difficulty</h3>
            ${[1, 2, 3].filter(d => byDiff[d].total > 0).map(d => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
                <span>${'⭐'.repeat(d)} Level ${d}</span>
                <span>${byDiff[d].correct}/${byDiff[d].total} (${byDiff[d].total ? Math.round(byDiff[d].correct / byDiff[d].total * 100) : 0}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-primary" id="review-btn">📋 Review Answers</button>
          <button class="btn btn-secondary" id="back-menu">← Back to Menu</button>
        </div>
      </div>
    `;

    this.querySelector('#review-btn')?.addEventListener('click', () => { this.currentQ = 0; this.state = 'review'; this.render(); });
    this.querySelector('#back-menu')?.addEventListener('click', () => { this.state = 'menu'; this.render(); });
  }

  renderReview() {
    const q = this.questions[this.currentQ];
    const letters = ['A', 'B', 'C', 'D'];
    const userAns = this.answers[this.currentQ];
    const correct = q.answer;

    const passageHtml = q._passageText ? `
      <div class="passage-text"><strong>${this._esc(q._passageTitle || 'Reading Passage')}</strong><br><br>${this._esc(q._passageText)}</div>
    ` : '';

    this.innerHTML = `
      <div style="max-width:760px;margin:0 auto;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="font-family:var(--serif);margin:0">Review — Q${this.currentQ + 1}/${this.questions.length}</h2>
          <button class="btn btn-secondary btn-sm" id="back-results">← Results</button>
        </div>
        ${passageHtml}
        <div class="card" style="margin-bottom:16px">
          <p style="font-size:1.05rem;line-height:1.6;margin-bottom:16px"><strong>Q${this.currentQ + 1}.</strong> ${this._esc(q.question)}</p>
          ${q.options.map((opt, i) => {
            let cls = '';
            if (letters[i] === correct) cls = ' correct';
            else if (letters[i] === userAns && userAns !== correct) cls = ' incorrect';
            return `<div class="hspt-option${cls}"><strong>${letters[i]}.</strong> ${this._esc(opt)} ${letters[i] === correct ? '✅' : ''}${letters[i] === userAns && userAns !== correct ? '❌' : ''}</div>`;
          }).join('')}
          ${q.explanation ? `<div style="margin-top:12px;padding:12px;background:var(--surface);border-radius:8px;font-size:.9rem"><strong>Explanation:</strong> ${this._esc(q.explanation)}</div>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between">
          <button class="btn btn-secondary" id="prev-r" ${this.currentQ === 0 ? 'disabled' : ''}>← Previous</button>
          <button class="btn btn-primary" id="next-r" ${this.currentQ >= this.questions.length - 1 ? 'disabled' : ''}>Next →</button>
        </div>
      </div>
    `;

    this.querySelector('#prev-r')?.addEventListener('click', () => { this.currentQ--; this.renderReview(); });
    this.querySelector('#next-r')?.addEventListener('click', () => { this.currentQ++; this.renderReview(); });
    this.querySelector('#back-results')?.addEventListener('click', () => { this.state = 'results'; this.render(); });
  }

  renderHistory() {
    const sectionSessions = {};
    this.sessions.forEach(s => {
      if (!sectionSessions[s.section]) sectionSessions[s.section] = [];
      sectionSessions[s.section].push(s);
    });

    const tableRows = this.sessions.map(s => `
      <tr>
        <td>${this._esc(SECTIONS[s.section]?.icon || '')} ${this._esc(SECTIONS[s.section]?.name || s.section)}</td>
        <td>${this._esc(s.score)}/${this._esc(s.total)}</td>
        <td><span class="badge">${this._esc(s.percentage)}%</span></td>
        <td>${Math.floor(s.time_spent / 60)}m ${s.time_spent % 60}s</td>
        <td>${this._esc(new Date(s.created_at).toLocaleDateString())}</td>
      </tr>
    `).join('');

    this.innerHTML = `
      <div style="max-width:960px;margin:0 auto;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h1 style="font-family:var(--serif);margin:0">📊 Session History</h1>
          <button class="btn btn-secondary" id="back-menu">← Back</button>
        </div>
        <div class="card" style="margin-bottom:24px">
          <canvas id="history-chart" height="200"></canvas>
        </div>
        ${this.sessions.length ? `
        <div class="card" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="border-bottom:2px solid var(--border)">
              <th style="text-align:left;padding:8px">Section</th>
              <th style="text-align:left;padding:8px">Score</th>
              <th style="text-align:left;padding:8px">%</th>
              <th style="text-align:left;padding:8px">Time</th>
              <th style="text-align:left;padding:8px">Date</th>
            </tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>` : '<cc-empty-state message="No sessions yet — start practicing!" icon="📝"></cc-empty-state>'}
      </div>
    `;

    this.querySelector('#back-menu')?.addEventListener('click', () => { this.state = 'menu'; this.render(); });

    // Render chart
    if (this.sessions.length) {
      const ctx = this.querySelector('#history-chart');
      if (ctx && window.Chart) {
        const cs = getComputedStyle(document.documentElement);
        const colors = { verbal: cs.getPropertyValue('--accent').trim() || '#f59e0b', quantitative: cs.getPropertyValue('--info').trim() || '#3b82f6', reading: cs.getPropertyValue('--success').trim() || '#10b981', mathematics: cs.getPropertyValue('--danger').trim() || '#ef4444', language: cs.getPropertyValue('--purple').trim() || '#a855f7' };
        const datasets = Object.entries(sectionSessions).map(([key, sessions]) => ({
          label: SECTIONS[key]?.name || key,
          data: sessions.slice().reverse().map(s => s.percentage),
          borderColor: colors[key] || '#888',
          backgroundColor: (colors[key] || '#888') + '33',
          tension: 0.3,
          fill: false
        }));
        // Build labels from all sessions (dates)
        const allDates = this.sessions.slice().reverse().map(s => new Date(s.created_at).toLocaleDateString());
        const uniqueDates = [...new Set(allDates)];
        new Chart(ctx, {
          type: 'line',
          data: { labels: uniqueDates, datasets },
          options: {
            responsive: true,
            scales: {
              x: { grid: { color: cs.getPropertyValue('--border').trim() || 'rgba(255,255,255,.06)' }, ticks: { color: cs.getPropertyValue('--muted').trim() || '#999' } },
              y: { min: 0, max: 100, grid: { color: cs.getPropertyValue('--border').trim() || 'rgba(255,255,255,.06)' }, ticks: { color: cs.getPropertyValue('--muted').trim() || '#999', callback: v => v + '%' } }
            },
            plugins: { legend: { labels: { color: cs.getPropertyValue('--text').trim() || '#ccc' } } }
          }
        });
      }
    }
  }

  disconnectedCallback() {
    clearInterval(this.timer);
  }
}

customElements.define('cc-hspt-practice', CcHsptPractice);
