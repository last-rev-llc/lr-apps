/**
 * <cc-slide-deck> — Full-screen presentation / slide deck component
 *
 * Usage:
 *   <cc-slide-deck>
 *     <cc-slide>Slide 1 content</cc-slide>
 *     <cc-slide>Slide 2 content</cc-slide>
 *   </cc-slide-deck>
 *
 * Attributes (cc-slide-deck):
 *   progress     — show progress bar (default: true, set "false" to hide)
 *   counter      — show slide counter (default: true)
 *   nav-hint     — show navigation hint text (default: true)
 *   transition   — "slide" | "fade" | "zoom" (default: "slide")
 *   auto-play    — auto-advance interval in ms (0 = off, default 0)
 *   loop         — loop back to first slide at end (default: false)
 *   full-screen  — take full viewport (default: true)
 *
 * Attributes (cc-slide):
 *   bg       — optional background color/gradient
 *   class    — custom classes
 *
 * Events:
 *   slide-change — detail: { index, total, slide }
 *
 * API:
 *   deck.goto(n)   — go to slide n (0-indexed)
 *   deck.next()    — next slide
 *   deck.prev()    — previous slide
 *   deck.current   — current slide index
 *   deck.total     — total slides
 */
(function () {
  const DECK_TAG = 'cc-slide-deck';
  const SLIDE_TAG = 'cc-slide';
  if (customElements.get(DECK_TAG)) return;

  class CcSlideDeck extends HTMLElement {
    constructor() {
      super();
      this._current = 0;
      this._touchX = 0;
    }

    get current() { return this._current; }
    get total() { return this.querySelectorAll(SLIDE_TAG).length; }

    connectedCallback() {
      this._build();
      this._bindKeys();
      this._bindTouch();
      this._bindClick();
      this._setupAutoPlay();
      this.goto(0);
    }

    disconnectedCallback() {
      if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
      if (this._autoTimer) clearInterval(this._autoTimer);
    }

    _build() {
      const showProgress = this.getAttribute('progress') !== 'false';
      const showCounter = this.getAttribute('counter') !== 'false';
      const showHint = this.getAttribute('nav-hint') !== 'false';
      const fullScreen = this.getAttribute('full-screen') !== 'false';

      if (fullScreen) {
        this.style.cssText = 'display:block;width:100vw;height:100vh;position:relative;overflow:hidden;';
      } else {
        this.style.cssText = 'display:block;width:100%;height:100%;position:relative;overflow:hidden;';
      }

      // Wrap existing slides
      const slides = [...this.querySelectorAll(SLIDE_TAG)];

      if (showProgress) {
        const bar = document.createElement('div');
        bar.className = 'cc-deck-progress';
        this.prepend(bar);
        this._progressBar = bar;
      }

      if (showCounter) {
        const ctr = document.createElement('div');
        ctr.className = 'cc-deck-counter';
        this.appendChild(ctr);
        this._counter = ctr;
      }

      if (showHint) {
        const hint = document.createElement('div');
        hint.className = 'cc-deck-hint';
        hint.textContent = '← → or click to navigate';
        this.appendChild(hint);
      }

      if (!CcSlideDeck._styles) {
        const s = document.createElement('style');
        s.textContent = `
          cc-slide {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            padding: 60px 80px;
            opacity: 0; pointer-events: none;
            transition: opacity 0.5s ease, transform 0.5s ease;
            text-align: center;
            overflow-y: auto;
          }
          cc-slide.cc-slide-active {
            opacity: 1; pointer-events: auto;
          }

          /* Slide transition */
          cc-slide-deck[transition="slide"] cc-slide { transform: translateX(40px); }
          cc-slide-deck[transition="slide"] cc-slide.cc-slide-active { transform: translateX(0); }
          cc-slide-deck[transition="slide"] cc-slide.cc-slide-exit { transform: translateX(-40px); }

          /* Fade transition */
          cc-slide-deck[transition="fade"] cc-slide { transform: none; }
          cc-slide-deck[transition="fade"] cc-slide.cc-slide-exit { transform: none; }

          /* Zoom transition */
          cc-slide-deck[transition="zoom"] cc-slide { transform: scale(0.9); }
          cc-slide-deck[transition="zoom"] cc-slide.cc-slide-active { transform: scale(1); }
          cc-slide-deck[transition="zoom"] cc-slide.cc-slide-exit { transform: scale(1.1); opacity: 0; }

          /* Default to slide transition */
          cc-slide-deck:not([transition]) cc-slide { transform: translateX(40px); }
          cc-slide-deck:not([transition]) cc-slide.cc-slide-active { transform: translateX(0); }
          cc-slide-deck:not([transition]) cc-slide.cc-slide-exit { transform: translateX(-40px); }

          /* Slide typography defaults */
          cc-slide h1 { font-size: 3rem; margin-bottom: 16px; background: var(--accent-grad, linear-gradient(135deg, #f59e0b, #f97316)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          cc-slide h2 { font-size: 2rem; margin-bottom: 20px; color: var(--accent, #f59e0b); }
          cc-slide h3 { font-size: 1.4rem; margin: 16px 0 8px; color: var(--accent2, #3b82f6); }
          cc-slide p, cc-slide li { font-size: 1.1rem; line-height: 1.7; color: var(--muted, #94a3b8); max-width: 900px; }
          cc-slide ul { list-style: none; padding: 0; text-align: left; max-width: 900px; width: 100%; }
          cc-slide ul:not(.cc-no-arrows) li::before { content: "→ "; color: var(--accent, #f59e0b); font-weight: bold; }
          cc-slide table { border-collapse: collapse; margin-top: 16px; width: 100%; max-width: 900px; text-align: left; }
          cc-slide th { color: var(--accent, #f59e0b); border-bottom: 1px solid var(--border, rgba(255,255,255,0.1)); padding: 8px 12px; font-size: 0.9rem; }
          cc-slide td { padding: 8px 12px; color: var(--muted, #94a3b8); font-size: 0.95rem; border-bottom: 1px solid rgba(255,255,255,0.05); }

          /* Two-column layout helper */
          cc-slide .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; text-align: left; width: 100%; max-width: 900px; margin-top: 16px; }
          @media (max-width: 700px) {
            cc-slide { padding: 40px 24px; }
            cc-slide h1 { font-size: 2rem; }
            cc-slide h2 { font-size: 1.5rem; }
            cc-slide .cols { grid-template-columns: 1fr; }
          }

          .cc-deck-progress {
            position: fixed; top: 0; left: 0; height: 3px;
            background: var(--accent-grad, linear-gradient(135deg, #f59e0b, #f97316));
            z-index: 200; transition: width 0.4s ease;
          }
          .cc-deck-counter {
            position: fixed; bottom: 20px; right: 30px;
            color: var(--muted, #94a3b8); font-size: 0.85rem; z-index: 100;
            background: var(--glass, rgba(255,255,255,0.05));
            padding: 6px 14px; border-radius: 20px;
            border: 1px solid var(--glass-border, rgba(255,255,255,0.1));
            backdrop-filter: blur(8px);
          }
          .cc-deck-hint {
            position: fixed; bottom: 20px; left: 30px;
            color: rgba(255,255,255,0.3); font-size: 0.75rem; z-index: 100;
          }
        `;
        document.head.appendChild(s);
        CcSlideDeck._styles = true;
      }
    }

    goto(n) {
      const slides = this.querySelectorAll(SLIDE_TAG);
      const total = slides.length;
      if (total === 0) return;

      const loop = this.hasAttribute('loop');
      if (n < 0) n = loop ? total - 1 : 0;
      if (n >= total) n = loop ? 0 : total - 1;
      if (n === this._current && slides[n].classList.contains('cc-slide-active')) return;

      const prev = slides[this._current];
      if (prev) {
        prev.classList.remove('cc-slide-active');
        prev.classList.add('cc-slide-exit');
        setTimeout(() => prev.classList.remove('cc-slide-exit'), 500);
      }

      this._current = n;
      slides[n].classList.add('cc-slide-active');

      if (this._progressBar) {
        this._progressBar.style.width = `${((n + 1) / total) * 100}%`;
      }
      if (this._counter) {
        this._counter.textContent = `${n + 1} / ${total}`;
      }

      this.dispatchEvent(new CustomEvent('slide-change', {
        detail: { index: n, total, slide: slides[n] }
      }));
    }

    next() { this.goto(this._current + 1); }
    prev() { this.goto(this._current - 1); }

    _bindKeys() {
      this._keyHandler = (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); this.next(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
        if (e.key === 'Home') this.goto(0);
        if (e.key === 'End') this.goto(this.total - 1);
      };
      document.addEventListener('keydown', this._keyHandler);
    }

    _bindTouch() {
      this.addEventListener('touchstart', e => { this._touchX = e.touches[0].clientX; });
      this.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - this._touchX;
        if (Math.abs(dx) > 50) dx > 0 ? this.prev() : this.next();
      });
    }

    _bindClick() {
      this.addEventListener('click', e => {
        // Don't navigate if clicking interactive elements
        if (e.target.closest('a, button, input, select, textarea')) return;
        if (e.clientX > window.innerWidth / 2) this.next();
        else this.prev();
      });
    }

    _setupAutoPlay() {
      const interval = parseInt(this.getAttribute('auto-play'));
      if (interval > 0) {
        this._autoTimer = setInterval(() => this.next(), interval);
      }
    }
  }

  // cc-slide is just a semantic container
  class CcSlide extends HTMLElement {
    connectedCallback() {
      const bg = this.getAttribute('bg');
      if (bg) this.style.background = bg;
    }
  }

  customElements.define(DECK_TAG, CcSlideDeck);
  customElements.define(SLIDE_TAG, CcSlide);
})();
