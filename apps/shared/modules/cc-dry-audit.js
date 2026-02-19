// ─── DRY Audit Summary (dashboard widget) ────────────────
class CcDryAudit extends HTMLElement {
  async connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) return;
    try {
      const data = await (await fetch(src)).json();
      this._render(data);
    } catch (e) {
      this._render({ lastRun: null, items: [] });
    }
  }

  _render(data) {
    const items = data.items || [];
    const fixed = items.filter(i => i.status === 'fixed');
    const noted = items.filter(i => i.status === 'noted');
    const lastRun = data.lastRun
      ? new Date(data.lastRun).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })
      : 'Never';

    const recentItems = items.slice(0, 8);

    this.innerHTML = `
    <div class="panel">
      <div class="panel-header flex justify-between items-center">
        <span>🔍 DRY Audit</span>
        <span class="text-xs text-muted">Last run: ${lastRun}</span>
      </div>
      <div class="flex gap-3 mb-3">
        <div class="flex items-center gap-1">
          <span class="text-green font-bold text-lg">${fixed.length}</span>
          <span class="text-muted text-sm">fixed</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-yellow font-bold text-lg">${noted.length}</span>
          <span class="text-muted text-sm">noted</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-primary font-bold text-lg">${items.length}</span>
          <span class="text-muted text-sm">total</span>
        </div>
      </div>
      ${recentItems.length ? `<div class="flex flex-col gap-2">${recentItems.map(item => `
        <div class="alert-item">
          <span style="color:${item.status === 'fixed' ? 'var(--green)' : 'var(--yellow)'};font-size:10px;flex-shrink:0;">●</span>
          <span class="text-muted font-semibold" style="min-width:80px;">${item.app}</span>
          <span class="alert-title">${item.issue}</span>
        </div>`).join('')}</div>` : '<cc-empty-state message="No audit issues" icon="✅" animation="sparkle"></cc-empty-state>'}
    </div>`;
  }
}
customElements.define('cc-dry-audit', CcDryAudit);
