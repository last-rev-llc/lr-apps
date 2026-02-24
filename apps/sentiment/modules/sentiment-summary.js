class SentimentSummary extends HTMLElement {
  constructor() {
    super();
    this.data = null;
  }

  connectedCallback() {
    this.render();
    this.loadData();
  }

  render() {
    this.innerHTML = `
      <style>
        .sentiment-summary { 
          background: var(--card-bg); 
          border: 1px solid var(--border); 
          border-radius: 12px; 
          padding: 1.25rem; 
        }
        .sentiment-summary h3 { 
          margin: 0 0 1rem; 
          font-size: 1rem; 
          display: flex; 
          align-items: center; 
          gap: .5rem; 
        }
        .sentiment-summary .summary-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: .75rem; 
        }
        .sentiment-summary .summary-item { 
          text-align: center; 
        }
        .sentiment-summary .summary-value { 
          font-size: 1.5rem; 
          font-weight: 700; 
          color: var(--accent); 
        }
        .sentiment-summary .summary-label { 
          font-size: .75rem; 
          color: var(--muted); 
          margin-top: .25rem; 
        }
        .sentiment-summary .loading { 
          text-align: center; 
          color: var(--muted); 
          padding: 1rem; 
        }
      </style>
      <div class="sentiment-summary">
        <h3>💜 Team Sentiment</h3>
        <div id="content" class="loading">Loading...</div>
      </div>
    `;
  }

  async loadData() {
    try {
      const supabase = window.supabase;
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('sentiment_entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      this.data = data.map(row => ({
        sentiment: row.sentiment_score,
        blockers: row.blockers || [],
        highlights: row.highlights || []
      }));

      this.renderContent();
    } catch(e) {
      console.error('Failed to load sentiment summary:', e);
      const content = this.querySelector('#content');
      if (content) {
        content.innerHTML = '<div style="color:var(--danger);font-size:.85rem;">Failed to load</div>';
      }
    }
  }

  renderContent() {
    const content = this.querySelector('#content');
    if (!content || !this.data || !this.data.length) {
      if (content) content.innerHTML = '<div style="color:var(--muted);font-size:.85rem;">No data</div>';
      return;
    }

    const avg = (this.data.reduce((s,x) => s + x.sentiment, 0) / this.data.length).toFixed(1);
    const blocked = this.data.filter(x => x.blockers?.length > 0).length;
    const highlights = this.data.reduce((s,x) => s + (x.highlights?.length || 0), 0);

    content.className = 'summary-grid';
    content.innerHTML = `
      <div class="summary-item">
        <div class="summary-value">${avg}</div>
        <div class="summary-label">Avg Score</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${this.data.length}</div>
        <div class="summary-label">Entries</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${blocked}</div>
        <div class="summary-label">Blocked</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${highlights}</div>
        <div class="summary-label">Highlights</div>
      </div>
    `;
  }
}

customElements.define('sentiment-summary', SentimentSummary);
