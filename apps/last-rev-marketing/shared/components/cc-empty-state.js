// ─── Empty State — celebratory empty state with contained sparkle/confetti ───
class CcEmptyState extends HTMLElement {
  connectedCallback() {
    const message = this.getAttribute('message') || 'All clear!';
    const icon = this.getAttribute('icon') || '✨';
    const animation = this.getAttribute('animation') || 'sparkle'; // sparkle | confetti | none

    this.innerHTML = `
      <div class="cc-empty-state-container">
        <canvas class="cc-empty-state-canvas"></canvas>
        <div class="cc-empty-state-icon">${icon}</div>
        <div class="cc-empty-state-msg">${message}</div>
      </div>`;

    const style = document.createElement('style');
    style.textContent = `
      .cc-empty-state-container {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        min-height: 120px;
        text-align: center;
      }
      .cc-empty-state-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      .cc-empty-state-icon {
        font-size: 32px;
        margin-bottom: 8px;
        animation: cc-es-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .cc-empty-state-msg {
        font-size: 14px;
        color: var(--muted, #94a3b8);
        font-weight: 500;
        animation: cc-es-fade 0.6s ease both;
        animation-delay: 0.2s;
      }
      @keyframes cc-es-pop {
        0% { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes cc-es-fade {
        0% { opacity: 0; transform: translateY(6px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `;
    this.prepend(style);

    if (animation !== 'none') {
      requestAnimationFrame(() => this._animate(animation));
    }
  }

  _animate(type) {
    const canvas = this.querySelector('.cc-empty-state-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const particles = [];
    const count = type === 'confetti' ? 40 : 20;
    const colors = type === 'confetti'
      ? ['#f59e0b','#fbbf24','#10b981','#38bdf8','#f87171','#a78bfa','#fb923c']
      : ['#f59e0b','#fbbf24','rgba(255,255,255,0.6)','rgba(255,255,255,0.3)'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: type === 'confetti' ? -10 - Math.random() * 40 : Math.random() * canvas.height,
        size: type === 'confetti' ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * (type === 'confetti' ? 2 : 0.3),
        vy: type === 'confetti' ? 1 + Math.random() * 2 : -0.3 - Math.random() * 0.5,
        life: 1,
        decay: 0.008 + Math.random() * 0.008,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
      });
    }

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive++;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.rotation += p.rotSpeed;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (type === 'confetti') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive > 0) raf = requestAnimationFrame(draw);
    };
    draw();

    // cleanup after animation
    setTimeout(() => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 3000);
  }
}
customElements.define('cc-empty-state', CcEmptyState);
