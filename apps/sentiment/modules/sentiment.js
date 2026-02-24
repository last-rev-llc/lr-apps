class TeamSentiment extends HTMLElement {
  constructor() {
    super();
    this.data = [];
    this.selectedMember = 'all';
    this.chart = null;
  }

  connectedCallback() {
    this.render();
    this.loadData();
  }

  disconnectedCallback() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  render() {
    this.innerHTML = `
      <style>
        .filter-bar { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; text-align: center; }
        .stat-card .value { font-size: 2rem; font-weight: 700; color: var(--accent); }
        .stat-card .label { font-size: .85rem; color: var(--muted); margin-top: .25rem; }
        .chart-container { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
        .chart-container h2 { font-size: 1.1rem; margin: 0 0 1rem; }
        .chart-container canvas { width: 100% !important; max-height: 300px; }
        .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .member-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
        .member-card h3 { margin: 0 0 .5rem; font-size: 1rem; }
        .member-card .mood-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: .75rem; font-weight: 600; }
        .member-card .mood-badge.positive { background: var(--green); color: #000; }
        .member-card .mood-badge.excited { background: var(--accent); color: #000; }
        .member-card .mood-badge.neutral { background: var(--muted); color: var(--text); }
        .member-card .mood-badge.frustrated { background: var(--orange); color: #000; }
        .member-card .mood-badge.blocked { background: var(--danger, var(--red)); color: #fff; }
        .member-card .sentiment-bar { height: 6px; border-radius: 3px; background: var(--border); margin: .75rem 0 .5rem; overflow: hidden; }
        .member-card .sentiment-bar .fill { height: 100%; border-radius: 3px; background: var(--accent); }
        .member-card .detail { font-size: .85rem; color: var(--muted); margin-top: .5rem; }
        .member-card .blockers { color: var(--danger, var(--red)); font-size: .8rem; margin-top: .5rem; }
        .timeline { margin-bottom: 2rem; }
        .timeline h2 { font-size: 1.1rem; margin: 0 0 1rem; }
        .day-group { margin-bottom: 1.5rem; }
        .day-group h3 { font-size: .9rem; color: var(--muted); margin: 0 0 .75rem; border-bottom: 1px solid var(--border); padding-bottom: .5rem; }
        .day-entries { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: .75rem; }
        .entry-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 1rem; font-size: .85rem; }
        .entry-card .entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .5rem; }
        .entry-card .entry-name { font-weight: 600; }
        .entry-card .entry-score { font-weight: 700; font-size: 1.1rem; }
        .entry-card .entry-summary { color: var(--muted); }
        .entry-card .entry-highlights { color: var(--green); font-size: .8rem; margin-top: .35rem; }
        .entry-card .entry-blockers { color: var(--danger, var(--red)); font-size: .8rem; margin-top: .35rem; }
      </style>

      <div class="filter-bar" id="filters"></div>
      <div class="stats-row" id="stats"></div>
      <div class="chart-container">
        <h2>Sentiment Trend</h2>
        <canvas id="trendChart"></canvas>
      </div>
      <h2 style="font-size:1.1rem;margin:0 0 1rem;">Team Members</h2>
      <cc-stagger animation="fade-up" delay="60">
        <div class="member-grid" id="members"></div>
      </cc-stagger>
      <div class="timeline">
        <h2>Daily Timeline</h2>
        <div id="timeline"></div>
      </div>
    `;
  }

  esc(str) {
    const el = document.createElement('span');
    el.textContent = str ?? '';
    return el.innerHTML;
  }

  escAttr(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
      
      // Transform Supabase data to match old format
      this.data = data.map(row => ({
        id: row.id,
        date: row.date,
        member: row.member_name,
        sentiment: row.sentiment_score,
        mood: row.mood,
        summary: row.work_summary,
        blockers: row.blockers || [],
        highlights: row.highlights || []
      }));

      this.updateDisplay();
    } catch(e) {
      console.error('Failed to load sentiment data:', e);
      window.showToast?.('Failed to load sentiment data', 3000);
    }
  }

  filtered() {
    if (this.selectedMember === 'all') return this.data;
    return this.data.filter(d => d.member === this.selectedMember);
  }

  updateDisplay() {
    this.renderFilters();
    this.renderStats();
    this.renderMembers();
    this.renderTimeline();
    this.renderChart();
  }

  renderFilters() {
    const members = [...new Set(this.data.map(d => d.member))].sort();
    const items = [{ value: 'all', label: 'All Members' }, ...members.map(m => ({ value: m, label: m }))];
    const filtersEl = this.querySelector('#filters');
    filtersEl.innerHTML =
      `<cc-pill-dropdown label="Member" items='${this.escAttr(JSON.stringify(items))}' value="${this.escAttr(this.selectedMember)}"></cc-pill-dropdown>`;
    filtersEl.querySelector('cc-pill-dropdown')
      ?.addEventListener('dropdown-change', e => { 
        this.selectedMember = e.detail.value; 
        this.updateDisplay(); 
      });
  }

  renderStats() {
    const d = this.filtered();
    const avg = d.length ? (d.reduce((s,x) => s + x.sentiment, 0) / d.length).toFixed(1) : '—';
    const blocked = d.filter(x => x.blockers?.length > 0).length;
    const highlights = d.reduce((s,x) => s + (x.highlights?.length || 0), 0);
    const members = new Set(d.map(x => x.member)).size;
    this.querySelector('#stats').innerHTML = `
      <div class="stat-card"><div class="value">${this.esc(avg)}</div><div class="label">Avg Sentiment</div></div>
      <div class="stat-card"><div class="value">${d.length}</div><div class="label">Total Entries</div></div>
      <div class="stat-card"><div class="value">${members}</div><div class="label">Team Members</div></div>
      <div class="stat-card"><div class="value">${blocked}</div><div class="label">Blocked Days</div></div>
      <div class="stat-card"><div class="value">${highlights}</div><div class="label">Highlights</div></div>`;
  }

  renderMembers() {
    const d = this.filtered();
    const members = [...new Set(d.map(x => x.member))].sort();
    const el = this.querySelector('#members');
    if (!members.length) {
      el.innerHTML = '<cc-empty-state message="No members found" icon="👥"></cc-empty-state>';
      return;
    }
    el.innerHTML = members.map(m => {
      const entries = d.filter(x => x.member === m).sort((a,b) => b.date.localeCompare(a.date));
      const latest = entries[0];
      const avg = (entries.reduce((s,x) => s + x.sentiment, 0) / entries.length).toFixed(1);
      const blockerCount = entries.filter(x => x.blockers?.length > 0).length;
      return `<div class="member-card">
        <h3>${this.esc(m)}</h3>
        <span class="mood-badge ${this.escAttr(latest.mood)}">${this.esc(latest.mood)}</span>
        <div class="sentiment-bar"><div class="fill" style="width:${(avg/10*100).toFixed(0)}%"></div></div>
        <div class="detail">Avg: <strong>${this.esc(avg)}</strong>/10 over ${entries.length} days</div>
        <div class="detail">Latest: ${this.esc(latest.summary)}</div>
        ${blockerCount ? `<div class="blockers">⚠ ${blockerCount} blocked day${blockerCount>1?'s':''}</div>` : ''}
      </div>`;
    }).join('');
  }

  renderTimeline() {
    const d = this.filtered();
    const dates = [...new Set(d.map(x => x.date))].sort().reverse();
    const el = this.querySelector('#timeline');
    if (!dates.length) {
      el.innerHTML = '<cc-empty-state message="No entries yet" icon="📅"></cc-empty-state>';
      return;
    }
    el.innerHTML = dates.map(date => {
      const entries = d.filter(x => x.date === date);
      return `<div class="day-group">
        <h3>${this.esc(date)}</h3>
        <div class="day-entries">${entries.map(e => `
          <div class="entry-card">
            <div class="entry-header">
              <span class="entry-name">${this.esc(e.member)}</span>
              <span class="entry-score" style="color:${e.sentiment >= 7 ? 'var(--green)' : e.sentiment >= 5 ? 'var(--accent)' : 'var(--danger, var(--red))'}">${e.sentiment}/10</span>
            </div>
            <div class="entry-summary">${this.esc(e.summary)}</div>
            ${e.highlights?.length ? `<div class="entry-highlights">✨ ${e.highlights.map(h => this.esc(h)).join(', ')}</div>` : ''}
            ${e.blockers?.length ? `<div class="entry-blockers">🚧 ${e.blockers.map(b => this.esc(b)).join(', ')}</div>` : ''}
          </div>`).join('')}
        </div>
      </div>`;
    }).join('');
  }

  renderChart() {
    const d = this.filtered();
    const dates = [...new Set(d.map(x => x.date))].sort();
    const canvas = this.querySelector('#trendChart');
    if (!canvas) return;

    if (this.selectedMember !== 'all') {
      const entries = dates.map(date => d.find(x => x.date === date)?.sentiment ?? null);
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{ 
            label: this.selectedMember, 
            data: entries, 
            borderColor: '#f59e0b', 
            backgroundColor: 'rgba(245,158,11,.15)', 
            fill: true, 
            tension: .3 
          }]
        },
        options: { 
          responsive: true, 
          scales: { y: { min: 0, max: 10 } }, 
          plugins: { legend: { display: false } } 
        }
      });
    } else {
      const members = [...new Set(d.map(x => x.member))].sort();
      const colors = ['#f59e0b','#3b82f6','#22c55e','#ef4444','#a855f7'];
      const datasets = members.map((m,i) => ({
        label: m,
        data: dates.map(date => d.find(x => x.date === date && x.member === m)?.sentiment ?? null),
        borderColor: colors[i % colors.length],
        tension: .3,
        fill: false
      }));
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(canvas, {
        type: 'line',
        data: { labels: dates, datasets },
        options: { 
          responsive: true, 
          scales: { y: { min: 0, max: 10 } } 
        }
      });
    }
  }
}

customElements.define('team-sentiment', TeamSentiment);
