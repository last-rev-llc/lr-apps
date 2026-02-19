/**
 * <cc-confetti> — Burst confetti animation on page load (or on demand)
 *
 * Attributes:
 *   colors  — comma-separated hex colors (default: "#FDBB30,#00543C,#fff,#007A56")
 *   count   — number of pieces (default: 80)
 *   delay   — ms delay before burst (default: 300)
 *   auto    — if present, fires on connectedCallback (default: true)
 *
 * Methods:
 *   fire()  — manually trigger a confetti burst
 *
 * CSS classes injected into <head> once.
 */
class CCConfetti extends HTMLElement {
  connectedCallback() {
    if (!CCConfetti._styles) {
      const s = document.createElement('style');
      s.textContent = `
        .cc-confetti-piece {
          position: fixed; z-index: 9999; pointer-events: none;
          animation: cc-confetti-fall linear forwards;
        }
        @keyframes cc-confetti-fall {
          0% { opacity:1; transform: translateY(0) rotate(0deg) scale(1); }
          80% { opacity:1; }
          100% { opacity:0; transform: translateY(100vh) rotate(720deg) scale(0.5); }
        }
      `;
      document.head.appendChild(s);
      CCConfetti._styles = true;
    }
    if (this.getAttribute('auto') !== 'false') {
      setTimeout(() => this.fire(), parseInt(this.getAttribute('delay')) || 300);
    }
  }

  fire() {
    const colors = (this.getAttribute('colors') || '#FDBB30,#00543C,#fff,#007A56').split(',').map(c => c.trim());
    const count = parseInt(this.getAttribute('count')) || 80;
    const shapes = ['circle', 'square', 'strip'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'cc-confetti-piece';
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;
      Object.assign(el.style, {
        left: Math.random() * 100 + 'vw',
        top: '-20px',
        width: (shape === 'strip' ? size * 0.4 : size) + 'px',
        height: (shape === 'strip' ? size * 2 : size) + 'px',
        background: color,
        borderRadius: shape === 'circle' ? '50%' : shape === 'strip' ? '2px' : '1px',
        animationDuration: (Math.random() * 2 + 2) + 's',
        animationDelay: Math.random() * 0.8 + 's'
      });
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }
}
customElements.define('cc-confetti', CCConfetti);
