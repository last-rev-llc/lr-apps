(function () {
  const TAG = 'cc-contact-form';
  if (customElements.get(TAG)) return;

  const _esc = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  class CcContactForm extends HTMLElement {
    static get observedAttributes() { return ['title', 'description', 'email', 'no-header']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const title = this.getAttribute('title') || "Let's Build Something Together";
      const desc = this.getAttribute('description') || 'Tell us about your project and we\'ll get back to you within 24 hours.';
      const email = this.getAttribute('email') || 'hello@lastrev.com';
      const noHeader = this.hasAttribute('no-header');

      this.innerHTML = `
        <div class="ccf">
          ${noHeader ? '' : `<div class="ccf__header">
            <h3 class="ccf__title">${_esc(title)}</h3>
            <p class="ccf__desc">${_esc(desc)}</p>
          </div>`}
          <form class="ccf__form" data-email="${_esc(email)}">
            <div class="ccf__row">
              <div class="ccf__field">
                <label class="ccf__label" for="ccf-name">Name</label>
                <input class="ccf__input" type="text" id="ccf-name" name="name" placeholder="Your name" required>
              </div>
              <div class="ccf__field">
                <label class="ccf__label" for="ccf-email">Email</label>
                <input class="ccf__input" type="email" id="ccf-email" name="email" placeholder="you@company.com" required>
              </div>
            </div>
            <div class="ccf__field">
              <label class="ccf__label" for="ccf-company">Company</label>
              <input class="ccf__input" type="text" id="ccf-company" name="company" placeholder="Your company">
            </div>
            <div class="ccf__field">
              <label class="ccf__label" for="ccf-message">How can we help?</label>
              <textarea class="ccf__textarea" id="ccf-message" name="message" rows="4" placeholder="Tell us about your project, timeline, and goals..." required></textarea>
            </div>
            <button class="ccf__submit" type="submit">Send Message</button>
          </form>
          <div class="ccf__success" style="display:none">
            <div class="ccf__success-icon">✓</div>
            <p class="ccf__success-text">Thanks! We'll be in touch soon.</p>
          </div>
        </div>
      `;

      const form = this.querySelector('.ccf__form');
      const success = this.querySelector('.ccf__success');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        this.dispatchEvent(new CustomEvent('contact-submit', { detail: data, bubbles: true }));

        // Fallback: open mailto
        const subject = encodeURIComponent('New inquiry from ' + (data.name || 'website'));
        const body = encodeURIComponent(
          'Name: ' + (data.name || '') + '\\n' +
          'Email: ' + (data.email || '') + '\\n' +
          'Company: ' + (data.company || '') + '\\n\\n' +
          (data.message || '')
        );
        window.open('mailto:' + email + '?subject=' + subject + '&body=' + body, '_blank');

        form.style.display = 'none';
        success.style.display = 'block';
      });

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-contact-form-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-contact-form-styles';
      s.textContent = `
        cc-contact-form { display: block; }
        .ccf { max-width: 640px; margin: 0 auto; padding: 48px 24px; text-align: center; }
        .ccf__title { font-size: 1.6rem; font-weight: 700; color: var(--text, #e2e8f0); margin: 0 0 8px; }
        .ccf__desc { color: var(--muted, #94a3b8); font-size: 0.95rem; margin: 0 0 32px; line-height: 1.6; }
        .ccf__form { text-align: left; display: flex; flex-direction: column; gap: 16px; }
        .ccf__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) { .ccf__row { grid-template-columns: 1fr; } }
        .ccf__field { display: flex; flex-direction: column; gap: 6px; }
        .ccf__label { font-size: 0.8rem; font-weight: 600; color: var(--muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.05em; }
        .ccf__input, .ccf__textarea {
          background: rgba(255,255,255,0.05); border: 1px solid var(--border, rgba(255,255,255,0.1));
          border-radius: 8px; padding: 12px 14px; color: var(--text, #e2e8f0); font-size: 0.95rem;
          font-family: inherit; transition: border-color 0.2s;
        }
        .ccf__input:focus, .ccf__textarea:focus {
          outline: none; border-color: var(--accent, #f59e0b);
        }
        .ccf__input::placeholder, .ccf__textarea::placeholder { color: rgba(255,255,255,0.25); }
        .ccf__textarea { resize: vertical; min-height: 100px; }
        .ccf__submit {
          align-self: flex-start; background: var(--accent, #f59e0b); color: #000;
          border: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;
          font-size: 0.95rem; cursor: pointer; transition: transform 0.15s, opacity 0.15s;
        }
        .ccf__submit:hover { transform: translateY(-1px); opacity: 0.9; }
        .ccf__success { text-align: center; padding: 40px 0; }
        .ccf__success-icon { font-size: 2.5rem; margin-bottom: 12px; color: var(--accent, #f59e0b); }
        .ccf__success-text { color: var(--text, #e2e8f0); font-size: 1.1rem; }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcContactForm);
})();
