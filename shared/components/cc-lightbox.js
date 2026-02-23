/**
 * <cc-lightbox> — Click-to-zoom image lightbox overlay
 *
 * Usage: Add anywhere in page (singleton). Then call:
 *   document.querySelector('cc-lightbox').open(src, alt)
 * Or use helper: CCLightbox.open(src, alt)
 *
 * Click overlay or press Escape to close.
 */
class CCLightbox extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    if (!CCLightbox._styles) {
      const s = document.createElement('style');
      s.textContent = `
        cc-lightbox {
          position: fixed; inset: 0; z-index: 10000;
          background: rgba(0,0,0,0.92);
          display: none; align-items: center; justify-content: center;
          cursor: zoom-out;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        cc-lightbox.open { display: flex; opacity: 1; }
        cc-lightbox img {
          max-width: 90vw; max-height: 90vh;
          border-radius: 8px;
          box-shadow: 0 0 60px rgba(0,0,0,0.5);
          transform: scale(0.9);
          transition: transform 0.3s ease;
        }
        cc-lightbox.open img { transform: scale(1); }
      `;
      document.head.appendChild(s);
      CCLightbox._styles = true;
    }

    this.innerHTML = '<img src="" alt="">';
    this.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    CCLightbox._instance = this;
  }

  open(src, alt) {
    const img = this.querySelector('img');
    img.src = src;
    img.alt = alt || '';
    this.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.classList.remove('open');
    document.body.style.overflow = '';
  }

  static open(src, alt) {
    if (CCLightbox._instance) CCLightbox._instance.open(src, alt);
  }
}
customElements.define('cc-lightbox', CCLightbox);
