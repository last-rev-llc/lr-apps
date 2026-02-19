/* Dad Joke of the Day — Supabase-backed database */

class DadJokeDB {
  constructor() {
    this.sb = window.supabase;
    if (!this.sb) throw new Error('Supabase client not initialized');
  }

  async getAllJokes() {
    return this.sb.select('dad_jokes', { filters: { active: 'eq.true' }, order: 'id.asc' });
  }

  async getJoke(id) {
    const rows = await this.sb.select('dad_jokes', { filters: { id: `eq.${id}` }, limit: 1 });
    return rows[0] || null;
  }

  async getByCategory(category) {
    return this.sb.select('dad_jokes', { filters: { category: `eq.${category}`, active: 'eq.true' } });
  }

  async addJoke(setup, punchline, category = 'Classic', source = 'manual') {
    return this.sb.upsert('dad_jokes', {
      setup, punchline, category, source, active: true,
      updated_at: new Date().toISOString()
    });
  }

  async rateJoke(id, rating) {
    const joke = await this.getJoke(id);
    if (!joke) return;
    const timesRated = (joke.times_rated || 0) + 1;
    const ratingMap = { groan: 1, eyeroll: 2, funny: 3, nocap: 4, sus: 1, brainrot: 2, ratio: 1, bussin: 4 };
    const newRating = (((joke.rating || 0) * (timesRated - 1)) + (ratingMap[rating] || 2)) / timesRated;
    return this.sb.update('dad_jokes', {
      rating: Math.round(newRating * 100) / 100,
      times_rated: timesRated,
      updated_at: new Date().toISOString()
    }, { id: `eq.${id}` });
  }

  async markShown(id) {
    const joke = await this.getJoke(id);
    if (!joke) return;
    return this.sb.update('dad_jokes', {
      times_shown: (joke.times_shown || 0) + 1,
      updated_at: new Date().toISOString()
    }, { id: `eq.${id}` });
  }

  async setFeatured(id, date) {
    return this.sb.update('dad_jokes', {
      featured_date: date,
      updated_at: new Date().toISOString()
    }, { id: `eq.${id}` });
  }

  async deleteJoke(id) {
    return this.sb.update('dad_jokes', { active: false, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
  }

  async getCategories() {
    const jokes = await this.getAllJokes();
    return [...new Set(jokes.map(j => j.category).filter(Boolean))].sort();
  }

  async stats() {
    const jokes = await this.getAllJokes();
    return {
      total: jokes.length,
      categories: [...new Set(jokes.map(j => j.category))].length,
      totalRatings: jokes.reduce((s, j) => s + (j.times_rated || 0), 0),
      avgRating: jokes.filter(j => j.times_rated > 0).reduce((s, j, _, a) => s + j.rating / a.length, 0)
    };
  }
}

// Auto-init
window.dadJokeDB = new DadJokeDB();
