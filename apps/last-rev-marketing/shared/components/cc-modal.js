/* <cc-modal> — Shared modal/overlay component
   Attributes: title, size (sm|md|lg), open (boolean)
   API: open(), close(), toggle()
   Events: dispatches 'modal-close' on close
   Slots: default slot for body content, [slot="footer"] for action buttons
*/
(function() {
  class CCModal extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.classList.add('cc-modal-overlay');
      this._render();
      this.addEventListener('click', (e) => {
        if (e.target === this) this.close();
      });
      document.addEventListener('keydown', this._escHandler = (e) => {
        if (e.key === 'Escape' && this.classList.contains('visible')) this.close();
      });
    }

    disconnectedCallback() {
      if (this._escHandler) document.removeEventListener('keydown', this._escHandler);
    }

    static get observedAttributes() { return ['title', 'size', 'open']; }
    attributeChangedCallback(name) {
      if (name === 'open') {
        this.hasAttribute('open') ? this.open() : this.close();
      } else if (this.isConnected) {
        this._updateHeader();
      }
    }

    _render() {
      const title = this.getAttribute('title') || '';
      const size = this.getAttribute('size') || 'md';
      const sizeClass = { sm: 'cc-modal-sm', md: 'cc-modal-md', lg: 'cc-modal-lg' }[size] || 'cc-modal-md';

      // Preserve existing children (slot content)
      const existingBody = this.querySelector('.cc-modal-body');
      const existingFooter = this.querySelector('[slot="footer"]');
      const bodyContent = existingBody ? existingBody.innerHTML : '';
      const footerContent = existingFooter ? existingFooter.outerHTML : '';

      // Only render wrapper if not already rendered
      if (!this.querySelector('.cc-modal-panel')) {
        const children = Array.from(this.childNodes).map(n => n.cloneNode(true));
        this.innerHTML = '';

        const panel = document.createElement('div');
        panel.className = `cc-modal-panel ${sizeClass}`;

        const header = document.createElement('div');
        header.className = 'cc-modal-header';
        header.innerHTML = `<h2>${title}</h2><button class="cc-modal-close" onclick="this.closest('cc-modal').close()">✕</button>`;
        panel.appendChild(header);

        const body = document.createElement('div');
        body.className = 'cc-modal-body';

        // Move non-footer children into body, footer stays separate
        const footer = document.createElement('div');
        footer.className = 'cc-modal-footer';
        let hasFooter = false;

        children.forEach(child => {
          if (child.getAttribute && child.getAttribute('slot') === 'footer') {
            footer.appendChild(child);
            hasFooter = true;
          } else {
            body.appendChild(child);
          }
        });

        panel.appendChild(body);
        if (hasFooter) panel.appendChild(footer);
        this.appendChild(panel);
      }

      if (this.hasAttribute('open')) this.classList.add('visible');
    }

    _updateHeader() {
      const h2 = this.querySelector('.cc-modal-header h2');
      if (h2) h2.textContent = this.getAttribute('title') || '';
    }

    open() {
      this.classList.add('visible');
      this.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
      const firstInput = this.querySelector('input, textarea, select');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }

    close() {
      this.classList.remove('visible');
      this.removeAttribute('open');
      document.body.style.overflow = '';
      this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true }));
    }

    toggle() {
      this.classList.contains('visible') ? this.close() : this.open();
    }
  }

  customElements.define('cc-modal', CCModal);
})();
