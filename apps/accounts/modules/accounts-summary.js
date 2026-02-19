class AccountsSummary extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div class="text-sm text-muted">Loading…</div>';
    this._init();
  }

  async _init() {
    try {
      const src = this.getAttribute('src');
      let clients = [];
      if (src) {
        const r = await fetch(src);
        clients = await r.json();
      } else if (window.SyncDB) {
        const db = await SyncDB.init(ACCOUNTS_DB_CONFIG);
        clients = db.all('clients');
      }
      this._renderSummary(clients);
    } catch (e) {
      this.innerHTML = `<div class="text-sm text-muted">Error loading accounts summary</div>`;
    }
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  _renderSummary(clients) {
    const totalPRs = clients.reduce((s, c) => s + (c.github?.openPRs || 0), 0);
    const totalContacts = clients.reduce((s, c) => s + (c.contacts?.length || 0), 0);
    const jiraIssues = clients.reduce((s, c) => s + (c.jira?.openTickets || 0), 0);

    this.innerHTML = `
      <div class="card p-4">
        <div class="flex items-center gap-2 mb-3 font-semibold text-sm">
          <i data-lucide="users" style="width:16px;height:16px;color:var(--accent)"></i>
          Accounts Overview
        </div>
        <div class="grid-2 gap-3">
          <div class="stat-box"><div class="stat-box-value">${clients.length}</div><div class="stat-box-label">Clients</div></div>
          <div class="stat-box"><div class="stat-box-value">${totalPRs}</div><div class="stat-box-label">Open PRs</div></div>
          <div class="stat-box"><div class="stat-box-value">${totalContacts}</div><div class="stat-box-label">Contacts</div></div>
          <div class="stat-box"><div class="stat-box-value">${jiraIssues}</div><div class="stat-box-label">Jira Tickets</div></div>
        </div>
        <div class="mt-3 text-xs text-muted">
          ${clients.slice(0,5).map(c => `<span class="pill text-xs mr-1">${this._esc(c.name)}</span>`).join('')}
          ${clients.length > 5 ? `<span class="text-muted">+${clients.length-5} more</span>` : ''}
        </div>
      </div>
    `;
    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
  }
}
customElements.define('accounts-summary', AccountsSummary);
