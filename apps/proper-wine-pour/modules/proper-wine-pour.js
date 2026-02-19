/* proper-wine-pour — Main app component */
class ProperWinePour extends HTMLElement {
  _esc(s) { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; }
  _escAttr(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  connectedCallback() {
    this._data = [];
    this._tab = 'guide';
    this._calcBottle = 45;
    this._calcPour = 5;
    this._calcMarkup = 350;
    this._calcPrice = 18;
    this._trackerRating = 'all';
    this._wallType = 'all';
    this._wallPosts = [];
    this._pourLogs = [];
    this._loadData();
  }

  async _loadData() {
    try {
      const src = this.getAttribute('src');
      if (src) {
        const r = await fetch(src);
        this._data = await r.json();
      }
    } catch(e) { window.showToast?.('Could not load restaurant data'); }
    try {
      this._db = await WinePourDB.init();
      this._pourLogs = await this._db.getPours();
      this._wallPosts = await this._db.getWallPosts();
    } catch(e) { /* DB not available, using local data */ }
    this._render();
  }

  _render() {
    const generous = this._data.filter(r => r.pour_rating === 'generous');
    const stingy = this._data.filter(r => r.pour_rating === 'stingy' || r.pour_rating === 'criminal');
    this.innerHTML = `
      <style>
        .wine-app { max-width: 960px; margin: 0 auto; padding: 1.5rem 1rem; }
        .wine-glass-svg { display: inline-block; }
        .pour-level { transition: height 0.5s ease; }
        .glass-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin: 24px 0; }
        .glass-card { text-align: center; padding: 20px; }
        .glass-card h4 { color: var(--heading); margin: 12px 0 4px; font-family: var(--serif); }
        .glass-card p { color: var(--muted); font-size: 13px; margin: 0; }
        .the-rule { background: linear-gradient(135deg, rgba(114,47,55,0.3), rgba(139,0,0,0.2)); border: 1px solid #722F37; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
        .the-rule h3 { font-family: var(--serif); color: #e74c6f; font-size: 1.4rem; margin: 0 0 8px; }
        .the-rule p { color: var(--muted); margin: 4px 0; font-size: 14px; }
        .calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
        .calc-field label { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .calc-field input { width: 100%; padding: 10px 12px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: var(--heading); font-size: 16px; }
        .calc-results { margin: 24px 0; }
        .calc-stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .calc-stat .label { color: var(--muted); font-size: 14px; }
        .calc-stat .value { color: var(--heading); font-weight: 700; font-size: 16px; }
        .rip-meter { margin: 24px 0; }
        .rip-bar { height: 24px; border-radius: 12px; background: linear-gradient(90deg, #22c55e, #eab308, #f97316, #ef4444, #7f1d1d); position: relative; overflow: hidden; }
        .rip-indicator { position: absolute; top: -4px; width: 4px; height: 32px; background: white; border-radius: 2px; transition: left 0.5s ease; box-shadow: 0 0 8px rgba(255,255,255,0.8); }
        .rip-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 4px; }
        .restaurant-list { display: grid; gap: 12px; margin: 20px 0; }
        .restaurant-row { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
        .restaurant-row h4 { margin: 0; font-family: var(--serif); color: var(--heading); }
        .restaurant-row .neighborhood { color: var(--muted); font-size: 12px; }
        .pour-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .pour-badge.generous { background: rgba(34,197,94,0.15); color: #22c55e; }
        .pour-badge.standard { background: rgba(234,179,8,0.15); color: #eab308; }
        .pour-badge.stingy { background: rgba(249,115,22,0.15); color: #f97316; }
        .pour-badge.criminal { background: rgba(239,68,68,0.15); color: #ef4444; }
        .wine-stars { color: #722F37; letter-spacing: 2px; }
        .knowledge-section { margin: 20px 0; }
        .knowledge-section h3 { font-family: var(--serif); color: var(--heading); margin: 24px 0 12px; font-size: 1.1rem; }
        .knowledge-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .knowledge-item { padding: 16px; }
        .knowledge-item h4 { color: var(--heading); margin: 0 0 6px; font-size: 14px; }
        .knowledge-item p { color: var(--muted); font-size: 13px; margin: 0; line-height: 1.5; }
        .temp-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .temp-table th, .temp-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
        .temp-table th { color: var(--muted); font-size: 11px; text-transform: uppercase; font-weight: 600; }
        .temp-table td:first-child { color: var(--heading); font-weight: 500; }
        .wall-post { padding: 16px; margin-bottom: 12px; }
        .wall-post .post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .wall-post .username { font-weight: 600; color: var(--heading); }
        .wall-post .post-type { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .wall-post .post-type.shame { color: #ef4444; }
        .wall-post .post-type.glory { color: #22c55e; }
        .wall-post .content { color: var(--muted); font-size: 14px; line-height: 1.6; }
        .wall-post .post-actions { display: flex; gap: 12px; margin-top: 10px; }
        .wall-post .post-actions button { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; color: var(--muted); cursor: pointer; font-size: 12px; }
        .wall-post .post-actions button:hover { border-color: var(--accent); color: var(--accent); }
        .add-form { padding: 20px; margin: 20px 0; }
        .add-form input, .add-form textarea, .add-form select { width: 100%; padding: 10px 12px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: var(--heading); font-size: 14px; margin-bottom: 12px; font-family: inherit; }
        .add-form textarea { min-height: 80px; resize: vertical; }
        .glass-types-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 20px 0; }
        .glossary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
        .glossary-item { padding: 12px 16px; }
        .glossary-item strong { color: var(--heading); font-family: var(--serif); }
        .glossary-item span { color: var(--muted); font-size: 13px; }
        @media (max-width: 600px) { .calc-grid { grid-template-columns: 1fr; } }
      </style>
      <div class="wine-app">
        <cc-fade-in>
          <cc-page-header icon="🍷" title="Proper Wine Pour" description="Perfect pour every time"></cc-page-header>
        </cc-fade-in>

        <div style="display:flex;justify-content:center;gap:12px;margin:16px 0 8px;flex-wrap:wrap;">
          <cc-stat-counter value="${generous.length}" label="Generous Spots" duration="1200"></cc-stat-counter>
          <cc-stat-counter value="${this._data.length}" label="Restaurants" duration="1500"></cc-stat-counter>
          <cc-stat-counter value="${this._pourLogs.length}" label="Pours Logged" duration="1000"></cc-stat-counter>
        </div>

        <cc-tabs active="guide">
          <cc-tab name="guide" label="Pour Guide" icon="wine">
            ${this._renderGuide()}
          </cc-tab>
          <cc-tab name="calculator" label="Calculator" icon="calculator">
            ${this._renderCalculator()}
          </cc-tab>
          <cc-tab name="tracker" label="Tracker" icon="clipboard-list">
            ${this._renderTracker()}
          </cc-tab>
          <cc-tab name="knowledge" label="Knowledge" icon="book-open">
            ${this._renderKnowledge()}
          </cc-tab>
          <cc-tab name="wall" label="Community" icon="message-circle">
            ${this._renderWall()}
          </cc-tab>
        </cc-tabs>
      </div>
    `;
    this._bindEvents();
  }

  _renderGlass(fillPct, size, label, color = '#722F37') {
    const bowlH = 80;
    const fillH = bowlH * fillPct;
    const y = 30 + bowlH - fillH;
    return `<svg viewBox="0 0 80 160" width="${size}" class="wine-glass-svg">
      <ellipse cx="40" cy="30" rx="28" ry="8" fill="none" stroke="#666" stroke-width="1.5"/>
      <path d="M12,30 Q12,110 30,115 L30,140 L50,140 L50,115 Q68,110 68,30" fill="none" stroke="#666" stroke-width="1.5"/>
      <rect x="12" y="${y}" width="56" height="${fillH}" fill="${color}" opacity="0.6" rx="2"
        clip-path="url(#bowl-clip-${label.replace(/\s/g,'')})" class="pour-level"/>
      <defs><clipPath id="bowl-clip-${label.replace(/\s/g,'')}">
        <path d="M12,30 Q12,110 30,115 L50,115 Q68,110 68,30 Z"/>
      </clipPath></defs>
      <line x1="20" y1="140" x2="60" y2="140" stroke="#666" stroke-width="2"/>
      <ellipse cx="40" cy="142" rx="22" ry="5" fill="none" stroke="#666" stroke-width="1.5"/>
    </svg>`;
  }

  _renderGuide() {
    return `
      <cc-fade-in>
        <h2 style="font-family:var(--serif);text-align:center;margin-top:8px;">Know Your Pour</h2>
        <p style="color:var(--muted);text-align:center;font-size:14px;">A visual guide to what you should be getting in your glass.</p>
      </cc-fade-in>

      <cc-stagger delay="80" animation="fade-up">
        <div class="glass-grid">
          <div class="card glass-card">
            ${this._renderGlass(0.25, 80, 'tasting')}
            <h4>Tasting Pour</h4>
            <p>2 oz (60ml)</p>
            <p style="color:var(--yellow, #eab308);font-size:11px;">Wine tastings only</p>
          </div>
          <div class="card glass-card">
            ${this._renderGlass(0.5, 80, 'standard', '#8B0000')}
            <h4>Standard Pour</h4>
            <p>5 oz (150ml)</p>
            <p style="color:var(--green, #22c55e);font-size:11px;">What you SHOULD get</p>
          </div>
          <div class="card glass-card">
            ${this._renderGlass(0.62, 80, 'full', '#722F37')}
            <h4>Full Glass</h4>
            <p>6 oz (175ml)</p>
            <p style="color:var(--green, #22c55e);font-size:11px;">Generous pour</p>
          </div>
          <div class="card glass-card">
            ${this._renderGlass(0.15, 80, 'criminal', '#ef4444')}
            <h4>Criminal Pour</h4>
            <p>&lt; 3 oz</p>
            <p style="color:var(--red, #ef4444);font-size:11px;">Unacceptable</p>
          </div>
        </div>
      </cc-stagger>

      <cc-fade-in delay="200">
        <div class="the-rule">
          <h3>The Golden Rule</h3>
          <p><strong>1 bottle (750ml) = 5 standard glasses (5oz each)</strong></p>
          <p>If a restaurant charges you $18/glass for a $45 bottle, that's 5 glasses at $9 cost each.</p>
          <p>If you're getting less than 5oz, you're being shorted. Period.</p>
        </div>
      </cc-fade-in>

      <cc-fade-in delay="300">
        <h3 style="font-family:var(--serif);margin:32px 0 16px;">Glass Types & Proper Fill Levels</h3>
        <div class="glass-types-grid">
          <div class="card glass-card">
            ${this._renderGlass(0.38, 70, 'red-wine', '#722F37')}
            <h4>Red Wine Glass</h4>
            <p>Fill to widest point of bowl</p>
            <p style="font-size:11px;color:var(--muted);">~1/3 full</p>
          </div>
          <div class="card glass-card">
            ${this._renderGlass(0.5, 70, 'white-wine', '#e8d44d')}
            <h4>White Wine Glass</h4>
            <p>Fill slightly higher</p>
            <p style="font-size:11px;color:var(--muted);">~1/2 full</p>
          </div>
          <div class="card glass-card">
            ${this._renderGlass(0.65, 70, 'champagne', '#f0e68c')}
            <h4>Champagne Flute</h4>
            <p>Fill to ~3/4</p>
            <p style="font-size:11px;color:var(--muted);">Preserves bubbles</p>
          </div>
          <div class="card glass-card">
            ${this._renderGlass(0.45, 70, 'rose', '#ffb6c1')}
            <h4>Rosé Glass</h4>
            <p>Similar to white wine</p>
            <p style="font-size:11px;color:var(--muted);">Slightly tapered</p>
          </div>
        </div>
      </cc-fade-in>

      <cc-fade-in delay="400">
        <h3 style="font-family:var(--serif);margin:32px 0 12px;">Wine Glass Anatomy</h3>
        <div class="card" style="text-align:center;padding:24px;">
          <svg viewBox="0 0 200 320" width="200">
            <text x="160" y="28" font-size="11" fill="#888" text-anchor="start">Rim</text>
            <line x1="128" y1="26" x2="155" y2="26" stroke="#555" stroke-width="0.5"/>
            <text x="160" y="88" font-size="11" fill="#888" text-anchor="start">Bowl</text>
            <line x1="128" y1="86" x2="155" y2="86" stroke="#555" stroke-width="0.5"/>
            <text x="160" y="210" font-size="11" fill="#888" text-anchor="start">Stem</text>
            <line x1="103" y1="208" x2="155" y2="208" stroke="#555" stroke-width="0.5"/>
            <text x="160" y="285" font-size="11" fill="#888" text-anchor="start">Base</text>
            <line x1="135" y1="283" x2="155" y2="283" stroke="#555" stroke-width="0.5"/>
            <ellipse cx="100" cy="30" rx="55" ry="14" fill="none" stroke="#aaa" stroke-width="2"/>
            <path d="M45,30 Q45,180 85,195 L85,270 L115,270 L115,195 Q155,180 155,30" fill="none" stroke="#aaa" stroke-width="2"/>
            <rect x="45" y="90" width="110" height="80" fill="#722F37" opacity="0.4" rx="2"
              clip-path="url(#anatomy-clip)"/>
            <defs><clipPath id="anatomy-clip"><path d="M45,30 Q45,180 85,195 L115,195 Q155,180 155,30 Z"/></clipPath></defs>
            <line x1="55" y1="270" x2="145" y2="270" stroke="#aaa" stroke-width="2.5"/>
            <ellipse cx="100" cy="275" rx="45" ry="10" fill="none" stroke="#aaa" stroke-width="2"/>
            <line x1="72" y1="90" x2="128" y2="90" stroke="#eab308" stroke-width="1" stroke-dasharray="4,3"/>
            <text x="100" y="84" font-size="9" fill="#eab308" text-anchor="middle">5oz fill line</text>
          </svg>
        </div>
      </cc-fade-in>
    `;
  }

  _renderCalculator() {
    const costPerGlass = (this._calcBottle / (750 / (this._calcPour * 29.5735))).toFixed(2);
    const costPerOz = (this._calcBottle / 25.36).toFixed(2);
    const restaurantGlass = this._calcPrice;
    const markup = ((restaurantGlass / costPerGlass) * 100).toFixed(0);
    const ripOff = Math.min(100, Math.max(0, (markup - 100) / 5));
    let ripLabel = 'Fair Deal';
    if (ripOff > 75) ripLabel = 'Highway Robbery';
    else if (ripOff > 55) ripLabel = 'Outrageous';
    else if (ripOff > 35) ripLabel = 'Steep';
    else if (ripOff > 15) ripLabel = 'Normal Markup';

    return `
      <cc-fade-in>
        <h2 style="font-family:var(--serif);text-align:center;margin-top:8px;">Pour Calculator</h2>
        <p style="color:var(--muted);text-align:center;font-size:14px;">Find out if you're getting ripped off.</p>
      </cc-fade-in>

      <div class="card add-form">
        <div class="calc-grid">
          <div class="calc-field">
            <label>Retail Bottle Price ($)</label>
            <input type="number" id="calc-bottle" value="${this._calcBottle}" min="5" max="500">
          </div>
          <div class="calc-field">
            <label>Pour Size (oz)</label>
            <input type="number" id="calc-pour" value="${this._calcPour}" min="1" max="10" step="0.5">
          </div>
          <div class="calc-field">
            <label>Restaurant Glass Price ($)</label>
            <input type="number" id="calc-price" value="${this._calcPrice}" min="5" max="200">
          </div>
          <div class="calc-field">
            <label>Typical Markup (%)</label>
            <input type="number" id="calc-markup" value="${this._calcMarkup}" min="100" max="800">
          </div>
        </div>
      </div>

      <div id="calc-results-container">
        ${this._renderCalculatorResults(costPerGlass, costPerOz, restaurantGlass, markup, ripOff, ripLabel)}
      </div>
    `;
  }

  _renderCalculatorResults(costPerGlass, costPerOz, restaurantGlass, markup, ripOff, ripLabel) {
    return `
      <cc-fade-in delay="100">
        <div class="card calc-results" style="padding:20px;">
          <div class="calc-stat">
            <span class="label">Your cost per glass (retail)</span>
            <span class="value">$${costPerGlass}</span>
          </div>
          <div class="calc-stat">
            <span class="label">Cost per oz (retail)</span>
            <span class="value">$${costPerOz}</span>
          </div>
          <div class="calc-stat">
            <span class="label">Restaurant price</span>
            <span class="value">$${restaurantGlass}</span>
          </div>
          <div class="calc-stat">
            <span class="label">Actual markup</span>
            <span class="value" style="color:${ripOff > 55 ? 'var(--red, #ef4444)' : ripOff > 30 ? 'var(--orange, #f97316)' : 'var(--green, #22c55e)'}">${markup}%</span>
          </div>
          <div class="calc-stat">
            <span class="label">Glasses per bottle</span>
            <span class="value">${(750 / (this._calcPour * 29.5735)).toFixed(1)}</span>
          </div>
        </div>

        <div class="rip-meter">
          <h4 style="font-family:var(--serif);margin-bottom:8px;text-align:center;">Rip-Off Meter: <span style="color:${ripOff > 55 ? 'var(--red, #ef4444)' : ripOff > 30 ? 'var(--orange, #f97316)' : 'var(--green, #22c55e)'}">${ripLabel}</span></h4>
          <div class="rip-bar">
            <div class="rip-indicator" style="left:${ripOff}%;"></div>
          </div>
          <div class="rip-labels">
            <span>Fair Deal</span><span>Normal</span><span>Steep</span><span>Outrageous</span><span>Highway Robbery</span>
          </div>
        </div>
      </cc-fade-in>
    `;
  }

  _renderTracker() {
    const sorted = [...this._data].sort((a,b) => {
      const order = {generous:0,standard:1,stingy:2,criminal:3};
      return order[a.pour_rating] - order[b.pour_rating];
    });
    const filtered = this._trackerRating === 'all' ? sorted : sorted.filter(r => r.pour_rating === this._trackerRating);

    return `
      <cc-fade-in>
        <h2 style="font-family:var(--serif);text-align:center;margin-top:8px;">Pour Tracker</h2>
        <p style="color:var(--muted);text-align:center;font-size:14px;">Track and rate restaurant wine pours.</p>
      </cc-fade-in>

      <cc-pill-dropdown label="Rating" items='[{"value":"all","label":"All"},{"value":"generous","label":"Generous"},{"value":"standard","label":"Standard"},{"value":"stingy","label":"Stingy"}]' value="${this._escAttr(this._trackerRating)}"></cc-pill-dropdown>

      <cc-search placeholder="Search restaurants..." style="margin:12px 0;"></cc-search>

      <div style="display:flex;justify-content:flex-end;margin:8px 0;">
        <button class="btn btn-primary" id="add-pour-btn" style="font-size:13px;padding:6px 16px;">
          ＋ Log Pour
        </button>
      </div>

      <cc-stagger delay="50" animation="fade-up">
        <div class="restaurant-list">
          ${filtered.map(r => `
            <div class="card restaurant-row">
              <div>
                <h4>${this._esc(r.name)}</h4>
                <span class="neighborhood">${this._esc(r.neighborhood)} · Avg $${this._esc(r.avg_glass_price)}/glass</span>
                <div class="wine-stars" style="margin-top:4px;">${'🍷'.repeat(r.wine_list_rating)}${'○'.repeat(5-r.wine_list_rating)}</div>
                <p style="color:var(--muted);font-size:12px;margin:4px 0 0;">${this._esc(r.notes)}</p>
              </div>
              <span class="pour-badge ${this._escAttr(r.pour_rating)}">${this._esc(r.pour_rating)}</span>
            </div>
          `).join('')}
          ${filtered.length === 0 ? '<cc-empty-state message="No restaurants match this filter" icon="🍷" animation="none"></cc-empty-state>' : ''}
        </div>
      </cc-stagger>

      <cc-modal id="pour-modal" title="Log a Pour" size="md">
        <div class="add-form" style="padding:0;">
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Restaurant Name</label>
          <input type="text" id="pour-restaurant" placeholder="e.g. Gary Danko">
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Wine Ordered</label>
          <input type="text" id="pour-wine" placeholder="e.g. Caymus Cabernet 2021">
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Pour Rating</label>
          <select id="pour-rating-select">
            <option value="generous">Generous</option>
            <option value="standard" selected>Standard</option>
            <option value="stingy">Stingy</option>
            <option value="criminal">Criminal</option>
          </select>
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Price Paid ($)</label>
          <input type="number" id="pour-price" placeholder="18" min="1" max="500">
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Notes</label>
          <textarea id="pour-notes" placeholder="How was the pour? Any comments..."></textarea>
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Your Name</label>
          <input type="text" id="pour-user" placeholder="Your name">
        </div>
        <div slot="footer">
          <button class="btn btn-primary" id="save-pour-btn">Save Pour</button>
        </div>
      </cc-modal>
    `;
  }

  _renderKnowledge() {
    return `
      <cc-fade-in>
        <h2 style="font-family:var(--serif);text-align:center;margin-top:8px;">Wine Knowledge</h2>
        <p style="color:var(--muted);text-align:center;font-size:14px;">Everything you need to know to be a savvy wine drinker.</p>
      </cc-fade-in>

      <div class="knowledge-section">
        <h3>Serving Temperatures</h3>
        <div class="card" style="padding:16px;overflow-x:auto;">
          <table class="temp-table">
            <tr><th>Wine Type</th><th>Temperature</th><th>Tip</th></tr>
            <tr><td>Light Reds (Pinot Noir)</td><td>55-60°F / 13-16°C</td><td>Slightly cool, not room temp</td></tr>
            <tr><td>Full Reds (Cabernet)</td><td>60-65°F / 16-18°C</td><td>"Room temp" means a cool room</td></tr>
            <tr><td>White Wine</td><td>45-50°F / 7-10°C</td><td>20 min out of fridge</td></tr>
            <tr><td>Sparkling</td><td>40-45°F / 4-7°C</td><td>Ice bucket for 15 min</td></tr>
            <tr><td>Rosé</td><td>45-55°F / 7-13°C</td><td>Slightly warmer than white</td></tr>
            <tr><td>Dessert Wine</td><td>43-47°F / 6-8°C</td><td>Well chilled</td></tr>
          </table>
        </div>

        <h3>Food Pairing Basics</h3>
        <cc-stagger delay="60" animation="fade-up">
          <div class="knowledge-grid">
            <div class="card knowledge-item"><h4>Red Meat</h4><p>Bold reds: Cabernet Sauvignon, Malbec, Syrah. Tannins cut through fat.</p></div>
            <div class="card knowledge-item"><h4>Seafood</h4><p>Crisp whites: Sauvignon Blanc, Chablis, Muscadet. Acidity complements fish.</p></div>
            <div class="card knowledge-item"><h4>Pasta (Red Sauce)</h4><p>Italian reds: Chianti, Barbera, Sangiovese. Acidity matches tomato.</p></div>
            <div class="card knowledge-item"><h4>Spicy Food</h4><p>Off-dry whites: Riesling, Gewürztraminer. Sweetness tames heat.</p></div>
            <div class="card knowledge-item"><h4>Cheese</h4><p>Match intensity. Soft cheese = light wine. Aged cheese = bold wine.</p></div>
            <div class="card knowledge-item"><h4>Dessert</h4><p>Wine should be sweeter than dessert. Port, Sauternes, late harvest.</p></div>
          </div>
        </cc-stagger>

        <h3>How to Tell If Your Pour Is Short</h3>
        <cc-stagger delay="60" animation="fade-up">
          <div class="knowledge-grid">
            <div class="card knowledge-item"><h4>The Finger Test</h4><p>Standard pour = about 2 fingers width in a standard red wine glass. Less than 1.5 fingers? You're being shorted.</p></div>
            <div class="card knowledge-item"><h4>The Weight Test</h4><p>Pick up the glass. 5oz of wine should have noticeable weight. If it feels empty, it probably is.</p></div>
            <div class="card knowledge-item"><h4>The Bottle Math</h4><p>If they pour more than 5-6 glasses from a bottle, each pour is under 5oz. Watch the bottle.</p></div>
            <div class="card knowledge-item"><h4>The Swirl Test</h4><p>In a proper pour, swirling should show wine reaching the widest part of the bowl. If it barely moves, it's too little.</p></div>
          </div>
        </cc-stagger>

        <h3>Tipping Etiquette on Wine</h3>
        <div class="card knowledge-item">
          <p>Standard: 15-20% on the wine total, same as food. If the sommelier provides exceptional service (decanting, special pairings), consider 20-25%. On very expensive bottles ($200+), 15% is acceptable. Never skip the tip on wine — sommeliers work hard.</p>
        </div>

        <h3>Corkage Fee Guide</h3>
        <div class="card knowledge-item">
          <p>Bringing your own bottle (BYO) means paying a corkage fee, typically $25-75 in SF. It's worth it if your bottle costs significantly less than the restaurant's markup. Etiquette: Always offer the sommelier a taste. Don't bring a wine the restaurant already sells. Some restaurants waive corkage if you also buy a bottle from their list.</p>
        </div>

        <h3>Wine Terminology</h3>
        <cc-stagger delay="40" animation="fade-up">
          <div class="glossary-grid">
            <div class="card glossary-item"><strong>Tannins</strong> <span>— Compounds that create a drying sensation. Higher in red wines. Softens with age.</span></div>
            <div class="card glossary-item"><strong>Body</strong> <span>— How heavy/full the wine feels. Light (Pinot Grigio) to full (Cabernet).</span></div>
            <div class="card glossary-item"><strong>Terroir</strong> <span>— The environment where grapes grow: soil, climate, altitude. Makes each wine unique.</span></div>
            <div class="card glossary-item"><strong>Vintage</strong> <span>— The year the grapes were harvested. Not all years are equal.</span></div>
            <div class="card glossary-item"><strong>Decanting</strong> <span>— Pouring wine into a vessel to aerate it. Opens up flavors in young bold reds.</span></div>
            <div class="card glossary-item"><strong>Legs/Tears</strong> <span>— Droplets running down the glass after swirling. Indicates alcohol/sugar content.</span></div>
            <div class="card glossary-item"><strong>Corked</strong> <span>— Wine contaminated by TCA. Smells like wet cardboard. Send it back.</span></div>
            <div class="card glossary-item"><strong>Varietal</strong> <span>— Wine made primarily from one grape variety (e.g., 100% Chardonnay).</span></div>
            <div class="card glossary-item"><strong>Sommelier</strong> <span>— Trained wine professional. Your ally in getting a proper pour.</span></div>
            <div class="card glossary-item"><strong>Finish</strong> <span>— The taste that lingers after swallowing. Long finish = quality wine.</span></div>
          </div>
        </cc-stagger>
      </div>
    `;
  }

  _renderWall() {
    const filtered = this._wallType === 'all' ? this._wallPosts : this._wallPosts.filter(p => p.pour_type === this._wallType);
    return `
      <cc-fade-in>
        <h2 style="font-family:var(--serif);text-align:center;margin-top:8px;">Community Wall</h2>
        <p style="color:var(--muted);text-align:center;font-size:14px;">Share your pour stories — the good, the bad, and the criminal.</p>
      </cc-fade-in>

      <cc-pill-dropdown label="Type" items='[{"value":"all","label":"All"},{"value":"glory","label":"Pour of Glory"},{"value":"shame","label":"Pour of Shame"}]' value="${this._escAttr(this._wallType)}"></cc-pill-dropdown>

      <div style="display:flex;justify-content:flex-end;margin:12px 0;">
        <button class="btn btn-primary" id="add-wall-btn" style="font-size:13px;padding:6px 16px;">
          ＋ Share Story
        </button>
      </div>

      <div>
        ${filtered.length ? filtered.map(p => `
          <div class="card wall-post">
            <div class="post-header">
              <span class="username">${this._esc(p.user_name || 'Anonymous')}</span>
              <span class="post-type ${this._escAttr(p.pour_type)}">${p.pour_type === 'glory' ? 'Pour of Glory' : 'Pour of Shame'}</span>
            </div>
            <div class="content">${this._esc(p.content)}</div>
            <div class="post-actions">
              <button class="upvote-btn" data-id="${this._escAttr(p.id)}">
                👍 ${p.upvotes || 0}
              </button>
              <span style="color:var(--muted);font-size:11px;">${this._esc(new Date(p.created_at).toLocaleDateString())}</span>
            </div>
          </div>
        `).join('') : '<cc-empty-state message="No stories yet. Be the first to share!" icon="🍷"></cc-empty-state>'}
      </div>

      <cc-modal id="wall-modal" title="Share a Pour Story" size="md">
        <div class="add-form" style="padding:0;">
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Your Name</label>
          <input type="text" id="wall-user" placeholder="Your name">
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Story Type</label>
          <select id="wall-type-select">
            <option value="glory">Pour of Glory (great pour!)</option>
            <option value="shame">Pour of Shame (terrible pour)</option>
          </select>
          <label style="color:var(--muted);font-size:12px;font-weight:600;">Your Story</label>
          <textarea id="wall-content" placeholder="Tell us about your pour experience..."></textarea>
        </div>
        <div slot="footer">
          <button class="btn btn-primary" id="save-wall-btn">Post Story</button>
        </div>
      </cc-modal>
    `;
  }

  _bindEvents() {
    // Calculator inputs
    ['calc-bottle','calc-pour','calc-price','calc-markup'].forEach(id => {
      const el = this.querySelector('#' + id);
      if (el) el.addEventListener('input', e => {
        const map = {'calc-bottle':'_calcBottle','calc-pour':'_calcPour','calc-price':'_calcPrice','calc-markup':'_calcMarkup'};
        this[map[id]] = parseFloat(e.target.value) || 0;
        // Update just the results section without touching the inputs
        this._updateCalculatorResults();
      });
    });

    // Pill dropdown for tracker
    this.querySelectorAll('cc-pill-dropdown').forEach(pf => {
      pf.addEventListener('dropdown-change', e => {
        const tab = pf.closest('cc-tab');
        if (!tab) return;
        if (tab.getAttribute('name') === 'tracker') {
          this._trackerRating = e.detail.value;
          tab.innerHTML = this._renderTracker();
          this._bindEvents();
        } else if (tab.getAttribute('name') === 'wall') {
          this._wallType = e.detail.value;
          tab.innerHTML = this._renderWall();
          this._bindEvents();
        }
      });
    });

    // Search
    const search = this.querySelector('cc-search');
    if (search) search.addEventListener('cc-search', e => {
      const q = (e.detail?.value || '').toLowerCase();
      this.querySelectorAll('.restaurant-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });

    // Add pour button
    const addPourBtn = this.querySelector('#add-pour-btn');
    if (addPourBtn) addPourBtn.addEventListener('click', () => {
      this.querySelector('#pour-modal')?.open?.();
    });

    // Save pour
    const savePourBtn = this.querySelector('#save-pour-btn');
    if (savePourBtn) savePourBtn.addEventListener('click', async () => {
      const restaurant = this.querySelector('#pour-restaurant')?.value;
      const wine = this.querySelector('#pour-wine')?.value;
      const rating = this.querySelector('#pour-rating-select')?.value;
      const price = parseFloat(this.querySelector('#pour-price')?.value);
      const notes = this.querySelector('#pour-notes')?.value;
      const user = this.querySelector('#pour-user')?.value;
      if (!restaurant || !wine) { window.showToast?.('Please fill in restaurant and wine name'); return; }
      try {
        if (this._db) {
          await this._db.addPour({ restaurant_name: restaurant, wine_name: wine, pour_rating: rating, price_paid: price, notes, user_name: user || 'Anonymous' });
          this._pourLogs = await this._db.getPours();
        }
        this.querySelector('#pour-modal')?.close?.();
        window.showToast?.('Pour logged! 🍷');
      } catch(e) { window.showToast?.('Error saving: ' + e.message); }
    });

    // Upvote buttons (delegated)
    this.querySelectorAll('.upvote-btn').forEach(btn => {
      btn.addEventListener('click', () => this._upvote(btn.dataset.id));
    });

    // Add wall post button
    const addWallBtn = this.querySelector('#add-wall-btn');
    if (addWallBtn) addWallBtn.addEventListener('click', () => {
      this.querySelector('#wall-modal')?.open?.();
    });

    // Save wall post
    const saveWallBtn = this.querySelector('#save-wall-btn');
    if (saveWallBtn) saveWallBtn.addEventListener('click', async () => {
      const user = this.querySelector('#wall-user')?.value;
      const type = this.querySelector('#wall-type-select')?.value;
      const content = this.querySelector('#wall-content')?.value;
      if (!content) { window.showToast?.('Please write your story'); return; }
      try {
        if (this._db) {
          await this._db.addWallPost({ user_name: user || 'Anonymous', pour_type: type, content });
          this._wallPosts = await this._db.getWallPosts();
        }
        this.querySelector('#wall-modal')?.close?.();
        window.showToast?.('Story posted! 🍷');
        const tab = this.querySelector('cc-tab[name="wall"]');
      } catch(e) { window.showToast?.('Error saving: ' + e.message); }
    });
  }

  _updateCalculatorResults() {
    const costPerGlass = (this._calcBottle / (750 / (this._calcPour * 29.5735))).toFixed(2);
    const costPerOz = (this._calcBottle / 25.36).toFixed(2);
    const restaurantGlass = this._calcPrice;
    const markup = ((restaurantGlass / costPerGlass) * 100).toFixed(0);
    const ripOff = Math.min(100, Math.max(0, (markup - 100) / 5));
    let ripLabel = 'Fair Deal';
    if (ripOff > 75) ripLabel = 'Highway Robbery';
    else if (ripOff > 55) ripLabel = 'Outrageous';
    else if (ripOff > 35) ripLabel = 'Steep';
    else if (ripOff > 15) ripLabel = 'Normal Markup';

    const resultsContainer = this.querySelector('#calc-results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = this._renderCalculatorResults(costPerGlass, costPerOz, restaurantGlass, markup, ripOff, ripLabel);
    }
  }

  async _upvote(id) {
    try {
      if (this._db) {
        const post = this._wallPosts.find(p => p.id === id);
        if (post) {
          await this._db.upvoteWallPost(id, (post.upvotes || 0) + 1);
          this._wallPosts = await this._db.getWallPosts();
          const tab = this.querySelector('cc-tab[name="wall"]');
          window.showToast?.('Upvoted! 👍');
        }
      }
    } catch(e) { window.showToast?.('Could not upvote: ' + e.message); }
  }
}
customElements.define('proper-wine-pour', ProperWinePour);
