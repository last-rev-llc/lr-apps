/**
 * <cc-reveal> — Clip-path reveal animation on scroll
 *
 * Attributes:
 *   direction — reveal direction: left, right, top, bottom, center (default: bottom)
 *   duration  — animation duration in ms (default: 800)
 *   delay     — animation delay in ms (default: 0)
 *   easing    — CSS easing (default: cubic-bezier(0.65, 0, 0.35, 1))
 *   threshold — IntersectionObserver threshold (default: 0.15)
 *
 * Uses clip-path for a clean wipe/reveal effect. Works on any content.
 *
 * Usage:
 *   <cc-reveal direction="left">
 *     <img src="photo.jpg" alt="...">
 *   </cc-reveal>
 */
class CCReveal extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCReveal._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-reveal {
          display: block;
          transition-property: clip-path;
        }
        cc-reveal.cc-revealed {
          clip-path: inset(0 0 0 0) !important;
        }
      `;
      document.head.appendChild(s);
      CCReveal._styles = true;
    }

    const direction = this.getAttribute('direction') || 'bottom';
    const duration = parseInt(this.getAttribute('duration')) || 800;
    const delay = parseInt(this.getAttribute('delay')) || 0;
    const easing = this.getAttribute('easing') || 'cubic-bezier(0.65, 0, 0.35, 1)';
    const threshold = parseFloat(this.getAttribute('threshold')) || 0.15;

    // Clip-path starting states (hidden)
    const clips = {
      left: 'inset(0 100% 0 0)',
      right: 'inset(0 0 0 100%)',
      top: 'inset(0 0 100% 0)',
      bottom: 'inset(100% 0 0 0)',
      center: 'inset(50% 50% 50% 50%)'
    };

    this.style.clipPath = clips[direction] || clips.bottom;
    this.style.transitionDuration = duration + 'ms';
    this.style.transitionDelay = delay + 'ms';
    this.style.transitionTimingFunction = easing;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          this.classList.add('cc-revealed');
          observer.unobserve(this);
        }
      });
    }, { threshold });
    observer.observe(this);
  }
}
customElements.define('cc-reveal', CCReveal);
