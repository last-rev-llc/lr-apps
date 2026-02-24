/**
 * TQForm - Form wrapper component
 * 
 * @element tq-form
 * @fires tq-submit - Fired when form is submitted
 */
export class TQForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!this.validate()) {
          return;
        }

        const data = this.getFormData();
        this.dispatchEvent(new CustomEvent('tq-submit', {
          detail: { data },
          bubbles: true,
          composed: true
        }));
      });
    }
  }

  /**
   * Get form data from all tq-input children
   * Empty values are converted to null
   * @returns {Object} Form data
   */
  getFormData() {
    const data = {};
    const inputs = this.querySelectorAll('tq-input');
    
    inputs.forEach(input => {
      const name = input.name;
      const value = input.value;
      
      if (name) {
        // Convert empty strings to null
        data[name] = (value === '' || value === null || value === undefined) ? null : value;
      }
    });
    
    return data;
  }

  /**
   * Validate all required fields
   * @returns {boolean} True if valid
   */
  validate() {
    let isValid = true;
    const inputs = this.querySelectorAll('tq-input[required]');
    
    inputs.forEach(input => {
      const value = input.value;
      const name = input.name;
      
      if (!value || value === '' || value === null) {
        input.setAttribute('error', `${name || 'This field'} is required`);
        isValid = false;
      } else {
        input.removeAttribute('error');
      }
    });
    
    return isValid;
  }

  /**
   * Reset form to initial state
   */
  reset() {
    const inputs = this.querySelectorAll('tq-input');
    inputs.forEach(input => {
      input.value = '';
      input.removeAttribute('error');
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        form {
          display: contents;
        }
      </style>
      <form>
        <slot></slot>
      </form>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-form', TQForm);
