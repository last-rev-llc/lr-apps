/* proper-wine-pour-summary — Dashboard summary widget */
class ProperWinePourSummary extends HTMLElement {
  connectedCallback() {
    this._load();
  }
  async _load() {
    let data = [];
    // Try Supabase first, then fall back to JSON src
    try {
      if (window.supabase) {
        const rows = await window.supabase.select('restaurants', { order: 'name.asc' });
        if (rows && rows.length) data = rows;
      }
    } catch(e) {}
    if (!data.length) {
      try {
        const src = this.getAttribute('src');
        if (src) { const r = await fetch(src); data = await r.json(); }
      } catch(e) {}
    }
    const generous = data.filter(r => r.pour_rating === 'generous').length;
    const stingy = data.filter(r => r.pour_rating === 'stingy' || r.pour_rating === 'criminal').length;
    const avg = data.length ? (data.reduce((s,r) => s + (r.avg_glass_price || 0), 0) / data.length).toFixed(0) : 0;
    this.innerHTML = `
      <div class="card" style="padding:20px;">
        <h3 style="font-family:var(--serif);margin:0 0 12px;">Proper Wine Pour</h3>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <div><span style="font-size:24px;font-weight:700;color:#22c55e;">${generous}</span><br><span style="color:var(--muted);font-size:12px;">Generous</span></div>
          <div><span style="font-size:24px;font-weight:700;color:#ef4444;">${stingy}</span><br><span style="color:var(--muted);font-size:12px;">Stingy</span></div>
          <div><span style="font-size:24px;font-weight:700;color:var(--heading);">${data.length}</span><br><span style="color:var(--muted);font-size:12px;">Tracked</span></div>
          <div><span style="font-size:24px;font-weight:700;color:var(--heading);">$${avg}</span><br><span style="color:var(--muted);font-size:12px;">Avg Glass</span></div>
        </div>
      </div>
    `;
  }
}
customElements.define('proper-wine-pour-summary', ProperWinePourSummary);
