/* <cc-sidebar> — Reusable sidebar nav component
   Attributes: title, subtitle
   API: setSidebarItems(items), onselect callback
   Items: [{id, icon, name, description}]
*/
(function() {
  class CCSidebar extends HTMLElement {
    constructor() {
      super();
      this._items = [];
      this._activeId = null;
    }

    connectedCallback() {
      this.classList.add('cc-sidebar');
      this.render();
    }

    static get observedAttributes() { return ['title', 'subtitle']; }
    attributeChangedCallback() { if (this.isConnected) this.render(); }

    setSidebarItems(items) {
      this._items = items || [];
      this.renderList();
    }

    setActive(id) {
      this._activeId = id;
      this.querySelectorAll('.cc-sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === String(id));
      });
    }

    render() {
      const title = this.getAttribute('title') || '';
      const subtitle = this.getAttribute('subtitle') || '';
      this.innerHTML = `
        <div class="cc-sidebar-header">
          <h1>${title}</h1>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
        <div class="cc-sidebar-list" data-role="list"></div>
      `;
      this.renderList();
    }

    renderList() {
      const list = this.querySelector('[data-role="list"]');
      if (!list) return;
      if (this._items.length === 0) {
        list.innerHTML = '<cc-empty-state message="No items available" icon="📭" compact></cc-empty-state>';
        return;
      }
      list.innerHTML = this._items.map(item => `
        <button class="cc-sidebar-item${item.id === this._activeId ? ' active' : ''}" data-id="${item.id}">
          <span class="item-icon">${item.icon || ''}</span>
          <div class="item-info">
            <div class="item-name">${item.name || ''}</div>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
          </div>
        </button>
      `).join('');

      list.querySelectorAll('.cc-sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          this.setActive(id);
          if (this.onselect) this.onselect(id);
        });
      });
    }

    open() { this.classList.add('open'); }
    close() { this.classList.remove('open'); }
    toggle() { this.classList.toggle('open'); }
  }

  customElements.define('cc-sidebar', CCSidebar);
})();
