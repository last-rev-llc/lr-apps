// ─── Batches (cc-batches) ────────────────────────────────────────────
class CcBatches extends HTMLElement {
  connectedCallback() {
    this._batches = [];
    this._jobs = [];
    this._assignments = [];
    this._searchQuery = '';
    this._view = 'cards';
    this._loading = true;

    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._render(); });
    this.addEventListener('cc-view-change', e => { this._view = e.detail.view; this._render(); });
    this.addEventListener('click', e => {
      const card = e.target.closest('[data-batch-id]');
      if (card && !e.target.closest('.toggle-btn') && !e.target.closest('.run-btn-inline')) {
        this._openDetail(card.dataset.batchId);
      }
      const toggle = e.target.closest('.toggle-btn');
      if (toggle) { e.stopPropagation(); this._toggleEnabled(toggle.dataset.toggleId); }
      const run = e.target.closest('.run-btn-inline');
      if (run) { e.stopPropagation(); this._runBatch(run.dataset.runId); }
    });

    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  _escAttr(s) { return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async _load() {
    try {
      const sb = window.supabase;
      if (!sb) { setTimeout(() => this._load(), 500); return; }
      const [batches, jobs, assignments] = await Promise.all([
        sb.select('cron_batches', { order: 'name.asc' }),
        sb.select('cron_jobs', { order: 'name.asc' }),
        sb.select('cron_batch_jobs'),
      ]);
      this._batches = batches || [];
      this._jobs = jobs || [];
      this._assignments = assignments || [];
      this._loading = false;
      this._render();
    } catch (e) {
      console.error('cc-batches load:', e);
      this._loading = false;
      this._render();
    }
  }

  _jobsForBatch(batchId) {
    const jobIds = this._assignments
      .filter(a => a.batch_id === batchId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(a => a.job_id);
    return jobIds.map(id => this._jobs.find(j => j.id === id)).filter(Boolean);
  }

  _filtered() {
    let items = this._batches;
    const q = (this._searchQuery || '').toLowerCase().trim();
    if (q) items = items.filter(x =>
      x.name.toLowerCase().includes(q) || (x.schedule_human || '').toLowerCase().includes(q)
    );
    return items;
  }

  async _toggleEnabled(id) {
    const batch = this._batches.find(b => b.id === id);
    if (!batch) return;
    const newVal = !batch.enabled;
    try {
      await window.supabase.update('cron_batches', { enabled: newVal, updated_at: new Date().toISOString() }, { id });
      batch.enabled = newVal;
      this._render();
      window.showToast?.(`${batch.name} ${newVal ? 'enabled' : 'disabled'}`, 2000);
    } catch (e) {
      window.showToast?.('Failed to toggle', 2000);
    }
  }

  async _runBatch(id) {
    const batch = this._batches.find(b => b.id === id);
    if (!batch) return;
    const jobs = this._jobsForBatch(id).filter(j => j.enabled);
    if (!jobs.length) { window.showToast?.('No enabled jobs in batch', 2000); return; }
    try {
      if (!window.trigger) throw new Error('trigger.js not loaded');
      const msg = `Run batch: ${batch.name}\n\nJobs:\n${jobs.map(j => `- ${j.name}`).join('\n')}`;
      await window.trigger(msg, { context: 'cc-crons', silent: true });
      window.showToast?.(`⚡ Batch "${batch.name}" queued (${jobs.length} jobs)`, 2500);
    } catch (e) {
      window.showToast?.('Failed to queue batch', 2000);
    }
  }

  _openDetail(id) {
    const batch = this._batches.find(b => b.id === id);
    if (!batch) return;
    const esc = this._esc.bind(this);
    const jobs = this._jobsForBatch(id);

    const old = this.querySelector('cc-modal.batch-detail-modal');
    if (old) old.remove();

    const modal = document.createElement('cc-modal');
    modal.className = 'batch-detail-modal';
    modal.setAttribute('title', batch.name);
    modal.setAttribute('size', 'lg');

    modal.innerHTML = `
      <div class="cc-modal-body">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span class="badge ${batch.enabled ? 'badge-success' : 'badge-muted'}">${batch.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;">
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Schedule</div>
            <div style="font-size:14px;color:var(--heading);font-weight:600;">${esc(batch.schedule_human || '—')}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;font-family:monospace;">${esc(batch.schedule_expr || '—')}</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;">
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Jobs</div>
            <div style="font-size:24px;font-weight:700;color:var(--accent);">${jobs.length}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${jobs.filter(j => j.enabled).length} enabled</div>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Assigned Jobs</div>
          ${jobs.length ? `<div style="display:flex;flex-direction:column;gap:6px;">${jobs.map(j => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${j.enabled ? 'var(--green,#4ade80)' : 'var(--muted)'};flex-shrink:0;"></span>
              <a href="index.html" style="color:var(--text);text-decoration:none;font-weight:600;font-size:13px;">${esc(j.name)}</a>
              <span style="font-size:11px;color:var(--muted);margin-left:auto;">${esc(j.description || '')}</span>
            </div>
          `).join('')}</div>` : '<p style="color:var(--muted);font-size:13px;">No jobs assigned</p>'}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn toggle-modal-btn">${batch.enabled ? '⏸ Disable' : '▶️ Enable'}</button>
          <button class="btn btn-primary run-modal-btn">⚡ Run Batch</button>
        </div>
      </div>
    `;

    this.appendChild(modal);
    requestAnimationFrame(() => {
      modal.open();
      modal.querySelector('.toggle-modal-btn')?.addEventListener('click', () => {
        this._toggleEnabled(id); modal.remove();
      });
      modal.querySelector('.run-modal-btn')?.addEventListener('click', () => {
        this._runBatch(id);
      });
    });
  }

  _render() {
    const items = this._filtered();
    const esc = this._esc.bind(this);
    const q = this._searchQuery || '';

    const styles = `<style>
      cc-batches .card{cursor:pointer;transition:border-color .2s;}
      cc-batches .card:hover{border-color:var(--accent);}
      cc-batches .badge-success{background:rgba(74,222,128,.15);color:var(--green,#4ade80);}
      cc-batches .badge-muted{background:rgba(100,116,139,.15);color:var(--muted);}
      cc-batches .run-btn-inline{background:none;border:none;cursor:pointer;color:var(--green,#4ade80);font-size:14px;padding:2px;opacity:.7;transition:opacity .15s;}
      cc-batches .run-btn-inline:hover{opacity:1;}
    </style>`;

    if (this._loading) {
      this.innerHTML = `${styles}<cc-page-header icon="📦" title="Batches" description="Scheduled batch groups"></cc-page-header><p style="color:var(--muted);text-align:center;padding:40px;">Loading…</p>`;
      return;
    }

    const cardsHtml = items.map((x, i) => {
      const jobs = this._jobsForBatch(x.id);
      const enabledCount = jobs.filter(j => j.enabled).length;
      return `
      <div class="card cc-fade-in" style="animation-delay:${i * 30}ms" data-batch-id="${this._escAttr(x.id)}">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:15px;font-weight:700;">${esc(x.name)}</span>
          <span class="badge ${x.enabled ? 'badge-success' : 'badge-muted'}" style="font-size:10px;padding:2px 6px;">${x.enabled ? 'ON' : 'OFF'}</span>
          <button class="run-btn-inline" data-run-id="${this._escAttr(x.id)}" title="Run Batch" style="margin-left:auto;"><i data-lucide="play" style="width:14px;height:14px"></i></button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px;">${esc(x.schedule_human || x.schedule_expr || '—')}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px;">
          <span style="font-weight:600;color:var(--accent);">${jobs.length}</span> job${jobs.length !== 1 ? 's' : ''} · ${enabledCount} enabled
        </div>
      </div>`;
    }).join('');

    const listHtml = `<div class="view-list">${items.map(x => {
      const jobs = this._jobsForBatch(x.id);
      return `<div class="list-row" data-batch-id="${this._escAttr(x.id)}" role="button" style="cursor:pointer;">
        <span class="badge ${x.enabled ? 'badge-success' : 'badge-muted'}" style="font-size:10px;padding:1px 6px;flex-shrink:0;">${x.enabled ? 'ON' : 'OFF'}</span>
        <span style="font-weight:600;">${esc(x.name)}</span>
        <span style="color:var(--muted);font-size:12px;flex:1;">${esc(x.schedule_human || '')}</span>
        <span style="font-size:12px;color:var(--accent);font-weight:600;">${jobs.length} jobs</span>
      </div>`;
    }).join('')}</div>`;

    const expandedHtml = `<div class="view-expanded">${items.map(x => {
      const jobs = this._jobsForBatch(x.id);
      const enabledCount = jobs.filter(j => j.enabled).length;
      return `<div class="expanded-card" data-batch-id="${this._escAttr(x.id)}" role="button" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:16px;font-weight:700;">${esc(x.name)}</span>
          <span class="badge ${x.enabled ? 'badge-success' : 'badge-muted'}">${x.enabled ? 'Enabled' : 'Disabled'}</span>
          <button class="run-btn-inline" data-run-id="${this._escAttr(x.id)}" title="Run Batch" style="margin-left:auto;"><i data-lucide="play" style="width:14px;height:14px"></i></button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div style="font-size:12px;color:var(--muted);"><strong>Schedule:</strong> ${esc(x.schedule_human || x.schedule_expr || '—')}</div>
          <div style="font-size:12px;color:var(--muted);"><strong>Jobs:</strong> <span style="color:var(--accent);font-weight:600;">${jobs.length}</span> total · ${enabledCount} enabled</div>
        </div>
        ${jobs.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">${jobs.map(j => `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${j.enabled ? 'rgba(74,222,128,.12)' : 'rgba(100,116,139,.12)'};color:${j.enabled ? 'var(--green,#4ade80)' : 'var(--muted)'};">${esc(j.name)}</span>`).join('')}</div>` : ''}
      </div>`;
    }).join('')}</div>`;

    let contentHtml;
    if (this._view === 'list') contentHtml = listHtml;
    else if (this._view === 'expanded') contentHtml = expandedHtml;
    else contentHtml = `<div class="grid grid-cards-wide">${cardsHtml}</div>`;

    this.innerHTML = `${styles}
      <cc-page-header icon="📦" title="Batches" description="Scheduled batch groups" count="${items.length}" count-label="batch${items.length !== 1 ? 'es' : ''}"></cc-page-header>
      <div class="controls" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px;">
        <cc-search placeholder="Search batches…" value="${this._escAttr(q)}" style="flex:1;"></cc-search>
        <cc-view-toggle app="batches" value="${this._view}" style="flex-shrink:0;margin-left:auto;"></cc-view-toggle>
      </div>
      ${contentHtml}
      ${items.length ? '' : '<cc-empty-state message="No batches match your search" icon="📦"></cc-empty-state>'}`;
    setTimeout(() => window.refreshIcons?.(), 0);
  }
}
customElements.define('cc-batches', CcBatches);
