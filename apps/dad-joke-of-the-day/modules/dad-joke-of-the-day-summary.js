class DadJokeOfTheDaySummary extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div class="card" style="padding:20px;text-align:center;"><p style="color:var(--muted)">Loading...</p></div>';
    this.loadJoke();
  }

  async loadJoke() {
    let jokes = null;

    // Try Supabase first
    try {
      const sb = window.supabase;
      if (sb) {
        jokes = await sb.select('dad_jokes', { filters: { active: 'eq.true' }, order: 'id.asc' });
      }
    } catch (e) { /* fall through to JSON */ }

    // Fallback to JSON src
    if (!jokes || !jokes.length) {
      const src = this.getAttribute('src');
      if (!src) { this._renderError(); return; }
      try {
        const res = await fetch(src);
        jokes = await res.json();
      } catch (e) { this._renderError(); return; }
    }

    if (!jokes || !jokes.length) { this._renderError(); return; }

    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const joke = jokes[seed % jokes.length];
    const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    this.innerHTML = `
      <div class="card" style="padding:20px;text-align:center;">
        <div class="badge" style="margin-bottom:8px;">🤣 Dad Joke of the Day</div>
        <div style="font-family:var(--serif);font-size:1.1rem;margin-bottom:12px;">${esc(joke.setup)}</div>
        <details>
          <summary style="cursor:pointer;color:var(--amber);font-size:14px;">Reveal punchline</summary>
          <p style="color:var(--amber);margin-top:8px;font-weight:600;">${esc(joke.punchline)}</p>
        </details>
      </div>
    `;
  }

  _renderError() {
    this.innerHTML = '<div class="card" style="padding:20px;"><cc-empty-state message="Could not load joke" icon="😢"></cc-empty-state></div>';
  }
}
customElements.define('dad-joke-of-the-day-summary', DadJokeOfTheDaySummary);
