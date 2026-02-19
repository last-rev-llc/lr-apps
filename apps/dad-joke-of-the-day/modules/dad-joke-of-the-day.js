class DadJokeOfTheDay extends HTMLElement {
  connectedCallback() {
    this.jokes = [];
    this.currentJoke = null;
    this.punchlineRevealed = false;
    this.innerHTML = '<div class="djotd-wrap"><cc-empty-state message="Loading jokes..." icon="😄"></cc-empty-state></div>';
    this.loadJokes();
  }

  async loadJokes() {
    try {
      const db = window.dadJokeDB;
      this.jokes = await db.getAllJokes();
      this.showJokeOfTheDay();
    } catch (e) {
      // Fallback to JSON src if Supabase fails
      const src = this.getAttribute('src');
      if (src) {
        try {
          const res = await fetch(src);
          this.jokes = await res.json();
          this.showJokeOfTheDay();
        } catch (e2) {
          this.innerHTML = '<cc-empty-state message="Failed to load jokes" icon="😢"></cc-empty-state>';
        }
      } else {
        this.innerHTML = '<cc-empty-state message="Failed to load jokes" icon="😢"></cc-empty-state>';
      }
    }
  }

  getJokeOfTheDay() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return this.jokes[seed % this.jokes.length];
  }

  showJokeOfTheDay() {
    this.currentJoke = this.getJokeOfTheDay();
    this.punchlineRevealed = false;
    // Track that it was shown
    if (window.dadJokeDB && this.currentJoke?.id) {
      window.dadJokeDB.markShown(this.currentJoke.id).catch(() => {});
    }
    this.render(true);
  }

  showRandomJoke() {
    let joke;
    do { joke = this.jokes[Math.floor(Math.random() * this.jokes.length)]; }
    while (joke.id === this.currentJoke?.id && this.jokes.length > 1);
    this.currentJoke = joke;
    this.punchlineRevealed = false;
    if (window.dadJokeDB && joke?.id) {
      window.dadJokeDB.markShown(joke.id).catch(() => {});
    }
    this.render(false);
  }

  async rateJoke(rating) {
    const btn = this.querySelector(`[data-rating="${rating}"]`);
    if (btn) btn.classList.add('rated');
    try {
      if (window.dadJokeDB && this.currentJoke?.id) {
        await window.dadJokeDB.rateJoke(this.currentJoke.id, rating);
      }
    } catch (e) { /* silent */ }
    if (window.showToast) window.showToast(`You rated: ${rating}`, 2000);
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  render(isJOTD) {
    const j = this.currentJoke;
    if (!j) return;
    const esc = s => this._esc(String(s ?? ''));
    const statsHtml = j.times_rated > 0 ? `<span style="margin-left:8px;font-size:11px;color:var(--muted)">⭐ ${esc(j.rating?.toFixed(1) || '—')} (${esc(j.times_rated)} ratings)</span>` : '';
    this.innerHTML = `
      <style>
        .djotd-wrap{max-width:640px;margin:40px auto;padding:0 20px;text-align:center}
        .djotd-setup{font-family:var(--serif);font-size:1.6rem;line-height:1.4;margin:24px 0}
        .djotd-punchline{font-size:1.3rem;color:var(--amber);margin:20px 0;min-height:40px}
        .djotd-ratings{display:flex;gap:12px;justify-content:center;margin:24px 0;flex-wrap:wrap}
        .djotd-ratings button{font-size:2rem;background:var(--surface);border:2px solid var(--border);border-radius:12px;padding:12px 16px;cursor:pointer;transition:transform .15s,border-color .15s}
        .djotd-ratings button:hover,.djotd-ratings button.rated{transform:scale(1.2);border-color:var(--amber)}
      </style>
      <div class="djotd-wrap">
        <cc-fade-in>
        <div class="card" style="padding:32px;">
          ${isJOTD ? '<div class="badge">🗓️ Joke of the Day</div>' : '<div class="badge">🎲 Random Joke</div>'}
          <div class="djotd-setup">${esc(j.setup)}</div>
          <div class="djotd-punchline">
            ${this.punchlineRevealed ? esc(j.punchline) : ''}
          </div>
          ${!this.punchlineRevealed ? '<button class="btn btn-primary" id="revealBtn">👇 Reveal Punchline</button>' : ''}
          ${this.punchlineRevealed ? `
            <div class="djotd-ratings">
              <button data-rating="groan" title="Groan-worthy">😩</button>
              <button data-rating="eyeroll" title="Eye-roll">🙄</button>
              <button data-rating="funny" title="Actually funny">😂</button>
              <button data-rating="nocap" title="No cap, that slaps">💀</button>
              <button data-rating="sus" title="That's sus">🤨</button>
              <button data-rating="brainrot" title="Pure brainrot">🧠</button>
              <button data-rating="ratio" title="Ratio'd">📉</button>
              <button data-rating="bussin" title="Bussin fr fr">🔥</button>
            </div>
          ` : ''}
          <div class="badge" style="margin-top:8px">${esc(j.category)}${statsHtml}</div>
        </div>
        </cc-fade-in>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
          <button class="btn btn-primary" id="randomBtn">🎲 Random Joke</button>
          <button class="btn btn-secondary" id="jotdBtn">🗓️ Joke of the Day</button>
        </div>
      </div>
    `;
    const revealBtn = this.querySelector('#revealBtn');
    if (revealBtn) revealBtn.addEventListener('click', () => { this.punchlineRevealed = true; this.render(isJOTD); });
    this.querySelector('#randomBtn')?.addEventListener('click', () => this.showRandomJoke());
    this.querySelector('#jotdBtn')?.addEventListener('click', () => this.showJokeOfTheDay());
    this.querySelectorAll('[data-rating]').forEach(btn => {
      btn.addEventListener('click', () => this.rateJoke(btn.dataset.rating));
    });
  }
}
customElements.define('dad-joke-of-the-day', DadJokeOfTheDay);
