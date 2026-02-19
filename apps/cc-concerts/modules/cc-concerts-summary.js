/* cc-concerts-summary — Dashboard widget */

class CcConcertsSummary extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = '<div class="card" style="padding:16px;"><p style="color:var(--muted)">Loading concerts...</p></div>';
    try {
      const db = await ConcertsDB.init();
      const concerts = await db.getConcerts();
      const rsvps = await db.getAllRsvps();
      const now = new Date().toISOString().slice(0, 10);
      const upcoming = concerts.filter(c => c.date >= now).slice(0, 5);
      const goingCount = new Set(rsvps.filter(r => r.user_name === 'Adam H' && r.status === 'going').map(r => r.concert_id)).size;

      const esc = s => { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; };
      this.innerHTML = `<div class="card" style="padding:16px;">
        <h3 style="margin:0 0 8px;font-size:15px;">🎵 Concerts</h3>
        <div style="display:flex;gap:16px;margin-bottom:12px;">
          <div><strong style="font-size:20px;">${concerts.length}</strong><br><span style="font-size:11px;color:var(--muted)">Total</span></div>
          <div><strong style="font-size:20px;">${goingCount}</strong><br><span style="font-size:11px;color:var(--muted)">Going</span></div>
          <div><strong style="font-size:20px;">${upcoming.length}</strong><br><span style="font-size:11px;color:var(--muted)">Upcoming</span></div>
        </div>
        ${upcoming.length ? upcoming.map(c => `<div style="padding:4px 0;border-top:1px solid var(--border);font-size:12px;">
          <strong>${esc(c.artist)}</strong> <span style="color:var(--muted)">· ${esc(c.venue)} · ${esc(c.date)}</span>
        </div>`).join('') : '<cc-empty-state message="No upcoming shows" icon="🎵" animation="none"></cc-empty-state>'}
      </div>`;
    } catch (e) {
      this.innerHTML = `<div class="card" style="padding:16px;color:var(--muted);">Could not load concerts</div>`;
    }
  }
}

customElements.define('cc-concerts-summary', CcConcertsSummary);
