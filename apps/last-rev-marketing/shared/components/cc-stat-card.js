/**
 * <cc-stat-card> — Glass stat card with large number + label
 *
 * Attributes:
 *   value  — the big number/text to display (e.g. "44", "~2 min", "12+")
 *   label  — description text below the number
 *   icon   — optional emoji/icon before the value
 *   href   — optional link (makes card clickable)
 *   size   — "sm" | "md" | "lg" (default "md")
 *
 * Features:
 *   - Auto-varying accent colors when multiple cards are siblings
 *   - Numeric values animate with count-up effect
 *   - Non-numeric values animate with typewriter effect
 *   - Animations trigger when card is 20% from viewport bottom
 *
 * Slots:
 *   (default) — override the entire card body
 *
 * Container usage:
 *   Wrap multiple <cc-stat-card> in a parent with display:grid for auto-layout:
 *   <div class="cc-stat-grid"> ... </div>
 *
 * CSS custom properties:
 *   --stat-card-bg, --stat-card-border, --stat-card-radius, --stat-card-padding
 */
(function () {
  const TAG = 'cc-stat-card';
  if (customElements.get(TAG)) return;

  // Color palette for varying cards
  const ACCENT_PALETTES = [
    { grad: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.3)' },
    { grad: 'linear-gradient(135deg, #a855f7, #7c3aed)', glow: 'rgba(168,85,247,.15)', border: 'rgba(168,85,247,.3)' },
    { grad: 'linear-gradient(135deg, #3b82f6, #6366f1)', glow: 'rgba(59,130,246,.15)', border: 'rgba(59,130,246,.3)' },
    { grad: 'linear-gradient(135deg, #22c55e, #10b981)', glow: 'rgba(34,197,94,.15)', border: 'rgba(34,197,94,.3)' },
    { grad: 'linear-gradient(135deg, #ec4899, #f43f5e)', glow: 'rgba(236,72,153,.15)', border: 'rgba(236,72,153,.3)' },
    { grad: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', glow: 'rgba(6,182,212,.15)', border: 'rgba(6,182,212,.3)' },
    { grad: 'linear-gradient(135deg, #f97316, #ef4444)', glow: 'rgba(249,115,22,.15)', border: 'rgba(249,115,22,.3)' },
    { grad: 'linear-gradient(135deg, #8b5cf6, #a855f7)', glow: 'rgba(139,92,246,.15)', border: 'rgba(139,92,246,.3)' },
  ];

  class CcStatCard extends HTMLElement {
    static get observedAttributes() { return ['value', 'label', 'icon', 'href', 'size']; }

    connectedCallback() {
      this._animated = false;
      this._render();
      this._setupObserver();
    }

    disconnectedCallback() {
      if (this._observer) this._observer.disconnect();
    }

    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _getSiblingIndex() {
      const parent = this.parentElement;
      if (!parent) return 0;
      const siblings = [...parent.querySelectorAll('cc-stat-card')];
      return siblings.indexOf(this);
    }

    _getPalette() {
      const idx = this._getSiblingIndex();
      return ACCENT_PALETTES[idx % ACCENT_PALETTES.length];
    }

    _parseValue(val) {
      // Extract numeric part: "44" → 44, "8+" → 8, "~2 min" → 2, "50%+" → 50, "F500" → null
      const match = val.match(/^[~]?(\d+(?:\.\d+)?)/);
      if (match) {
        return {
          isNumeric: true,
          number: parseFloat(match[1]),
          prefix: val.slice(0, val.indexOf(match[1])),
          suffix: val.slice(val.indexOf(match[1]) + match[1].length),
          raw: val
        };
      }
      return { isNumeric: false, raw: val };
    }

    _render() {
      const value = this.getAttribute('value') || '';
      const label = this.getAttribute('label') || '';
      const icon = this.getAttribute('icon') || '';
      const href = this.getAttribute('href');
      const size = this.getAttribute('size') || 'md';
      const palette = this._getPalette();

      const sizes = { sm: { num: '1.8rem', pad: '16px', label: '0.8rem' }, md: { num: '2.4rem', pad: '24px', label: '0.95rem' }, lg: { num: '3.2rem', pad: '32px', label: '1.05rem' } };
      const s = sizes[size] || sizes.md;

      // Apply color variation via inline custom properties
      this.style.setProperty('--card-accent-grad', palette.grad);
      this.style.setProperty('--card-accent-glow', palette.glow);
      this.style.setProperty('--card-accent-border', palette.border);

      this.innerHTML = `
        <div class="cc-stat-card__inner" ${href ? `onclick="window.open('${href}','_blank')" style="cursor:pointer"` : ''}>
          <div class="cc-stat-card__value" data-value="${this._esc(value)}">${icon ? `<span class="cc-stat-card__icon">${icon}</span> ` : ''}<span class="cc-stat-card__num">&nbsp;</span></div>
          ${label ? `<div class="cc-stat-card__label">${label}</div>` : ''}
        </div>
      `;

      if (!CcStatCard._styles) {
        const style = document.createElement('style');
        style.textContent = `
          cc-stat-card {
            display: block;
            height: 100%;
          }
          .cc-stat-card__inner {
            background: var(--stat-card-bg, var(--card-accent-glow, var(--glass, rgba(255,255,255,0.05))));
            border: 1px solid var(--stat-card-border, var(--card-accent-border, var(--glass-border, rgba(255,255,255,0.1))));
            border-radius: var(--stat-card-radius, 16px);
            padding: var(--stat-card-padding, 24px);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            text-align: center;
            transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 120px;
          }
          .cc-stat-card__inner:hover {
            transform: translateY(-3px);
            border-color: var(--card-accent-border, var(--accent, #f59e0b));
            box-shadow: 0 8px 30px var(--card-accent-glow, rgba(245,158,11,.2));
          }
          .cc-stat-card__value {
            font-size: var(--stat-value-size, 2.4rem);
            font-weight: 800;
            line-height: 1.2;
            background: var(--card-accent-grad, var(--accent-grad, linear-gradient(135deg, #f59e0b, #f97316)));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            min-height: 1.3em;
            overflow: hidden;
            word-break: break-word;
          }
          cc-stat-card[size="sm"] .cc-stat-card__value { font-size: var(--stat-value-size, 1.8rem); }
          cc-stat-card[size="lg"] .cc-stat-card__value { font-size: var(--stat-value-size, 3.2rem); }
          .cc-stat-card__icon {
            -webkit-text-fill-color: initial;
          }
          .cc-stat-card__label {
            color: var(--muted, #94a3b8);
            font-size: 0.95rem;
            margin-top: 4px;
          }
          cc-stat-card[size="sm"] .cc-stat-card__label { font-size: 0.8rem; }
          cc-stat-card[size="lg"] .cc-stat-card__label { font-size: 1.05rem; }
          .cc-stat-card__num {
            display: inline;
          }

          /* Typewriter cursor blink */
          .cc-stat-card__num.typing::after {
            content: '|';
            -webkit-text-fill-color: currentColor;
            animation: cc-stat-blink .6s step-end infinite;
          }
          @keyframes cc-stat-blink { 0%,100%{opacity:1} 50%{opacity:0} }

          /* Grid helper */
          .cc-stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            width: 100%;
            align-items: stretch;
          }
          @media (max-width: 600px) {
            .cc-stat-grid {
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 12px;
            }
          }

          /* Auto equal-height for any flex/grid container with stat cards */
          .stat-card-container,
          .stats-container,
          [class*="stat"]:is(div, section) {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            align-items: stretch;
          }
          .stat-card-container > cc-stat-card,
          .stats-container > cc-stat-card,
          [class*="stat"]:is(div, section) > cc-stat-card {
            flex: 1;
            min-width: 180px;
          }
        `;
        document.head.appendChild(style);
        CcStatCard._styles = true;
      }
    }

    _setupObserver() {
      // Trigger animation when card is 20% from viewport bottom
      this._observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && !this._animated) {
            this._animated = true;
            this._animate();
            this._observer.disconnect();
          }
        });
      }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });
      this._observer.observe(this);
    }

    _animate() {
      const value = this.getAttribute('value') || '';
      const parsed = this._parseValue(value);
      const numEl = this.querySelector('.cc-stat-card__num');
      if (!numEl) return;

      if (parsed.isNumeric) {
        this._countUp(numEl, parsed);
      } else {
        this._typeWriter(numEl, value);
      }
    }

    _countUp(el, parsed) {
      const duration = 1200;
      const start = performance.now();
      const target = parsed.number;
      const isFloat = String(target).includes('.');
      const decimals = isFloat ? (String(target).split('.')[1] || '').length : 0;

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        const display = isFloat ? current.toFixed(decimals) : Math.round(current);
        el.textContent = `${parsed.prefix}${display}${parsed.suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
        else this._fitText();
      };
      requestAnimationFrame(tick);
    }

    _typeWriter(el, text) {
      el.classList.add('typing');
      el.textContent = '';
      let i = 0;
      const speed = 80;
      const type = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          // Remove cursor after done
          setTimeout(() => { el.classList.remove('typing'); this._fitText(); }, 600);
        }
      };
      type();
    }

    _fitText() {
      const valueEl = this.querySelector('.cc-stat-card__value');
      const inner = this.querySelector('.cc-stat-card__inner');
      if (!valueEl || !inner) return;

      // Reset to max size first
      valueEl.style.fontSize = '';

      // Get the max font size from computed style
      const maxSize = parseFloat(getComputedStyle(valueEl).fontSize);
      let size = maxSize;
      const minSize = 12;

      // Shrink until it fits both horizontally and vertically
      // Check horizontal: scrollWidth > clientWidth
      // Check vertical: scrollHeight > a reasonable max (2 lines worth)
      const maxHeight = maxSize * 1.2 * 2; // 2 lines at line-height 1.2

      while (size > minSize) {
        const overflowH = valueEl.scrollWidth > valueEl.clientWidth + 2;
        const overflowV = valueEl.scrollHeight > maxHeight + 2;
        if (!overflowH && !overflowV) break;
        size -= 1;
        valueEl.style.fontSize = size + 'px';
      }
    }

    _esc(s) {
      return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }
  }

  customElements.define(TAG, CcStatCard);
})();
