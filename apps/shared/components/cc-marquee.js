(function () {
  const TAG = 'cc-marquee';
  if (customElements.get(TAG)) return;

  class CcMarquee extends HTMLElement {
    static get observedAttributes() { return ['direction', 'speed', 'pause-on-hover', 'gap']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const direction = this.getAttribute('direction') || 'left';
      const speed = this.getAttribute('speed') || 'normal';
      const gap = this.getAttribute('gap') || '24';
      const pauseOnHover = this.hasAttribute('pause-on-hover');
      const speeds = { slow: '40s', normal: '25s', fast: '12s' };
      const dur = speeds[speed] || speeds.normal;
      const dir = direction === 'right' ? 'reverse' : 'normal';

      // Grab slotted children HTML
      const children = this.innerHTML;
      this.innerHTML = `
        <div class="cc-marquee__track" style="--marquee-dur:${dur};--marquee-dir:${dir};--marquee-gap:${gap}px">
          <div class="cc-marquee__inner">${children}</div>
          <div class="cc-marquee__inner" aria-hidden="true">${children}</div>
        </div>`;

      if (pauseOnHover) {
        const track = this.querySelector('.cc-marquee__track');
        track.classList.add('cc-marquee__track--pausable');
      }

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-marquee-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-marquee-styles';
      s.textContent = `
        cc-marquee { display: block; overflow: hidden; }
        .cc-marquee__track { display: flex; width: max-content; animation: cc-marquee-scroll var(--marquee-dur) linear infinite; animation-direction: var(--marquee-dir); }
        .cc-marquee__track--pausable:hover { animation-play-state: paused; }
        .cc-marquee__inner { display: flex; align-items: center; gap: var(--marquee-gap, 24px); padding-right: var(--marquee-gap, 24px); }
        @keyframes cc-marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcMarquee);
})();
