/* <cc-ads> — Shared Ad Creatives component
   Usage: <cc-ads app="cc-ideas"></cc-ads>
   Loads ads from Supabase `ads` table, falls back to embedded defaults.
   Requires: cc-toast, cc-pill-filter, CC.getParams/CC.setParams (cc-helpers)
*/
(function () {

const FALLBACK = {
  'cc-ideas': buildIdeasAds(),
  'cc-users': buildUsersAds(),
  'dad-joke-of-the-day': buildDadJokeAds(),
  'gen-alpha': buildGenAlphaAds(),
};

class CcAds extends HTMLElement {
  static get observedAttributes() { return ['app']; }

  connectedCallback() { this._load(); }
  attributeChangedCallback() { if (this.isConnected) this._load(); }

  get app() { return this.getAttribute('app') || ''; }

  async _load() {
    const app = this.app;
    let ads;
    try {
      if (window.supabase) {
        ads = await window.supabase.select('ads', {
          filters: { app: `eq.${app}` },
          order: 'category.asc,width.asc,height.asc'
        });
      }
    } catch (e) { console.warn('[cc-ads] Supabase failed, using fallback', e); }

    if (!ads || !ads.length) {
      ads = FALLBACK[app] || [];
    }

    this._render(ads);
  }

  _render(ads) {
    // Build size options from data
    const sizeSet = new Map();
    ads.forEach(a => {
      const key = `${a.width}×${a.height}`;
      if (!sizeSet.has(key)) sizeSet.set(key, `${a.width}×${a.height}`);
    });
    const sizeItems = ['All Sizes', ...sizeSet.keys()];

    // Read URL param
    const params = (window.CC && CC.getParams) ? CC.getParams() : {};
    const activeSize = params.size || 'All Sizes';

    // Filter ads
    const filtered = activeSize === 'All Sizes' ? ads :
      ads.filter(a => `${a.width}×${a.height}` === activeSize);

    // Group by category
    const groups = {};
    filtered.forEach(a => { (groups[a.category] = groups[a.category] || []).push(a); });

    this.innerHTML = `
      <style>
        .ccads-wrap { max-width: 1600px; margin: 0 auto; padding: 1rem 1rem 2rem; }
        .ccads-filter-bar { position: sticky; top: 0; z-index: 50; padding: .75rem 0; margin-bottom: 1.5rem;
          background: rgba(15,15,30,.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--glass-border); }
        .ccads-group { margin-bottom: 2.5rem; }
        .ccads-group h2 { font-size: 1.25rem; color: var(--amber); border-bottom: 1px solid rgba(245,158,11,.2);
          padding-bottom: .5rem; margin: 0 0 1.25rem; }
        .ccads-card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px;
          padding: 1.25rem; margin-bottom: 1.5rem; }
        .ccads-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .ccads-header h3 { margin: 0; font-size: 1rem; }
        .ccads-dims { color: var(--text-muted); font-size: .85rem; }
        .ccads-copy { background: none; color: var(--text-muted); border: none; padding: .35rem;
          border-radius: 6px; cursor: pointer; display:inline-flex; align-items:center; justify-content:center; transition: color .15s, background .15s; }
        .ccads-copy:hover { color: var(--amber); background: rgba(255,255,255,.08); }
        .ccads-copy [data-lucide] { width:18px; height:18px; }
        .ccads-preview { overflow: auto; border: 1px dashed rgba(255,255,255,.1); border-radius: 8px;
          padding: 1rem; display: flex; justify-content: center; }
        .ccads-preview > div { flex-shrink: 0; }
        .ccads-empty { text-align: center; color: var(--text-muted); padding: 3rem 1rem; }
      </style>
      <div class="ccads-wrap">
        <div class="ccads-filter-bar">
          <cc-pill-filter label="Size" items='${JSON.stringify(sizeItems)}' value="${activeSize}"></cc-pill-filter>
        </div>
        ${Object.keys(groups).length === 0 ? '<div class="ccads-empty">No ads match this filter.</div>' :
          Object.entries(groups).map(([cat, catAds]) => `
            <div class="ccads-group">
              <h2>${cat}</h2>
              ${catAds.map((ad, i) => {
                const uid = `ccad-${cat.replace(/\s/g,'')}-${i}-${Date.now()}`;
                return `<div class="ccads-card">
                  <div class="ccads-header">
                    <div><h3>${ad.name}</h3><span class="ccads-dims">${ad.width}×${ad.height}</span></div>
                    <button class="ccads-copy" data-uid="${uid}" title="Copy HTML"><i data-lucide="clipboard-copy"></i></button>
                  </div>
                  <div class="ccads-preview"><div id="${uid}">${ad.html}</div></div>
                </div>`;
              }).join('')}
            </div>
          `).join('')
        }
      </div>
    `;

    if (window.refreshIcons) refreshIcons();

    // Copy handlers
    this.querySelectorAll('.ccads-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const el = this.querySelector(`#${btn.dataset.uid}`);
        if (!el) return;
        navigator.clipboard.writeText(el.innerHTML.trim()).then(() => {
          document.querySelector('cc-toast')?.show?.('Copied to clipboard!', 'success');
        });
      });
    });

    // Filter handler
    const pf = this.querySelector('cc-pill-filter');
    if (pf) {
      pf.addEventListener('pill-change', (e) => {
        if (window.CC && CC.setParams) CC.setParams({ size: e.detail.value });
        this._load();
      });
    }
  }
}

if (!customElements.get('cc-ads')) customElements.define('cc-ads', CcAds);

/* ── Fallback data builders ── */

function buildIdeasAds() {
  const font = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;`;
  const bg = `background:linear-gradient(135deg,#0f0f1a 0%,#1a1d2e 100%);`;
  const glass = `background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.15);border-radius:8px;backdrop-filter:blur(8px);`;
  const cta = (sz) => `<span style="display:inline-block;background:#f59e0b;color:#000;padding:6px 14px;border-radius:6px;font-weight:700;font-size:${sz}px;white-space:nowrap;">Try Ideas Free →</span>`;
  const url = `<span style="color:rgba(255,255,255,.4);font-size:10px;">ideas.adam-harris.alphaclaw.app</span>`;
  const base = (w,h) => `${bg}${font}color:#fff;width:${w}px;height:${h}px;overflow:hidden;position:relative;box-sizing:border-box;`;

  return [
    { name:'Leaderboard', category:'Display Ads', width:728, height:90, html:`<div style="${base(728,90)}display:flex;align-items:center;justify-content:space-between;padding:0 20px;"><div style="display:flex;align-items:center;gap:12px;"><span style="font-size:26px;">💡</span><span style="font-size:16px;font-weight:700;color:#f59e0b;">Never Run Out of Ideas</span></div><div style="display:flex;align-items:center;gap:10px;">${url}${cta(11)}</div></div>` },
    { name:'Medium Rectangle', category:'Display Ads', width:300, height:250, html:`<div style="${base(300,250)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">💡</div><div style="font-size:18px;font-weight:800;color:#f59e0b;margin-bottom:6px;">Never Run Out of Ideas</div><div style="font-size:12px;color:rgba(255,255,255,.65);margin-bottom:12px;line-height:1.4;">Auto-generated ideas scored<br>by feasibility &amp; impact</div><div style="${glass}padding:8px 14px;margin-bottom:14px;font-size:11px;color:rgba(255,255,255,.7);">🤖 AI Generation · 🌐 Discovery · ⚡ Build</div>${cta(13)}<div style="margin-top:8px;">${url}</div></div>` },
    { name:'Wide Skyscraper', category:'Display Ads', width:160, height:600, html:`<div style="${base(160,600)}display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:24px 12px;text-align:center;"><div><div style="font-size:36px;margin-bottom:10px;">💡</div><div style="font-size:16px;font-weight:800;color:#f59e0b;line-height:1.3;">AI-Powered<br>Idea Pipeline</div></div><div style="width:100%;"><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">🤖 AI Generation</div><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">🌐 Community Discovery</div><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">⚡ One-Click Build</div><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">📊 Feasibility × Impact</div></div><div>${cta(13)}<div style="margin-top:8px;">${url}</div></div></div>` },
    { name:'Large Rectangle', category:'Display Ads', width:336, height:280, html:`<div style="${base(336,280)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">💡</div><div style="font-size:18px;font-weight:800;color:#f59e0b;margin-bottom:6px;">Never Run Out of Ideas</div><div style="font-size:12px;color:rgba(255,255,255,.65);margin-bottom:12px;line-height:1.4;">Auto-generated ideas scored<br>by feasibility &amp; impact</div><div style="${glass}padding:8px 14px;margin-bottom:14px;font-size:11px;color:rgba(255,255,255,.7);">🤖 AI Generation · 🌐 Discovery · ⚡ Build</div>${cta(13)}<div style="margin-top:8px;">${url}</div></div>` },
    { name:'Mobile Banner', category:'Display Ads', width:320, height:50, html:`<div style="${base(320,50)}display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">💡</span><span style="font-size:13px;font-weight:700;color:#f59e0b;">Never Run Out of Ideas</span></div>${cta(11)}</div>` },
    { name:'Social Square', category:'Social Media', width:1080, height:1080, html:`<div style="${base(1080,1080)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;text-align:center;"><div style="font-size:72px;margin-bottom:20px;">💡</div><div style="font-size:42px;font-weight:800;color:#f59e0b;margin-bottom:12px;line-height:1.2;">Never Run Out<br>of Ideas</div><div style="font-size:18px;color:rgba(255,255,255,.6);margin-bottom:36px;">AI-Powered Idea Generation, Scoring &amp; Management</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px;width:100%;max-width:600px;"><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">🤖</div><div style="font-size:14px;font-weight:600;">AI Generation</div></div><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">🌐</div><div style="font-size:14px;font-weight:600;">Community Discovery</div></div><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">📊</div><div style="font-size:14px;font-weight:600;">Smart Scoring</div></div><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">⚡</div><div style="font-size:14px;font-weight:600;">One-Click Build</div></div></div><span style="display:inline-block;background:#f59e0b;color:#000;padding:14px 32px;border-radius:10px;font-weight:700;font-size:18px;">Start Building →</span><div style="margin-top:12px;">${url}</div></div>` },
    { name:'Social Story', category:'Social Media', width:1080, height:1920, html:`<div style="${base(1080,1920)}display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:60px 40px;text-align:center;"><div><div style="font-size:80px;margin-bottom:16px;">💡</div><div style="font-size:48px;font-weight:800;color:#f59e0b;line-height:1.15;margin-bottom:16px;">Never Run<br>Out of<br>Ideas</div><div style="font-size:18px;color:rgba(255,255,255,.55);">AI-Powered Idea Pipeline</div></div><div style="width:100%;display:flex;flex-direction:column;gap:16px;"><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">🤖</span><div><div style="font-weight:600;font-size:16px;">AI Generation</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Auto-generated ideas on demand</div></div></div><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">🌐</span><div><div style="font-weight:600;font-size:16px;">Community Discovery</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Find what's trending</div></div></div><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">📊</span><div><div style="font-weight:600;font-size:16px;">Smart Scoring</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Feasibility × Impact matrix</div></div></div><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">⚡</span><div><div style="font-weight:600;font-size:16px;">One-Click Build</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Ship ideas instantly</div></div></div></div><div><span style="display:inline-block;background:#f59e0b;color:#000;padding:16px 40px;border-radius:12px;font-weight:700;font-size:20px;">Try Ideas Free →</span><div style="margin-top:12px;">${url}</div></div></div>` },
    { name:'Twitter/X Header', category:'Social Media', width:1500, height:500, html:`<div style="${base(1500,500)}display:flex;align-items:center;padding:0 40px;gap:40px;"><div style="flex:1;"><div style="font-size:28px;font-weight:800;color:#f59e0b;margin-bottom:6px;">💡 Score. Build. Ship.</div><div style="font-size:14px;color:rgba(255,255,255,.65);margin-bottom:16px;">Auto-generated ideas scored by feasibility &amp; impact</div><div style="display:flex;gap:12px;flex-wrap:wrap;"><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🤖 AI Generation</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🌐 Community Discovery</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">⚡ One-Click Build</span></div></div><div style="text-align:center;">${cta(13)}<div style="margin-top:6px;">${url}</div></div></div>` },
    { name:'Billboard', category:'Special Sizes', width:970, height:250, html:`<div style="${base(970,250)}display:flex;align-items:center;padding:0 40px;gap:40px;"><div style="flex:1;"><div style="font-size:28px;font-weight:800;color:#f59e0b;margin-bottom:6px;">💡 Score. Build. Ship.</div><div style="font-size:14px;color:rgba(255,255,255,.65);margin-bottom:16px;">Auto-generated ideas scored by feasibility &amp; impact</div><div style="display:flex;gap:12px;flex-wrap:wrap;"><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🤖 AI Generation</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🌐 Community Discovery</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">⚡ One-Click Build</span></div></div><div style="text-align:center;">${cta(13)}<div style="margin-top:6px;">${url}</div></div></div>` },
    { name:'Square', category:'Special Sizes', width:250, height:250, html:`<div style="${base(250,250)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">💡</div><div style="font-size:18px;font-weight:800;color:#f59e0b;margin-bottom:6px;">Never Run Out of Ideas</div><div style="font-size:12px;color:rgba(255,255,255,.65);margin-bottom:12px;line-height:1.4;">Auto-generated ideas scored<br>by feasibility &amp; impact</div>${cta(13)}<div style="margin-top:8px;">${url}</div></div>` },
  ];
}

function buildUsersAds() {
  const font = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;`;
  const bg = `background:linear-gradient(135deg,#0f0f1a 0%,#1a1d2e 100%);`;
  const glass = `background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.15);border-radius:8px;backdrop-filter:blur(8px);`;
  const cta = (sz) => `<span style="display:inline-block;background:#f59e0b;color:#000;padding:6px 14px;border-radius:6px;font-weight:700;font-size:${sz}px;white-space:nowrap;">Try Team Directory →</span>`;
  const url = `<span style="color:rgba(255,255,255,.4);font-size:10px;">cc-users.adam-harris.alphaclaw.app</span>`;
  const base = (w,h) => `${bg}${font}color:#fff;width:${w}px;height:${h}px;overflow:hidden;position:relative;box-sizing:border-box;`;

  return [
    { name:'Leaderboard', category:'Display Ads', width:728, height:90, html:`<div style="${base(728,90)}display:flex;align-items:center;justify-content:space-between;padding:0 20px;"><div style="display:flex;align-items:center;gap:12px;"><span style="font-size:26px;">👤</span><span style="font-size:16px;font-weight:700;color:#f59e0b;">Know Your Team</span></div><div style="display:flex;align-items:center;gap:10px;">${url}${cta(11)}</div></div>` },
    { name:'Medium Rectangle', category:'Display Ads', width:300, height:250, html:`<div style="${base(300,250)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">👤</div><div style="font-size:18px;font-weight:800;color:#f59e0b;margin-bottom:6px;">Know Your Team</div><div style="font-size:12px;color:rgba(255,255,255,.65);margin-bottom:12px;line-height:1.4;">AI-enriched profiles with<br>personality insights &amp; social discovery</div><div style="${glass}padding:8px 14px;margin-bottom:14px;font-size:11px;color:rgba(255,255,255,.7);">🧠 Personality · 🔍 Social · 📄 PDF</div>${cta(13)}<div style="margin-top:8px;">${url}</div></div>` },
    { name:'Wide Skyscraper', category:'Display Ads', width:160, height:600, html:`<div style="${base(160,600)}display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:24px 12px;text-align:center;"><div><div style="font-size:36px;margin-bottom:10px;">👤</div><div style="font-size:16px;font-weight:800;color:#f59e0b;line-height:1.3;">Beyond the<br>Org Chart</div></div><div style="width:100%;"><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">🧠 Personality Insights</div><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">🔍 Social Discovery</div><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">💬 Slack Activity</div><div style="${glass}padding:10px;margin-bottom:10px;font-size:11px;text-align:left;color:rgba(255,255,255,.7);">📄 PDF Profiles</div></div><div>${cta(13)}<div style="margin-top:8px;">${url}</div></div></div>` },
    { name:'Large Rectangle', category:'Display Ads', width:336, height:280, html:`<div style="${base(336,280)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">👤</div><div style="font-size:18px;font-weight:800;color:#f59e0b;margin-bottom:6px;">Know Your Team</div><div style="font-size:12px;color:rgba(255,255,255,.65);margin-bottom:12px;line-height:1.4;">AI-enriched profiles with<br>personality insights &amp; social discovery</div><div style="${glass}padding:8px 14px;margin-bottom:14px;font-size:11px;color:rgba(255,255,255,.7);">🧠 Personality · 🔍 Social · 📄 PDF</div>${cta(13)}<div style="margin-top:8px;">${url}</div></div>` },
    { name:'Mobile Banner', category:'Display Ads', width:320, height:50, html:`<div style="${base(320,50)}display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">👤</span><span style="font-size:13px;font-weight:700;color:#f59e0b;">Know Your Team</span></div>${cta(11)}</div>` },
    { name:'Social Square', category:'Social Media', width:1080, height:1080, html:`<div style="${base(1080,1080)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;text-align:center;"><div style="font-size:72px;margin-bottom:20px;">👤</div><div style="font-size:42px;font-weight:800;color:#f59e0b;margin-bottom:12px;line-height:1.2;">Know Your Team<br>Beyond the Org Chart</div><div style="font-size:18px;color:rgba(255,255,255,.6);margin-bottom:36px;">AI-Powered Team Intelligence Platform</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px;width:100%;max-width:600px;"><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">🧠</div><div style="font-size:14px;font-weight:600;">Personality Insights</div></div><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">🔍</div><div style="font-size:14px;font-weight:600;">Social Discovery</div></div><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">💬</div><div style="font-size:14px;font-weight:600;">Slack & GitHub</div></div><div style="${glass}padding:20px;text-align:center;border-radius:12px;"><div style="font-size:28px;margin-bottom:6px;">📄</div><div style="font-size:14px;font-weight:600;">PDF Export</div></div></div><span style="display:inline-block;background:#f59e0b;color:#000;padding:14px 32px;border-radius:10px;font-weight:700;font-size:18px;">Try Team Directory →</span><div style="margin-top:12px;">${url}</div></div>` },
    { name:'Social Story', category:'Social Media', width:1080, height:1920, html:`<div style="${base(1080,1920)}display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:60px 40px;text-align:center;"><div><div style="font-size:80px;margin-bottom:16px;">👤</div><div style="font-size:48px;font-weight:800;color:#f59e0b;line-height:1.15;margin-bottom:16px;">Know<br>Your<br>Team</div><div style="font-size:18px;color:rgba(255,255,255,.55);">AI-Powered Team Intelligence</div></div><div style="width:100%;display:flex;flex-direction:column;gap:16px;"><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">🧠</span><div><div style="font-weight:600;font-size:16px;">Personality Insights</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Communication style from real data</div></div></div><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">🔍</span><div><div style="font-weight:600;font-size:16px;">Social Discovery</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Auto-find LinkedIn, GitHub & more</div></div></div><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">💬</span><div><div style="font-weight:600;font-size:16px;">Slack & GitHub Activity</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Messages, repos, collaboration</div></div></div><div style="${glass}padding:20px;border-radius:12px;text-align:left;display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">📄</span><div><div style="font-weight:600;font-size:16px;">PDF Profiles</div><div style="font-size:12px;color:rgba(255,255,255,.5);">Export professional dossiers</div></div></div></div><div><span style="display:inline-block;background:#f59e0b;color:#000;padding:16px 40px;border-radius:12px;font-weight:700;font-size:20px;">Try Team Directory →</span><div style="margin-top:12px;">${url}</div></div></div>` },
    { name:'Twitter/X Header', category:'Social Media', width:1500, height:500, html:`<div style="${base(1500,500)}display:flex;align-items:center;padding:0 40px;gap:40px;"><div style="flex:1;"><div style="font-size:28px;font-weight:800;color:#f59e0b;margin-bottom:6px;">👤 AI-Powered Team Intelligence</div><div style="font-size:14px;color:rgba(255,255,255,.65);margin-bottom:16px;">Personality insights, social discovery &amp; relationship context</div><div style="display:flex;gap:12px;flex-wrap:wrap;"><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🧠 Personality Insights</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🔍 Social Discovery</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">📄 PDF Profiles</span></div></div><div style="text-align:center;">${cta(13)}<div style="margin-top:6px;">${url}</div></div></div>` },
    { name:'Billboard', category:'Special Sizes', width:970, height:250, html:`<div style="${base(970,250)}display:flex;align-items:center;padding:0 40px;gap:40px;"><div style="flex:1;"><div style="font-size:28px;font-weight:800;color:#f59e0b;margin-bottom:6px;">👤 AI-Powered Team Intelligence</div><div style="font-size:14px;color:rgba(255,255,255,.65);margin-bottom:16px;">Personality insights, social discovery &amp; relationship context</div><div style="display:flex;gap:12px;flex-wrap:wrap;"><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🧠 Personality Insights</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">🔍 Social Discovery</span><span style="${glass}padding:8px 12px;font-size:12px;color:rgba(255,255,255,.7);">📄 PDF Profiles</span></div></div><div style="text-align:center;">${cta(13)}<div style="margin-top:6px;">${url}</div></div></div>` },
    { name:'Square', category:'Special Sizes', width:250, height:250, html:`<div style="${base(250,250)}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">👤</div><div style="font-size:18px;font-weight:800;color:#f59e0b;margin-bottom:6px;">Know Your Team</div><div style="font-size:12px;color:rgba(255,255,255,.65);margin-bottom:12px;line-height:1.4;">AI-enriched profiles with<br>personality insights &amp; social discovery</div>${cta(13)}<div style="margin-top:8px;">${url}</div></div>` },
  ];
}

function buildDadJokeAds() {
  const font = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;`;
  const bg = `background:linear-gradient(135deg,#1a1a2e,#16213e);`;
  const base = (w,h) => `${bg}${font}color:#fff;width:${w}px;height:${h}px;overflow:hidden;position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:12px;`;
  const ctaBtn = `<span style="background:#f59e0b;color:#000;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;margin-top:6px;display:inline-block;">Get the Joke →</span>`;

  return [
    { name:'Leaderboard', category:'Display Ads', width:728, height:90, html:`<div style="${base(728,90)}flex-direction:row;gap:12px;"><span style="font-size:2rem;">🤣</span><div><h4 style="color:#f59e0b;margin:0 0 4px;font-size:14px;">Dad Joke of the Day</h4><p style="margin:0;font-size:12px;color:#ccc;">Why don't scientists trust atoms?</p></div><span style="background:#f59e0b;color:#000;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;">Get the Joke →</span></div>` },
    { name:'Medium Rectangle', category:'Display Ads', width:300, height:250, html:`<div style="${base(300,250)}"><span style="font-size:3rem;">🤣</span><h4 style="color:#f59e0b;margin:8px 0 4px;">Dad Joke of the Day</h4><p style="font-size:14px;padding:0 12px;margin:4px 0;">"What do you call a fake noodle?"</p><p style="color:#f59e0b;font-weight:600;margin:4px 0;">Click to find out!</p>${ctaBtn}</div>` },
    { name:'Mobile Banner', category:'Display Ads', width:320, height:50, html:`<div style="${base(320,50)}flex-direction:row;gap:8px;padding:4px 8px;"><span style="font-size:1.3rem;">🤣</span><p style="font-size:11px;flex:1;margin:0;">Today's dad joke is waiting...</p><span style="background:#f59e0b;color:#000;padding:4px 12px;border-radius:6px;font-size:10px;font-weight:700;">Open</span></div>` },
    { name:'Wide Skyscraper', category:'Display Ads', width:300, height:600, html:`<div style="${base(300,600)}"><span style="font-size:4rem;">🤣</span><h4 style="color:#f59e0b;font-size:18px;margin:12px 0 4px;">One Groan Per Day</h4><p style="padding:0 16px;font-size:14px;margin:4px 0;">"Why did the scarecrow win an award?"</p><p style="font-size:12px;color:#888;margin:4px 0;">He was outstanding in his field!</p><div style="margin-top:12px;display:flex;gap:8px;"><span style="font-size:1.5rem;">😩</span><span style="font-size:1.5rem;">🙄</span><span style="font-size:1.5rem;">😂</span></div><span style="background:#f59e0b;color:#000;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:700;margin-top:12px;display:inline-block;">Get the App →</span></div>` },
    { name:'Facebook Feed', category:'Social Media', width:1200, height:628, html:`<div style="${base(1200,628)}"><span style="font-size:4rem;">🤣</span><h4 style="color:#f59e0b;font-size:20px;margin:12px 0 4px;">Dad Joke of the Day</h4><p style="font-size:16px;padding:0 24px;margin:4px 0;">"What do you call cheese that isn't yours?"</p><p style="color:#f59e0b;font-size:18px;font-weight:700;margin:8px 0;">Nacho cheese!</p><span style="background:#f59e0b;color:#000;padding:8px 20px;border-radius:6px;font-size:14px;font-weight:700;margin-top:12px;display:inline-block;">Try It Free →</span></div>` },
    { name:'Social Story', category:'Social Media', width:1080, height:1920, html:`<div style="${base(1080,1920)}padding:60px 40px;justify-content:space-between;"><div style="text-align:center;"><span style="font-size:4rem;">🤣</span><h4 style="color:#f59e0b;font-size:36px;margin:20px 0;">Dad Joke<br>of the Day</h4><p style="font-size:24px;padding:0 20px;margin:20px 0;">"Why do programmers prefer dark mode?"</p><p style="color:#f59e0b;font-weight:700;font-size:22px;margin:12px 0;">Because light attracts bugs!</p></div><span style="background:#f59e0b;color:#000;padding:10px 24px;border-radius:6px;font-size:16px;font-weight:700;display:inline-block;">Swipe Up →</span></div>` },
  ];
}

function buildGenAlphaAds() {
  return [
    { name:'Leaderboard', category:'Display Ads', width:728, height:90, html:`<div style="width:728px;height:90px;background:linear-gradient(135deg,#8b5cf6,#ec4899);border-radius:8px;display:flex;align-items:center;justify-content:center;gap:16px;padding:0 24px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><span style="font-size:24px;">🧠</span><span style="font-weight:800;font-size:16px;color:#fff;">GenAlpha — Decode the Brainrot</span><span style="margin-left:auto;padding:6px 16px;background:#fff;color:#8b5cf6;border-radius:6px;font-weight:700;font-size:12px;">Try Now →</span></div>` },
    { name:'Medium Rectangle', category:'Display Ads', width:300, height:250, html:`<div style="width:300px;height:250px;background:linear-gradient(180deg,#1a1a2e,#16213e);border:1px solid rgba(139,92,246,.3);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><span style="font-size:40px;margin-bottom:8px;">🧠</span><span style="font-weight:900;font-size:18px;color:#fff;text-align:center;">What's Your<br>Brainrot Level?</span><span style="font-size:12px;color:rgba(255,255,255,.6);margin:8px 0 12px;text-align:center;">50+ slang terms · Quiz · Translator</span><span style="padding:8px 20px;background:#8b5cf6;color:#fff;border-radius:8px;font-weight:700;font-size:13px;">Take the Quiz →</span></div>` },
    { name:'Mobile Banner', category:'Display Ads', width:320, height:50, html:`<div style="width:320px;height:50px;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:6px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><span style="font-weight:700;font-size:12px;color:#fff;">🧠 GenAlpha Dictionary</span><span style="padding:4px 12px;background:#fff;color:#8b5cf6;border-radius:4px;font-weight:700;font-size:10px;">Open →</span></div>` },
    { name:'Social Story', category:'Social Media', width:1080, height:1920, html:`<div style="width:1080px;height:1920px;background:linear-gradient(180deg,#0f0f23,#1a0a2e,#2d1b69);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;box-sizing:border-box;border:1px solid rgba(139,92,246,.2);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><span style="font-size:80px;">💀</span><span style="font-weight:900;font-size:48px;color:#fff;text-align:center;margin:40px 0 16px;">POV: You Don't<br>Know What<br>"Skibidi" Means</span><span style="font-size:18px;color:rgba(255,255,255,.5);margin:16px 0;">genalpha dictionary</span><span style="padding:16px 40px;background:#ec4899;color:#fff;border-radius:12px;font-weight:700;font-size:20px;margin-top:24px;">Swipe Up →</span></div>` },
    { name:'Facebook Feed', category:'Social Media', width:1200, height:628, html:`<div style="width:1200px;height:628px;background:linear-gradient(135deg,#1a0a2e,#0f172a);border-radius:8px;display:flex;align-items:center;justify-content:center;gap:24px;padding:24px;box-sizing:border-box;border:1px solid rgba(139,92,246,.2);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><div style="text-align:center;"><div style="font-size:72px;margin-bottom:16px;">🔥</div><div style="font-weight:900;font-size:36px;color:#fff;">rizz · sigma · bussin</div><div style="font-weight:900;font-size:36px;color:#8b5cf6;">skibidi · no cap · slay</div><div style="font-size:18px;color:rgba(255,255,255,.5);margin:20px 0;">The complete Gen Alpha slang dictionary</div><span style="padding:12px 28px;background:#8b5cf6;color:#fff;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;">Learn the Lingo →</span></div></div>` },
  ];
}

})();
