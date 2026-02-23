/* <cc-field> — Shared form field component
   Attributes: label, type (text|email|tel|textarea|select|number), placeholder, name, value, required, rows, options (JSON array for select)
   API: getValue(), setValue(v), clear()
   
   Usage:
     <cc-field label="Name" name="name" placeholder="Enter name"></cc-field>
     <cc-field label="Description" type="textarea" name="desc" rows="4"></cc-field>
     <cc-field label="Category" type="select" name="cat" options='["Technical","Product","Business"]'></cc-field>
     <cc-field label="Tags" type="select" name="tags" options='[{"value":"a","label":"Option A"}]' multiple></cc-field>
*/
(function() {
  class CCField extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.classList.add('cc-field');
      this._render();
    }

    static get observedAttributes() { return ['label', 'type', 'placeholder', 'value', 'options']; }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const label = this.getAttribute('label') || '';
      const type = this.getAttribute('type') || 'text';
      const placeholder = this.getAttribute('placeholder') || '';
      const name = this.getAttribute('name') || '';
      const value = this.getAttribute('value') || '';
      const required = this.hasAttribute('required') ? 'required' : '';
      const rows = this.getAttribute('rows') || '4';
      const multiple = this.hasAttribute('multiple');

      let inputHtml = '';

      if (type === 'textarea') {
        inputHtml = `<textarea class="cc-field-input cc-field-textarea" name="${name}" placeholder="${placeholder}" rows="${rows}" ${required}>${value}</textarea>`;
      } else if (type === 'select') {
        let options = [];
        try { options = JSON.parse(this.getAttribute('options') || '[]'); } catch(e) {}
        const optionsHtml = options.map(o => {
          if (typeof o === 'string') return `<option value="${o}">${o}</option>`;
          return `<option value="${o.value}">${o.label || o.value}</option>`;
        }).join('');
        const multiAttr = multiple ? 'multiple style="min-height:80px;"' : '';
        inputHtml = `<select class="cc-field-input cc-field-select" name="${name}" ${multiAttr} ${required}>${optionsHtml}</select>`;
      } else {
        inputHtml = `<input class="cc-field-input" type="${type}" name="${name}" placeholder="${placeholder}" value="${value}" ${required}>`;
      }

      this.innerHTML = `
        ${label ? `<label class="cc-field-label">${label}</label>` : ''}
        ${inputHtml}
      `;
    }

    getValue() {
      const input = this.querySelector('.cc-field-input');
      if (!input) return '';
      if (input.tagName === 'SELECT' && input.multiple) {
        return Array.from(input.selectedOptions).map(o => o.value);
      }
      return input.value;
    }

    setValue(v) {
      const input = this.querySelector('.cc-field-input');
      if (!input) return;
      if (input.tagName === 'SELECT' && input.multiple && Array.isArray(v)) {
        Array.from(input.options).forEach(o => o.selected = v.includes(o.value));
      } else {
        input.value = v;
      }
    }

    clear() {
      const input = this.querySelector('.cc-field-input');
      if (!input) return;
      if (input.tagName === 'SELECT') {
        if (input.multiple) Array.from(input.options).forEach(o => o.selected = false);
        else input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    }
  }

  customElements.define('cc-field', CCField);
})();
