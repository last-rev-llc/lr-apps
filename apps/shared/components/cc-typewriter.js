/**
 * <cc-typewriter> — Typewriter text effect with cursor
 *
 * Attributes:
 *   text      — text to type (or uses textContent)
 *   speed     — ms per character (default: 50)
 *   delay     — ms before starting (default: 0)
 *   cursor    — show blinking cursor: true/false (default: true)
 *   loop      — loop the animation: true/false (default: false)
 *   pause     — ms to pause before erasing in loop mode (default: 2000)
 *
 * Usage:
 *   <cc-typewriter text="Hello, world!" speed="40"></cc-typewriter>
 *   <cc-typewriter>Any text content here</cc-typewriter>
 */
class CCTypewriter extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCTypewriter._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-typewriter {
          display: inline;
        }
        .cc-tw-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: cc-tw-blink 0.7s step-end infinite;
        }
        @keyframes cc-tw-blink {
          50% { opacity: 0; }
        }
      `;
      document.head.appendChild(s);
      CCTypewriter._styles = true;
    }

    const fullText = this.getAttribute('text') || this.textContent.trim();
    const speed = parseInt(this.getAttribute('speed')) || 50;
    const delay = parseInt(this.getAttribute('delay')) || 0;
    const showCursor = this.getAttribute('cursor') !== 'false';
    const loop = this.getAttribute('loop') === 'true';
    const pause = parseInt(this.getAttribute('pause')) || 2000;

    this.innerHTML = '';
    const textSpan = document.createElement('span');
    this.appendChild(textSpan);

    if (showCursor) {
      const cursor = document.createElement('span');
      cursor.className = 'cc-tw-cursor';
      this.appendChild(cursor);
    }

    const type = () => {
      let i = 0;
      const typeInterval = setInterval(() => {
        textSpan.textContent = fullText.slice(0, ++i);
        if (i >= fullText.length) {
          clearInterval(typeInterval);
          if (loop) {
            setTimeout(() => {
              const eraseInterval = setInterval(() => {
                textSpan.textContent = fullText.slice(0, --i);
                if (i <= 0) { clearInterval(eraseInterval); setTimeout(type, 300); }
              }, speed / 2);
            }, pause);
          }
        }
      }, speed);
    };

    setTimeout(type, delay);
  }
}
customElements.define('cc-typewriter', CCTypewriter);
