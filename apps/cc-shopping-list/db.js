/* cc-shopping-list — Supabase data layer */
/* Table: shopping_items */

class ShoppingDB {
  constructor(sb) { this._sb = sb; }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new ShoppingDB(window.supabase);
  }

  async getItems(store) {
    return (await this._sb.select('shopping_items', {
      filters: { store: `eq.${store}` },
      order: 'sort_order.asc,created_at.desc'
    })) || [];
  }

  async getAllItems() {
    return (await this._sb.select('shopping_items', {
      order: 'store.asc,sort_order.asc,created_at.desc'
    })) || [];
  }

  async getStoreCounts() {
    const all = await this.getAllItems();
    const counts = {};
    for (const item of all) {
      counts[item.store] = (counts[item.store] || 0) + 1;
    }
    return counts;
  }

  async getRecentItems(limit = 10) {
    const all = await this._sb.select('shopping_items', {
      order: 'created_at.desc'
    }) || [];
    const seen = new Set();
    const recent = [];
    for (const item of all) {
      const key = item.item_name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        recent.push({ name: item.item_name, category: item.category || 'other' });
        if (recent.length >= limit) break;
      }
    }
    return recent;
  }

  async addItem(store, itemName, quantity = 1, category = 'other') {
    const items = await this.getItems(store);
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order || 0), 0);
    return this._sb.upsert('shopping_items', {
      id: 'si-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      store, item_name: itemName, quantity, category,
      in_cart: false, sort_order: maxOrder + 1,
      created_at: new Date().toISOString()
    });
  }

  async toggleInCart(id, inCart) {
    return this._sb.update('shopping_items', { in_cart: inCart, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
  }

  async updateSortOrder(id, sortOrder) {
    return this._sb.update('shopping_items', { sort_order: sortOrder, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
  }

  async moveToStore(id, newStore) {
    return this._sb.update('shopping_items', { store: newStore, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
  }

  async deleteItem(id) {
    return this._sb.delete('shopping_items', { id: `eq.${id}` });
  }

  async deleteItems(ids) {
    for (const id of ids) await this.deleteItem(id);
  }

  async clearStore(store) {
    return this._sb.delete('shopping_items', { store: `eq.${store}`, in_cart: 'eq.true' });
  }
}

window.ShoppingDB = ShoppingDB;
