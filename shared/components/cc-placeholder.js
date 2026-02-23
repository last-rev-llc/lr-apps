/* <cc-placeholder> — Gradient placeholder thumbnail with emoji icon
   Usage:
     <cc-placeholder icon="🏔️" seed="hero-banner"></cc-placeholder>
     <cc-placeholder icon="📊" seed="dashboard" ratio="4/3"></cc-placeholder>

   Attributes:
     icon  — Emoji or text to display centered
     seed  — String used to generate a deterministic gradient
     ratio — CSS aspect-ratio value (default "16/10")
*/
(function () {
  const GRADIENTS = [
    ['#0f172a', '#1e3a5f'],
    ['#1a0a2e', '#2d1b69'],
    ['#0a2318', '#134e29'],
    ['#2a1a0a', '#5c3a1e'],
    ['#1a1a2e', '#0f2b46'],
    ['#0a1a2a', '#1a3a5a'],
    ['#1e0a2a', '#3a1a5a'],
    ['#0a2a1a', '#1a5a3a'],
    ['#2a0a1a', '#5a1a3a'],
    ['#1a2a0a', '#3a5a1a'],
  ];

  function hashIdx(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h) % GRADIENTS.length;
  }

  const STYLE = document.createElement('style');
  STYLE.textContent = `
    cc-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      font-size: 48px;
      color: rgba(255,255,255,.15);
      overflow: hidden;
    }
  `;
  document.head.appendChild(STYLE);

  class CcPlaceholder extends HTMLElement {
    static get observedAttributes() { return ['icon', 'seed', 'ratio']; }
    connectedCallback() { this._apply(); }
    attributeChangedCallback() { if (this.isConnected) this._apply(); }

    _apply() {
      const seed = this.getAttribute('seed') || this.textContent.trim() || 'default';
      const g = GRADIENTS[hashIdx(seed)];
      const ratio = this.getAttribute('ratio') || '16/10';
      const icon = this.getAttribute('icon') || '';

      this.style.aspectRatio = ratio;
      this.style.background = `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
      if (icon && !this._iconSet) {
        this.textContent = icon;
        this._iconSet = true;
      }
    }
  }

  customElements.define('cc-placeholder', CcPlaceholder);
})();
