/* cc-pr-review-summary — Dashboard summary widget */
class CcPrReviewSummary extends HTMLElement {
  connectedCallback() { this._load(); }

  _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }

  async _load() {
    this.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px;">Loading…</div>';
    try {
      const db = await PrReviewDB.init();
      const reviews = await db.getAll({ orderBy: 'reviewed_at', desc: true });
      this._render(reviews);
    } catch (e) {
      this.innerHTML = `<div style="color:var(--danger);font-size:13px;padding:12px;">Error: ${this._esc(e.message)}</div>`;
    }
  }

  _render(reviews) {
    const recent = reviews.slice(0, 3);
    const totalFindings = reviews.reduce((s, r) => s + (Array.isArray(r.findings) ? r.findings.length : 0), 0);
    this.innerHTML = `
      <div style="padding:16px;">
        <div style="display:flex;gap:16px;margin-bottom:16px;">
          <div><span style="font-size:20px;font-weight:700;color:var(--heading);">${reviews.length}</span> <span style="font-size:12px;color:var(--muted);">reviews</span></div>
          <div><span style="font-size:20px;font-weight:700;color:var(--heading);">${totalFindings}</span> <span style="font-size:12px;color:var(--muted);">findings</span></div>
        </div>
        ${recent.map(r => `
          <div style="padding:8px 0;border-top:1px solid var(--border);font-size:12px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="font-weight:600;color:var(--heading);">${this._esc(r.app_name)}</span>
              <span style="color:var(--muted);">${new Date(r.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div style="color:var(--text);margin-top:2px;">${this._esc(r.summary)}</div>
          </div>`).join('')}
        ${reviews.length > 3 ? `<a href="https://cc-pr-review.adam-harris.alphaclaw.app" style="font-size:12px;color:var(--accent);display:block;margin-top:8px;">View all ${reviews.length} reviews →</a>` : ''}
      </div>`;
  }
}
customElements.define('cc-pr-review-summary', CcPrReviewSummary);
