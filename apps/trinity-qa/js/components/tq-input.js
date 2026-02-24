/**
 * TQInput - Form input component with validation
 * 
 * @element tq-input
 * @attr {string} type - text|email|password|date|datetime-local|number|select|textarea|file|checkbox
 * @attr {string} label - Field label
 * @attr {string} name - Field name
 * @attr {string} placeholder - Placeholder text
 * @attr {boolean} required - Required field
 * @attr {string} value - Field value
 * @attr {string} error - Error message
 * @attr {string} help - Help text
 * @attr {string} options - JSON array for select type
 * @fires tq-change - Fired when value changes
 */
export class TQInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.hasAttribute('data-tq-component')) this.setAttribute('data-tq-component', 'tq-input');
    this.render();
    this.setupEventHandlers();
  }

  static get observedAttributes() {
    return ['type', 'label', 'name', 'placeholder', 'required', 'value', 'error', 'help', 'options', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.shadowRoot.children.length > 0) {
      if (name === 'value' && oldValue !== newValue) {
        this.updateInputValue();
      } else {
        this.render();
        this.setupEventHandlers();
      }
    }
  }

  get value() {
    const input = this.shadowRoot.querySelector('input, select, textarea');
    if (!input) return '';
    
    if (input.type === 'checkbox') {
      return input.checked;
    }
    return input.value || '';
  }

  set value(val) {
    this.setAttribute('value', val);
    this.updateInputValue();
  }

  get name() {
    return this.getAttribute('name') || '';
  }

  updateInputValue() {
    const input = this.shadowRoot.querySelector('input, select, textarea');
    if (!input) return;

    const value = this.getAttribute('value') || '';
    if (input.type === 'checkbox') {
      input.checked = value === 'true' || value === true;
    } else {
      input.value = value;
    }
  }

  setupEventHandlers() {
    const input = this.shadowRoot.querySelector('input, select, textarea');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const value = input.type === 'checkbox' ? input.checked : input.value;
      this.dispatchEvent(new CustomEvent('tq-change', {
        detail: { value, name: this.name },
        bubbles: true,
        composed: true
      }));
    });

    input.addEventListener('change', (e) => {
      const value = input.type === 'checkbox' ? input.checked : input.value;
      this.dispatchEvent(new CustomEvent('tq-change', {
        detail: { value, name: this.name },
        bubbles: true,
        composed: true
      }));
    });
  }

  renderInput() {
    const type = this.getAttribute('type') || 'text';
    const name = this.name;
    const placeholder = this.getAttribute('placeholder') || '';
    const required = this.hasAttribute('required');
    const value = this.getAttribute('value') || '';
    const disabled = this.hasAttribute('disabled');

    if (type === 'textarea') {
      return `<textarea 
        name="${name}" 
        placeholder="${placeholder}" 
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
        rows="4"
      >${value}</textarea>`;
    }

    if (type === 'select') {
      const optionsAttr = this.getAttribute('options') || '[]';
      let options = [];
      try {
        options = JSON.parse(optionsAttr);
      } catch (e) {
        console.error('Invalid options JSON:', e);
      }

      return `
        <select name="${name}" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>
          <option value="">${placeholder || 'Select...'}</option>
          ${options.map(opt => {
            const optValue = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return `<option value="${optValue}" ${value === optValue ? 'selected' : ''}>${optLabel}</option>`;
          }).join('')}
        </select>
      `;
    }

    if (type === 'checkbox') {
      return `<input 
        type="checkbox" 
        name="${name}" 
        ${value === 'true' || value === true ? 'checked' : ''}
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
      />`;
    }

    return `<input 
      type="${type}" 
      name="${name}" 
      placeholder="${placeholder}" 
      value="${value}"
      ${required ? 'required' : ''}
      ${disabled ? 'disabled' : ''}
    />`;
  }

  render() {
    const label = this.getAttribute('label') || '';
    const error = this.getAttribute('error') || '';
    const help = this.getAttribute('help') || '';
    const type = this.getAttribute('type') || 'text';
    const required = this.hasAttribute('required');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: var(--spacing-md, 1rem);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field.checkbox {
          flex-direction: row;
          align-items: center;
          gap: 0.75rem;
        }

        label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--gray-700, #374151);
          font-family: var(--font-sans, sans-serif);
        }

        label .required {
          color: var(--danger, #ef4444);
          margin-left: 0.25rem;
        }

        input, select, textarea {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--gray-300, #d1d5db);
          border-radius: var(--radius-md, 0.5rem);
          font-size: 1rem;
          font-family: var(--font-sans, sans-serif);
          background: white;
          color: var(--gray-900, #111827);
          transition: all 0.2s ease;
        }

        input[type="checkbox"] {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: var(--trinity-blue, #2c5f8d);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--trinity-blue, #2c5f8d) 10%, transparent);
        }

        input:disabled, select:disabled, textarea:disabled {
          background: var(--gray-100, #f3f4f6);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .error input, .error select, .error textarea {
          border-color: var(--danger, #ef4444);
        }

        .error-message {
          font-size: 0.875rem;
          color: var(--danger, #ef4444);
          margin-top: 0.25rem;
        }

        .help-text {
          font-size: 0.875rem;
          color: var(--gray-500, #6b7280);
          margin-top: 0.25rem;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
          appearance: none;
        }
      </style>
      <div class="field ${type === 'checkbox' ? 'checkbox' : ''} ${error ? 'error' : ''}">
        ${type !== 'checkbox' && label ? `<label>${label}${required ? '<span class="required">*</span>' : ''}</label>` : ''}
        ${this.renderInput()}
        ${type === 'checkbox' && label ? `<label>${label}${required ? '<span class="required">*</span>' : ''}</label>` : ''}
        ${error ? `<span class="error-message">${error}</span>` : ''}
        ${help && !error ? `<span class="help-text">${help}</span>` : ''}
      </div>
    `;

    this.setupEventHandlers();
  }
}

customElements.define('tq-input', TQInput);
