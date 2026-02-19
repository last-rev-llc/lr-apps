/**
 * <cc-particles> — Floating particle canvas with connecting lines
 * 
 * Attributes:
 *   count     — number of particles (default: 50)
 *   color1    — primary particle color as r,g,b (default: "253,187,48")
 *   color2    — secondary particle color as r,g,b (default: "0,122,86")
 *   line-color — connection line color as r,g,b (default: "0,122,86")
 *   speed     — particle speed multiplier (default: 1)
 */
class CCParticles extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this.className = 'cc-particles';
    const canvas = document.createElement('canvas');
    this.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const count = parseInt(this.getAttribute('count')) || 50;
    const color1 = this.getAttribute('color1') || '253,187,48';
    const color2 = this.getAttribute('color2') || '0,122,86';
    const lineColor = this.getAttribute('line-color') || '0,122,86';
    const speed = parseFloat(this.getAttribute('speed')) || 1;

    let particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3 * speed,
        vy: (Math.random() - 0.5) * 0.3 * speed,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        color: Math.random() > 0.5 ? color1 : color2
      });
    }

    const animate = () => {
      if (!this.isConnected) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${lineColor},${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };
    animate();
  }
}
customElements.define('cc-particles', CCParticles);
