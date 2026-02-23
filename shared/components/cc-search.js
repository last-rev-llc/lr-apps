// ─── Shared Search Component ──────────────────────────────
// Drop-in replacement for <input class="search"> in modules.
// Survives parent innerHTML rebuilds by auto-restoring focus + cursor.
//
// Usage:  <cc-search placeholder="Search…" value="${esc(query)}"></cc-search>
// Events: fires 'cc-search' CustomEvent with { detail: { value } } on input
// Focus:  auto-restores focus + selection when re-mounted after parent re-render

(function() {
  // Global focus state — tracks which search was active before re-render
  // Uses a delayed clear so blur from DOM removal doesn't wipe state
  // before the replacement element mounts.
  let _activeMeta = null;
  let _blurTimer = null;

  class CcSearch extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const placeholder = this.getAttribute('placeholder') || 'Search…';
      const value = this.getAttribute('value') || '';
      const extraStyle = this.getAttribute('input-style') || '';
      this.style.display = 'contents';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = this.getAttribute('input-class') || 'search';
      input.placeholder = placeholder;
      input.value = value;
      input.className = 'search cc-search-input'; if (extraStyle) input.style.cssText = extraStyle;

      input.addEventListener('input', () => {
        this.setAttribute('value', input.value);
        // Snapshot cursor position before dispatching (handlers may re-render DOM)
        const pos = input.selectionStart;
        _activeMeta = { placeholder, selStart: pos, selEnd: input.selectionEnd };
        this.dispatchEvent(new CustomEvent('cc-search', {
          bubbles: true,
          detail: { value: input.value }
        }));
        // Restore cursor in case a synchronous re-render shifted it
        requestAnimationFrame(() => {
          if (document.activeElement === input && input.selectionStart !== pos) {
            input.selectionStart = input.selectionEnd = pos;
          }
        });
      });

      input.addEventListener('focus', () => {
        if (_blurTimer) { clearTimeout(_blurTimer); _blurTimer = null; }
        _activeMeta = { placeholder, selStart: input.selectionStart, selEnd: input.selectionEnd };
      });
      input.addEventListener('blur', () => {
        // Delay clearing so a re-mount in the same tick can still restore
        if (_blurTimer) clearTimeout(_blurTimer);
        _blurTimer = setTimeout(() => { _activeMeta = null; _blurTimer = null; }, 100);
      });

      this.appendChild(input);

      // Auto-restore focus if we're replacing a previously-focused search
      if (_activeMeta && _activeMeta.placeholder === placeholder) {
        const meta = _activeMeta;
        if (_blurTimer) { clearTimeout(_blurTimer); _blurTimer = null; }
        requestAnimationFrame(() => {
          input.focus();
          const end = input.value.length;
          input.selectionStart = Math.min(meta.selStart ?? end, end);
          input.selectionEnd = Math.min(meta.selEnd ?? end, end);
          _activeMeta = { placeholder, selStart: input.selectionStart, selEnd: input.selectionEnd };
        });
      }
    }

    static get observedAttributes() { return ['value', 'placeholder']; }

    attributeChangedCallback(name, oldVal, newVal) {
      const input = this.querySelector('input');
      if (!input) return;
      if (name === 'value' && document.activeElement !== input) {
        input.value = newVal || '';
      }
      if (name === 'placeholder') {
        input.placeholder = newVal || 'Search…';
      }
    }
  }
  customElements.define('cc-search', CcSearch);
})();
