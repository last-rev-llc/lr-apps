class AgeOfApes extends HTMLElement {
  connectedCallback() {
    this.gameData = {};
    this.innerHTML = `<div id="aoa-app" style="max-width:1200px;margin:0 auto;padding:1rem;">
      <div id="aoa-loading" style="text-align:center;padding:3rem;color:var(--muted);">Loading game data...</div>
    </div>`;
    this.loadData();
  }

  async loadData() {
    try {
      const [buildings, fighters, troops, research, mechs, equipment] = await Promise.all([
        fetch('data/buildings.json').then(r=>r.json()),
        fetch('data/fighters.json').then(r=>r.json()),
        fetch('data/troops.json').then(r=>r.json()),
        fetch('data/research.json').then(r=>r.json()),
        fetch('data/mechs.json').then(r=>r.json()),
        fetch('data/equipment.json').then(r=>r.json())
      ]);
      this.gameData = { buildings, fighters, troops, research, mechs, equipment };
      this.render();
    } catch(e) {
      this.querySelector('#aoa-loading').textContent = 'Error loading game data: ' + e.message;
    }
  }

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  _escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  fmt(n) { return n == null ? '0' : n.toLocaleString(); }

  timeStr(d,h,m,s) {
    const parts = [];
    if(d) parts.push(d+'d');
    if(h) parts.push(h+'h');
    if(m) parts.push(m+'m');
    if(s) parts.push(s+'s');
    return parts.join(' ') || '0s';
  }

  totalSeconds(d,h,m,s) { return (d||0)*86400 + (h||0)*3600 + (m||0)*60 + (s||0); }

  secondsToTime(totalSec) {
    const d = Math.floor(totalSec/86400);
    const h = Math.floor((totalSec%86400)/3600);
    const m = Math.floor((totalSec%3600)/60);
    const s = Math.floor(totalSec%60);
    return {d,h,m,s, str: this.timeStr(d,h,m,s)};
  }

  render() {
    const app = this.querySelector('#aoa-app');
    app.innerHTML = `
      <cc-tabs active="home" id="main-tabs">
        <cc-tab name="home" label="Home" icon="home">${this.renderHome()}</cc-tab>
        <cc-tab name="database" label="Database" icon="database">${this.renderDatabase()}</cc-tab>
        <cc-tab name="guides" label="Guides" icon="book-open">${this.renderGuides()}</cc-tab>
        <cc-tab name="calculators" label="Calculators" icon="calculator">${this.renderCalculators()}</cc-tab>
        <cc-tab name="blog" label="Blog" icon="pen-line">${this.renderBlog()}</cc-tab>
      </cc-tabs>`;
    this.attachEvents();
  }

  renderHome() {
    return `<div style="padding:1rem 0;">
      <div style="text-align:center;margin-bottom:2rem;">
        <h1 style="font-size:2.5rem;margin:0;">🦍 Age of Apes Guide</h1>
        <p style="color:var(--muted);font-size:1.1rem;margin:.5rem 0;">The ultimate companion for Age of Apes. Databases, guides, and calculators — all in one place.</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
        <div class="card" onclick="document.querySelector('#main-tabs').setAttribute('active','calculators')" style="cursor:pointer;">
          <div class="card-top"><div class="card-title" style="font-size:1.1rem;">Calculators</div></div>
          <div class="card-desc">Research, Buildings, Troops, Fighters, Mechs, Equipment & Time calculators</div>
          <div class="card-meta"><span class="badge" style="background:var(--orange);color:#000;">7 Tools</span></div>
        </div>
        <div class="card" onclick="document.querySelector('#main-tabs').setAttribute('active','database')" style="cursor:pointer;">
          <div class="card-top"><div class="card-title" style="font-size:1.1rem;">Database</div></div>
          <div class="card-desc">Buildings, Fighters, Research & Mechs — full game data tables</div>
          <div class="card-meta"><span class="badge" style="background:var(--accent);color:#fff;">Data</span></div>
        </div>
        <div class="card" onclick="document.querySelector('#main-tabs').setAttribute('active','guides')" style="cursor:pointer;">
          <div class="card-top"><div class="card-title" style="font-size:1.1rem;">Guides</div></div>
          <div class="card-desc">Fighter equipment, medals, mechs, events, and strategy guides</div>
          <div class="card-meta"><span class="badge" style="background:var(--green);color:#000;">Guides</span></div>
        </div>
        <div class="card" onclick="document.querySelector('#main-tabs').setAttribute('active','blog')" style="cursor:pointer;">
          <div class="card-top"><div class="card-title" style="font-size:1.1rem;">Blog</div></div>
          <div class="card-desc">Tips, tricks, and strategy articles for competitive play</div>
          <div class="card-meta"><span class="badge" style="background:var(--blue);color:#fff;">Articles</span></div>
        </div>
      </div>
      <div class="panel" style="margin-top:2rem;">
        <h3 style="margin:0 0 .5rem;">Quick Stats</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">
          <div class="stat-box"><div class="stat-box-value">35</div><div class="stat-box-label">City Hall Levels</div></div>
          <div class="stat-box"><div class="stat-box-value">6</div><div class="stat-box-label">Troop Tiers</div></div>
          <div class="stat-box"><div class="stat-box-value">4</div><div class="stat-box-label">Research Trees</div></div>
          <div class="stat-box"><div class="stat-box-value">50</div><div class="stat-box-label">Fighter Max Level</div></div>
        </div>
      </div>
    </div>`;
  }

  renderDatabase() {
    const bd = this.gameData.buildings;
    const buildingTables = Object.entries(bd).map(([key, b]) => {
      const rows = b.levels.map(l => `<tr>
        <td>${l.level}</td><td>${this.fmt(l.food)}</td><td>${this.fmt(l.iron)}</td>
        <td>${this.fmt(l.batteries)}</td><td>${this.fmt(l.nuApeCaps)}</td>
        <td>${this.timeStr(l.days,l.hours,l.minutes,l.seconds)}</td>
        <td>${this.fmt(l.totalPower)}</td><td>${this.fmt(l.powerDelta)}</td>
      </tr>`).join('');
      return `<h3>${this._esc(b.name)}</h3><div style="overflow-x:auto;"><table class="aoa-table">
        <thead><tr><th>Level</th><th>Food</th><th>Iron</th><th>Batteries</th><th>Nu-Ape Caps</th><th>Time</th><th>Total Power</th><th>Power +</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    }).join('');

    const fd = this.gameData.fighters;
    const fighterTypes = Object.entries(fd.types).map(([type, names]) =>
      `<div class="panel" style="margin-bottom:1rem;"><h4 style="margin:0 0 .5rem;text-transform:capitalize;">${type.replace(/([A-Z])/g,' $1')}</h4>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${names.map(n=>`<span class="pill">${this._esc(n)}</span>`).join('')}</div></div>`
    ).join('');

    return `<div style="padding:1rem 0;">
      <cc-tabs active="db-buildings" no-url>
        <cc-tab name="db-buildings" label="Buildings">${buildingTables}</cc-tab>
        <cc-tab name="db-fighters" label="Fighters">
          <h3>Fighter Types</h3>${fighterTypes}
          <h3>Fighter Medals</h3>
          <div class="panel"><table class="aoa-table">
            <thead><tr><th>Rarity</th><th>Skill 1</th><th>Skill 2</th><th>Skill 3</th><th>Skill 4</th><th>Total 5/5/5/5</th><th>Leap Medals</th></tr></thead>
            <tbody>
              <tr><td>Epic</td><td>150</td><td>100</td><td>100</td><td>100</td><td>450</td><td>1,180</td></tr>
              <tr><td>Legendary</td><td>240</td><td>150</td><td>150</td><td>150</td><td>690</td><td>700</td></tr>
            </tbody></table></div>
        </cc-tab>
        <cc-tab name="db-research" label="Research">
          <h3>Research Categories</h3>
          ${Object.entries(this.gameData.research.categories).map(([k,cat])=>
            `<div class="panel" style="margin-bottom:1rem;"><h4 style="margin:0 0 .5rem;">${cat.name}</h4>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">${Object.values(cat.items).map(i=>`<span class="pill">${this._esc(i.name)} (Lv ${i.maxLevel})</span>`).join('')}</div></div>`
          ).join('')}
        </cc-tab>
        <cc-tab name="db-mechs" label="Mechs">
          <h3>Mech Data</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="panel"><h4 style="margin:0 0 .5rem;">Epic Mechs</h4><p style="color:var(--muted);margin:0;">Force max level: 60<br>Skills max level: 30</p></div>
            <div class="panel"><h4 style="margin:0 0 .5rem;">Legendary Mechs</h4><p style="color:var(--muted);margin:0;">Force max level: 60<br>Skills max level: 30</p></div>
          </div>
        </cc-tab>
      </cc-tabs>
    </div>`;
  }

  renderGuides() {
    const guides = [
      {cat:'Fighters',items:['Fighter Equipment','Fighter Experience','Fighter Medals','Fighter Statue Stars']},
      {cat:'Mechs',items:['Mech Force','Mech Skills','Mech Operators']},
      {cat:'Troops',items:['Unit Skills','Troop Weapons','Troop Gear']},
      {cat:'Events',items:['King of Apes Scoring','Pre-KVK','Interstellar Clash','Gacha Events']},
      {cat:'Other',items:['Server Transfer','Carrier Cabins','Relic Star Stones']}
    ];
    return `<div style="padding:1rem 0;">
      ${guides.map(g=>`
        <h3>${g.cat}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:1.5rem;">
          ${g.items.map(i=>`<div class="card"><div class="card-top"><div class="card-title">${i}</div></div>
            <div class="card-desc">Comprehensive guide for ${i.toLowerCase()} in Age of Apes.</div></div>`).join('')}
        </div>`).join('')}
      <div class="panel" style="margin-top:1rem;">
        <h3 style="margin:0 0 .5rem;">Fighter Experience Table</h3>
        <p style="color:var(--muted);font-size:.9rem;">Max cumulative XP by rarity:</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div class="stat-box"><div class="stat-box-value" style="font-size:1.2rem;">${this.fmt(32748403)}</div><div class="stat-box-label">Rare (Lv 50)</div></div>
          <div class="stat-box"><div class="stat-box-value" style="font-size:1.2rem;">${this.fmt(41314000)}</div><div class="stat-box-label">Epic (Lv 50)</div></div>
          <div class="stat-box"><div class="stat-box-value" style="font-size:1.2rem;">${this.fmt(50213100)}</div><div class="stat-box-label">Legendary (Lv 50)</div></div>
        </div>
      </div>
    </div>`;
  }

  renderCalculators() {
    return `<div style="padding:1rem 0;">
      <cc-tabs active="calc-buildings" no-url>
        <cc-tab name="calc-buildings" label="Buildings">${this.renderBuildingsCalc()}</cc-tab>
        <cc-tab name="calc-research" label="Research">${this.renderResearchCalc()}</cc-tab>
        <cc-tab name="calc-troops" label="Troops">${this.renderTroopsCalc()}</cc-tab>
        <cc-tab name="calc-fighter" label="Fighter">${this.renderFighterCalc()}</cc-tab>
        <cc-tab name="calc-mech" label="Mech">${this.renderMechCalc()}</cc-tab>
        <cc-tab name="calc-equip" label="Equipment">${this.renderEquipCalc()}</cc-tab>
        <cc-tab name="calc-time" label="Time">${this.renderTimeCalc()}</cc-tab>
      </cc-tabs>
    </div>`;
  }

  renderBuildingsCalc() {
    const opts = Object.entries(this.gameData.buildings).map(([k,b])=>`<option value="${this._escAttr(k)}">${this._esc(b.name)}</option>`).join('');
    return `<div class="panel">
      <h3 style="margin:0 0 1rem;">Buildings Calculator</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:1rem;">
        <div><label style="color:var(--muted);font-size:.85rem;">Building</label><select id="bc-building" class="aoa-select">${opts}</select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Start Level</label><input type="number" id="bc-start" class="aoa-input" value="1" min="0"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">End Level</label><input type="number" id="bc-end" class="aoa-input" value="30" min="1"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Speed %</label><input type="number" id="bc-speed" class="aoa-input" value="0" min="0"></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1rem;">
        <label style="color:var(--muted);font-size:.85rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="bc-architect"> Architect (+3%)</label>
        <label style="color:var(--muted);font-size:.85rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="bc-rise"> Rise & Soar (+10%)</label>
      </div>
      <button class="btn btn-primary" id="bc-calc">Calculate</button>
      <div id="bc-results" style="margin-top:1rem;"></div>
    </div>`;
  }

  renderResearchCalc() {
    const cats = Object.entries(this.gameData.research.categories).map(([k,c])=>`<option value="${this._escAttr(k)}">${this._esc(c.name)}</option>`).join('');
    return `<div class="panel">
      <h3 style="margin:0 0 1rem;">Research Calculator</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:1rem;">
        <div><label style="color:var(--muted);font-size:.85rem;">Category</label><select id="rc-cat" class="aoa-select">${cats}</select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Research Item</label><select id="rc-item" class="aoa-select"></select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Start Level</label><input type="number" id="rc-start" class="aoa-input" value="0" min="0"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">End Level</label><input type="number" id="rc-end" class="aoa-input" value="10" min="1"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Speed %</label><input type="number" id="rc-speed" class="aoa-input" value="0" min="0"></div>
      </div>
      <button class="btn btn-primary" id="rc-calc">Calculate</button>
      <div id="rc-results" style="margin-top:1rem;"></div>
    </div>`;
  }

  renderTroopsCalc() {
    const types = this.gameData.troops.types.map(t=>`<option value="${this._escAttr(t)}">${this._esc(t)}</option>`).join('');
    const tiers = Object.entries(this.gameData.troops.tiers).map(([k,v])=>`<option value="${this._escAttr(k)}">${this._esc(k)} - ${this._esc(v.name)}</option>`).join('');
    return `<div class="panel">
      <h3 style="margin:0 0 1rem;">Troops Calculator</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:1rem;">
        <div><label style="color:var(--muted);font-size:.85rem;">Troop Type</label><select id="tc-type" class="aoa-select">${types}</select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Tier</label><select id="tc-tier" class="aoa-select">${tiers}</select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Quantity</label><input type="number" id="tc-qty" class="aoa-input" value="1000" min="1"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Training Speed %</label><input type="number" id="tc-speed" class="aoa-input" value="0" min="0"></div>
      </div>
      <button class="btn btn-primary" id="tc-calc">Calculate</button>
      <div id="tc-results" style="margin-top:1rem;"></div>
    </div>`;
  }

  renderFighterCalc() {
    return `<div class="panel">
      <h3 style="margin:0 0 1rem;">Fighter XP Calculator</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:1rem;">
        <div><label style="color:var(--muted);font-size:.85rem;">Rarity</label><select id="fc-rarity" class="aoa-select"><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Current Level</label><input type="number" id="fc-start" class="aoa-input" value="1" min="1" max="50"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Target Level</label><input type="number" id="fc-end" class="aoa-input" value="50" min="1" max="50"></div>
      </div>
      <button class="btn btn-primary" id="fc-calc">Calculate</button>
      <div id="fc-results" style="margin-top:1rem;"></div>
    </div>`;
  }

  renderMechCalc() {
    return `<div class="panel">
      <h3 style="margin:0 0 1rem;">Mech Calculator</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:1rem;">
        <div><label style="color:var(--muted);font-size:.85rem;">Rarity</label><select id="mc-rarity" class="aoa-select"><option value="epic">Epic</option><option value="legendary">Legendary</option></select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Force Start Level</label><input type="number" id="mc-fstart" class="aoa-input" value="1" min="1" max="60"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Force End Level</label><input type="number" id="mc-fend" class="aoa-input" value="60" min="1" max="60"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Skill Start Level</label><input type="number" id="mc-sstart" class="aoa-input" value="1" min="1" max="30"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Skill End Level</label><input type="number" id="mc-send" class="aoa-input" value="30" min="1" max="30"></div>
      </div>
      <button class="btn btn-primary" id="mc-calc">Calculate</button>
      <div id="mc-results" style="margin-top:1rem;"></div>
    </div>`;
  }

  renderEquipCalc() {
    return `<div class="panel">
      <h3 style="margin:0 0 1rem;">Equipment Materials Calculator</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:1rem;">
        <div><label style="color:var(--muted);font-size:.85rem;">Rarity</label><select id="ec-rarity" class="aoa-select"><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Start Level</label><input type="number" id="ec-start" class="aoa-input" value="1" min="1"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">End Level</label><input type="number" id="ec-end" class="aoa-input" value="30" min="1"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Number of Slots</label><input type="number" id="ec-slots" class="aoa-input" value="4" min="1" max="4"></div>
      </div>
      <button class="btn btn-primary" id="ec-calc">Calculate</button>
      <div id="ec-results" style="margin-top:1rem;"></div>
    </div>`;
  }

  renderTimeCalc() {
    return `<div class="panel">
      <h3 style="margin:0 0 1rem;">Actual Time Calculator</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:1rem;">
        <div><label style="color:var(--muted);font-size:.85rem;">Days</label><input type="number" id="atc-d" class="aoa-input" value="0" min="0"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Hours</label><input type="number" id="atc-h" class="aoa-input" value="0" min="0"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Minutes</label><input type="number" id="atc-m" class="aoa-input" value="0" min="0"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Seconds</label><input type="number" id="atc-s" class="aoa-input" value="0" min="0"></div>
        <div><label style="color:var(--muted);font-size:.85rem;">Speed %</label><input type="number" id="atc-speed" class="aoa-input" value="50" min="0"></div>
      </div>
      <button class="btn btn-primary" id="atc-calc">Calculate</button>
      <div id="atc-results" style="margin-top:1rem;"></div>
    </div>`;
  }

  renderBlog() {
    const posts = [
      {title:'Top 10 Tips for New Players',desc:'Essential strategies for your first week in Age of Apes.'},
      {title:'Optimizing Resource Production',desc:'How to maximize food and iron output at every city hall level.'},
      {title:'Fighter Tier List (2025)',desc:'Ranking the best fighters for PvP and PvE content.'},
      {title:'KVK Preparation Guide',desc:'Everything you need to do before Kingdom vs Kingdom starts.'},
      {title:'Best Mech Builds',desc:'Optimal mech configurations for different combat situations.'},
      {title:'Speed-Up Management',desc:'How to efficiently use your construction and research speed-ups.'}
    ];
    return `<div style="padding:1rem 0;">
      <h2 style="margin:0 0 1rem;">Latest Articles</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
        ${posts.map(p=>`<div class="card"><div class="card-top"><div class="card-title">${this._esc(p.title)}</div></div><div class="card-desc">${this._esc(p.desc)}</div><div class="card-meta"><span class="badge" style="background:var(--blue);color:#fff;">Article</span></div></div>`).join('')}
      </div>
    </div>`;
  }

  renderResultCards(items) {
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
      ${items.map(([label,value])=>`<div class="stat-box"><div class="stat-box-value" style="font-size:1.1rem;">${value}</div><div class="stat-box-label">${label}</div></div>`).join('')}
    </div>`;
  }

  attachEvents() {
    // Buildings calc
    this.querySelector('#bc-calc')?.addEventListener('click', () => {
      const bKey = this.querySelector('#bc-building').value;
      const start = +this.querySelector('#bc-start').value;
      const end = +this.querySelector('#bc-end').value;
      let speed = +this.querySelector('#bc-speed').value;
      if(this.querySelector('#bc-architect').checked) speed += 3;
      if(this.querySelector('#bc-rise').checked) speed += 10;
      const levels = this.gameData.buildings[bKey]?.levels || [];
      let food=0,iron=0,batt=0,caps=0,totalSec=0,power=0;
      levels.forEach(l => {
        const [from,to] = l.level.split('-').map(Number);
        if(from >= start && to <= end) {
          food += l.food; iron += l.iron; batt += l.batteries; caps += l.nuApeCaps;
          totalSec += this.totalSeconds(l.days,l.hours,l.minutes,l.seconds);
          power += l.powerDelta;
        }
      });
      const actualSec = totalSec * (100/(100+speed));
      const orig = this.secondsToTime(totalSec);
      const actual = this.secondsToTime(actualSec);
      this.querySelector('#bc-results').innerHTML = this.renderResultCards([
        ['Original Time', orig.str],['Actual Time', actual.str],['Power Gained', this.fmt(power)],
        ['Food', this.fmt(food)],['Iron', this.fmt(iron)],['Batteries', this.fmt(batt)],['Nu-Ape Caps', this.fmt(caps)]
      ]);
    });

    // Research calc - populate items
    const rcCat = this.querySelector('#rc-cat');
    const rcItem = this.querySelector('#rc-item');
    const populateItems = () => {
      const cat = this.gameData.research.categories[rcCat.value];
      rcItem.innerHTML = Object.entries(cat.items).map(([k,v])=>`<option value="${this._escAttr(k)}">${this._esc(v.name)}</option>`).join('');
    };
    rcCat?.addEventListener('change', populateItems);
    if(rcCat) populateItems();

    this.querySelector('#rc-calc')?.addEventListener('click', () => {
      const cat = this.gameData.research.categories[rcCat.value];
      const item = cat.items[rcItem.value];
      const start = +this.querySelector('#rc-start').value;
      const end = Math.min(+this.querySelector('#rc-end').value, item.maxLevel);
      const speed = +this.querySelector('#rc-speed').value;
      let power = 0;
      for(let i = start; i < end; i++) power += (item.basePower[i] || 0);
      // Estimate time based on power (simplified)
      const estSec = power * 2;
      const actualSec = estSec * (100/(100+speed));
      this.querySelector('#rc-results').innerHTML = this.renderResultCards([
        ['Research', this._esc(item.name)],['Levels', `${start} → ${end}`],
        ['Power Gained', this.fmt(power)],['Est. Time', this.secondsToTime(estSec).str],
        ['Actual Time', this.secondsToTime(actualSec).str]
      ]);
    });

    // Troops calc
    this.querySelector('#tc-calc')?.addEventListener('click', () => {
      const tier = this.gameData.troops.tiers[this.querySelector('#tc-tier').value];
      const qty = +this.querySelector('#tc-qty').value;
      const speed = +this.querySelector('#tc-speed').value;
      const food = tier.food * qty;
      const iron = tier.iron * qty;
      const caps = tier.nuApeCaps * qty;
      const power = tier.power * qty;
      const totalSec = tier.trainTime * qty;
      const actualSec = totalSec * (100/(100+speed));
      this.querySelector('#tc-results').innerHTML = this.renderResultCards([
        ['Power', this.fmt(power)],['Food', this.fmt(food)],['Iron', this.fmt(iron)],
        ['Nu-Ape Caps', this.fmt(caps)],['Train Time', this.secondsToTime(totalSec).str],
        ['Actual Time', this.secondsToTime(actualSec).str]
      ]);
    });

    // Fighter calc
    this.querySelector('#fc-calc')?.addEventListener('click', () => {
      const rarity = this.querySelector('#fc-rarity').value;
      const start = +this.querySelector('#fc-start').value;
      const end = +this.querySelector('#fc-end').value;
      const data = this.gameData.fighters.experience[rarity];
      const startXP = data.find(d=>d.level===start)?.cumulative || 0;
      const endXP = data.find(d=>d.level===end)?.cumulative || 0;
      const needed = endXP - startXP;
      this.querySelector('#fc-results').innerHTML = this.renderResultCards([
        ['Rarity', rarity.charAt(0).toUpperCase()+rarity.slice(1)],
        ['Levels', `${start} → ${end}`],['XP Needed', this.fmt(needed)],
        ['Start Cumulative', this.fmt(startXP)],['End Cumulative', this.fmt(endXP)]
      ]);
    });

    // Mech calc
    this.querySelector('#mc-calc')?.addEventListener('click', () => {
      const rarity = this.querySelector('#mc-rarity').value;
      const mech = this.gameData.mechs[rarity];
      const fs = +this.querySelector('#mc-fstart').value - 1;
      const fe = +this.querySelector('#mc-fend').value - 1;
      const ss = +this.querySelector('#mc-sstart').value - 1;
      const se = +this.querySelector('#mc-send').value - 1;
      let chips=0,cores=0,power=0,manuals=0;
      for(let i=fs;i<=fe;i++){chips+=(mech.force.chipsPerLevel[i]||0);cores+=(mech.force.coresPerLevel[i]||0);power+=(mech.force.powerPerLevel[i]||0);}
      for(let i=ss;i<=se;i++){manuals+=(mech.skills.manualsPerLevel[i]||0);}
      this.querySelector('#mc-results').innerHTML = this.renderResultCards([
        ['Chips', this.fmt(chips)],['Cores', this.fmt(cores)],['Power', this.fmt(power)],
        ['Manuals', this.fmt(manuals)],['Est. USD', '$'+this.fmt(Math.round((chips/10000+cores/100+manuals/500)*0.99))]
      ]);
    });

    // Equipment calc
    this.querySelector('#ec-calc')?.addEventListener('click', () => {
      const rarity = this.querySelector('#ec-rarity').value;
      const eqData = this.gameData.equipment.rarities[rarity];
      const start = +this.querySelector('#ec-start').value - 1;
      const end = Math.min(+this.querySelector('#ec-end').value, eqData.maxLevel) - 1;
      const slots = +this.querySelector('#ec-slots').value;
      const mats = eqData.materialsPerLevel;
      const results = [];
      for(const [matName, levels] of Object.entries(mats)) {
        let total = 0;
        for(let i=start;i<=end;i++) total += (levels[i]||0);
        total *= slots;
        const label = matName.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
        results.push([label, this.fmt(total)]);
      }
      this.querySelector('#ec-results').innerHTML = this.renderResultCards(results);
    });

    // Time calc
    this.querySelector('#atc-calc')?.addEventListener('click', () => {
      const d = +this.querySelector('#atc-d').value;
      const h = +this.querySelector('#atc-h').value;
      const m = +this.querySelector('#atc-m').value;
      const s = +this.querySelector('#atc-s').value;
      const speed = +this.querySelector('#atc-speed').value;
      const totalSec = this.totalSeconds(d,h,m,s);
      const actualSec = totalSec * (100/(100+speed));
      const saved = totalSec - actualSec;
      this.querySelector('#atc-results').innerHTML = this.renderResultCards([
        ['Original Time', this.secondsToTime(totalSec).str],
        ['Actual Time', this.secondsToTime(actualSec).str],
        ['Time Saved', this.secondsToTime(saved).str],
        ['Speed Bonus', speed+'%']
      ]);
    });
  }
}
customElements.define('age-of-apes', AgeOfApes);
