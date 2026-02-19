/**
 * <cc-stagger> — Automatically staggers animation of direct children
 *
 * Attributes:
 *   delay     — base delay between children in ms (default: 100)
 *   duration  — animation duration per child in ms (default: 500)
 *   animation — animation type: fade-up, fade-down, fade-left, fade-right, scale, blur (default: fade-up)
 *   distance  — slide distance in px (default: 24)
 *   threshold — IntersectionObserver threshold (default: 0.1)
 *   once      — if "false", re-animates on scroll (default: true)
 *
 * Usage:
 *   <cc-stagger delay="80" animation="fade-up">
 *     <div>First</div>
 *     <div>Second</div>
 *     <div>Third</div>
 *   </cc-stagger>
 *
 * Children animate in sequence when the container scrolls into view.
 */
class CCStagger extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCStagger._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-stagger { display: block; }
        cc-stagger > * {
          transition-property: opacity, transform, filter;
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        cc-stagger.cc-stagger-ready > * {
          opacity: 0;
        }
        cc-stagger.cc-stagger-visible > * {
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
        }
      `;
      document.head.appendChild(s);
      CCStagger._styles = true;
    }

    const staggerDelay = parseInt(this.getAttribute('delay')) || 100;
    const duration = parseInt(this.getAttribute('duration')) || 500;
    const animation = this.getAttribute('animation') || 'fade-up';
    const distance = parseInt(this.getAttribute('distance')) || 24;
    const threshold = parseFloat(this.getAttribute('threshold')) || 0.1;
    const once = this.getAttribute('once') !== 'false';

    const transforms = {
      'fade-up': `translateY(${distance}px)`,
      'fade-down': `translateY(-${distance}px)`,
      'fade-left': `translateX(${distance}px)`,
      'fade-right': `translateX(-${distance}px)`,
      'scale': 'scale(0.85)',
      'blur': 'translateY(8px)'
    };

    const children = Array.from(this.children);
    children.forEach((child, i) => {
      child.style.transitionDuration = duration + 'ms';
      child.style.transitionDelay = (i * staggerDelay) + 'ms';
      child.style.transform = transforms[animation] || transforms['fade-up'];
      if (animation === 'blur') child.style.filter = 'blur(4px)';
    });

    this.classList.add('cc-stagger-ready');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          this.classList.add('cc-stagger-visible');
          if (once) observer.unobserve(this);
        } else if (!once) {
          this.classList.remove('cc-stagger-visible');
        }
      });
    }, { threshold });
    observer.observe(this);
  }
}
customElements.define('cc-stagger', CCStagger);
