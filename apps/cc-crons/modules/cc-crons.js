// ─── Jobs (cc-crons) ────────────────────────────────────────────
class CcCrons extends HTMLElement {
  connectedCallback() {
    this._jobs = [];
    this._batches = [];
    this._assignments = [];
    this._searchQuery = '';
    this._view = 'cards';
    this._loading = true;

    this.addEventListener('cc-search', e => { this._searchQuery = e.detail.value; this._render(); });
    this.addEventListener('cc-view-change', e => { this._view = e.detail.view; this._render(); });
    this.addEventListener('click', e => {
      const card = e.target.closest('[data-job-id]');
      if (card && !e.target.closest('.toggle-btn') && !e.target.closest('.run-btn-inline')) {
        this._openDetail(card.dataset.jobId);
      }
      const toggle = e.target.closest('.toggle-btn');
      if (toggle) { e.stopPropagation(); this._toggleEnabled(toggle.dataset.toggleId); }
      const run = e.target.closest('.run-btn-inline');
      if (run) { e.stopPropagation(); this._runNow(run.dataset.runId); }
    });

    this._load();
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  _escAttr(s) { return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async _load() {
    try {
      const sb = window.supabase;
      if (!sb) { setTimeout(() => this._load(), 500); return; }
      const [jobs, batches, assignments] = await Promise.all([
        sb.select('cron_jobs', { order: 'name.asc' }),
        sb.select('cron_batches', { order: 'name.asc' }),
        sb.select('cron_batch_jobs'),
      ]);
      this._jobs = jobs || [];
      this._batches = batches || [];
      this._assignments = assignments || [];
      this._loading = false;
      this._render();
    } catch (e) {
      console.error('cc-crons load:', e);
      this._loading = false;
      this._render();
    }
  }

  _batchesForJob(jobId) {
    const batchIds = this._assignments.filter(a => a.job_id === jobId).map(a => a.batch_id);
    return this._batches.filter(b => batchIds.includes(b.id));
  }

  _filtered() {
    let items = this._jobs;
    const q = (this._searchQuery || '').toLowerCase().trim();
    if (q) items = items.filter(x =>
      x.name.toLowerCase().includes(q) || (x.description || '').toLowerCase().includes(q) ||
      (x.prompt_text || '').toLowerCase().includes(q)
    );
    return items;
  }

  async _toggleEnabled(id) {
    const job = this._jobs.find(j => j.id === id);
    if (!job) return;
    const newVal = !job.enabled;
    try {
      await window.supabase.update('cron_jobs', { enabled: newVal, updated_at: new Date().toISOString() }, { id });
      job.enabled = newVal;
      this._render();
      window.showToast?.(`${job.name} ${newVal ? 'enabled' : 'disabled'}`, 2000);
    } catch (e) {
      console.error('Toggle failed:', e);
      window.showToast?.('Failed to toggle', 2000);
    }
  }

  async _runNow(id) {
    const job = this._jobs.find(j => j.id === id);
    if (!job) return;
    try {
      if (!window.trigger) throw new Error('trigger.js not loaded');
      const msg = `Run this cron job now: ${job.name}\n\nPrompt: ${job.prompt_text}`;
      await window.trigger(msg, { context: 'cc-crons', silent: true });
      window.showToast?.(`⚡ "${job.name}" queued`, 2500);
    } catch (e) {
      console.error('Run failed:', e);
      window.showToast?.('Failed to queue job', 2000);
    }
  }

  _openDetail(id) {
    const job = this._jobs.find(j => j.id === id);
    if (!job) return;
    const esc = this._esc.bind(this);
    const batches = this._batchesForJob(id);
    const allBatches = this._batches;

    const old = this.querySelector('cc-modal.job-detail-modal');
    if (old) old.remove();

    const modal = document.createElement('cc-modal');
    modal.className = 'job-detail-modal';
    modal.setAttribute('title', job.name);
    modal.setAttribute('size', 'lg');

    const assignedIds = new Set(batches.map(b => b.id));
    const chipColors = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];
    const batchChips = allBatches.map((b, i) => {
      const isAssigned = assignedIds.has(b.id);
      const color = chipColors[i % chipColors.length];
      return `<button class="batch-chip ${isAssigned ? 'batch-chip-active' : 'batch-chip-inactive'}" data-batch-id="${this._escAttr(b.id)}" data-assigned="${this._escAttr(String(isAssigned))}" style="--chip-color:${this._escAttr(color)};">${esc(b.name)}</button>`;
    }).join('') || '<span style="color:var(--muted);font-size:12px;">No batches exist</span>';

    modal.innerHTML = `
      <div class="cc-modal-body">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
          <span class="badge ${job.enabled ? 'badge-success' : 'badge-muted'}">${job.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        ${job.description ? `<p style="color:var(--muted);font-size:13px;margin:0 0 16px;">${esc(job.description)}</p>` : ''}
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Batch Assignments</div>
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;">${batchChips}</div>
        </div>
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Prompt</div>
          <textarea class="prompt-textarea" style="width:100%;min-height:200px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;color:var(--text);white-space:pre-wrap;line-height:1.5;font-family:monospace;resize:vertical;box-sizing:border-box;">${esc(job.prompt_text || '')}</textarea>
          <button class="btn save-prompt-btn" style="margin-top:8px;">💾 Save Prompt</button>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:16px;">
          Created: ${job.created_at ? new Date(job.created_at).toLocaleString() : '—'} · Updated: ${job.updated_at ? new Date(job.updated_at).toLocaleString() : '—'}
          ${job.prompt_file ? ` · File: ${esc(job.prompt_file)}` : ''}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn toggle-modal-btn">${job.enabled ? '⏸ Disable' : '▶️ Enable'}</button>
          <button class="btn btn-primary run-modal-btn">⚡ Run Now</button>
        </div>
      </div>
    `;

    this.appendChild(modal);
    requestAnimationFrame(() => {
      modal.open();
      // Event handlers within modal — batch chip toggles
      modal.querySelectorAll('.batch-chip').forEach(chip => {
        chip.addEventListener('click', async () => {
          const batchId = chip.dataset.batchId;
          const isAssigned = chip.dataset.assigned === 'true';
          const batchName = chip.textContent;
          try {
            if (isAssigned) {
              await window.supabase.delete('cron_batch_jobs', { batch_id: `eq.${batchId}`, job_id: `eq.${id}` });
              this._assignments = this._assignments.filter(a => !(a.batch_id === batchId && a.job_id === id));
              window.showToast?.(`Removed from ${batchName}`, 2000);
            } else {
              await window.supabase.upsert('cron_batch_jobs', { batch_id: batchId, job_id: id, sort_order: 0 });
              this._assignments.push({ batch_id: batchId, job_id: id, sort_order: 0 });
              window.showToast?.(`Added to ${batchName}`, 2000);
            }
            modal.remove();
            this._openDetail(id);
            this._render();
          } catch (err) {
            console.error('Batch toggle failed:', err);
            window.showToast?.('Failed to update batch', 2000);
          }
        });
      });
      modal.querySelector('.save-prompt-btn')?.addEventListener('click', async () => {
        const textarea = modal.querySelector('.prompt-textarea');
        const newPrompt = textarea.value;
        try {
          await window.supabase.update('cron_jobs', { prompt_text: newPrompt, updated_at: new Date().toISOString() }, { id });
          job.prompt_text = newPrompt;
          window.showToast?.('Prompt saved', 2000);
        } catch (err) {
          console.error('Save prompt failed:', err);
          window.showToast?.('Failed to save prompt', 2000);
        }
      });
      modal.querySelector('.toggle-modal-btn')?.addEventListener('click', () => {
        this._toggleEnabled(id);
        modal.remove();
      });
      modal.querySelector('.run-modal-btn')?.addEventListener('click', () => {
        this._runNow(id);
      });
    });
  }

  _render() {
    const items = this._filtered();
    const esc = this._esc.bind(this);
    const q = this._searchQuery || '';

    const styles = `<style>
      cc-crons .prompt-block{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;color:var(--muted);white-space:pre-wrap;line-height:1.5;max-height:300px;overflow-y:auto;font-family:monospace;}
      cc-crons .card{cursor:pointer;transition:border-color .2s;}
      cc-crons .card:hover{border-color:var(--accent);}
      cc-crons .job-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px;}
      cc-crons .badge-success{background:rgba(74,222,128,.15);color:var(--green,#4ade80);}
      cc-crons .badge-muted{background:rgba(100,116,139,.15);color:var(--muted);}
      cc-crons .pill{background:rgba(245,158,11,.12);color:var(--accent);padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;}
      cc-crons .run-btn-inline{background:none;border:none;cursor:pointer;color:var(--green,#4ade80);font-size:14px;padding:2px;opacity:.7;transition:opacity .15s;}
      cc-crons .run-btn-inline:hover{opacity:1;}
      cc-crons .toggle-btn{background:none;border:none;cursor:pointer;font-size:12px;padding:2px 6px;border-radius:4px;}
      .batch-chip{border:none;cursor:pointer;padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;transition:all .2s ease;}
      .batch-chip-active{background:var(--chip-color,#f59e0b);color:#000;opacity:1;box-shadow:0 0 8px color-mix(in srgb,var(--chip-color,#f59e0b) 40%,transparent);}
      .batch-chip-inactive{background:rgba(100,116,139,.15);color:#64748b;opacity:.6;filter:grayscale(1);}
      .batch-chip:hover{opacity:1;filter:none;transform:scale(1.05);}
    </style>`;

    if (this._loading) {
      this.innerHTML = `${styles}<cc-page-header icon="⏰" title="Jobs" description="Cron job definitions"></cc-page-header><p style="color:var(--muted);text-align:center;padding:40px;">Loading…</p>`;
      return;
    }

    const cardsHtml = items.map((x, i) => {
      const batches = this._batchesForJob(x.id);
      const batchPills = batches.map(b => `<span class="pill">${esc(b.name)}</span>`).join('');
      return `
      <div class="card cc-fade-in" style="animation-delay:${i * 30}ms" data-job-id="${this._escAttr(x.id)}">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:15px;font-weight:700;">${esc(x.name)}</span>
          <span class="badge ${x.enabled ? 'badge-success' : 'badge-muted'}" style="font-size:10px;padding:2px 6px;">${x.enabled ? 'ON' : 'OFF'}</span>
          <button class="run-btn-inline" data-run-id="${this._escAttr(x.id)}" title="Run Now" style="margin-left:auto;"><i data-lucide="play" style="width:14px;height:14px"></i></button>
        </div>
        ${x.description ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(x.description)}</div>` : ''}
        <div class="job-meta">${batchPills || '<span style="font-size:11px;color:var(--muted);">Unassigned</span>'}</div>
      </div>`;
    }).join('');

    const listHtml = `<div class="view-list">${items.map(x => {
      const batches = this._batchesForJob(x.id);
      return `<div class="list-row" data-job-id="${this._escAttr(x.id)}" role="button" style="cursor:pointer;">
        <span class="badge ${x.enabled ? 'badge-success' : 'badge-muted'}" style="font-size:10px;padding:1px 6px;flex-shrink:0;">${x.enabled ? 'ON' : 'OFF'}</span>
        <span style="font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(x.name)}</span>
        <span style="color:var(--muted);font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(x.description || '')}</span>
        ${batches.map(b => `<span class="pill">${esc(b.name)}</span>`).join('')}
      </div>`;
    }).join('')}</div>`;

    const expandedHtml = `<div class="view-expanded">${items.map(x => {
      const batches = this._batchesForJob(x.id);
      return `<div class="expanded-card" data-job-id="${this._escAttr(x.id)}" role="button" style="cursor:pointer;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:16px;font-weight:700;">${esc(x.name)}</span>
          <span class="badge ${x.enabled ? 'badge-success' : 'badge-muted'}">${x.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        ${x.description ? `<div style="color:var(--muted);font-size:13px;margin-bottom:8px;">${esc(x.description)}</div>` : ''}
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${batches.map(b => `<span class="pill">${esc(b.name)}</span>`).join('') || '<span style="font-size:11px;color:var(--muted);">Unassigned</span>'}</div>
        ${x.prompt_text ? `<pre class="prompt-block" style="max-height:60px;overflow:hidden;font-size:11px;">${esc(x.prompt_text.substring(0, 300))}…</pre>` : ''}
      </div>`;
    }).join('')}</div>`;

    let contentHtml;
    if (this._view === 'list') contentHtml = listHtml;
    else if (this._view === 'expanded') contentHtml = expandedHtml;
    else contentHtml = `<div class="grid grid-cards-wide">${cardsHtml}</div>`;

    this.innerHTML = `${styles}
      <cc-page-header icon="⏰" title="Jobs" description="Cron job definitions & prompts" count="${items.length}" count-label="job${items.length !== 1 ? 's' : ''}"></cc-page-header>
      <div class="controls" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px;">
        <cc-search placeholder="Search jobs…" value="${this._escAttr(q)}"></cc-search>
        <cc-view-toggle app="crons" value="${this._view}"></cc-view-toggle>
      </div>
      ${contentHtml}
      ${items.length ? '' : '<cc-empty-state message="No jobs match your search" icon="🔍" animation="sparkle"></cc-empty-state>'}`;
    setTimeout(() => window.refreshIcons?.(), 0);
  }
}
customElements.define('cc-crons', CcCrons);
