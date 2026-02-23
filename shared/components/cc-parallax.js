/**
 * <cc-parallax> — Full-height parallax section with optional background image/gradient
 *
 * Attributes:
 *   bg-image  — background image URL
 *   bg-color  — background color/gradient fallback
 *   speed     — parallax speed factor (default: 0.3, 0 = no parallax)
 *   height    — section height (default: "100vh")
 *   overlay   — overlay color (default: "rgba(0,0,0,0.5)")
 *   align     — content vertical alignment: top, center, bottom (default: center)
 *
 * Slot: default slot for content
 *
 * CSS classes: .cc-parallax, .cc-parallax-bg, .cc-parallax-content
 */
class CCParallax extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCParallax._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-parallax {
          display: block;
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        .cc-parallax-bg {
          position: absolute;
          inset: -20% 0;
          background-size: cover;
          background-position: center;
          will-change: transform;
          z-index: 0;
        }
        .cc-parallax-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .cc-parallax-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          padding: 48px 32px;
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }
        .cc-parallax-content[data-align="top"] { justify-content: flex-start; }
        .cc-parallax-content[data-align="center"] { justify-content: center; }
        .cc-parallax-content[data-align="bottom"] { justify-content: flex-end; }
      `;
      document.head.appendChild(s);
      CCParallax._styles = true;
    }

    const bgImage = this.getAttribute('bg-image') || '';
    const bgColor = this.getAttribute('bg-color') || '';
    const speed = parseFloat(this.getAttribute('speed') ?? 0.3);
    const height = this.getAttribute('height') || '100vh';
    const overlay = this.getAttribute('overlay') || 'rgba(0,0,0,0.5)';
    const align = this.getAttribute('align') || 'center';

    this.style.height = height;
    this.style.minHeight = height;

    // Move slotted content
    const content = this.innerHTML;
    this.innerHTML = `
      <div class="cc-parallax-bg"></div>
      <div class="cc-parallax-overlay"></div>
      <div class="cc-parallax-content" data-align="${align}" style="min-height:${height}">${content}</div>
    `;

    const bg = this.querySelector('.cc-parallax-bg');
    const ov = this.querySelector('.cc-parallax-overlay');

    if (bgImage) bg.style.backgroundImage = `url(${bgImage})`;
    if (bgColor) bg.style.background = bgColor;
    ov.style.background = overlay;

    if (speed > 0) {
      const onScroll = () => {
        const rect = this.getBoundingClientRect();
        const scrolled = -rect.top * speed;
        bg.style.transform = `translate3d(0, ${scrolled}px, 0)`;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }
}
customElements.define('cc-parallax', CCParallax);
