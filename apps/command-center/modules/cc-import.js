/* ⚡ cc-import — CSV/vCard Bulk Import for Contacts */
class CcImport extends HTMLElement {
  connectedCallback() {
    this._file = null;
    this._parsed = [];
    this._mapping = {};
    this._targetFields = ['name','email','phone','company','title','type','linkedin_url','twitter_handle','website','location','notes','tags'];
    this._step = 'upload'; // upload → map → preview → done
    this._render();
  }

  _render() {
    if (this._step === 'upload') this._renderUpload();
    else if (this._step === 'map') this._renderMap();
    else if (this._step === 'preview') this._renderPreview();
    else if (this._step === 'done') this._renderDone();
  }

  _renderUpload() {
    this.innerHTML = `
      <div class="page-header"><h1>📥 Bulk Import Contacts</h1>
        <p style="color:var(--muted)">Drag-and-drop CSV or vCard files. Works with LinkedIn exports, Google Contacts, and other CRMs.</p>
      </div>
      <div id="drop-zone" style="border:2px dashed var(--border);border-radius:16px;padding:80px 40px;text-align:center;cursor:pointer;transition:all .2s;margin:24px auto;max-width:600px;">
        <div style="font-size:48px;margin-bottom:16px;">📂</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Drop CSV or vCard file here</div>
        <div style="color:var(--muted);font-size:14px;">or click to browse</div>
        <input type="file" id="file-input" accept=".csv,.vcf,.vcard,text/csv,text/vcard" style="display:none">
      </div>
      <div style="text-align:center;color:var(--muted);font-size:13px;margin-top:8px;">
        Supported: .csv, .vcf (vCard 2.1/3.0/4.0)
      </div>`;

    const zone = this.querySelector('#drop-zone');
    const input = this.querySelector('#file-input');
    zone.onclick = () => input.click();
    zone.ondragover = e => { e.preventDefault(); zone.style.borderColor='var(--accent)'; zone.style.background='rgba(99,102,241,0.05)'; };
    zone.ondragleave = () => { zone.style.borderColor='var(--border)'; zone.style.background=''; };
    zone.ondrop = e => { e.preventDefault(); zone.style.borderColor='var(--border)'; zone.style.background=''; this._handleFile(e.dataTransfer.files[0]); };
    input.onchange = () => { if(input.files[0]) this._handleFile(input.files[0]); };
  }

  async _handleFile(file) {
    if (!file) return;
    this._file = file;
    const text = await file.text();
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'vcf' || ext === 'vcard') {
      this._parsed = this._parseVCard(text);
      this._sourceFields = [...new Set(this._parsed.flatMap(r => Object.keys(r)))];
    } else {
      this._parsed = this._parseCSV(text);
      this._sourceFields = this._parsed.length ? Object.keys(this._parsed[0]) : [];
    }

    if (!this._parsed.length) {
      document.querySelector('cc-toast')?.show('No records found in file', 'error');
      return;
    }

    // Auto-map fields
    this._mapping = {};
    const aliases = {
      name: ['name','full name','fullname','display name','displayname','contact name','formatted name','fn'],
      email: ['email','e-mail','email address','emailaddress','mail'],
      phone: ['phone','telephone','tel','phone number','mobile','cell','work phone','home phone'],
      company: ['company','organization','org','organisation','company name','employer'],
      title: ['title','job title','jobtitle','position','role','designation'],
      type: ['type','contact type','category','relationship'],
      linkedin_url: ['linkedin','linkedin url','linkedin profile'],
      twitter_handle: ['twitter','twitter url','twitter handle','x'],
      website: ['website','url','web','homepage','site'],
      location: ['address','street address','location','city','mailing address'],
      notes: ['notes','note','description','comments','memo'],
      tags: ['tags','labels','categories','groups']
    };
    for (const sf of this._sourceFields) {
      const lower = sf.toLowerCase().trim();
      for (const [target, alts] of Object.entries(aliases)) {
        if (alts.includes(lower) && !Object.values(this._mapping).includes(target)) {
          this._mapping[sf] = target;
          break;
        }
      }
    }

    // Combine first+last name if both exist
    const hasFirst = this._sourceFields.some(f => ['first name','firstname','first','given name'].includes(f.toLowerCase()));
    const hasLast = this._sourceFields.some(f => ['last name','lastname','last','family name','surname'].includes(f.toLowerCase()));
    if (hasFirst && hasLast && !Object.values(this._mapping).includes('name')) {
      this._combineNames = true;
      const firstField = this._sourceFields.find(f => ['first name','firstname','first','given name'].includes(f.toLowerCase()));
      const lastField = this._sourceFields.find(f => ['last name','lastname','last','family name','surname'].includes(f.toLowerCase()));
      this._nameFirstField = firstField;
      this._nameLastField = lastField;
      // Remove these from mapping as we'll combine them
      delete this._mapping[firstField];
      delete this._mapping[lastField];
    }

    this._step = 'map';
    this._render();
  }

  _parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    // Handle quoted CSV fields
    const parseLine = (line) => {
      const result = []; let current = ''; let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      result.push(current.trim());
      return result;
    };
    const headers = parseLine(lines[0]);
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = parseLine(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    });
  }

  _parseVCard(text) {
    const cards = text.split(/(?=BEGIN:VCARD)/i).filter(c => c.trim());
    return cards.map(card => {
      const obj = {};
      const lines = card.split(/\r?\n/);
      for (const line of lines) {
        const m = line.match(/^([^:;]+)[;:]*(.*)/);
        if (!m) continue;
        const key = m[1].toUpperCase().replace(/;.*/, '');
        const val = m[2].replace(/^.*:/, '').trim();
        if (!val) continue;
        if (key === 'FN') obj.name = val;
        else if (key === 'N' && !obj.name) {
          const parts = val.split(';');
          obj.name = `${parts[1]||''} ${parts[0]||''}`.trim();
        }
        else if (key === 'EMAIL') obj.email = obj.email || val;
        else if (key === 'TEL') obj.phone = obj.phone || val;
        else if (key === 'ORG') obj.company = val.replace(/;/g, ' ').trim();
        else if (key === 'TITLE') obj.title = val;
        else if (key === 'URL') obj.website = obj.website || val;
        else if (key === 'ADR') obj.address = val.replace(/;+/g, ', ').replace(/^,\s*/, '').trim();
        else if (key === 'NOTE') obj.notes = val;
      }
      return obj;
    }).filter(c => c.name || c.email);
  }

  _renderMap() {
    const rows = this._sourceFields.map(sf => `
      <tr>
        <td style="padding:8px 12px;font-weight:500;">${sf}</td>
        <td style="padding:8px 12px;color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._parsed[0]?.[sf] || '—'}</td>
        <td style="padding:8px 12px;">
          <select data-source="${sf}" style="background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:6px 10px;width:100%;">
            <option value="">— skip —</option>
            ${this._targetFields.map(tf => `<option value="${tf}" ${this._mapping[sf]===tf?'selected':''}>${tf}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('');

    this.innerHTML = `
      <div class="page-header">
        <h1>🔗 Map Fields</h1>
        <p style="color:var(--muted)">${this._parsed.length} records from <strong>${this._file.name}</strong>. Map source columns to contact fields.</p>
      </div>
      ${this._combineNames ? `<div class="card" style="margin-bottom:16px;padding:12px 16px;background:rgba(99,102,241,0.08);border:1px solid var(--accent);">
        ✨ Auto-combining <strong>${this._nameFirstField}</strong> + <strong>${this._nameLastField}</strong> → <strong>name</strong>
      </div>` : ''}
      <div class="card" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="padding:8px 12px;text-align:left;">Source Column</th>
            <th style="padding:8px 12px;text-align:left;">Sample</th>
            <th style="padding:8px 12px;text-align:left;">Map To</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button class="btn" id="back-btn">← Back</button>
        <button class="btn btn-primary" id="preview-btn">Preview Import →</button>
      </div>`;

    this.querySelector('#back-btn').onclick = () => { this._step = 'upload'; this._render(); };
    this.querySelector('#preview-btn').onclick = () => {
      // Read mapping from selects
      this._mapping = {};
      this.querySelectorAll('select[data-source]').forEach(sel => {
        if (sel.value) this._mapping[sel.dataset.source] = sel.value;
      });
      this._buildMapped();
      this._step = 'preview';
      this._render();
    };
  }

  _buildMapped() {
    this._mapped = this._parsed.map(row => {
      const contact = {};
      // Combine first+last name
      if (this._combineNames) {
        contact.name = `${row[this._nameFirstField]||''} ${row[this._nameLastField]||''}`.trim();
      }
      for (const [src, tgt] of Object.entries(this._mapping)) {
        if (row[src]) {
          if (tgt === 'name' && contact.name) continue; // don't overwrite combined name
          contact[tgt] = row[src];
        }
      }
      if (!contact.type) contact.type = 'other'; // Default type
      contact.raw_data = JSON.stringify(row);
      contact.source = 'csv-import';
      contact.created_at = new Date().toISOString();
      contact.updated_at = contact.created_at;
      contact.id = crypto.randomUUID();
      return contact;
    }).filter(c => c.name || c.email);
  }

  async _renderPreview() {
    // Check for duplicates against existing contacts
    const db = await getDb();
    let existing = [];
    try { existing = await db.getAll('contacts'); } catch(e) {}
    const existingEmails = new Set(existing.map(c => c.email?.toLowerCase()).filter(Boolean));

    this._dupes = [];
    this._unique = [];
    for (const c of this._mapped) {
      if (c.email && existingEmails.has(c.email.toLowerCase())) {
        c._isDupe = true;
        this._dupes.push(c);
      } else {
        this._unique.push(c);
      }
    }

    const preview = this._mapped.slice(0, 20);
    const previewRows = preview.map(c => `
      <tr style="${c._isDupe ? 'opacity:0.5;text-decoration:line-through;' : ''}">
        <td style="padding:6px 10px;">${c._isDupe ? '⚠️' : '✅'}</td>
        <td style="padding:6px 10px;">${c.name || '—'}</td>
        <td style="padding:6px 10px;">${c.email || '—'}</td>
        <td style="padding:6px 10px;">${c.company || '—'}</td>
        <td style="padding:6px 10px;">${c.title || '—'}</td>
        <td style="padding:6px 10px;">${c.phone || '—'}</td>
      </tr>`).join('');

    this.innerHTML = `
      <div class="page-header">
        <h1>👀 Preview Import</h1>
        <p style="color:var(--muted)">Review before importing.</p>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
        <div class="card" style="padding:16px 24px;min-width:120px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:var(--accent);">${this._mapped.length}</div>
          <div style="color:var(--muted);font-size:13px;">Total Records</div>
        </div>
        <div class="card" style="padding:16px 24px;min-width:120px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:var(--green,#22c55e);">${this._unique.length}</div>
          <div style="color:var(--muted);font-size:13px;">New Contacts</div>
        </div>
        <div class="card" style="padding:16px 24px;min-width:120px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:var(--warning,#f59e0b);">${this._dupes.length}</div>
          <div style="color:var(--muted);font-size:13px;">Duplicates (skipped)</div>
        </div>
      </div>
      ${this._dupes.length ? `<div class="card" style="margin-bottom:16px;padding:12px 16px;background:rgba(245,158,11,0.08);border:1px solid var(--warning,#f59e0b);">
        ⚠️ <strong>${this._dupes.length} duplicate${this._dupes.length>1?'s':''}</strong> found by email match — will be skipped.
        <label style="display:block;margin-top:8px;"><input type="checkbox" id="include-dupes"> Import duplicates anyway (overwrite existing)</label>
      </div>` : ''}
      <div class="card" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="padding:6px 10px;"></th>
            <th style="padding:6px 10px;text-align:left;">Name</th>
            <th style="padding:6px 10px;text-align:left;">Email</th>
            <th style="padding:6px 10px;text-align:left;">Company</th>
            <th style="padding:6px 10px;text-align:left;">Title</th>
            <th style="padding:6px 10px;text-align:left;">Phone</th>
          </tr></thead>
          <tbody>${previewRows}</tbody>
        </table>
        ${this._mapped.length > 20 ? `<div style="text-align:center;color:var(--muted);padding:12px;font-size:13px;">…and ${this._mapped.length - 20} more</div>` : ''}
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button class="btn" id="back-btn">← Back to Mapping</button>
        <button class="btn btn-primary" id="import-btn">🚀 Import ${this._unique.length} Contacts</button>
      </div>`;

    this.querySelector('#back-btn').onclick = () => { this._step = 'map'; this._render(); };
    this.querySelector('#import-btn').onclick = () => this._doImport();
    const dupeCheck = this.querySelector('#include-dupes');
    if (dupeCheck) {
      dupeCheck.onchange = () => {
        const btn = this.querySelector('#import-btn');
        const count = dupeCheck.checked ? this._mapped.length : this._unique.length;
        btn.textContent = `🚀 Import ${count} Contacts`;
      };
    }
  }

  async _doImport() {
    const btn = this.querySelector('#import-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Importing…';

    const includeDupes = this.querySelector('#include-dupes')?.checked;
    const toImport = includeDupes ? this._mapped : this._unique;

    try {
      const db = await getDb();
      let imported = 0;
      for (const c of toImport) {
        delete c._isDupe;
        await db.upsert('contacts', c);
        imported++;
      }
      this._importCount = imported;
      this._step = 'done';
      this._render();
      document.querySelector('cc-toast')?.show(`✅ Imported ${imported} contacts!`, 'success');
    } catch(e) {
      console.error('Import failed:', e);
      document.querySelector('cc-toast')?.show('Import failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = '🚀 Retry Import';
    }
  }

  _renderDone() {
    this.innerHTML = `
      <div style="text-align:center;padding:80px 20px;">
        <div style="font-size:64px;margin-bottom:16px;">🎉</div>
        <h1 style="margin-bottom:8px;">Import Complete!</h1>
        <p style="color:var(--muted);font-size:18px;margin-bottom:32px;">${this._importCount} contacts imported successfully.</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button class="btn btn-primary" onclick="this.closest('cc-import')._step='upload';this.closest('cc-import')._render();">Import More</button>
        </div>
      </div>`;
  }
}
customElements.define('cc-import', CcImport);
