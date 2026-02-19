/* cc-ai-scripts — AI Scripts Toolkit (client-first flow) */
class CcAiScripts extends HTMLElement {
  connectedCallback() {
    this._db = null;
    this._clients = [];
    this._activeClient = null;
    this._step = 'select'; // select | config | tools
    this._questionSets = [];
    this._questions = [];
    this._files = [];
    this._chatflows = [];
    this._urlResults = [];
    this._urlContent = '';
    this._abortController = null;
    this._processing = false;
    this._progress = { done: 0, total: 0 };
    this._fileFilter = 'all';
    this._urlSourceType = 'csv';
    this._urlFilter = '';
    this._selectedQs = null;
    this._evalRuns = [];
    this._viewingRun = null;
    this._runResults = [];
    // Persist eval fields across re-renders
    this._evalHost = null;
    this._evalChatflowId = null;
    this._evalChatflowManual = false;
    this._evalTag = null;
    this._evalConcurrency = null;
    this._init();
  }

  _esc(s) { const d = document.createElement('span'); d.textContent = s ?? ''; return d.innerHTML; }
  _escAttr(s) { return (s ?? '').toString().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async _init() {
    // Wait for supabase-client.js to finish initializing (may load async)
    for (let i = 0; i < 50 && !window.supabase; i++) await new Promise(r => setTimeout(r, 100));
    this._db = await AiScriptsDB.init();
    this._clients = await this._db.loadClients();
    const stored = sessionStorage.getItem('aiscripts_client');
    if (stored) {
      this._activeClient = this._clients.find(c => c.id === stored) || null;
      if (this._activeClient) this._step = 'config';
    }
    this._render();
    if (this._activeClient) this._loadClientData();
  }

  async _loadClientData() {
    if (!this._activeClient) return;
    const cid = this._activeClient.id;
    this._questionSets = await this._db.loadQuestionSets(cid);
    this._chatflows = await this._db.loadChatflows(cid);
    this._files = await this._db.loadFiles(cid);
    // Load question counts for each set
    for (const qs of this._questionSets) {
      const questions = await this._db.loadQuestions(qs.id);
      qs._count = questions.length;
    }
    this._render();
  }

  _selectClient(id) {
    this._activeClient = this._clients.find(c => c.id === id) || null;
    if (this._activeClient) {
      sessionStorage.setItem('aiscripts_client', this._activeClient.id);
      this._step = 'config';
      this._questions = [];
      this._selectedQs = null;
      this._evalRuns = [];
      this._viewingRun = null;
      this._runResults = [];
      this._urlResults = [];
      this._render();
      this._loadClientData();
    }
  }

  _goToSelect() { this._step = 'select'; this._render(); }
  _goToTools() { this._step = 'tools'; this._render(); }

  _captureEvalState() {
    const sel = this.querySelector('.js-eval-chatflow-select');
    if (sel) {
      this._evalChatflowManual = sel.value === '__manual__';
      this._evalChatflowId = this._evalChatflowManual ? (this.querySelector('.js-eval-chatflow-manual')?.value || '') : sel.value;
    }
    const h = this.querySelector('.js-eval-host'); if (h) this._evalHost = h.value;
    const t = this.querySelector('.js-eval-tag'); if (t) this._evalTag = t.value;
    const cn = this.querySelector('.js-eval-concurrency'); if (cn) this._evalConcurrency = cn.value;
    const ci = this.querySelector('.js-eval-chatid'); if (ci) this._evalChatId = ci.value;
  }

  _render() {
    this._captureEvalState();
    if (this._step === 'select') { this._renderSelectScreen(); }
    else if (this._step === 'config') { this._renderConfigScreen(); }
    else { this._renderToolsScreen(); }
    if (window.lucide) lucide.createIcons({ attrs: { class: '' } });
  }

  /* ══════════════════════════════════════════════
     STEP 1 — CLIENT SELECTOR
     ══════════════════════════════════════════════ */
  _renderSelectScreen() {
    this.innerHTML = `
      <div style="padding:2rem;max-width:900px;margin:0 auto">
        <h2 style="margin:0 0 0.5rem;font-family:var(--serif)">Select a Client</h2>
        <p style="color:var(--muted);margin:0 0 1.5rem">Choose a client to configure and use the AI tools.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem">
          ${this._clients.map(cl => `<div class="card js-pick-client" data-id="${this._escAttr(cl.id)}" style="cursor:pointer;padding:1.5rem;transition:border-color 0.2s">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
              <i data-lucide="building-2" style="width:24px;height:24px;color:var(--accent)"></i>
              <h3 style="margin:0;font-size:1.1rem">${this._esc(cl.name)}</h3>
            </div>
            <p style="margin:0;color:var(--muted);font-size:0.85rem">${this._esc(cl.slug || cl.id)}</p>
            ${cl.api_host ? `<p style="margin:0.25rem 0 0;color:var(--muted);font-size:0.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._esc(cl.api_host)}</p>` : ''}
          </div>`).join('')}
          <div class="card js-add-new-client" style="cursor:pointer;padding:1.5rem;border:2px dashed var(--glass-border);display:flex;align-items:center;justify-content:center;min-height:100px">
            <div style="text-align:center;color:var(--muted)">
              <i data-lucide="plus-circle" style="width:32px;height:32px;margin-bottom:0.5rem"></i>
              <p style="margin:0;font-size:0.95rem">Add New Client</p>
            </div>
          </div>
        </div>
      </div>
    `;
    this.querySelectorAll('.js-pick-client').forEach(el =>
      el.addEventListener('click', () => this._selectClient(el.dataset.id))
    );
    this.querySelector('.js-add-new-client')?.addEventListener('click', () => this._addNewClientFlow());
  }

  /* ══════════════════════════════════════════════
     STEP 2 — CLIENT CONFIG
     ══════════════════════════════════════════════ */
  _renderConfigScreen() {
    const c = this._activeClient;
    const v = (val) => val || '';
    const inputStyle = 'width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.5rem 0.8rem;font-size:0.9rem';
    this.innerHTML = `
      <div style="padding:2rem;max-width:700px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
          <button class="btn btn-secondary js-back-select" title="Switch Client"><i data-lucide="arrow-left" style="width:16px;height:16px"></i></button>
          <div>
            <h2 style="margin:0;font-family:var(--serif)">${this._esc(c.name)}</h2>
            <p style="margin:0;color:var(--muted);font-size:0.85rem">Review and configure client connection details</p>
          </div>
        </div>
        <div class="card" style="padding:1.5rem">
          <div style="display:grid;gap:1rem">
            <div class="cfg-row"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Name</label><input class="js-cfg-name" value="${this._escAttr(v(c.name))}" style="${inputStyle}"></div>
            <div class="cfg-row"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Slug</label><input class="js-cfg-slug" value="${this._escAttr(v(c.slug))}" style="${inputStyle}"></div>
            <div class="cfg-row"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">API Host</label><input class="js-cfg-host" value="${this._escAttr(v(c.api_host))}" placeholder="https://api.example.com" style="${inputStyle}"><small style="color:var(--muted);font-size:0.75rem">Flowise server URL — include https://, no trailing slash</small></div>
            <div class="cfg-row"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">API Token</label><input class="js-cfg-token" value="${this._escAttr(v(c.api_token))}" type="password" style="${inputStyle}"><small style="color:var(--muted);font-size:0.75rem">Flowise API key. Leave blank for public APIs</small></div>
            <div class="cfg-row"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Chatflow ID</label>
              <select class="js-cfg-chatflow-select" style="${inputStyle}" onchange="this.parentElement.querySelector('.js-cfg-chatflow-manual').style.display=this.value==='__manual__'?'block':'none'">
                <option value="">Select a chatflow...</option>
                ${this._chatflows.map(cf => `<option value="${this._escAttr(cf.chatflow_id)}" ${cf.chatflow_id === v(c.chatflow_id) ? 'selected' : ''}>${this._esc(cf.name)} (${this._esc(cf.chatflow_id || '—')})</option>`).join('')}
                <option value="__manual__" ${v(c.chatflow_id) && !this._chatflows.find(cf => cf.chatflow_id === v(c.chatflow_id)) ? 'selected' : ''}>✏️ Enter manually...</option>
              </select>
              <input class="js-cfg-chatflow-manual" placeholder="Paste chatflow ID" value="${this._escAttr(v(c.chatflow_id) && !this._chatflows.find(cf => cf.chatflow_id === v(c.chatflow_id)) ? v(c.chatflow_id) : '')}" style="${inputStyle};margin-top:0.5rem;display:${v(c.chatflow_id) && !this._chatflows.find(cf => cf.chatflow_id === v(c.chatflow_id)) ? 'block' : 'none'}">
              <small style="color:var(--muted);font-size:0.75rem">Select a saved chatflow or enter an ID manually</small></div>
            <div class="cfg-row"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Default Tag</label><input class="js-cfg-tag" value="${this._escAttr(v(c.default_tag))}" style="${inputStyle}"><small style="color:var(--muted);font-size:0.75rem">Label for eval tracking — e.g. v2-prod, staging</small></div>
            <div class="cfg-row"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Base Trace URL</label><input class="js-cfg-trace" value="${this._escAttr(v(c.base_trace_url))}" placeholder="https://trace.example.com" style="${inputStyle}"><small style="color:var(--muted);font-size:0.75rem">Observability dashboard URL — trace IDs appended automatically</small></div>
          </div>
          <div style="display:flex;gap:0.75rem;margin-top:1.5rem;justify-content:flex-end">
            <button class="btn btn-secondary js-cfg-save"><i data-lucide="save" style="width:16px;height:16px"></i> Save</button>
            <button class="btn btn-primary js-cfg-continue"><i data-lucide="arrow-right" style="width:16px;height:16px"></i> Continue to Tools</button>
          </div>
        </div>

        <div style="margin-top:2rem">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <h3 style="font-family:var(--serif);margin:0">Question Sets</h3>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-secondary js-add-qs"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Manually</button>
              <button class="btn btn-primary js-upload-qs-csv"><i data-lucide="upload" style="width:16px;height:16px"></i> Upload CSV</button>
              <input type="file" class="js-qs-csv-input" accept=".csv" style="display:none">
            </div>
          </div>
          ${this._questionSets.length === 0 ? '<p style="color:var(--muted);font-size:0.9rem">No question sets yet. Add manually or upload a CSV file.</p>' :
          `<div style="display:grid;gap:0.5rem">${this._questionSets.map(qs => `<div class="card" style="padding:0.75rem;display:flex;justify-content:space-between;align-items:center">
            <div>
              <strong>${this._esc(qs.name)}</strong>
              ${qs.tag ? `<span style="color:var(--muted);font-size:0.85rem;margin-left:0.5rem">${this._esc(qs.tag)}</span>` : ''}
              <div style="color:var(--muted);font-size:0.75rem;margin-top:0.15rem">${qs._count || 0} rows</div>
            </div>
            <div style="display:flex;gap:0.25rem">
              <button class="btn btn-secondary js-edit-qs" data-id="${this._escAttr(qs.id)}" title="Edit"><i data-lucide="edit" style="width:14px;height:14px"></i></button>
              <button class="btn btn-secondary js-delete-qs" data-id="${this._escAttr(qs.id)}" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
          </div>`).join('')}</div>`}
        </div>

        <div style="margin-top:2rem">
          <h3 style="font-family:var(--serif);margin-bottom:1rem">Chatflows</h3>
          <button class="btn btn-secondary js-add-cf" style="margin-bottom:0.75rem"><i data-lucide="plus" style="width:16px;height:16px"></i> Add Chatflow</button>
          ${this._chatflows.length === 0 ? '<p style="color:var(--muted);font-size:0.9rem">No chatflows yet.</p>' :
          `<div style="display:grid;gap:0.5rem">${this._chatflows.map(cf => `<div class="card" style="padding:0.75rem;display:flex;justify-content:space-between;align-items:center">
            <div><strong>${this._esc(cf.name)}</strong> <span style="color:var(--muted);font-size:0.85rem">${this._esc(cf.chatflow_id || '')}</span>
              <div style="color:var(--muted);font-size:0.75rem;margin-top:0.15rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:500px;font-family:monospace">${this._esc((c.api_host || '') + '/api/v1/prediction/' + (cf.chatflow_id || ''))}</div>
            </div>
            <div style="display:flex;gap:0.25rem">
              <button class="btn btn-secondary js-edit-cf" data-id="${this._escAttr(cf.id)}" title="Edit"><i data-lucide="edit" style="width:14px;height:14px"></i></button>
              <button class="btn btn-secondary js-delete-cf" data-id="${this._escAttr(cf.id)}" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
            </div>
          </div>`).join('')}</div>`}
        </div>
      </div>
    `;
    this._bindConfig();
  }

  _bindConfig() {
    this.querySelector('.js-back-select')?.addEventListener('click', () => this._goToSelect());
    this.querySelector('.js-cfg-save')?.addEventListener('click', () => this._saveConfig());
    this.querySelector('.js-cfg-continue')?.addEventListener('click', async () => { await this._saveConfig(); this._goToTools(); });

    this.querySelector('.js-add-qs')?.addEventListener('click', () => this._editQsModal());
    this.querySelector('.js-upload-qs-csv')?.addEventListener('click', () => this.querySelector('.js-qs-csv-input')?.click());
    this.querySelector('.js-qs-csv-input')?.addEventListener('change', e => this._uploadQsCsv(e));
    this.querySelectorAll('.js-edit-qs').forEach(el => el.addEventListener('click', () => this._editQsModal(el.dataset.id)));
    this.querySelectorAll('.js-delete-qs').forEach(el => el.addEventListener('click', async () => {
      if (confirm('Delete this question set and all its questions?')) {
        await this._db.deleteQuestions(el.dataset.id);
        await this._db.deleteQuestionSet(el.dataset.id);
        await this._loadClientData();
      }
    }));
    this.querySelector('.js-add-cf')?.addEventListener('click', () => this._editCfModal());
    this.querySelectorAll('.js-edit-cf').forEach(el => el.addEventListener('click', () => this._editCfModal(el.dataset.id)));
    this.querySelectorAll('.js-delete-cf').forEach(el => el.addEventListener('click', async () => {
      if (confirm('Delete this chatflow?')) { await this._db.deleteChatflow(el.dataset.id); await this._loadClientData(); }
    }));
  }

  async _saveConfig() {
    const c = this._activeClient;
    const data = {
      id: c.id,
      name: this.querySelector('.js-cfg-name')?.value ?? c.name,
      slug: this.querySelector('.js-cfg-slug')?.value ?? c.slug,
      api_host: this.querySelector('.js-cfg-host')?.value ?? '',
      api_token: this.querySelector('.js-cfg-token')?.value ?? '',
      chatflow_id: (this.querySelector('.js-cfg-chatflow-select')?.value === '__manual__' ? this.querySelector('.js-cfg-chatflow-manual')?.value : this.querySelector('.js-cfg-chatflow-select')?.value) ?? '',
      default_tag: this.querySelector('.js-cfg-tag')?.value ?? '',
      base_trace_url: this.querySelector('.js-cfg-trace')?.value ?? '',
    };
    await this._db.saveClient(data);
    this._clients = await this._db.loadClients();
    this._activeClient = this._clients.find(cl => cl.id === c.id) || this._activeClient;
    this._render();
    window.showToast?.('Client saved ✅', 3000);
  }

  async _addNewClientFlow() {
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', 'Add New Client');
    modal.setAttribute('size', 'md');
    const inputStyle = 'width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem';
    modal.innerHTML = `
      <div style="display:grid;gap:1rem">
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">ID (unique key)</label><input class="js-m-id" style="${inputStyle}" placeholder="my-client"><small style="color:var(--muted);font-size:0.75rem">Lowercase, no spaces — used as the internal key</small></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Name</label><input class="js-m-name" style="${inputStyle}" placeholder="My Client"></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Slug</label><input class="js-m-slug" style="${inputStyle}" placeholder="my-client"></div>
        <button class="btn btn-primary js-m-save" style="justify-self:end">Create Client</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.open();
    modal.querySelector('.js-m-save').addEventListener('click', async () => {
      const id = modal.querySelector('.js-m-id').value.trim();
      const name = modal.querySelector('.js-m-name').value.trim();
      const slug = modal.querySelector('.js-m-slug').value.trim() || id;
      if (!id || !name) { window.showToast?.('ID and Name required', 3000); return; }
      await this._db.saveClient({ id, name, slug });
      this._clients = await this._db.loadClients();
      modal.close();
      this._selectClient(id);
      window.showToast?.('Client created ✅', 3000);
    });
  }

  /* ══════════════════════════════════════════════
     CSV UPLOAD FOR QUESTION SETS
     ══════════════════════════════════════════════ */
  _uploadQsCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length < 2) { window.showToast?.('CSV must have a header row and at least one data row', 3000); return; }

      const header = lines[0].toLowerCase();
      const headerCols = this._parseCsvLine(header);
      const rows = lines.slice(1).map(l => this._parseCsvLine(l));

      // Find the question column
      const qIdx = headerCols.findIndex(h => h.includes('question'));
      const uidIdx = headerCols.findIndex(h => h.includes('uid') || h.includes('id'));

      if (qIdx < 0) {
        window.showToast?.('CSV must have a "question" column', 3000);
        return;
      }

      const parsedQuestions = rows.map(cols => ({
        question: (cols[qIdx] || '').trim(),
        uid: uidIdx >= 0 ? (cols[uidIdx] || '').trim() : ''
      })).filter(q => q.question);

      this._showCsvUploadModal(file.name, headerCols, parsedQuestions, rows.slice(0, 5));
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  _showCsvUploadModal(filename, headers, parsedQuestions, previewRows) {
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', 'Import Question Set from CSV');
    modal.setAttribute('size', 'lg');
    const inputStyle = 'width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem';

    // Build preview table
    const previewHtml = `<div style="overflow-x:auto;max-height:200px;margin:0.75rem 0;border:1px solid var(--glass-border);border-radius:8px">
      <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
        <thead><tr style="border-bottom:1px solid var(--glass-border);background:var(--glass)">
          ${headers.map(h => `<th style="padding:0.4rem 0.6rem;text-align:left;color:var(--muted);white-space:nowrap">${this._esc(h)}</th>`).join('')}
        </tr></thead>
        <tbody>${previewRows.map(row => `<tr style="border-bottom:1px solid var(--glass-border)">
          ${headers.map((_, i) => `<td style="padding:0.4rem 0.6rem;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${this._esc(row[i] || '')}</td>`).join('')}
        </tr>`).join('')}</tbody>
      </table>
    </div>`;

    const defaultName = filename.replace(/\.csv$/i, '');

    modal.innerHTML = `
      <div style="display:grid;gap:1rem">
        <div style="display:flex;gap:0.75rem;align-items:center;padding:0.75rem;background:var(--glass);border-radius:8px">
          <i data-lucide="file-text" style="width:20px;height:20px;color:var(--accent)"></i>
          <div>
            <strong>${this._esc(filename)}</strong>
            <span style="color:var(--muted);font-size:0.85rem;margin-left:0.5rem">${parsedQuestions.length} questions found</span>
          </div>
        </div>
        <div style="font-size:0.85rem;color:var(--muted)">Preview (first ${previewRows.length} rows):</div>
        ${previewHtml}
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Question Set Name *</label><input class="js-m-name" value="${this._escAttr(defaultName)}" style="${inputStyle}"></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Tag</label><input class="js-m-tag" placeholder="e.g. v1, baseline, regression" style="${inputStyle}"><small style="color:var(--muted);font-size:0.75rem">Optional label for organizing and filtering question sets</small></div>
        <button class="btn btn-primary js-m-save" style="justify-self:end"><i data-lucide="upload" style="width:16px;height:16px"></i> Import ${parsedQuestions.length} Questions</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.open();
    if (window.lucide) lucide.createIcons({ attrs: { class: '' }, nameAttr: 'data-lucide' });

    modal.querySelector('.js-m-save').addEventListener('click', async () => {
      const name = modal.querySelector('.js-m-name').value.trim();
      const tag = modal.querySelector('.js-m-tag').value.trim();
      if (!name) { window.showToast?.('Name is required', 3000); return; }

      const qsId = crypto.randomUUID();
      // Save the question set
      await this._db.saveQuestionSet({
        id: qsId,
        client_id: this._activeClient.id,
        name,
        tag
      });

      // Save all questions
      const questions = parsedQuestions.map(q => ({
        id: crypto.randomUUID(),
        question_set_id: qsId,
        uid: q.uid || crypto.randomUUID().slice(0, 8),
        question: q.question,
        response_text: '',
        response_json: '',
        status: 'pending'
      }));
      await this._db.saveQuestions(questions);

      modal.close();
      await this._loadClientData();
      window.showToast?.(`Imported "${name}" with ${questions.length} questions ✅`, 3000);
    });
  }

  /* ══════════════════════════════════════════════
     STEP 3 — TOOLS (tabs)
     ══════════════════════════════════════════════ */
  _renderToolsScreen() {
    const c = this._activeClient;
    this.innerHTML = `
      <div style="padding:0.75rem 1.5rem;display:flex;align-items:center;gap:1rem;border-bottom:1px solid var(--glass-border)">
        <i data-lucide="building-2" style="width:18px;height:18px;color:var(--accent)"></i>
        <strong style="font-size:1rem">${this._esc(c.name)}</strong>
        <button class="btn btn-secondary js-switch-client" style="padding:0.25rem 0.6rem;font-size:0.8rem"><i data-lucide="repeat" style="width:14px;height:14px"></i> Switch Client</button>
        <button class="btn btn-secondary js-edit-config" style="padding:0.25rem 0.6rem;font-size:0.8rem"><i data-lucide="settings" style="width:14px;height:14px"></i> Config</button>
      </div>
      <cc-tabs active="eval">
        <cc-tab name="eval" label="Eval Questions" icon="message-square">${this._renderEval()}</cc-tab>
        <cc-tab name="runs" label="Run History" icon="history">${this._renderRunHistory()}</cc-tab>
        <cc-tab name="files" label="File Management" icon="folder">${this._renderFiles()}</cc-tab>
        <cc-tab name="urls" label="URL Check" icon="link">${this._renderUrls()}</cc-tab>
      </cc-tabs>
    `;
    this._bindTools();
  }

  _bindTools() {
    this.querySelector('.js-switch-client')?.addEventListener('click', () => this._goToSelect());
    this.querySelector('.js-edit-config')?.addEventListener('click', () => { this._step = 'config'; this._render(); });

    // Eval tab
    this.querySelector('.js-qs-select')?.addEventListener('change', e => this._loadQs(e.target.value));
    this.querySelector('.js-run-selected')?.addEventListener('click', () => this._runEval(true));
    this.querySelector('.js-run-all')?.addEventListener('click', () => this._runEval(false));
    this.querySelector('.js-stop-queue')?.addEventListener('click', () => this._stopQueue());
    this.querySelector('.js-export-csv')?.addEventListener('click', () => this._exportCsv());
    this.querySelector('.js-clear-results')?.addEventListener('click', () => { this._questions = this._questions.map(q => ({...q, response_text: '', response_json: '', status: 'pending'})); this._render(); });
    this.querySelector('.js-check-all')?.addEventListener('change', e => {
      this.querySelectorAll('.js-q-check').forEach(cb => cb.checked = e.target.checked);
    });

    // Run History tab
    this.querySelector('.js-runs-qs-select')?.addEventListener('change', e => this._loadRunHistory(e.target.value));
    this.querySelectorAll('.js-view-run').forEach(el => el.addEventListener('click', () => this._viewRun(el.dataset.id)));
    this.querySelector('.js-back-runs')?.addEventListener('click', () => { this._viewingRun = null; this._runResults = []; this._render(); });
    this.querySelectorAll('.js-delete-run').forEach(el => el.addEventListener('click', async () => {
      if (confirm('Delete this run and all its results?')) {
        await this._db.deleteEvalRun(el.dataset.id);
        this._viewingRun = null;
        this._runResults = [];
        if (this._selectedQs) await this._loadRunHistory(this._selectedQs);
        else this._render();
      }
    }));

    // Files tab
    this.querySelector('.js-file-type-filter')?.addEventListener('pill-change', e => {
      this._fileFilter = e.detail.value;
      this._render();
    });
    this.querySelector('.js-upload-file')?.addEventListener('click', () => this.querySelector('.js-file-input')?.click());
    this.querySelector('.js-file-input')?.addEventListener('change', e => this._uploadFile(e));
    this.querySelectorAll('.js-view-file').forEach(el => el.addEventListener('click', () => this._viewFile(el.dataset.id)));
    this.querySelectorAll('.js-dl-file').forEach(el => el.addEventListener('click', () => this._downloadFile(el.dataset.id, el.dataset.name, el.dataset.type)));
    this.querySelectorAll('.js-del-file').forEach(el => el.addEventListener('click', () => this._deleteFile(el.dataset.id)));

    // URL tab
    this.querySelector('.js-url-source-filter')?.addEventListener('pill-change', e => { this._urlSourceType = e.detail.value; this._render(); });
    this.querySelector('.js-url-upload')?.addEventListener('click', () => this.querySelector('.js-url-file-input')?.click());
    this.querySelector('.js-url-file-input')?.addEventListener('change', e => this._loadUrlFile(e));
    this.querySelector('.js-url-file-select')?.addEventListener('change', e => this._loadUrlFromDb(e.target.value));
    this.querySelector('.js-extract-urls')?.addEventListener('click', () => this._extractUrls());
    this.querySelector('.js-check-urls')?.addEventListener('click', () => this._checkUrls());
    this.querySelector('.js-url-filter')?.addEventListener('input', e => { this._urlFilter = e.target.value; this._render(); });
  }

  /* ── EVAL QUESTIONS TAB ── */
  _renderEval() {
    const c = this._activeClient;
    const sets = this._questionSets;
    const qs = this._questions;
    const prog = this._progress;
    return `<div style="padding:1.5rem">
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:end;margin-bottom:1rem">
        <div style="min-width:200px"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Question Set</label>
          <select class="js-qs-select" style="width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem">
            <option value="">Select...</option>
            ${sets.map(s => `<option value="${this._escAttr(s.id)}" ${s.id === this._selectedQs ? 'selected' : ''}>${this._esc(s.name)} (${s._count || 0})</option>`).join('')}
          </select>
        </div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Tag</label><input class="js-eval-tag" value="${this._escAttr(this._evalTag ?? c?.default_tag || '')}" style="background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem"></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">API Host</label><input class="js-eval-host" value="${this._escAttr(this._evalHost ?? c?.api_host || '')}" style="background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem;min-width:250px"></div>
        <div style="min-width:200px"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Chatflow ID</label>
          <select class="js-eval-chatflow-select" style="width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem" onchange="const m=this.parentElement.querySelector('.js-eval-chatflow-manual');m.style.display=this.value==='__manual__'?'block':'none'">
            <option value="">Select...</option>
            ${this._chatflows.map(cf => {
              const selVal = this._evalChatflowId ?? c?.chatflow_id ?? '';
              const isManual = this._evalChatflowManual;
              return `<option value="${this._escAttr(cf.chatflow_id)}" ${!isManual && cf.chatflow_id === selVal ? 'selected' : ''}>${this._esc(cf.name)}</option>`;
            }).join('')}
            <option value="__manual__" ${this._evalChatflowManual ? 'selected' : ''}>✏️ Enter manually...</option>
          </select>
          <input class="js-eval-chatflow-manual" placeholder="Paste chatflow ID" value="${this._escAttr(this._evalChatflowManual ? (this._evalChatflowId || '') : '')}" style="width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem;margin-top:0.5rem;display:${this._evalChatflowManual ? 'block' : 'none'}">
        </div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Concurrency</label><input class="js-eval-concurrency" type="number" min="1" max="50" value="${this._escAttr(this._evalConcurrency ?? '10')}" style="width:70px;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem"></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Chat ID Override</label><input class="js-eval-chatid" placeholder="Leave blank to use question UID" value="${this._escAttr(this._evalChatId ?? '')}" style="background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem;min-width:280px"><small style="color:var(--muted);font-size:0.75rem">Overrides chatId for all questions in the run</small></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem">
        <button class="btn btn-primary js-run-selected" title="Run eval on checked questions"><i data-lucide="play" style="width:16px;height:16px"></i> Run Selected</button>
        <button class="btn btn-primary js-run-all" title="Run eval on all questions"><i data-lucide="play-circle" style="width:16px;height:16px"></i> Run All</button>
        <button class="btn btn-secondary js-stop-queue" ${!this._processing ? 'disabled' : ''} title="Stop current run"><i data-lucide="square" style="width:16px;height:16px"></i> Stop</button>
        <button class="btn btn-secondary js-export-csv" title="Export results as CSV"><i data-lucide="download" style="width:16px;height:16px"></i> Export CSV</button>
        <button class="btn btn-secondary js-clear-results" title="Reset all statuses"><i data-lucide="trash-2" style="width:16px;height:16px"></i> Clear</button>
      </div>
      ${this._processing ? `<div style="margin-bottom:1rem"><div style="background:var(--glass);border-radius:8px;height:8px;overflow:hidden"><div style="background:var(--accent);height:100%;width:${prog.total ? (prog.done/prog.total*100) : 0}%;transition:width 0.3s"></div></div><small style="color:var(--muted)">${prog.done}/${prog.total}</small></div>` : ''}
      ${qs.length === 0 ? '<cc-empty-state icon="📋" message="No questions loaded. Select a question set above."></cc-empty-state>' :
      `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--glass-border)">
          <th style="padding:0.5rem;width:40px"><input type="checkbox" class="js-check-all"></th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Question</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Response</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted);width:100px">Status</th>
        </tr></thead>
        <tbody>${qs.map((q, i) => `<tr style="border-bottom:1px solid var(--glass-border)">
          <td style="padding:0.5rem"><input type="checkbox" class="js-q-check" data-idx="${i}"></td>
          <td style="padding:0.5rem;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${this._escAttr(q.question)}">${this._esc(q.question)}</td>
          <td style="padding:0.5rem;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${this._escAttr(q.response_text || '')}">${this._esc(q.response_text || '')}</td>
          <td style="padding:0.5rem"><span class="pill" style="background:${this._statusColor(q.status)};color:#fff;font-size:0.75rem">${this._esc(q.status || 'pending')}</span></td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
  }

  _statusColor(s) {
    if (s === 'processing') return 'var(--blue, #3b82f6)';
    if (s === 'completed') return 'var(--green, #22c55e)';
    if (s === 'error') return 'var(--red, #ef4444)';
    return 'var(--muted)';
  }

  /* ── RUN HISTORY TAB ── */
  _renderRunHistory() {
    if (this._viewingRun) return this._renderRunDetail();
    const sets = this._questionSets;
    const runs = this._evalRuns;
    return `<div style="padding:1.5rem">
      <div style="display:flex;gap:0.75rem;align-items:end;margin-bottom:1.5rem">
        <div style="min-width:200px"><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Question Set</label>
          <select class="js-runs-qs-select" style="width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem">
            <option value="">Select...</option>
            ${sets.map(s => `<option value="${this._escAttr(s.id)}" ${s.id === this._selectedQs ? 'selected' : ''}>${this._esc(s.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      ${runs.length === 0 ? '<cc-empty-state icon="📊" message="No runs yet. Run an eval from the Eval Questions tab to create run history."></cc-empty-state>' :
      `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--glass-border)">
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Run</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Chatflow</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Tag</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Status</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Results</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Date</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Actions</th>
        </tr></thead>
        <tbody>${runs.map(r => `<tr style="border-bottom:1px solid var(--glass-border)">
          <td style="padding:0.5rem;font-family:monospace;font-size:0.8rem">${this._esc(r.id.slice(0, 8))}</td>
          <td style="padding:0.5rem">${this._esc(r.chatflow_name || r.chatflow_id || '—')}</td>
          <td style="padding:0.5rem">${r.tag ? `<span class="pill" style="background:var(--glass);font-size:0.75rem">${this._esc(r.tag)}</span>` : '—'}</td>
          <td style="padding:0.5rem"><span class="pill" style="background:${this._statusColor(r.status)};color:#fff;font-size:0.75rem">${this._esc(r.status)}</span></td>
          <td style="padding:0.5rem;font-size:0.85rem">
            <span style="color:var(--green)">${r.completed || 0}</span>/<span>${r.total_questions || 0}</span>
            ${r.errors ? `<span style="color:var(--red);margin-left:0.25rem">(${r.errors} err)</span>` : ''}
          </td>
          <td style="padding:0.5rem;font-size:0.85rem">${this._relDate(r.created_at)}</td>
          <td style="padding:0.5rem;display:flex;gap:0.25rem">
            <button class="btn btn-secondary js-view-run" data-id="${this._escAttr(r.id)}" title="View results"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
            <button class="btn btn-secondary js-delete-run" data-id="${this._escAttr(r.id)}" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
  }

  _renderRunDetail() {
    const run = this._viewingRun;
    const results = this._runResults;
    return `<div style="padding:1.5rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <button class="btn btn-secondary js-back-runs"><i data-lucide="arrow-left" style="width:16px;height:16px"></i></button>
        <div>
          <h3 style="margin:0;font-family:var(--serif)">Run ${this._esc(run.id.slice(0, 8))}</h3>
          <div style="color:var(--muted);font-size:0.85rem">
            ${run.chatflow_name || run.chatflow_id || '—'} ${run.tag ? `· ${this._esc(run.tag)}` : ''} · ${this._relDate(run.created_at)}
          </div>
        </div>
        <span class="pill" style="background:${this._statusColor(run.status)};color:#fff;font-size:0.75rem;margin-left:auto">${this._esc(run.status)}</span>
      </div>
      ${results.length === 0 ? '<cc-empty-state icon="📋" message="No results recorded for this run."></cc-empty-state>' :
      `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--glass-border)">
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Question</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Response</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted);width:80px">Status</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted);width:80px">Time</th>
        </tr></thead>
        <tbody>${results.map(r => `<tr style="border-bottom:1px solid var(--glass-border)">
          <td style="padding:0.5rem;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${this._escAttr(r.question_text)}">${this._esc(r.question_text)}</td>
          <td style="padding:0.5rem;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${this._escAttr(r.response_text || '')}">${this._esc(r.response_text || '')}</td>
          <td style="padding:0.5rem"><span class="pill" style="background:${this._statusColor(r.status)};color:#fff;font-size:0.75rem">${this._esc(r.status)}</span></td>
          <td style="padding:0.5rem;font-size:0.85rem;color:var(--muted)">${r.duration_ms ? (r.duration_ms / 1000).toFixed(1) + 's' : '—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
  }

  /* ── FILE MANAGEMENT TAB ── */
  _renderFiles() {
    const files = this._fileFilter === 'all' ? this._files : this._files.filter(f => f.type === this._fileFilter);
    return `<div style="padding:1.5rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;flex-wrap:wrap">
        <cc-pill-filter class="js-file-type-filter" items='[{"value":"all","label":"All"},{"value":"csv","label":"CSV"},{"value":"json","label":"JSON"}]' value="${this._fileFilter}"></cc-pill-filter>
        <button class="btn btn-primary js-upload-file" title="Upload a CSV or JSON file (max 10MB)"><i data-lucide="upload" style="width:16px;height:16px"></i> Upload</button>
        <input type="file" class="js-file-input" accept=".csv,.json" style="display:none">
      </div>
      ${files.length === 0 ? '<cc-empty-state icon="📁" message="No files uploaded for this client."></cc-empty-state>' :
      `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--glass-border)">
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Name</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Type</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Size</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Uploaded</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Actions</th>
        </tr></thead>
        <tbody>${files.map(f => `<tr style="border-bottom:1px solid var(--glass-border)">
          <td style="padding:0.5rem">${this._esc(f.name)}</td>
          <td style="padding:0.5rem"><span class="pill">${this._esc(f.type)}</span></td>
          <td style="padding:0.5rem">${this._formatSize(f.size)}</td>
          <td style="padding:0.5rem">${this._relDate(f.uploaded_at)}</td>
          <td style="padding:0.5rem;display:flex;gap:0.25rem">
            <button class="btn btn-secondary js-view-file" data-id="${this._escAttr(f.id)}" title="View"><i data-lucide="eye" style="width:14px;height:14px"></i></button>
            <button class="btn btn-secondary js-dl-file" data-id="${this._escAttr(f.id)}" data-name="${this._escAttr(f.name)}" data-type="${this._escAttr(f.type)}" title="Download"><i data-lucide="download" style="width:14px;height:14px"></i></button>
            <button class="btn btn-secondary js-del-file" data-id="${this._escAttr(f.id)}" title="Delete"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
  }

  /* ── URL CHECK TAB ── */
  _renderUrls() {
    const results = this._urlResults;
    const filtered = this._urlFilter ? results.filter(r => r.url.toLowerCase().includes(this._urlFilter.toLowerCase())) : results;
    const valid = filtered.filter(r => r.ok).length;
    const failed = filtered.length - valid;
    return `<div style="padding:1.5rem">
      <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end;margin-bottom:1rem">
        <cc-pill-filter class="js-url-source-filter" items='[{"value":"csv","label":"CSV"},{"value":"json","label":"JSON"}]' value="${this._urlSourceType}"></cc-pill-filter>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Select File</label>
          <select class="js-url-file-select" style="background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem">
            <option value="">Upload new file...</option>
            ${this._files.filter(f => f.type === this._urlSourceType).map(f => `<option value="${this._escAttr(f.id)}">${this._esc(f.name)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-secondary js-url-upload" title="Upload a file containing URLs"><i data-lucide="upload" style="width:16px;height:16px"></i> Upload</button>
        <input type="file" class="js-url-file-input" accept=".csv,.json" style="display:none">
        <button class="btn btn-primary js-extract-urls" title="Extract all URLs from loaded file"><i data-lucide="search" style="width:16px;height:16px"></i> Extract URLs</button>
        <button class="btn btn-primary js-check-urls" ${results.length === 0 ? 'disabled' : ''} title="Check all extracted URLs"><i data-lucide="check-circle" style="width:16px;height:16px"></i> Check URLs</button>
      </div>
      <div style="margin-bottom:1rem">
        <input class="js-url-filter" placeholder="Filter URLs..." value="${this._escAttr(this._urlFilter)}" style="background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem;width:100%;max-width:400px">
      </div>
      ${results.length > 0 ? `<div style="display:flex;gap:1.5rem;margin-bottom:1rem;color:var(--muted);font-size:0.9rem">
        <span style="color:var(--green)">Valid: ${valid} (${filtered.length ? Math.round(valid/filtered.length*100) : 0}%)</span>
        <span style="color:var(--red)">Failed: ${failed} (${filtered.length ? Math.round(failed/filtered.length*100) : 0}%)</span>
        <span>Total: ${filtered.length}</span>
      </div>` : ''}
      ${filtered.length === 0 ? '<cc-empty-state icon="🔗" message="No URLs extracted. Upload a file and click Extract URLs."></cc-empty-state>' :
      `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--glass-border)">
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">URL</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted);width:100px">Status</th>
          <th style="padding:0.5rem;text-align:left;color:var(--muted)">Error</th>
        </tr></thead>
        <tbody>${filtered.map(r => `<tr style="border-bottom:1px solid var(--glass-border);background:${r.ok === true ? 'rgba(34,197,94,0.05)' : r.ok === false ? 'rgba(239,68,68,0.05)' : 'transparent'}">
          <td style="padding:0.5rem;max-width:500px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><a href="${this._escAttr(r.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${this._esc(r.url)}</a></td>
          <td style="padding:0.5rem">${r.ok === true ? '<span style="color:var(--green)">✓ '+(r.status_code||'OK')+'</span>' : r.ok === false ? '<span style="color:var(--red)">✗ '+(r.status_code||'ERR')+'</span>' : '<span style="color:var(--muted)">pending</span>'}</td>
          <td style="padding:0.5rem;color:var(--muted);font-size:0.85rem">${this._esc(r.error || '')}</td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>`;
  }

  /* ── HELPERS ── */
  _formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  }
  _relDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  _parseCsvLine(line) {
    const result = []; let current = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) { if (ch === '"' && line[i+1] === '"') { current += '"'; i++; } else if (ch === '"') inQuotes = false; else current += ch; }
      else { if (ch === '"') inQuotes = true; else if (ch === ',') { result.push(current.trim()); current = ''; } else current += ch; }
    }
    result.push(current.trim());
    return result;
  }

  /* ── EVAL LOGIC (now creates run records) ── */
  async _loadQs(id) {
    if (!id) { this._questions = []; this._selectedQs = null; this._render(); return; }
    this._selectedQs = id;
    this._questions = await this._db.loadQuestions(id);
    this._render();
  }

  async _loadRunHistory(qsId) {
    if (!qsId) { this._evalRuns = []; this._render(); return; }
    this._selectedQs = qsId;
    this._evalRuns = await this._db.loadEvalRuns(qsId);
    this._render();
  }

  async _viewRun(runId) {
    const run = this._evalRuns.find(r => r.id === runId);
    if (!run) return;
    this._viewingRun = run;
    this._runResults = await this._db.loadRunResults(runId);
    this._render();
  }

  async _runEval(selectedOnly) {
    const host = this.querySelector('.js-eval-host')?.value;
    const chatflowId = (this.querySelector('.js-eval-chatflow-select')?.value === '__manual__' ? this.querySelector('.js-eval-chatflow-manual')?.value : this.querySelector('.js-eval-chatflow-select')?.value) || '';
    const tag = this.querySelector('.js-eval-tag')?.value;
    const concurrency = parseInt(this.querySelector('.js-eval-concurrency')?.value) || 10;
    const chatIdOverride = this.querySelector('.js-eval-chatid')?.value?.trim() || '';
    const token = this._activeClient?.api_token || '';
    if (!host || !chatflowId) { window.showToast?.('API Host and Chatflow ID required', 3000); return; }

    let indices = [];
    if (selectedOnly) {
      this.querySelectorAll('.js-q-check:checked').forEach(cb => indices.push(parseInt(cb.dataset.idx)));
      if (indices.length === 0) { window.showToast?.('No questions selected', 3000); return; }
    } else {
      indices = this._questions.map((_, i) => i);
    }

    // Create a run record
    const runId = crypto.randomUUID();
    const chatflowName = this._chatflows.find(cf => cf.chatflow_id === chatflowId)?.name || '';
    const run = {
      id: runId,
      client_id: this._activeClient.id,
      question_set_id: this._selectedQs,
      chatflow_id: chatflowId,
      chatflow_name: chatflowName,
      tag: tag,
      status: 'running',
      total_questions: indices.length,
      completed: 0,
      errors: 0,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    await this._db.saveEvalRun(run);

    this._abortController = new AbortController();
    this._processing = true;
    this._progress = { done: 0, total: indices.length };
    this._render();

    const queue = [...indices];
    const signal = this._abortController.signal;
    let completedCount = 0;
    let errorCount = 0;

    const process = async () => {
      while (queue.length > 0 && !signal.aborted) {
        const idx = queue.shift();
        const q = this._questions[idx];
        if (!q) continue;
        q.status = 'processing';
        this._render();

        const resultId = crypto.randomUUID();
        const startTime = Date.now();
        try {
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch(`${host}/api/v1/prediction/${chatflowId}`, {
            method: 'POST', headers, signal,
            body: JSON.stringify({
              question: q.question, streaming: false, chatId: chatIdOverride || q.uid || q.id,
              overrideConfig: {},
              trackingMetadata: { is_eval: true, tag, question_uid: q.uid || q.id, run_id: runId }
            })
          });
          const data = await res.json();
          q.response_text = data.text || data.response || JSON.stringify(data);
          q.response_json = JSON.stringify(data);
          q.status = 'completed';
          completedCount++;

          // Save run result
          await this._db.saveRunResult({
            id: resultId, run_id: runId, question_id: q.id,
            question_text: q.question, response_text: q.response_text,
            response_json: data, status: 'completed',
            duration_ms: Date.now() - startTime
          });
        } catch (err) {
          if (signal.aborted) break;
          q.response_text = err.message;
          q.status = 'error';
          errorCount++;

          await this._db.saveRunResult({
            id: resultId, run_id: runId, question_id: q.id,
            question_text: q.question, response_text: err.message,
            status: 'error', duration_ms: Date.now() - startTime
          });
        }
        this._progress.done++;
        this._render();

        // Update run progress
        run.completed = completedCount;
        run.errors = errorCount;
        this._db.saveEvalRun(run).catch(() => {});
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, indices.length) }, () => process());
    await Promise.all(workers);

    // Finalize run
    run.status = signal.aborted ? 'stopped' : (errorCount > 0 ? 'completed_with_errors' : 'completed');
    run.completed = completedCount;
    run.errors = errorCount;
    run.completed_at = new Date().toISOString();
    await this._db.saveEvalRun(run);

    this._processing = false;
    this._render();
    window.showToast?.(`Eval complete — ${completedCount} done, ${errorCount} errors`, 3000);
  }

  _stopQueue() {
    if (this._abortController) this._abortController.abort();
    this._processing = false;
    this._questions.forEach(q => { if (q.status === 'processing') q.status = 'pending'; });
    this._render();
    window.showToast?.('Queue stopped', 3000);
  }

  _exportCsv() {
    const rows = [['uid', 'question', 'response', 'status']];
    this._questions.forEach(q => rows.push([q.uid || '', q.question || '', q.response_text || '', q.status || '']));
    const csv = rows.map(r => r.map(c => '"' + (c || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'eval-results.csv'; a.click();
  }

  /* ── FILE MANAGEMENT LOGIC ── */
  async _uploadFile(e) {
    const file = e.target.files[0];
    if (!file || !this._activeClient) return;
    if (file.size > 10 * 1024 * 1024) { window.showToast?.('File too large (max 10MB)', 3000); return; }
    const content = await file.text();
    const type = file.name.endsWith('.json') ? 'json' : 'csv';
    await this._db.saveFile({
      id: crypto.randomUUID(),
      client_id: this._activeClient.id,
      name: file.name, type, content, size: file.size
    });
    this._files = await this._db.loadFiles(this._activeClient.id);
    this._render();
    window.showToast?.('File uploaded ✅', 3000);
    e.target.value = '';
  }

  async _viewFile(id) {
    const f = await this._db.getFile(id);
    if (!f) return;
    let content = f.content || '';
    if (f.type === 'json') try { content = JSON.stringify(JSON.parse(content), null, 2); } catch {}
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', f.name);
    modal.setAttribute('size', 'lg');
    modal.innerHTML = `<pre style="white-space:pre-wrap;word-break:break-all;max-height:60vh;overflow:auto;font-size:0.85rem;color:var(--text)">${this._esc(content)}</pre>`;
    document.body.appendChild(modal);
    modal.open();
  }

  _downloadFile(id, name, type) {
    const f = this._files.find(f => f.id === id);
    if (!f) return;
    const blob = new Blob([f.content || ''], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  }

  async _deleteFile(id) {
    if (!confirm('Delete this file?')) return;
    await this._db.deleteFile(id);
    this._files = this._files.filter(f => f.id !== id);
    this._render();
    window.showToast?.('File deleted', 3000);
  }

  /* ── URL CHECK LOGIC ── */
  async _loadUrlFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    this._urlContent = await file.text();
    this._urlResults = [];
    this._render();
    window.showToast?.('File loaded', 3000);
    e.target.value = '';
  }

  async _loadUrlFromDb(id) {
    if (!id) return;
    const f = await this._db.getFile(id);
    if (f) { this._urlContent = f.content || ''; this._urlResults = []; this._render(); }
  }

  _extractUrls() {
    if (!this._urlContent) { window.showToast?.('No file content loaded', 3000); return; }
    const urlRegex = /https?:\/\/[^\s"'<>\]\)]+/g;
    const mdLinkRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
    const urls = new Set();
    let m;
    while ((m = mdLinkRegex.exec(this._urlContent)) !== null) urls.add(m[2]);
    while ((m = urlRegex.exec(this._urlContent)) !== null) urls.add(m[0].replace(/[.,;:!?)]+$/, ''));
    this._urlResults = [...urls].map(url => ({ id: crypto.randomUUID(), client_id: this._activeClient?.id, url, status_code: null, ok: null, error: null, source: 'extract' }));
    this._render();
    window.showToast?.(`Extracted ${this._urlResults.length} URLs`, 3000);
  }

  async _checkUrls() {
    if (this._urlResults.length === 0) return;
    window.showToast?.('Checking URLs...', 3000);
    const checks = this._urlResults.map(async r => {
      try {
        const res = await fetch(r.url, { method: 'HEAD', mode: 'no-cors' });
        r.status_code = res.status || 0;
        r.ok = res.type === 'opaque' ? true : res.ok;
      } catch (err) {
        try {
          const res = await fetch(r.url, { mode: 'no-cors' });
          r.status_code = res.status || 0;
          r.ok = res.type === 'opaque' ? true : res.ok;
        } catch (err2) {
          r.ok = false; r.error = err2.message; r.status_code = 0;
        }
      }
      r.checked_at = new Date().toISOString();
    });
    await Promise.all(checks);
    this._render();
    await this._db.saveUrlChecks(this._urlResults).catch(() => {});
    window.showToast?.('URL check complete ✅', 3000);
  }

  /* ── MODALS (question sets & chatflows) ── */
  _editQsModal(id) {
    const qs = id ? this._questionSets.find(q => q.id === id) : { name: '', tag: '' };
    if (!qs) return;
    const isNew = !id;
    const inputStyle = 'width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem';
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', isNew ? 'Add Question Set' : 'Edit Question Set');
    modal.setAttribute('size', 'sm');
    modal.innerHTML = `
      <div style="display:grid;gap:1rem">
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Name</label><input class="js-m-name" value="${this._escAttr(qs.name || '')}" style="${inputStyle}"></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Tag</label><input class="js-m-tag" value="${this._escAttr(qs.tag || '')}" style="${inputStyle}"></div>
        <button class="btn btn-primary js-m-save" style="justify-self:end">Save</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.open();
    modal.querySelector('.js-m-save').addEventListener('click', async () => {
      const data = {
        id: id || crypto.randomUUID(),
        client_id: this._activeClient?.id,
        name: modal.querySelector('.js-m-name').value,
        tag: modal.querySelector('.js-m-tag').value,
      };
      if (!data.name) { window.showToast?.('Name required', 3000); return; }
      await this._db.saveQuestionSet(data);
      await this._loadClientData();
      modal.close();
      window.showToast?.('Question set saved ✅', 3000);
    });
  }

  _editCfModal(id) {
    const cf = id ? this._chatflows.find(c => c.id === id) : { name: '', chatflow_id: '' };
    if (!cf) return;
    const isNew = !id;
    const apiHost = this._activeClient?.api_host || '';
    const inputStyle = 'width:100%;background:var(--glass);color:var(--text);border:1px solid var(--glass-border);border-radius:8px;padding:0.4rem 0.8rem';
    const readonlyStyle = inputStyle + ';opacity:0.6;cursor:not-allowed';
    const modal = document.createElement('cc-modal');
    modal.setAttribute('title', isNew ? 'Add Chatflow' : 'Edit Chatflow');
    modal.setAttribute('size', 'sm');
    modal.innerHTML = `
      <div style="display:grid;gap:1rem">
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">API Host</label><input value="${this._escAttr(apiHost)}" readonly style="${readonlyStyle}"><small style="color:var(--muted);font-size:0.75rem">From client connection details</small></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Name</label><input class="js-m-name" value="${this._escAttr(cf.name || '')}" style="${inputStyle}"></div>
        <div><label style="color:var(--muted);font-size:0.85rem;display:block;margin-bottom:0.25rem">Chatflow ID</label><input class="js-m-cfid" value="${this._escAttr(cf.chatflow_id || '')}" style="${inputStyle}"></div>
        <button class="btn btn-primary js-m-save" style="justify-self:end">Save</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.open();
    modal.querySelector('.js-m-save').addEventListener('click', async () => {
      const data = {
        id: id || crypto.randomUUID(),
        client_id: this._activeClient?.id,
        name: modal.querySelector('.js-m-name').value,
        chatflow_id: modal.querySelector('.js-m-cfid').value,
      };
      if (!data.name) { window.showToast?.('Name required', 3000); return; }
      await this._db.saveChatflow(data);
      await this._loadClientData();
      modal.close();
      window.showToast?.('Chatflow saved ✅', 3000);
    });
  }
}

customElements.define('cc-ai-scripts', CcAiScripts);
