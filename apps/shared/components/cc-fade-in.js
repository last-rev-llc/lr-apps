/**
 * <cc-fade-in> — Scroll-triggered fade-in + slide-up animation wrapper
 *
 * Attributes:
 *   delay     — animation delay in ms (default: 0)
 *   duration  — animation duration in ms (default: 700)
 *   direction — slide direction: up, down, left, right (default: up)
 *   distance  — slide distance in px (default: 30)
 *   threshold — IntersectionObserver threshold 0-1 (default: 0.15)
 *
 * Wraps any content. Animates when scrolled into view.
 */
class CCFadeIn extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCFadeIn._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-fade-in {
          display: block;
          opacity: 0;
          transition-property: opacity, transform;
          transition-timing-function: ease;
        }
        cc-fade-in.cc-visible {
          opacity: 1 !important;
          transform: translate(0, 0) !important;
        }
      `;
      document.head.appendChild(s);
      CCFadeIn._styles = true;
    }

    const delay = parseInt(this.getAttribute('delay')) || 0;
    const duration = parseInt(this.getAttribute('duration')) || 700;
    const direction = this.getAttribute('direction') || 'up';
    const distance = parseInt(this.getAttribute('distance')) || 30;
    const threshold = parseFloat(this.getAttribute('threshold')) || 0.15;

    const transforms = {
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`,
      left: `translateX(${distance}px)`,
      right: `translateX(-${distance}px)`
    };

    this.style.transform = transforms[direction] || transforms.up;
    this.style.transitionDuration = duration + 'ms';
    this.style.transitionDelay = delay + 'ms';

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          this.classList.add('cc-visible');
          observer.unobserve(this);
        }
      });
    }, { threshold });
    observer.observe(this);
  }
}
customElements.define('cc-fade-in', CCFadeIn);
