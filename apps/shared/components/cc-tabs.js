/* ⚡ <cc-tabs> — Reusable tabbed container component
   Usage:
     <cc-tabs active="admin">
       <cc-tab name="admin" label="Admin" icon="settings">...content...</cc-tab>
       <cc-tab name="code" label="Code" icon="code">...content...</cc-tab>
     </cc-tabs>
*/

(function () {
  class CcTabs extends HTMLElement {
    connectedCallback() {
      const tabs = [...this.querySelectorAll('cc-tab')];
      if (!tabs.length) return;

      // Determine active tab: URL param > attribute > first tab
      const urlTab = this.hasAttribute('no-url') ? null : new URLSearchParams(location.search).get('tab');
      const attrTab = this.getAttribute('active');
      let active = urlTab || attrTab || tabs[0].getAttribute('name');
      if (!tabs.find(t => t.getAttribute('name') === active)) active = tabs[0].getAttribute('name');

      // Build tab bar
      const bar = document.createElement('div');
      bar.className = 'cc-tabs-bar';

      tabs.forEach(tab => {
        const name = tab.getAttribute('name');
        const label = tab.getAttribute('label') || name;
        const icon = tab.getAttribute('icon');
        const btn = document.createElement('button');
        btn.className = 'cc-tab-btn' + (name === active ? ' active' : '');
        btn.dataset.tab = name;
        btn.type = 'button';

        let html = '';
        if (icon) html += '<i data-lucide="' + icon + '"></i> ';
        html += '<span>' + label + '</span>';
        btn.innerHTML = html;

        btn.addEventListener('click', () => this._activate(name));
        bar.appendChild(btn);
      });

      this.insertBefore(bar, this.firstChild);

      // Wrap each tab's content
      tabs.forEach(tab => {
        tab.classList.add('cc-tab-content');
        if (tab.getAttribute('name') !== active) tab.classList.add('hidden');
      });

      this._active = active;

      // Init Lucide icons in tab bar
      requestAnimationFrame(() => {
        if (window.lucide) lucide.createIcons({ attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide' });
      });
    }

    _activate(name) {
      if (name === this._active) return;
      this._active = name;

      // Update buttons
      this.querySelectorAll('.cc-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === name);
      });

      // Update panels
      this.querySelectorAll('cc-tab').forEach(tab => {
        tab.classList.toggle('hidden', tab.getAttribute('name') !== name);
      });

      // Persist in URL (unless no-url attribute set)
      if (!this.hasAttribute('no-url')) {
        const url = new URL(location);
        url.searchParams.set('tab', name);
        history.replaceState(null, '', url);
      }

      // Dispatch event for external listeners
      this.dispatchEvent(new CustomEvent('tab-change', { detail: { tab: name }, bubbles: true }));
    }
  }

  if (!customElements.get('cc-tabs')) customElements.define('cc-tabs', CcTabs);
  if (!customElements.get('cc-tab')) customElements.define('cc-tab', class extends HTMLElement {});
})();
