/* ─── <cc-media-card> — Standardized media card with save/share/download ───
   Usage:
     <cc-media-card
       title="Hero Banner"
       type="Image"
       src="https://example.com/image.png"
       thumbnail="https://example.com/thumb.png"
       date="2026-02-15"
       tags='["hero","ai-gen"]'
       media-id="abc-123"
       base64=""
     ></cc-media-card>

   Attributes:
     title      — Card title
     type       — Media type: Image, Video, GIF, Audio, PDF, Presentation
     src        — URL to the full media file (for download/open)
     thumbnail  — URL to thumbnail image (optional, falls back to placeholder)
     base64     — Base64 data string of the media (for saving; if not set, fetched from src on save)
     date       — ISO date string
     tags       — JSON array of tag strings
     media-id   — Unique ID (auto-generated if not provided)
     saveable   — Show save button (default: true)
     shareable  — Show share button (default: true)
     downloadable — Show download button (default: true)

   Events:
     media-save     — { id, title, type, base64, tags }
     media-download — { id, title, src }
     media-click    — { id, title, src }

   Save stores to Supabase `media` table via window.supabase.
*/
(function () {
  const TYPE_ICONS = { Image: '🖼️', Video: '🎬', GIF: '🎨', Audio: '🎵', PDF: '📄', Presentation: '📊' };

  class CcMediaCard extends HTMLElement {
    static get observedAttributes() {
      return ['title', 'type', 'src', 'thumbnail', 'date', 'tags', 'media-id', 'base64', 'saveable', 'shareable', 'downloadable'];
    }

    connectedCallback() {
      this._injectStyles();
      this.render();
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    get _title() { return this.getAttribute('title') || 'Untitled'; }
    get _type() { return this.getAttribute('type') || 'Image'; }
    get _src() { return this.getAttribute('src') || ''; }
    get _thumbnail() { return this.getAttribute('thumbnail') || ''; }
    get _base64() { return this.getAttribute('base64') || ''; }
    get _date() { return this.getAttribute('date') || ''; }
    get _mediaId() { return this.getAttribute('media-id') || `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
    get _saveable() { return this.getAttribute('saveable') !== 'false'; }
    get _shareable() { return this.getAttribute('shareable') !== 'false'; }
    get _downloadable() { return this.getAttribute('downloadable') !== 'false'; }

    get _tags() {
      try { return JSON.parse(this.getAttribute('tags') || '[]'); }
      catch { return []; }
    }

    _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    _typeIcon(type) { return TYPE_ICONS[type] || '📁'; }

    _formatDate(iso) {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    render() {
      const title = this._esc(this._title);
      const type = this._esc(this._type);
      const date = this._formatDate(this._date);
      const tags = this._tags;
      const thumbnail = this._thumbnail;

      const thumbHtml = thumbnail
        ? `<img class="mc-thumb" src="${this._esc(thumbnail)}" alt="${title}" loading="lazy">`
        : `<cc-placeholder icon="${this._typeIcon(this._type)}" seed="${title}"></cc-placeholder>`;

      const tagsHtml = tags.map(t => `<span class="mc-tag">${this._esc(t)}</span>`).join('');

      const saveBtn = this._saveable
        ? `<button class="mc-action-btn mc-save" title="Save to Gallery" data-action="save">💾</button>` : '';
      const shareBtn = this._shareable
        ? `<button class="mc-action-btn mc-share-btn" title="Share" data-action="share">🔗</button>` : '';
      const downloadBtn = this._downloadable
        ? `<button class="mc-action-btn mc-download" title="Download" data-action="download">⬇️</button>` : '';

      this.innerHTML = `
        <div class="mc-card">
          <div class="mc-thumb-wrap" data-action="open">
            ${thumbHtml}
          </div>
          <div class="mc-body">
            <div class="mc-title" title="${title}">${title}</div>
            <div class="mc-meta">
              <cc-type-badge type="${type}"></cc-type-badge>
              ${date ? `<span>${date}</span>` : ''}
            </div>
            ${tagsHtml ? `<div class="mc-tags">${tagsHtml}</div>` : ''}
            <div class="mc-actions">
              ${saveBtn}${shareBtn}${downloadBtn}
            </div>
          </div>
        </div>`;

      // Bind events
      this.querySelector('[data-action="open"]')?.addEventListener('click', () => this._handleClick());
      this.querySelector('[data-action="save"]')?.addEventListener('click', (e) => { e.stopPropagation(); this._handleSave(); });
      this.querySelector('[data-action="share"]')?.addEventListener('click', (e) => { e.stopPropagation(); this._handleShare(); });
      this.querySelector('[data-action="download"]')?.addEventListener('click', (e) => { e.stopPropagation(); this._handleDownload(); });

      window.refreshIcons?.();
    }

    _handleClick() {
      this.dispatchEvent(new CustomEvent('media-click', {
        bubbles: true, detail: { id: this._mediaId, title: this._title, src: this._src }
      }));
      if (this._src) {
        if (this._type === 'Image' && window.CCLightbox) {
          CCLightbox.open(this._src, this._title);
        } else {
          window.open(this._src, '_blank');
        }
      }
    }

    async _handleSave() {
      const btn = this.querySelector('[data-action="save"]');
      if (btn) { btn.disabled = true; btn.textContent = '⏳'; }

      try {
        let base64 = this._base64;

        // If no base64 provided, try to fetch and convert
        if (!base64 && this._src) {
          try {
            const resp = await fetch(this._src);
            const blob = await resp.blob();
            base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn('cc-media-card: Could not fetch media for base64 conversion', e);
          }
        }

        const record = {
          id: this._mediaId,
          name: this._title,
          type: this._type,
          url: this._src,
          thumbnail: this._thumbnail,
          base64_data: base64,
          tags: JSON.stringify(this._tags),
          source: window.location.hostname.split('.')[0] || 'unknown',
          created_at: this._date || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Save to Supabase
        if (window.supabase) {
          await window.supabase.upsert('media', record);
          window.showToast?.('Saved to Gallery ✅');
        } else {
          // Fallback: save to SyncDB if available
          if (window.getDb) {
            const db = await window.getDb();
            db.upsert('media', { ...record, tags: this._tags });
            window.showToast?.('Saved locally ✅');
          } else {
            window.showToast?.('No database available — cannot save');
          }
        }

        if (btn) { btn.textContent = '✅'; setTimeout(() => { btn.textContent = '💾'; btn.disabled = false; }, 2000); }

        this.dispatchEvent(new CustomEvent('media-save', {
          bubbles: true, detail: { id: this._mediaId, title: this._title, type: this._type, base64, tags: this._tags }
        }));
      } catch (e) {
        console.error('cc-media-card save error:', e);
        window.showToast?.('Save failed ❌');
        if (btn) { btn.textContent = '❌'; setTimeout(() => { btn.textContent = '💾'; btn.disabled = false; }, 2000); }
      }
    }

    _handleShare() {
      const src = this._src || window.location.href;
      if (navigator.share) {
        navigator.share({ title: this._title, url: src }).catch(() => {});
      } else {
        navigator.clipboard.writeText(src).then(() => {
          window.showToast?.('Link copied ✅');
        });
      }
      this.dispatchEvent(new CustomEvent('media-share', {
        bubbles: true, detail: { id: this._mediaId, title: this._title, src }
      }));
    }

    async _handleDownload() {
      const src = this._src || this._base64;
      if (!src) { window.showToast?.('No file to download'); return; }

      try {
        let blobUrl;
        if (src.startsWith('data:')) {
          blobUrl = src;
        } else {
          const resp = await fetch(src);
          const blob = await resp.blob();
          blobUrl = URL.createObjectURL(blob);
        }
        const a = document.createElement('a');
        a.href = blobUrl;
        const ext = this._type === 'Video' ? 'mp4' : this._type === 'Audio' ? 'mp3' : this._type === 'GIF' ? 'gif' : 'png';
        a.download = `${this._title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (!src.startsWith('data:')) URL.revokeObjectURL(blobUrl);
        window.showToast?.('Download started ⬇️');
      } catch (e) {
        window.open(src, '_blank');
        window.showToast?.('Opened in new tab — right-click to save');
      }

      this.dispatchEvent(new CustomEvent('media-download', {
        bubbles: true, detail: { id: this._mediaId, title: this._title, src }
      }));
    }

    _injectStyles() {
      if (document.getElementById('cc-media-card-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-media-card-styles';
      s.textContent = `
        cc-media-card {
          display: block;
        }
        .mc-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: transform .2s, border-color .2s, box-shadow .2s;
          cursor: pointer;
        }
        .mc-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 8px 32px rgba(245,158,11,.12);
        }
        .mc-thumb-wrap {
          position: relative;
          overflow: hidden;
        }
        .mc-thumb {
          width: 100%;
          aspect-ratio: 16/10;
          object-fit: cover;
          display: block;
          background: rgba(255,255,255,.05);
        }
        .mc-thumb-wrap cc-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 16/10;
        }
        .mc-body {
          padding: 12px 16px 14px;
        }
        .mc-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mc-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 11px;
          color: var(--muted);
        }
        .mc-tags {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .mc-tag {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,.06);
          color: var(--muted);
        }
        .mc-actions {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }
        .mc-action-btn {
          flex: 1;
          padding: 6px 0;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: transparent;
          font-size: 14px;
          cursor: pointer;
          transition: all .2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mc-action-btn:hover {
          border-color: var(--accent);
          background: rgba(245,158,11,.08);
          transform: scale(1.05);
        }
        .mc-action-btn:disabled {
          opacity: 0.5;
          cursor: wait;
        }
        .mc-save:hover { background: rgba(34,197,94,.1); border-color: #22c55e; }
        .mc-share-btn:hover { background: rgba(59,130,246,.1); border-color: #3b82f6; }
        .mc-download:hover { background: rgba(139,92,246,.1); border-color: #8b5cf6; }

        @media (max-width: 600px) {
          .mc-body { padding: 10px 12px 12px; }
          .mc-title { font-size: 13px; }
          .mc-action-btn { padding: 5px 0; font-size: 12px; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define('cc-media-card', CcMediaCard);
})();
