/**
 * TQFooter - Application footer
 * 
 * @element tq-footer
 * @attr {string} company-name - Company name
 * @attr {string} year - Copyright year
 */
export class TQFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['company-name', 'year'];
  }

  attributeChangedCallback() {
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  render() {
    const companyName = this.getAttribute('company-name') || 'Trinity Building Services';
    const year = this.getAttribute('year') || new Date().getFullYear();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: auto;
        }

        footer {
          background: var(--trinity-navy, #1a2332);
          color: rgba(255, 255, 255, 0.8);
          padding: 2rem 1rem;
          margin-top: 4rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }

        .footer-top {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .copyright {
          font-size: 0.875rem;
          font-family: var(--font-sans, sans-serif);
        }

        .powered-by {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--font-sans, sans-serif);
        }

        .powered-by a {
          color: var(--trinity-accent, #6ab0dd);
          text-decoration: none;
          font-weight: 600;
        }

        .powered-by a:hover {
          text-decoration: underline;
        }

        .divider {
          width: 1px;
          height: 1rem;
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 640px) {
          .footer-top {
            flex-direction: column;
            gap: 0.75rem;
          }

          .divider {
            display: none;
          }
        }
      </style>
      <footer>
        <div class="footer-container">
          <div class="footer-top">
            <div class="copyright">
              © ${year} ${companyName}. All rights reserved.
            </div>
            <div class="divider"></div>
            <div class="powered-by">
              Powered by <a href="https://lastrev.com" target="_blank" rel="noopener">Last Rev</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('tq-footer', TQFooter);
