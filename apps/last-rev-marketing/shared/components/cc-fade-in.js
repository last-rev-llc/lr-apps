/**
 * <cc-fade-in> — Scroll-triggered entrance animation wrapper
 *
 * Attributes:
 *   delay     — animation delay in ms (default: 0)
 *   duration  — animation duration in ms (default: 800)
 *   direction — slide direction: up, down, left, right, none (default: up)
 *   distance  — slide distance in px (default: 40)
 *   threshold — IntersectionObserver threshold 0-1 (default: 0.1)
 *   scale     — start scale, e.g. "0.9" (default: none)
 *   blur      — start blur in px, e.g. "8" (default: 0)
 *   rotate    — start rotation in deg, e.g. "3" (default: 0)
 *   easing    — CSS timing function (default: cubic-bezier(0.16, 1, 0.3, 1))
 *   stagger   — auto-stagger children by this many ms each (default: none)
 *
 * Examples:
 *   <cc-fade-in>                          — subtle slide up + fade
 *   <cc-fade-in distance="60" blur="6">   — dramatic slide up with blur
 *   <cc-fade-in scale="0.85" rotate="2">  — zoom + tilt entrance
 *   <cc-fade-in direction="left" distance="80"> — slide from right
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
          will-change: opacity, transform, filter;
          transition-property: opacity, transform, filter;
        }
        cc-fade-in.cc-visible {
          opacity: 1 !important;
          transform: translate(0, 0) scale(1) rotate(0deg) !important;
          filter: blur(0px) !important;
        }
      `;
      document.head.appendChild(s);
      CCFadeIn._styles = true;
    }

    const delay = parseInt(this.getAttribute('delay')) || 0;
    const duration = parseInt(this.getAttribute('duration')) || 800;
    const direction = this.getAttribute('direction') || 'up';
    const distance = parseInt(this.getAttribute('distance')) || 40;
    const threshold = parseFloat(this.getAttribute('threshold')) || 0.1;
    const scale = parseFloat(this.getAttribute('scale')) || 1;
    const blur = parseInt(this.getAttribute('blur')) || 0;
    const rotate = parseFloat(this.getAttribute('rotate')) || 0;
    const easing = this.getAttribute('easing') || 'cubic-bezier(0.16, 1, 0.3, 1)';

    const dirMap = {
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`,
      left: `translateX(${distance}px)`,
      right: `translateX(-${distance}px)`,
      none: 'translate(0, 0)'
    };

    const translate = dirMap[direction] || dirMap.up;
    this.style.transform = `${translate} scale(${scale}) rotate(${rotate}deg)`;
    this.style.filter = blur ? `blur(${blur}px)` : '';
    this.style.transitionDuration = duration + 'ms';
    this.style.transitionDelay = delay + 'ms';
    this.style.transitionTimingFunction = easing;

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
