class CringeRizzlerSummary extends HTMLElement {
  connectedCallback() { this.load(); }

  async load() {
    try {
      const db = await CringeRizzlerDB.init();
      const all = await db.getAll();
      const phrases = all.filter(r => r.type === 'phrase').length;
      const memes = all.filter(r => r.type === 'meme').length;
      this.innerHTML = `
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <cc-stat-counter value="${all.length}" label="Total Saved" duration="1200"></cc-stat-counter>
          <cc-stat-counter value="${phrases}" label="Phrases" duration="1200"></cc-stat-counter>
          <cc-stat-counter value="${memes}" label="Memes" duration="1200"></cc-stat-counter>
        </div>
      `;
    } catch (e) {
      this.innerHTML = '<p style="color:var(--muted);">Could not load summary.</p>';
    }
  }
}

customElements.define('cringe-rizzler-summary', CringeRizzlerSummary);
