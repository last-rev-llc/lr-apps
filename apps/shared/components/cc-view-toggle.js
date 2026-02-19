// ─── View Toggle (cards / list / expanded) ────────────────
// Usage: <cc-view-toggle app="recipes" default="cards"></cc-view-toggle>
// Events: fires 'cc-view-change' CustomEvent with { detail: { view } }
(function() {
  const VIEWS = [
    { id: 'cards', label: 'Cards', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>' },
    { id: 'list', label: 'List', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="5" y1="3" x2="15" y2="3"/><line x1="5" y1="8" x2="15" y2="8"/><line x1="5" y1="13" x2="15" y2="13"/><circle cx="2" cy="3" r="1" fill="currentColor" stroke="none"/><circle cx="2" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="2" cy="13" r="1" fill="currentColor" stroke="none"/></svg>' },
    { id: 'expanded', label: 'Expanded', svg: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="14" height="4" rx="1"/><rect x="1" y="7" width="14" height="4" rx="1"/><rect x="1" y="13" width="14" height="2" rx="1"/></svg>' }
  ];

  class CcViewToggle extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.style.display = 'inline-flex';

      const app = this.getAttribute('app') || 'default';
      const def = this.getAttribute('default') || 'cards';
      const key = `cc-view-${app}`;

      // Restore from prefs
      let stored = null;
      if (window.UserPrefs) stored = window.UserPrefs.get(key, null);
      if (!stored) try { stored = localStorage.getItem(key); } catch(e) {}
      this._view = this.getAttribute('value') || stored || def;

      this._render();
    }

    get value() { return this._view; }
    set value(v) { if (v !== this._view) { this._view = v; this._persist(); this._render(); } }

    _persist() {
      const app = this.getAttribute('app') || 'default';
      const key = `cc-view-${app}`;
      if (window.UserPrefs) window.UserPrefs.set(key, this._view);
      else try { localStorage.setItem(key, this._view); } catch(e) {}
    }

    _select(id) {
      if (id === this._view) return;
      this._view = id;
      this._persist();
      this._render();
      this.dispatchEvent(new CustomEvent('cc-view-change', { bubbles: true, detail: { view: id } }));
    }

    _render() {
      this.innerHTML = VIEWS.map(v => `
        <button class="cc-vt-btn${v.id === this._view ? ' active' : ''}" data-view="${v.id}" title="${v.label}" aria-label="${v.label} view">
          ${v.svg}
        </button>
      `).join('');
      this.querySelectorAll('.cc-vt-btn').forEach(btn => {
        btn.addEventListener('click', () => this._select(btn.dataset.view));
      });
    }
  }

  // Inject styles once
  if (!document.getElementById('cc-view-toggle-style')) {
    const style = document.createElement('style');
    style.id = 'cc-view-toggle-style';
    style.textContent = `
      cc-view-toggle {
        display: inline-flex;
        gap: 2px;
        background: var(--glass, rgba(255,255,255,0.08));
        border: 1px solid var(--glass-border, rgba(255,255,255,0.15));
        border-radius: 8px;
        padding: 2px;
      }
      .cc-vt-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 28px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--muted, #94a3b8);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .cc-vt-btn:hover {
        background: var(--glass-hover, rgba(255,255,255,0.12));
        color: var(--text, #f8fafc);
      }
      .cc-vt-btn.active {
        background: var(--accent, #f59e0b);
        color: #000;
      }
    `;
    document.head.appendChild(style);
  }

  customElements.define('cc-view-toggle', CcViewToggle);
})();
