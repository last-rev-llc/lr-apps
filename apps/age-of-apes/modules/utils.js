// Age of Apes — Shared utility functions
window.AOA = {
  fmt(n) { return n == null ? '0' : n.toLocaleString(); },

  esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
  escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },

  timeStr(d, h, m, s) {
    const parts = [];
    if (d) parts.push(d + 'd');
    if (h) parts.push(h + 'h');
    if (m) parts.push(m + 'm');
    if (s) parts.push(s + 's');
    return parts.join(' ') || '0s';
  },

  totalSeconds(d, h, m, s) {
    return (d || 0) * 86400 + (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
  },

  secondsToTime(totalSec) {
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    return { d, h, m, s, str: AOA.timeStr(d, h, m, s) };
  },

  renderResultCards(items) {
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
      ${items.map(([label, value]) => `<div class="stat-box"><div class="stat-box-value" style="font-size:1.1rem;">${value}</div><div class="stat-box-label">${label}</div></div>`).join('')}
    </div>`;
  }
};
