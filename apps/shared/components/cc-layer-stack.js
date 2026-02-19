/**
 * <cc-layer-stack> — Vertical stack of glass bars for architecture/hierarchy diagrams
 *
 * Usage:
 *   <cc-layer-stack>
 *     <cc-layer label="Web Apps (44)" detail="*.adam-harris.alphaclaw.app"></cc-layer>
 *     <cc-layer label="Shared Components" detail="40 web components"></cc-layer>
 *     <cc-layer label="Database" detail="Supabase · PostgreSQL"></cc-layer>
 *   </cc-layer-stack>
 *
 * Attributes (cc-layer-stack):
 *   max-width — max width of the stack (default "700px")
 *   gap       — gap between layers (default "4px")
 *   animated  — if present, layers fade in sequentially on scroll
 *
 * Attributes (cc-layer):
 *   label   — left-side text
 *   detail  — right-side muted text
 *   icon    — optional emoji/icon before label
 *   href    — optional link (makes layer clickable)
 *   accent  — optional accent color override
 */
(function () {
  const STACK_TAG = 'cc-layer-stack';
  const LAYER_TAG = 'cc-layer';
  if (customElements.get(STACK_TAG)) return;

  class CcLayerStack extends HTMLElement {
    connectedCallback() { this._render(); }

    _render() {
      const maxW = this.getAttribute('max-width') || '700px';
      const gap = this.getAttribute('gap') || '4px';
      const animated = this.hasAttribute('animated');

      this.style.display = 'block';
      this.style.width = '100%';
      this.style.maxWidth = maxW;

      // Style children
      const layers = this.querySelectorAll(LAYER_TAG);
      layers.forEach((layer, i) => {
        if (animated) {
          layer.style.opacity = '0';
          layer.style.transform = 'translateY(10px)';
          layer.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`;
        }
      });

      if (animated) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              layers.forEach(l => { l.style.opacity = '1'; l.style.transform = 'translateY(0)'; });
              obs.disconnect();
            }
          });
        }, { threshold: 0.2 });
        obs.observe(this);
      }

      if (!CcLayerStack._styles) {
        const s = document.createElement('style');
        s.textContent = `
          cc-layer-stack {
            display: block;
          }
          cc-layer-stack cc-layer {
            margin: ${gap} 0;
          }
        `;
        document.head.appendChild(s);
        CcLayerStack._styles = true;
      }
    }
  }

  class CcLayer extends HTMLElement {
    static get observedAttributes() { return ['label', 'detail', 'icon', 'href', 'accent']; }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const label = this.getAttribute('label') || '';
      const detail = this.getAttribute('detail') || '';
      const icon = this.getAttribute('icon') || '';
      const href = this.getAttribute('href');
      const accent = this.getAttribute('accent');

      const tag = href ? 'a' : 'div';
      const linkAttrs = href ? `href="${href}" target="_blank" style="text-decoration:none;color:inherit"` : '';

      this.innerHTML = `
        <${tag} class="cc-layer__inner" ${linkAttrs}>
          <span class="cc-layer__label">${icon ? `<span class="cc-layer__icon">${icon}</span> ` : ''}${label}</span>
          ${detail ? `<span class="cc-layer__detail">${detail}</span>` : ''}
        </${tag}>
      `;

      if (accent) {
        this.querySelector('.cc-layer__inner').style.borderLeftColor = accent;
      }

      if (!CcLayer._styles) {
        const s = document.createElement('style');
        s.textContent = `
          cc-layer {
            display: block;
          }
          .cc-layer__inner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--glass, rgba(255,255,255,0.05));
            border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            border-left: 3px solid var(--accent, #f59e0b);
            padding: 14px 24px;
            border-radius: 10px;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transition: transform 0.2s ease, border-color 0.2s ease;
          }
          .cc-layer__inner:hover {
            transform: translateX(4px);
            border-color: var(--accent, #f59e0b);
          }
          .cc-layer__label {
            color: var(--text, #e2e8f0);
            font-size: 1rem;
            font-weight: 500;
          }
          .cc-layer__icon {
            margin-right: 4px;
          }
          .cc-layer__detail {
            color: var(--muted, #94a3b8);
            font-size: 0.85rem;
          }
          @media (max-width: 600px) {
            .cc-layer__inner {
              flex-direction: column;
              align-items: flex-start;
              gap: 4px;
              padding: 12px 16px;
            }
          }
        `;
        document.head.appendChild(s);
        CcLayer._styles = true;
      }
    }
  }

  customElements.define(STACK_TAG, CcLayerStack);
  customElements.define(LAYER_TAG, CcLayer);
})();
