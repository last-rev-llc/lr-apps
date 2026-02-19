/**
 * <cc-stat-counter> — Animated number counter triggered by scroll visibility
 *
 * Attributes:
 *   value   — target number or string (e.g. "17", "1.51", "16+")
 *   label   — label text below the number
 *   suffix  — appended after animation (e.g. "+", "%")
 *   duration — animation duration in ms (default: 1500)
 *
 * CSS classes: .cc-stat-counter, .cc-stat-number, .cc-stat-label
 * Inherits card styling from parent (backgrounds, borders, etc.)
 */
class CCStatCounter extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCStatCounter._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-stat-counter {
          display: block;
          text-align: center;
          padding: 20px 12px;
        }
        .cc-stat-number {
          font-size: 2.4rem;
          font-weight: 800;
          line-height: 1;
          font-family: Georgia, serif;
          color: var(--theme-accent, var(--accent, #f59e0b));
        }
        .cc-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 6px;
          color: var(--theme-gray, var(--muted, #94a3b8));
        }
      `;
      document.head.appendChild(s);
      CCStatCounter._styles = true;
    }

    const value = this.getAttribute('value') || '0';
    const label = this.getAttribute('label') || '';
    const suffix = this.getAttribute('suffix') || '';
    const duration = parseInt(this.getAttribute('duration')) || 1500;

    this.innerHTML = `
      <div class="cc-stat-number">0</div>
      ${label ? `<div class="cc-stat-label">${label}</div>` : ''}
    `;

    const numEl = this.querySelector('.cc-stat-number');
    const numTarget = parseFloat(value);
    const isFloat = value.includes('.');
    const isNumeric = !isNaN(numTarget);

    if (!isNumeric) {
      numEl.textContent = value;
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !this._animated) {
          this._animated = true;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = numTarget * eased;
            numEl.textContent = (isFloat ? val.toFixed(2) : Math.round(val)) + (progress < 1 ? '' : suffix);
            if (progress < 1) requestAnimationFrame(tick);
            else numEl.textContent = value + suffix;
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(this);
  }
}
customElements.define('cc-stat-counter', CCStatCounter);
