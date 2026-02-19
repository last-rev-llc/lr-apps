/* Daily Updates — Supabase data layer */

class DailyUpdatesDB {
  constructor(sb) { 
    this._sb = sb; 
  }

  static async init() {
    if (!window.supabase) throw new Error('Supabase client not initialized');
    return new DailyUpdatesDB(window.supabase);
  }

  // Get all daily updates with filtering and pagination
  async getUpdates({ 
    source_app, 
    category, 
    search, 
    time_range = 'all',
    orderBy = 'created_at', 
    desc = true,
    limit = 50,
    offset = 0
  } = {}) {
    const filters = {};
    
    if (source_app && source_app !== 'all') {
      filters.source_app = `eq.${source_app}`;
    }
    
    if (category && category !== 'all') {
      filters.category = `eq.${category}`;
    }
    
    if (search) {
      filters.or = `(title.ilike.*${search}*,body.ilike.*${search}*,source_name.ilike.*${search}*)`;
    }

    // Time range filtering
    if (time_range !== 'all') {
      const now = new Date();
      let cutoff;
      switch (time_range) {
        case 'day':
          // Start of today (00:00:00)
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          // Start of this week (Monday 00:00:00)
          const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
          break;
        case 'month':
          // Start of this month (1st day 00:00:00)
          cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      if (cutoff) {
        filters.created_at = `gte.${cutoff.toISOString()}`;
      }
    }

    return this._sb.select('daily_updates', {
      filters,
      order: `${orderBy}.${desc ? 'desc' : 'asc'}`,
      limit,
      offset
    });
  }

  // Get single update by ID
  async getUpdate(id) {
    const rows = await this._sb.select('daily_updates', { 
      filters: { id: `eq.${id}` }, 
      limit: 1 
    });
    return rows[0] || null;
  }

  // Add or update an update
  async upsertUpdate(update) {
    update.updated_at = new Date().toISOString();
    if (!update.created_at) {
      update.created_at = new Date().toISOString();
    }
    
    // Ensure reactions is an object
    if (!update.reactions) {
      update.reactions = {};
    }
    
    // Ensure links is an array
    if (!update.links) {
      update.links = [];
    }
    
    // Ensure tags is an array
    if (!update.tags) {
      update.tags = [];
    }
    
    return this._sb.upsert('daily_updates', update);
  }

  // Toggle reaction on an update
  async toggleReaction(updateId, emoji) {
    const update = await this.getUpdate(updateId);
    if (!update) return null;

    const reactions = { ...update.reactions };
    if (reactions[emoji]) {
      reactions[emoji]++;
    } else {
      reactions[emoji] = 1;
    }

    return this._sb.update('daily_updates', { 
      reactions,
      updated_at: new Date().toISOString()
    }, { 
      id: `eq.${updateId}` 
    });
  }

  // Remove reaction from an update
  async removeReaction(updateId, emoji) {
    const update = await this.getUpdate(updateId);
    if (!update) return null;

    const reactions = { ...update.reactions };
    if (reactions[emoji] && reactions[emoji] > 1) {
      reactions[emoji]--;
    } else {
      delete reactions[emoji];
    }

    return this._sb.update('daily_updates', { 
      reactions,
      updated_at: new Date().toISOString()
    }, { 
      id: `eq.${updateId}` 
    });
  }

  // Delete an update
  async deleteUpdate(id) {
    return this._sb.delete('daily_updates', { id: `eq.${id}` });
  }

  // Get unique source apps for filtering
  async getSourceApps() {
    const updates = await this._sb.select('daily_updates', {
      select: 'source_app,source_name,source_icon'
    });
    
    const apps = new Map();
    updates.forEach(u => {
      if (!apps.has(u.source_app)) {
        apps.set(u.source_app, {
          id: u.source_app,
          name: u.source_name,
          icon: u.source_icon
        });
      }
    });
    
    return Array.from(apps.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get unique categories for filtering
  async getCategories() {
    const updates = await this._sb.select('daily_updates', {
      select: 'category'
    });
    
    const categories = new Set();
    updates.forEach(u => {
      if (u.category) categories.add(u.category);
    });
    
    return Array.from(categories).sort();
  }

  // Profile management
  async getProfiles() {
    return this._sb.select('daily_update_profiles', {
      order: 'name.asc'
    });
  }

  async getProfile(id) {
    const rows = await this._sb.select('daily_update_profiles', { 
      filters: { id: `eq.${id}` }, 
      limit: 1 
    });
    return rows[0] || null;
  }

  async upsertProfile(profile) {
    profile.updated_at = new Date().toISOString();
    if (!profile.created_at) {
      profile.created_at = new Date().toISOString();
    }
    return this._sb.upsert('daily_update_profiles', profile);
  }

  async deleteProfile(id) {
    return this._sb.delete('daily_update_profiles', { id: `eq.${id}` });
  }

  // Increment post count for a profile
  async incrementPostCount(profileId) {
    const profile = await this.getProfile(profileId);
    if (profile) {
      profile.post_count = (profile.post_count || 0) + 1;
      return this.upsertProfile(profile);
    }
    return null;
  }
}

window.DailyUpdatesDB = DailyUpdatesDB;