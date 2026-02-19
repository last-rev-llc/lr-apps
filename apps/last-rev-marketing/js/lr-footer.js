/**
 * <lr-footer> — Site footer for Last Rev Marketing.
 *
 * No attributes. Renders contact section (via <cc-contact-form>), nav links, copyright.
 *
 * NOTE: Don't use directly — <lr-layout> renders this automatically.
 *       LR marketing pages only; standalone apps don't use a footer component.
 */
(function () {
  const TAG = 'lr-footer';
  if (customElements.get(TAG)) return;

  class LrFooter extends HTMLElement {
    connectedCallback() { this._render(); }

    _render() {
      this.innerHTML = `
        <footer class="lp-footer">
          <div class="lp-divider"></div>
          <section class="lp-section" id="contact">
            <cc-section-intro data-component="cc-section-intro" title="Let's Build Your AI Operations Layer" body="Whether you need internal AI assistants, customer-facing agents, or the full platform — we'll get you there."></cc-section-intro>
            <cc-contact-form
              email="hello@lastrev.com"
              no-header
            ></cc-contact-form>
          </section>
          <div class="lp-divider"></div>
          <p>© ${new Date().getFullYear()} Last Rev. All rights reserved. · <a href="./index.html">Home</a> · <a href="./ai-offerings.html">AI Offerings</a> · <a href="./privacy.html">Privacy</a> · <a href="./terms.html">Terms</a> · <a href="https://lastrev.com">lastrev.com</a></p>
        </footer>
      `;
    }
  }

  customElements.define(TAG, LrFooter);
})();
