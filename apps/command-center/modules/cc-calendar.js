
// ─── Calendar ─────────────────────────────────────────────
class CcCalendar extends HTMLElement {
  _esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  connectedCallback() {
    this._tz = this.getAttribute('tz') || 'America/Los_Angeles';
    this._load();
  }

  _formatTime(ds) {
    if (!ds || ds.length === 10) return 'All day';
    return new Date(ds).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: this._tz });
  }

  _formatRange(s, e) {
    if (!s || s.length === 10) return 'All day';
    return this._formatTime(s) + ' – ' + this._formatTime(e);
  }

  _formatDay(ds) {
    const d = new Date(ds);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const fmt = s => s.toLocaleDateString('en-US', { timeZone: this._tz });
    if (fmt(d) === fmt(today)) return 'Today';
    if (fmt(d) === fmt(tomorrow)) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: this._tz });
  }

  async _load() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      const events = await (await fetch(src)).json();
      if (!events.length) {
        this.innerHTML = `<div class="panel"><div class="panel-header"><i data-lucide="calendar"></i> Upcoming Events <span class="badge">0</span></div><cc-empty-state message="Calendar is clear" icon="☀️"></cc-empty-state></div>`;
        setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
        return;
      }
      this.innerHTML = `
        <div class="panel">
          <div class="panel-header"><i data-lucide="calendar"></i> Upcoming Events <span class="badge">${events.length}</span></div>
          <div class="scrollable-body"><ul class="event-list">${this._renderEvents(events)}</ul></div>
        </div>`;
      setTimeout(() => window.refreshIcons && window.refreshIcons(), 0);
    } catch (e) { console.error('cc-calendar:', e); }
  }

  _renderEvents(events) {
    let lastDay = '';
    return events.map(e => {
      const day = this._formatDay(e.start);
      let divider = '';
      if (day !== lastDay) { divider = `<div class="day-divider">${day}</div>`; lastDay = day; }
      const zoom = e.isZoom && e.zoomLink ? ` · <a href="${this._esc(e.zoomLink)}" target="_blank" rel="noopener" class="zoom-link">📹 Zoom</a>` : '';
      const att = (e.attendees || []).length;
      const attMeta = att > 0 ? ` · ${att} attendees` : '';
      return `${divider}<li class="event-item">
        <div class="event-time">${this._formatRange(e.start, e.end)}</div>
        <div class="event-details">
          <div class="event-name"><a href="${this._esc(e.htmlLink || '')}" target="_blank" rel="noopener">${this._esc(e.summary || 'No title')}</a></div>
          <div class="event-meta">${day}${attMeta}${zoom}</div>
        </div>
      </li>`;
    }).join('');
  }
}
customElements.define('cc-calendar', CcCalendar);
