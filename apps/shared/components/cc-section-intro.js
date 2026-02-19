(function () {
  const TAG = 'cc-section-intro';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcSectionIntro extends HTMLElement {
    static get observedAttributes() {
      return ['badge', 'badge-color', 'overline', 'title', 'subtitle', 'body', 'align'];
    }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const badge = this.getAttribute('badge') || '';
      const badgeColor = this.getAttribute('badge-color') || '';
      const overline = this.getAttribute('overline') || '';
      const title = this.getAttribute('title') || '';
      const subtitle = this.getAttribute('subtitle') || '';
      const body = this.getAttribute('body') || '';
      const align = this.getAttribute('align') || 'center';

      const badgeHTML = badge
        ? `<div class="cc-si__badge${badgeColor ? ' cc-si__badge--' + _esc(badgeColor) : ''}">${_esc(badge)}</div>`
        : '';
      const overlineHTML = overline
        ? `<div class="cc-si__overline">${_esc(overline)}</div>`
        : '';
      const titleHTML = title
        ? `<h2 class="cc-si__title">${_esc(title)}</h2>`
        : '';
      const subtitleHTML = subtitle
        ? `<p class="cc-si__subtitle">${_esc(subtitle)}</p>`
        : '';
      const bodyHTML = body
        ? `<p class="cc-si__body">${_esc(body)}</p>`
        : '';

      this.innerHTML = `
        <div class="cc-si cc-si--${_esc(align)}">
          ${badgeHTML}${overlineHTML}${titleHTML}${subtitleHTML}${bodyHTML}
        </div>
      `;

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-section-intro-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-section-intro-styles';
      s.textContent = `
        cc-section-intro { display: block; margin-bottom: 40px; }
        .cc-si { max-width: 800px; }
        .cc-si--center { text-align: center; margin-left: auto; margin-right: auto; }
        .cc-si--left { text-align: left; }
        .cc-si__badge {
          display: inline-block;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 2px;
          padding: 6px 18px; border-radius: 20px;
          margin-bottom: 16px;
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
        }
        .cc-si__badge--amber { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .cc-si__badge--violet { background: rgba(124,58,237,0.15); color: #a78bfa; }
        .cc-si__badge--pink { background: rgba(236,72,153,0.15); color: #f472b6; }
        .cc-si__badge--blue { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .cc-si__badge--green { background: rgba(34,197,94,0.15); color: #4ade80; }
        .cc-si__overline {
          font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px;
          color: var(--accent, #f59e0b); font-weight: 600; margin-bottom: 8px;
        }
        .cc-si__title {
          font-family: var(--serif, Georgia, serif);
          font-size: clamp(28px, 4vw, 44px); font-weight: 700;
          line-height: 1.1; letter-spacing: -0.5px;
          color: var(--text, #e2e8f0); margin: 0 0 12px;
        }
        .cc-si__subtitle {
          font-size: 18px; color: rgba(255,255,255,0.5);
          margin: 0 0 12px; line-height: 1.5;
        }
        .cc-si__body {
          font-size: 17px; line-height: 1.7;
          color: rgba(255,255,255,0.5); max-width: 720px;
          margin: 0; 
        }
        .cc-si--center .cc-si__body { margin: 0 auto; }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcSectionIntro);
})();
