(function () {
  const TAG = 'cc-timeline';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcTimeline extends HTMLElement {
    static get observedAttributes() { return ['steps', 'variant', 'numbered']; }
    connectedCallback() { this._render(); this._observe(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }
    disconnectedCallback() { this._io?.disconnect(); }

    _render() {
      const steps = this._parse();
      const variant = this.getAttribute('variant') || 'vertical';
      const numbered = this.getAttribute('numbered') !== 'false';

      this.setAttribute('data-variant', variant);
      this.innerHTML = `<div class="cc-timeline__track cc-timeline__track--${_esc(variant)}">
        ${steps.map((s, i) => `
          <div class="cc-timeline__step" data-step="${i}">
            <div class="cc-timeline__marker">${s.icon ? `<i data-lucide="${_esc(s.icon)}"></i>` : (numbered ? `<span>${i + 1}</span>` : '')}</div>
            <div class="cc-timeline__info">
              <div class="cc-timeline__title">${_esc(s.title)}</div>
              ${s.description ? `<div class="cc-timeline__desc">${_esc(s.description)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;

      if (steps.some(s => s.icon)) window.refreshIcons?.();
      this._injectStyles();
    }

    _parse() { try { return JSON.parse(this.getAttribute('steps') || '[]'); } catch { return []; } }

    _observe() {
      this._io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('cc-timeline__step--visible'); this._io.unobserve(e.target); } });
      }, { threshold: 0.2 });
      setTimeout(() => this.querySelectorAll('.cc-timeline__step').forEach(el => this._io.observe(el)), 50);
    }

    _injectStyles() {
      if (document.getElementById('cc-timeline-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-timeline-styles';
      s.textContent = `
        cc-timeline { display: block; }
        .cc-timeline__track--vertical { display: flex; flex-direction: column; gap: 0; position: relative; padding-left: 32px; }
        .cc-timeline__track--vertical::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: var(--border, rgba(255,255,255,0.1)); }
        .cc-timeline__step { position: relative; padding-bottom: 28px; opacity: 0; transform: translateY(16px); transition: opacity 0.4s ease, transform 0.4s ease; }
        .cc-timeline__step--visible { opacity: 1; transform: translateY(0); }
        .cc-timeline__marker { position: absolute; left: -32px; width: 32px; height: 32px; border-radius: 50%; background: var(--surface, #1e293b); border: 2px solid var(--accent, #f59e0b); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: var(--accent, #f59e0b); z-index: 1; }
        .cc-timeline__marker i, .cc-timeline__marker svg { width: 14px; height: 14px; color: var(--accent, #f59e0b); }
        .cc-timeline__title { font-weight: 600; color: var(--text, #e2e8f0); font-size: 1rem; }
        .cc-timeline__desc { color: var(--muted, #94a3b8); font-size: 0.9rem; margin-top: 4px; line-height: 1.5; }
        .cc-timeline__track--horizontal { display: flex; gap: 24px; overflow-x: auto; padding-bottom: 12px; }
        .cc-timeline__track--horizontal .cc-timeline__step { padding-bottom: 0; min-width: 180px; flex-shrink: 0; }
        .cc-timeline__track--horizontal .cc-timeline__marker { position: static; margin: 0 auto 12px; }
        .cc-timeline__track--horizontal::before { display: none; }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcTimeline);
})();
