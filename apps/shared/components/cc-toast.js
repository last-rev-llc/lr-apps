// ─── Toast ────────────────────────────────────────────────
// Styles live in theme.css (.cc-toast-container, .cc-toast-item)
class CcToast extends HTMLElement {
  connectedCallback() {
    this.classList.add('cc-toast-container');
    window.showToast = (msg, duration = 3000) => this.show(msg, duration);
    if (window._toastQueue) { window._toastQueue.forEach(([m, d]) => this.show(m, d)); delete window._toastQueue; }
  }

  show(msg, duration = 3000) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.classList.add('cc-toast-item');
    this.appendChild(t);
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => {
      t.classList.remove('visible');
      setTimeout(() => t.remove(), 200);
    }, duration);
  }
}
customElements.define('cc-toast', CcToast);
