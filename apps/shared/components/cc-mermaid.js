(function () {
  const TAG = 'cc-mermaid';
  if (customElements.get(TAG)) return;

  let mermaidLoading = false;
  let mermaidReady = false;
  const queue = [];

  function loadMermaid(cb) {
    if (mermaidReady) return cb();
    queue.push(cb);
    if (mermaidLoading) return;
    mermaidLoading = true;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    s.onload = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches ||
        document.documentElement.classList.contains('dark') ||
        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().startsWith('#0');
      window.mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });
      mermaidReady = true;
      queue.forEach(fn => fn());
      queue.length = 0;
    };
    document.head.appendChild(s);
  }

  let renderCounter = 0;

  class CcMermaid extends HTMLElement {
    static get observedAttributes() { return ['code']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _render() {
      const code = this.getAttribute('code');
      if (!code) { this.innerHTML = ''; return; }

      this.innerHTML = '<div class="cc-mermaid__loading" style="color:var(--muted,#94a3b8);font-size:0.9rem;padding:16px">Loading diagram…</div>';

      loadMermaid(async () => {
        try {
          const id = 'cc-mermaid-' + (++renderCounter);
          const { svg } = await window.mermaid.render(id, code);
          this.innerHTML = `<div class="cc-mermaid__diagram">${svg}</div>`;
        } catch (e) {
          this.innerHTML = `<div class="cc-mermaid__error" style="color:#f87171;font-size:0.85rem;padding:12px;border:1px solid #f8717133;border-radius:8px">Diagram error: ${e.message || e}</div>`;
        }
      });

      this._injectStyles();
    }

    _injectStyles() {
      if (document.getElementById('cc-mermaid-styles')) return;
      const s = document.createElement('style');
      s.id = 'cc-mermaid-styles';
      s.textContent = `
        cc-mermaid { display: block; }
        .cc-mermaid__diagram { overflow-x: auto; padding: 8px 0; }
        .cc-mermaid__diagram svg { max-width: 100%; height: auto; }
      `;
      document.head.appendChild(s);
    }
  }

  customElements.define(TAG, CcMermaid);
})();
