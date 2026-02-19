/* <cc-ga4-alerts src="data/ga4-alerts.json"> — GA4 Traffic Anomaly Alerts widget */
(function(){
class CcGa4Alerts extends HTMLElement {
  _esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  connectedCallback(){
    this.innerHTML = `<div class="card" id="ga4a-root"><div class="card-header"><span class="status-dot" id="ga4a-dot"></span> <strong>GA4 Alerts</strong><span class="meta ml-auto text-sm text-muted" id="ga4a-time"></span></div><div id="ga4a-body" style="padding:12px;font-size:14px;color:var(--muted)">Loading…</div></div>`;
    this._style();
    this._load();
  }
  _style(){
    if(document.getElementById('ga4a-css'))return;
    const s=document.createElement('style');s.id='ga4a-css';
    s.textContent=`
      #ga4a-root .card-header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border,#333)}
      #ga4a-root .status-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
      .ga4a-ok{background:#22c55e}.ga4a-warning{background:#eab308}.ga4a-critical{background:#ef4444}
      .ga4a-alert{display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid var(--border,#222)}
      .ga4a-alert:last-child{border:none}
      .ga4a-badge{font-size:11px;font-weight:600;padding:2px 7px;border-radius:4px;flex-shrink:0;text-transform:uppercase}
      .ga4a-badge.warning{background:#eab30822;color:#eab308}.ga4a-badge.critical{background:#ef444422;color:#ef4444}
      .ga4a-pct{font-weight:700;margin-left:auto;white-space:nowrap}
      .ga4a-pct.neg{color:#ef4444}.ga4a-pct.pos{color:#22c55e}
      .ga4a-baseline{font-size:12px;color:var(--muted);margin-top:8px;display:flex;gap:16px;flex-wrap:wrap}
    `;
    document.head.appendChild(s);
  }
  async _load(){
    const src=this.getAttribute('src');if(!src)return;
    try{
      const r=await fetch(src);if(!r.ok)throw r.status;
      const d=await r.json();this._render(d);
    }catch(e){this.querySelector('#ga4a-body').textContent='Failed to load alerts';}
  }
  _render(d){
    const dot=this.querySelector('#ga4a-dot');
    dot.className='status-dot ga4a-'+(d.status||'ok');
    const time=this.querySelector('#ga4a-time');
    if(d.lastChecked){const dt=new Date(d.lastChecked);time.textContent=dt.toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
    const body=this.querySelector('#ga4a-body');
    if(!d.alerts||!d.alerts.length){
      body.innerHTML='<cc-empty-state message="No alerts" icon="✅" animation="sparkle"></cc-empty-state>';
    }else{
      body.innerHTML=d.alerts.map(a=>{
        const sign=a.changePercent>0?'+':'';
        const cls=a.changePercent<0?'neg':'pos';
        return `<div class="ga4a-alert"><span class="ga4a-badge ${a.severity}">${a.severity}</span><span>${a.message}</span><span class="ga4a-pct ${cls}">${sign}${a.changePercent}%</span></div>`;
      }).join('');
    }
    if(d.baseline){
      body.innerHTML+=`<div class="ga4a-baseline"><span>📊 7d avg: ${(d.baseline.avgSessions||0).toLocaleString()} sessions</span><span>${(d.baseline.avgPageviews||0).toLocaleString()} pvs</span><span>${(d.baseline.avgUsers||0).toLocaleString()} users</span></div>`;
    }
  }
}
customElements.define('cc-ga4-alerts',CcGa4Alerts);
})();
