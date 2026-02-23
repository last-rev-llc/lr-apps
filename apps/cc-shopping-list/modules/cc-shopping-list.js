/**
 * <cc-shopping-list>
 *
 * Shopping list organizer with store tabs, categories, drag-to-reorder,
 * swipe-to-delete, quick-add suggestions, batch operations, and sort options.
 */

const CATEGORIES = [
  { value: 'produce', label: 'Produce', icon: 'apple' },
  { value: 'dairy', label: 'Dairy', icon: 'milk' },
  { value: 'meat', label: 'Meat & Seafood', icon: 'beef' },
  { value: 'frozen', label: 'Frozen', icon: 'snowflake' },
  { value: 'bakery', label: 'Bakery', icon: 'croissant' },
  { value: 'beverages', label: 'Beverages', icon: 'cup-soda' },
  { value: 'snacks', label: 'Snacks', icon: 'cookie' },
  { value: 'household', label: 'Household', icon: 'spray-can' },
  { value: 'personal', label: 'Personal Care', icon: 'heart' },
  { value: 'other', label: 'Other', icon: 'package' }
];

const STORES = [
  { name: "Trader Joe's", icon: 'leaf' },
  { name: 'Costco', icon: 'warehouse' },
  { name: 'Target', icon: 'target' }
];

class CcShoppingList extends HTMLElement {
  connectedCallback() {
    this.currentStore = STORES[0].name;
    this.items = [];
    this.db = null;
    this.viewMode = 'list';
    this.sortBy = 'manual';
    this.selectedIds = new Set();
    this.selectMode = false;
    this.storeCounts = {};
    this._dragItem = null;
    this._touchStartX = 0;
    this.init();
  }

  async init() {
    this.db = await ShoppingDB.init();
    await this._refreshCounts();
    this.render();
    await this.loadItems();
    this._bindEvents();
  }

  _esc(str) {
    const el = document.createElement('span');
    el.textContent = str ?? '';
    return el.innerHTML;
  }

  _escAttr(str) {
    return (str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async _refreshCounts() {
    this.storeCounts = await this.db.getStoreCounts();
  }

  _storeLabel(s) {
    const count = this.storeCounts[s.name] || 0;
    return `${s.name}${count ? ` (${count})` : ''}`;
  }

  _catLabel(cat) {
    return CATEGORIES.find(c => c.value === cat)?.label || 'Other';
  }

  render() {
    const catOptions = JSON.stringify(CATEGORIES.map(c => ({ value: c.value, label: c.label })));
    this.innerHTML = `
      <div style="max-width:900px;margin:0 auto;padding:1rem;">
        <cc-tabs active="${this._escAttr(this.currentStore)}">
          ${STORES.map(s => `<cc-tab name="${this._escAttr(s.name)}" label="${this._escAttr(this._storeLabel(s))}" icon="${s.icon}"></cc-tab>`).join('')}
        </cc-tabs>

        <div style="display:flex;align-items:center;justify-content:space-between;margin:1rem 0 .5rem;flex-wrap:wrap;gap:.5rem;">
          <h2 style="margin:0;font-size:1.25rem;">${this._esc(this.currentStore)}</h2>
          <div style="display:flex;gap:.5rem;align-items:center;">
            <cc-pill-dropdown name="sort" options='${JSON.stringify([
              {value:'manual',label:'Manual'},
              {value:'name',label:'Name'},
              {value:'category',label:'Category'},
              {value:'date',label:'Date Added'},
              {value:'checked',label:'Checked'}
            ])}' value="manual" label="Sort"></cc-pill-dropdown>
            <cc-view-toggle app="cc-shopping-list" default="list"></cc-view-toggle>
          </div>
        </div>

        <div style="display:flex;gap:.5rem;align-items:flex-end;margin-bottom:.75rem;flex-wrap:wrap;">
          <div style="flex:1;min-width:140px;">
            <cc-field name="item-name" placeholder="Add item..." label=""></cc-field>
          </div>
          <div style="width:60px;">
            <cc-field name="item-qty" type="number" placeholder="Qty" value="1" label=""></cc-field>
          </div>
          <div style="width:120px;">
            <cc-field name="item-cat" type="select" options='${catOptions}' value="other" label=""></cc-field>
          </div>
          <button class="btn btn-primary" data-action="add" title="Add item" style="height:40px;width:40px;padding:0;display:flex;align-items:center;justify-content:center;">
            <i data-lucide="plus" style="width:20px;height:20px;"></i>
          </button>
        </div>

        <div id="suggestions" style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem;"></div>

        ${this.selectMode ? `
        <div style="display:flex;gap:.5rem;margin-bottom:.75rem;align-items:center;flex-wrap:wrap;">
          <span class="badge" style="margin-right:.5rem;">${this.selectedIds.size} selected</span>
          <button class="btn btn-secondary" data-action="delete-selected" style="display:flex;align-items:center;gap:.25rem;">
            <i data-lucide="trash-2" style="width:16px;height:16px;"></i> Delete
          </button>
          <button class="btn btn-secondary" data-action="move-selected" style="display:flex;align-items:center;gap:.25rem;">
            <i data-lucide="arrow-right-left" style="width:16px;height:16px;"></i> Move
          </button>
          <button class="btn btn-secondary" data-action="cancel-select">Cancel</button>
        </div>` : ''}

        <div id="items-list"></div>

        <div id="clear-section" style="display:none;text-align:center;margin-top:1rem;">
          <button class="btn btn-secondary" data-action="clear-checked" style="display:inline-flex;align-items:center;gap:.25rem;">
            <i data-lucide="check-check" style="width:16px;height:16px;"></i> Clear Checked
          </button>
        </div>
      </div>

      <cc-modal id="confirm-modal" title="Confirm" size="sm">
        <p id="confirm-msg"></p>
        <div slot="footer" style="display:flex;gap:.5rem;justify-content:flex-end;">
          <button class="btn btn-secondary" data-action="confirm-cancel">Cancel</button>
          <button class="btn btn-primary" data-action="confirm-ok" style="background:var(--danger,var(--red));">Confirm</button>
        </div>
      </cc-modal>

      <cc-modal id="move-modal" title="Move to Store" size="sm">
        <div id="move-options" style="display:flex;flex-direction:column;gap:.5rem;"></div>
      </cc-modal>
    `;
    if (window.lucide) lucide.createIcons({ nodes: [this] });
  }

  _renderItems() {
    const list = this.querySelector('#items-list');
    if (!list) return;

    if (!this.items.length) {
      list.innerHTML = '<cc-empty-state message="No items yet — add something above!" icon="shopping-cart"></cc-empty-state>';
      this._updateClearBtn();
      return;
    }

    const sorted = this._sortItems([...this.items]);
    const grouped = this.sortBy === 'category';

    if (grouped) {
      const groups = {};
      for (const item of sorted) {
        const cat = item.category || 'other';
        (groups[cat] = groups[cat] || []).push(item);
      }
      list.innerHTML = Object.entries(groups).map(([cat, items]) =>
        `<div style="margin-bottom:1rem;">
          <div style="font-size:.85rem;color:var(--text-secondary);font-weight:600;margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em;">${this._esc(this._catLabel(cat))}</div>
          ${items.map(i => this._renderItem(i)).join('')}
        </div>`
      ).join('');
    } else {
      list.innerHTML = sorted.map(i => this._renderItem(i)).join('');
    }

    this._updateClearBtn();
    this._bindItemEvents();
    if (window.lucide) lucide.createIcons({ nodes: [list] });
  }

  _renderItem(item) {
    const checked = item.in_cart ? 'checked' : '';
    const opacity = item.in_cart ? 'opacity:.5;' : '';
    const strike = item.in_cart ? 'text-decoration:line-through;color:var(--text-secondary);' : '';
    const sel = this.selectMode ? `<input type="checkbox" class="sel-check" data-id="${this._escAttr(item.id)}" ${this.selectedIds.has(item.id) ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer;">` : '';

    return `<div class="card" data-id="${this._escAttr(item.id)}" draggable="${this.sortBy === 'manual' ? 'true' : 'false'}"
      style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;margin-bottom:.5rem;${opacity}touch-action:pan-y;cursor:${this.sortBy === 'manual' ? 'grab' : 'default'};">
      ${sel}
      ${this.sortBy === 'manual' ? '<i data-lucide="grip-vertical" style="width:16px;height:16px;color:var(--text-secondary);flex-shrink:0;"></i>' : ''}
      <input type="checkbox" class="item-check" data-id="${this._escAttr(item.id)}" ${checked} style="width:20px;height:20px;cursor:pointer;flex-shrink:0;">
      <div style="flex:1;min-width:0;">
        <span style="font-weight:500;${strike}">${this._esc(item.item_name)}</span>
        ${item.quantity > 1 ? `<span style="color:var(--text-secondary);font-size:.85rem;margin-left:.5rem;">×${item.quantity}</span>` : ''}
        <span class="pill" style="font-size:.7rem;margin-left:.5rem;">${this._esc(this._catLabel(item.category || 'other'))}</span>
      </div>
      <button class="btn btn-secondary" data-action="delete-item" data-id="${this._escAttr(item.id)}" title="Delete" style="padding:.25rem;width:32px;height:32px;display:flex;align-items:center;justify-content:center;min-width:unset;">
        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
      </button>
    </div>`;
  }

  _sortItems(items) {
    switch (this.sortBy) {
      case 'name': return items.sort((a, b) => a.item_name.localeCompare(b.item_name));
      case 'category': return items.sort((a, b) => (a.category || 'other').localeCompare(b.category || 'other'));
      case 'date': return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'checked': return items.sort((a, b) => (a.in_cart ? 1 : 0) - (b.in_cart ? 1 : 0));
      default: return items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  }

  _updateClearBtn() {
    const btn = this.querySelector('#clear-section');
    if (btn) btn.style.display = this.items.some(i => i.in_cart) ? 'block' : 'none';
  }

  async _loadSuggestions() {
    const el = this.querySelector('#suggestions');
    if (!el) return;
    const recent = await this.db.getRecentItems(8);
    const currentNames = new Set(this.items.map(i => i.item_name.toLowerCase()));
    const suggestions = recent.filter(r => !currentNames.has(r.name.toLowerCase()));
    if (!suggestions.length) { el.innerHTML = ''; return; }
    el.innerHTML = suggestions.map(s =>
      `<button class="pill" data-action="quick-add" data-name="${this._escAttr(s.name)}" data-cat="${this._escAttr(s.category)}" style="cursor:pointer;border:1px solid var(--border-color);">
        <i data-lucide="plus" style="width:12px;height:12px;"></i> ${this._esc(s.name)}
      </button>`
    ).join('');
    if (window.lucide) lucide.createIcons({ nodes: [el] });
  }

  async loadItems() {
    this.items = await this.db.getItems(this.currentStore);
    this._renderItems();
    this._loadSuggestions();
    this._updateTabCounts();
  }

  async _updateTabCounts() {
    await this._refreshCounts();
    const tabs = this.querySelector('cc-tabs');
    if (!tabs) return;
    STORES.forEach(s => {
      const tab = tabs.querySelector(`cc-tab[name="${CSS.escape(s.name)}"]`);
      if (tab) tab.setAttribute('label', this._storeLabel(s));
    });
  }

  _bindEvents() {
    // Tab change
    this.querySelector('cc-tabs')?.addEventListener('tab-change', e => {
      const name = e.detail?.tab;
      if (name) this._switchStore(name);
    });

    // Add button
    this.querySelector('[data-action="add"]')?.addEventListener('click', () => this._addItem());

    // Enter key on name field
    this.querySelector('cc-field[name="item-name"]')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') this._addItem();
    });

    // View toggle
    this.querySelector('cc-view-toggle')?.addEventListener('cc-view-change', e => {
      this.viewMode = e.detail.view;
      this._renderItems();
    });

    // Sort dropdown
    this.querySelector('cc-pill-dropdown[name="sort"]')?.addEventListener('pill-dropdown-change', e => {
      this.sortBy = e.detail?.value || 'manual';
      this._renderItems();
    });

    // Clear checked
    this.addEventListener('click', e => {
      const action = e.target.closest('[data-action]')?.dataset?.action;
      if (!action) return;

      if (action === 'clear-checked') this._confirmClear();
      else if (action === 'delete-selected') this._deleteSelected();
      else if (action === 'move-selected') this._showMoveModal();
      else if (action === 'cancel-select') { this.selectMode = false; this.selectedIds.clear(); this.render(); this.loadItems(); }
      else if (action === 'confirm-cancel') this.querySelector('#confirm-modal')?.close();
      else if (action === 'confirm-ok') { this._confirmCb?.(); this.querySelector('#confirm-modal')?.close(); }
      else if (action === 'quick-add') {
        const btn = e.target.closest('[data-action="quick-add"]');
        this._quickAdd(btn.dataset.name, btn.dataset.cat);
      }
      else if (action === 'move-to') {
        const store = e.target.closest('[data-action="move-to"]')?.dataset?.store;
        if (store) this._moveSelectedTo(store);
      }
    });
  }

  _bindItemEvents() {
    // Checkboxes
    this.querySelectorAll('.item-check').forEach(cb => {
      cb.addEventListener('change', e => {
        this.db.toggleInCart(e.target.dataset.id, e.target.checked).then(() => this.loadItems());
      });
    });

    // Select checkboxes
    this.querySelectorAll('.sel-check').forEach(cb => {
      cb.addEventListener('change', e => {
        if (e.target.checked) this.selectedIds.add(e.target.dataset.id);
        else this.selectedIds.delete(e.target.dataset.id);
        const badge = this.querySelector('.badge');
        if (badge) badge.textContent = `${this.selectedIds.size} selected`;
      });
    });

    // Delete buttons
    this.querySelectorAll('[data-action="delete-item"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = e.target.closest('[data-id]').dataset.id;
        this._deleteItem(id);
      });
    });

    // Long press for select mode
    this.querySelectorAll('#items-list .card').forEach(card => {
      let timer;
      card.addEventListener('pointerdown', () => {
        timer = setTimeout(() => {
          if (!this.selectMode) {
            this.selectMode = true;
            this.selectedIds.add(card.dataset.id);
            this.render();
            this.loadItems();
          }
        }, 500);
      });
      card.addEventListener('pointerup', () => clearTimeout(timer));
      card.addEventListener('pointerleave', () => clearTimeout(timer));
    });

    // Drag and drop (manual sort)
    if (this.sortBy === 'manual') {
      this.querySelectorAll('#items-list .card[draggable="true"]').forEach(card => {
        card.addEventListener('dragstart', e => {
          this._dragItem = card.dataset.id;
          card.style.opacity = '0.4';
          e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => {
          card.style.opacity = '1';
          this._dragItem = null;
        });
        card.addEventListener('dragover', e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          card.style.borderTop = '2px solid var(--accent-color)';
        });
        card.addEventListener('dragleave', () => {
          card.style.borderTop = '';
        });
        card.addEventListener('drop', e => {
          e.preventDefault();
          card.style.borderTop = '';
          if (this._dragItem && this._dragItem !== card.dataset.id) {
            this._reorder(this._dragItem, card.dataset.id);
          }
        });

        // Touch drag support
        let touchY = 0;
        card.addEventListener('touchstart', e => {
          this._touchStartX = e.touches[0].clientX;
          touchY = e.touches[0].clientY;
        }, { passive: true });
        card.addEventListener('touchmove', e => {
          const dx = e.touches[0].clientX - this._touchStartX;
          if (Math.abs(dx) > 60) {
            card.style.transform = `translateX(${dx}px)`;
            card.style.opacity = Math.max(0.3, 1 - Math.abs(dx) / 200);
          }
        }, { passive: true });
        card.addEventListener('touchend', e => {
          const dx = (e.changedTouches[0]?.clientX || 0) - this._touchStartX;
          if (Math.abs(dx) > 120) {
            this._deleteItem(card.dataset.id);
          } else {
            card.style.transform = '';
            card.style.opacity = '';
          }
        });
      });
    }
  }

  async _reorder(dragId, dropId) {
    const sorted = this._sortItems([...this.items]);
    const dragIdx = sorted.findIndex(i => i.id === dragId);
    const dropIdx = sorted.findIndex(i => i.id === dropId);
    if (dragIdx < 0 || dropIdx < 0) return;
    const [moved] = sorted.splice(dragIdx, 1);
    sorted.splice(dropIdx, 0, moved);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].sort_order !== i) {
        await this.db.updateSortOrder(sorted[i].id, i);
      }
    }
    await this.loadItems();
  }

  async _switchStore(store) {
    this.currentStore = store;
    const h2 = this.querySelector('h2');
    if (h2) h2.textContent = store;
    this.selectedIds.clear();
    this.selectMode = false;
    await this.loadItems();
  }

  async _addItem() {
    const nameField = this.querySelector('cc-field[name="item-name"]');
    const qtyField = this.querySelector('cc-field[name="item-qty"]');
    const catField = this.querySelector('cc-field[name="item-cat"]');
    const name = nameField?.getValue?.()?.trim?.() || '';
    const qty = parseInt(qtyField?.getValue?.()) || 1;
    const cat = catField?.getValue?.() || 'other';
    if (!name) { window.showToast?.('Enter an item name', 2000); return; }
    await this.db.addItem(this.currentStore, name, qty, cat);
    window.showToast?.(`Added ${name}`, 2000);
    nameField?.clear?.();
    qtyField?.setValue?.('1');
    nameField?.focus?.();
    await this.loadItems();
  }

  async _quickAdd(name, cat) {
    await this.db.addItem(this.currentStore, name, 1, cat || 'other');
    window.showToast?.(`Added ${name}`, 2000);
    await this.loadItems();
  }

  async _deleteItem(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    await this.db.deleteItem(id);
    window.showToast?.(`Removed ${item.item_name}`, 2000);
    await this.loadItems();
  }

  _confirmClear() {
    const checked = this.items.filter(i => i.in_cart);
    if (!checked.length) return;
    const modal = this.querySelector('#confirm-modal');
    const msg = this.querySelector('#confirm-msg');
    if (msg) msg.textContent = `Delete ${checked.length} checked item${checked.length !== 1 ? 's' : ''}?`;
    this._confirmCb = async () => {
      await this.db.clearStore(this.currentStore);
      window.showToast?.(`Cleared ${checked.length} item${checked.length !== 1 ? 's' : ''}`, 2000);
      await this.loadItems();
    };
    modal?.open();
  }

  async _deleteSelected() {
    if (!this.selectedIds.size) return;
    const modal = this.querySelector('#confirm-modal');
    const msg = this.querySelector('#confirm-msg');
    if (msg) msg.textContent = `Delete ${this.selectedIds.size} selected item${this.selectedIds.size !== 1 ? 's' : ''}?`;
    this._confirmCb = async () => {
      await this.db.deleteItems([...this.selectedIds]);
      window.showToast?.(`Deleted ${this.selectedIds.size} items`, 2000);
      this.selectedIds.clear();
      this.selectMode = false;
      this.render();
      await this.loadItems();
    };
    modal?.open();
  }

  _showMoveModal() {
    if (!this.selectedIds.size) return;
    const modal = this.querySelector('#move-modal');
    const opts = this.querySelector('#move-options');
    if (opts) {
      opts.innerHTML = STORES.filter(s => s.name !== this.currentStore).map(s =>
        `<button class="btn btn-secondary" data-action="move-to" data-store="${this._escAttr(s.name)}" style="width:100%;justify-content:center;">
          <i data-lucide="${s.icon}" style="width:16px;height:16px;margin-right:.5rem;"></i> ${this._esc(s.name)}
        </button>`
      ).join('');
      if (window.lucide) lucide.createIcons({ nodes: [opts] });
    }
    modal?.open();
  }

  async _moveSelectedTo(store) {
    for (const id of this.selectedIds) {
      await this.db.moveToStore(id, store);
    }
    window.showToast?.(`Moved ${this.selectedIds.size} items to ${store}`, 2000);
    this.querySelector('#move-modal')?.close();
    this.selectedIds.clear();
    this.selectMode = false;
    this.render();
    await this.loadItems();
  }
}

customElements.define('cc-shopping-list', CcShoppingList);
