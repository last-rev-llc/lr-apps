/**
 * <cc-slide-in> — Scroll-triggered slide animation (no fade, pure motion)
 *
 * Attributes:
 *   from      — slide origin: left, right, top, bottom (default: left)
 *   distance  — slide distance in px (default: 60)
 *   duration  — animation duration in ms (default: 600)
 *   delay     — animation delay in ms (default: 0)
 *   easing    — CSS easing function (default: cubic-bezier(0.16, 1, 0.3, 1))
 *   threshold — IntersectionObserver threshold 0-1 (default: 0.1)
 *   once      — if "false", re-animates on each scroll-in (default: true)
 *
 * Works great for cards, images, panels sliding in from edges.
 */
class CCSlideIn extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCSlideIn._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-slide-in {
          display: block;
          will-change: transform;
          transition-property: transform;
        }
        cc-slide-in.cc-slid {
          transform: translate(0, 0) !important;
        }
      `;
      document.head.appendChild(s);
      CCSlideIn._styles = true;
    }

    const from = this.getAttribute('from') || 'left';
    const distance = parseInt(this.getAttribute('distance')) || 60;
    const duration = parseInt(this.getAttribute('duration')) || 600;
    const delay = parseInt(this.getAttribute('delay')) || 0;
    const easing = this.getAttribute('easing') || 'cubic-bezier(0.16, 1, 0.3, 1)';
    const threshold = parseFloat(this.getAttribute('threshold')) || 0.1;
    const once = this.getAttribute('once') !== 'false';

    const origins = {
      left: `translateX(-${distance}px)`,
      right: `translateX(${distance}px)`,
      top: `translateY(-${distance}px)`,
      bottom: `translateY(${distance}px)`
    };

    this.style.transform = origins[from] || origins.left;
    this.style.transitionDuration = duration + 'ms';
    this.style.transitionDelay = delay + 'ms';
    this.style.transitionTimingFunction = easing;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          this.classList.add('cc-slid');
          if (once) observer.unobserve(this);
        } else if (!once) {
          this.classList.remove('cc-slid');
        }
      });
    }, { threshold });
    observer.observe(this);
  }
}
customElements.define('cc-slide-in', CCSlideIn);
