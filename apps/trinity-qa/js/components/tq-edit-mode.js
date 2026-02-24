/* <tq-edit-mode> — Edit Mode overlay for Trinity QA components
   Scans DOM for tq-* custom elements, shows wand overlay on hover,
   lets users submit feedback to the trigger_queue in the MAIN Supabase project.
   
   Activated via keyboard shortcut (Ctrl+Shift+E) or programmatically.
*/
(function () {
  // Feedback goes to the MAIN project's trigger_queue (not Trinity's Supabase)
  const SUPABASE_URL = 'https://lregiwsovpmljxjvrrsc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HPinRWPrX97uxshGM0u1rw_UAsQsyFq';

  const STYLE = document.createElement('style');
  STYLE.textContent = `
    [data-tq-component].tq-edit-hoverable { position: relative; }

    .tq-edit-wand {
      position: absolute; z-index: 9998;
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #2c5f8d, #4a90c8);
      border: 2px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; opacity: 0;
      transition: opacity .2s, transform .15s;
      font-size: 14px; line-height: 1;
      box-shadow: 0 2px 12px rgba(44,95,141,.5);
    }
    .tq-edit-wand:hover { transform: scale(1.15); opacity: 1 !important; }
    [data-tq-component].tq-edit-hoverable:hover {
      outline: 2px dashed rgba(44,95,141,.5); outline-offset: 2px;
    }
    [data-tq-component].tq-edit-focused {
      outline: 2px solid var(--trinity-blue, #2c5f8d) !important; outline-offset: 2px;
    }

    body.tq-edit-active { margin-left: 380px; transition: margin-left .3s cubic-bezier(.4,0,.2,1); }
    @media (max-width: 500px) { body.tq-edit-active { margin-left: 90vw; } }

    .tq-edit-sidebar {
      position: fixed; top: 0; left: 0; width: 380px; max-width: 90vw; height: 100vh;
      background: #fff; border-right: 1px solid var(--gray-200, #e5e7eb);
      z-index: 9999; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1);
      display: flex; flex-direction: column; font-family: var(--font-sans, sans-serif);
      box-shadow: 8px 0 32px rgba(0,0,0,.15);
    }
    .tq-edit-sidebar.open { transform: translateX(0); }
    .tq-edit-sidebar-header {
      padding: 16px 20px; border-bottom: 1px solid var(--gray-200, #e5e7eb);
      display: flex; align-items: center; justify-content: space-between;
      background: var(--trinity-navy, #1a2332); color: white;
    }
    .tq-edit-sidebar-header h3 { margin: 0; font-size: 1rem; }
    .tq-edit-sidebar-close {
      background: none; border: none; color: rgba(255,255,255,.7);
      font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 4px;
    }
    .tq-edit-sidebar-close:hover { background: rgba(255,255,255,.1); }
    .tq-edit-sidebar-body { padding: 20px; flex: 1; overflow-y: auto; }

    .tq-edit-component-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(44,95,141,.1); border: 1px solid rgba(44,95,141,.3);
      border-radius: 8px; padding: 8px 14px; margin-bottom: 16px;
      font-size: .85rem; color: var(--trinity-blue, #2c5f8d); width: fit-content;
    }
    .tq-edit-label {
      font-size: .8rem; color: var(--gray-500, #6b7280); margin-bottom: 6px;
      text-transform: uppercase; letter-spacing: .5px; font-weight: 600;
    }
    .tq-edit-textarea {
      width: 100%; min-height: 120px; background: var(--gray-50, #f9fafb);
      border: 1px solid var(--gray-300, #d1d5db); border-radius: 8px;
      color: var(--gray-800, #1f2937); font-family: inherit; font-size: .9rem;
      padding: 12px; resize: vertical; outline: none; transition: border-color .2s;
    }
    .tq-edit-textarea:focus { border-color: var(--trinity-blue, #2c5f8d); }
    .tq-edit-char-count {
      font-size: .75rem; color: var(--gray-400, #9ca3af); text-align: right; margin-top: 4px;
    }
    .tq-edit-char-count.invalid { color: var(--danger, #ef4444); }
    .tq-edit-submit {
      margin-top: 16px; width: 100%; padding: 12px;
      background: var(--trinity-blue, #2c5f8d); color: #fff; border: none;
      border-radius: 8px; font-size: .9rem; font-weight: 600; cursor: pointer;
      transition: opacity .2s, transform .1s;
    }
    .tq-edit-submit:hover:not(:disabled) { opacity: .9; }
    .tq-edit-submit:active:not(:disabled) { transform: scale(.98); }
    .tq-edit-submit:disabled { opacity: .4; cursor: not-allowed; }
    .tq-edit-url {
      font-size: .75rem; color: var(--gray-400, #9ca3af); margin-bottom: 16px; word-break: break-all;
    }
    .tq-edit-hint {
      color: var(--gray-500, #6b7280); font-size: .9rem; text-align: center;
      padding: 40px 20px; line-height: 1.6;
    }

    /* Toggle button (fixed bottom-left) */
    .tq-edit-toggle {
      position: fixed; bottom: 20px; left: 20px; z-index: 9997;
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--trinity-navy, #1a2332); border: 2px solid var(--trinity-blue, #2c5f8d);
      color: white; font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,.3); transition: all .2s;
    }
    .tq-edit-toggle:hover { transform: scale(1.1); }
    .tq-edit-toggle.active { background: var(--trinity-blue, #2c5f8d); }
  `;
  document.head.appendChild(STYLE);

  class TQEditMode {
    constructor() {
      this.active = false;
      this.focusedEl = null;
      this.sidebar = null;
      this.wands = [];
      this._createToggleButton();
    }

    _createToggleButton() {
      const btn = document.createElement('button');
      btn.className = 'tq-edit-toggle';
      btn.innerHTML = '✏️';
      btn.title = 'Toggle Edit Mode (Ctrl+Shift+E)';
      btn.addEventListener('click', () => this.toggle());
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
      this._toggleBtn = btn;
    }

    toggle() {
      this.active ? this.deactivate() : this.activate();
    }

    activate() {
      this.active = true;
      this._toggleBtn.classList.add('active');
      this._tagComponents();
      this._createSidebar();
      this._addWands();
      document.body.classList.add('tq-edit-active');
      this.sidebar.classList.add('open');
      this._updateSidebarContent(null);
    }

    deactivate() {
      this.active = false;
      this._toggleBtn.classList.remove('active');
      this._removeWands();
      document.body.classList.remove('tq-edit-active');
      if (this.sidebar) {
        this.sidebar.classList.remove('open');
        setTimeout(() => this.sidebar?.remove(), 300);
        this.sidebar = null;
      }
      document.querySelectorAll('.tq-edit-focused').forEach(el => el.classList.remove('tq-edit-focused'));
      document.querySelectorAll('.tq-edit-hoverable').forEach(el => el.classList.remove('tq-edit-hoverable'));
      this.focusedEl = null;
    }

    _tagComponents() {
      document.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (tag.startsWith('tq-') && !el.hasAttribute('data-tq-component')) {
          el.setAttribute('data-tq-component', tag);
        }
      });
    }

    _getEditableComponents() {
      return [...document.querySelectorAll('[data-tq-component]')].filter(el => {
        if (el.closest('.tq-edit-sidebar')) return false;
        const tag = el.getAttribute('data-tq-component');
        const skip = ['tq-toast'];
        return !skip.includes(tag);
      });
    }

    _createSidebar() {
      if (this.sidebar) this.sidebar.remove();
      const sb = document.createElement('div');
      sb.className = 'tq-edit-sidebar';
      sb.innerHTML = `
        <div class="tq-edit-sidebar-header">
          <h3>✏️ Edit Mode</h3>
          <button class="tq-edit-sidebar-close" title="Close">✕</button>
        </div>
        <div class="tq-edit-sidebar-body"></div>
      `;
      document.body.appendChild(sb);
      this.sidebar = sb;
      sb.querySelector('.tq-edit-sidebar-close').addEventListener('click', () => this.deactivate());
    }

    _addWands() {
      this._removeWands();

      // Create a wand container on body for overlay positioning
      let container = document.getElementById('tq-edit-wand-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'tq-edit-wand-container';
        container.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;z-index:9998;pointer-events:none;';
        document.body.appendChild(container);
      }

      const comps = this._getEditableComponents();
      comps.forEach(el => {
        el.classList.add('tq-edit-hoverable');

        const wand = document.createElement('button');
        wand.className = 'tq-edit-wand';
        wand.style.pointerEvents = 'auto';
        wand.style.opacity = '0';
        wand.innerHTML = '✏️';
        wand.title = `Edit ${el.getAttribute('data-tq-component')}`;
        wand.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this._focusComponent(el);
        });
        container.appendChild(wand);
        this.wands.push({ wand, el });
      });

      // Position wands over their components
      this._positionWands();

      // Show wands on hover via mouse tracking
      document.addEventListener('mousemove', this._onMouseMove);
      window.addEventListener('scroll', this._onScroll, true);
      window.addEventListener('resize', this._onScroll);
    }

    _positionWands() {
      this.wands.forEach(({ wand, el }) => {
        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        wand.style.position = 'absolute';
        wand.style.top = `${rect.top + scrollY + 4}px`;
        wand.style.left = `${rect.right + scrollX - 32}px`;
      });
    }

    _onMouseMove = (e) => {
      this.wands.forEach(({ wand, el }) => {
        const rect = el.getBoundingClientRect();
        const inBounds = e.clientX >= rect.left && e.clientX <= rect.right &&
                         e.clientY >= rect.top && e.clientY <= rect.bottom;
        // Also check if hovering the wand itself
        const wandRect = wand.getBoundingClientRect();
        const onWand = e.clientX >= wandRect.left && e.clientX <= wandRect.right &&
                       e.clientY >= wandRect.top && e.clientY <= wandRect.bottom;

        if (inBounds || onWand) {
          wand.style.opacity = '1';
          el.style.outline = '2px dashed rgba(44,95,141,.5)';
          el.style.outlineOffset = '2px';
        } else {
          wand.style.opacity = '0';
          if (!el.classList.contains('tq-edit-focused')) {
            el.style.outline = '';
            el.style.outlineOffset = '';
          }
        }
      });
    }

    _onScroll = () => {
      this._positionWands();
    }

    _removeWands() {
      this.wands.forEach(({ wand }) => wand.remove());
      this.wands = [];
      const container = document.getElementById('tq-edit-wand-container');
      if (container) container.remove();
      document.removeEventListener('mousemove', this._onMouseMove);
      window.removeEventListener('scroll', this._onScroll, true);
      window.removeEventListener('resize', this._onScroll);
    }

    _focusComponent(el) {
      document.querySelectorAll('.tq-edit-focused').forEach(e => e.classList.remove('tq-edit-focused'));
      el.classList.add('tq-edit-focused');
      this.focusedEl = el;
      this._updateSidebarContent(el);
    }

    _updateSidebarContent(el) {
      const body = this.sidebar?.querySelector('.tq-edit-sidebar-body');
      if (!body) return;

      const name = el ? el.getAttribute('data-tq-component') : null;

      body.innerHTML = `
        ${name
          ? `<div class="tq-edit-component-badge">✏️ &lt;${name}&gt;</div>`
          : `<div class="tq-edit-hint">Click ✏️ on any component to target it,<br>or submit general page feedback below.</div>`
        }
        <div class="tq-edit-url">${window.location.href}</div>
        <div class="tq-edit-label">${name ? 'What would you like to change?' : 'Describe your feedback'}</div>
        <textarea class="tq-edit-textarea" placeholder="${name ? `Describe the change for <${name}>...` : 'Describe what you\'d like changed...'} (min 20 characters)"></textarea>
        <div class="tq-edit-char-count">0 / 20 min</div>
        <button class="tq-edit-submit" disabled>🚀 Send Feedback</button>
      `;

      const textarea = body.querySelector('.tq-edit-textarea');
      const charCount = body.querySelector('.tq-edit-char-count');
      const submitBtn = body.querySelector('.tq-edit-submit');

      textarea.addEventListener('input', () => {
        const len = textarea.value.trim().length;
        charCount.textContent = `${len} / 20 min`;
        charCount.classList.toggle('invalid', len > 0 && len < 20);
        submitBtn.disabled = len < 20;
      });

      submitBtn.addEventListener('click', () => this._submit(name, textarea.value.trim(), body));
    }

    async _submit(componentName, message, body) {
      const btn = body.querySelector('.tq-edit-submit');
      btn.disabled = true;
      btn.textContent = '⏳ Sending...';

      const prefix = componentName ? `[Component: ${componentName}] ` : '';
      const payload = {
        message: `[Trinity QA] ${prefix}[URL: ${window.location.href}] ${message}`,
        source: 'edit-mode',
        status: 'pending'
      };

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/trigger_queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        btn.textContent = '✅ Sent!';
        const textarea = body.querySelector('.tq-edit-textarea');
        const charCount = body.querySelector('.tq-edit-char-count');
        if (textarea) textarea.value = '';
        if (charCount) { charCount.textContent = '0 / 20 min'; charCount.classList.remove('invalid'); }
        setTimeout(() => { btn.textContent = '🚀 Send Feedback'; btn.disabled = true; }, 2000);

        if (window.TQToast) {
          window.TQToast.show('Feedback submitted! We\'ll review it shortly.', 'success');
        }
      } catch (err) {
        btn.textContent = '❌ Failed — try again';
        btn.disabled = false;
        console.error('Edit mode submit error:', err);
      }
    }
  }

  // Keyboard shortcut: Ctrl+Shift+E
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      window.__tqEditMode.toggle();
    }
  });

  window.__tqEditMode = new TQEditMode();
})();
