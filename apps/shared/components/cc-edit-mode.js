/* <cc-edit-mode> — Edit Mode overlay system for shared components
   Scans the DOM for cc-* custom elements, adds data-cc-component attributes,
   shows wand overlay on hover, and lets users submit feedback to trigger_queue.

   Activated by cc-app-nav's Edit Mode toggle button.
   Usage: automatically loaded by index.js — no manual placement needed.
*/
(function () {
  const SUPABASE_URL_FALLBACK = 'https://lregiwsovpmljxjvrrsc.supabase.co';
  const SUPABASE_KEY_FALLBACK = 'sb_publishable_HPinRWPrX97uxshGM0u1rw_UAsQsyFq';

  // ── Styles ──────────────────────────────────────────────────────────
  const STYLE = document.createElement('style');
  STYLE.textContent = `
    /* Wand overlay on hoverable components */
    [data-cc-component].cc-edit-hoverable {
      position: relative;
    }
    .cc-edit-wand {
      position: absolute; top: 4px; right: 4px; z-index: 9998;
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      border: 2px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; opacity: 0; pointer-events: none;
      transition: opacity .2s, transform .15s;
      font-size: 14px; line-height: 1;
      box-shadow: 0 2px 12px rgba(139,92,246,.5);
    }
    [data-cc-component].cc-edit-hoverable:hover .cc-edit-wand,
    .cc-edit-wand.cc-edit-wand-focused {
      opacity: 1; pointer-events: auto;
    }
    .cc-edit-wand:hover { transform: scale(1.15); }
    [data-cc-component].cc-edit-hoverable:hover {
      outline: 2px dashed rgba(139,92,246,.5);
      outline-offset: 2px;
    }
    /* hoverable components are inline — no z-index needed */
    [data-cc-component].cc-edit-focused {
      outline: 2px solid #a855f7 !important;
      outline-offset: 2px;
    }

    /* Drawer push — shifts page content right when left sidebar opens */
    body.cc-edit-active {
      margin-left: 380px;
      transition: margin-left .3s cubic-bezier(.4,0,.2,1);
    }
    @media (max-width: 500px) {
      body.cc-edit-active { margin-left: 90vw; }
    }

    /* Sidebar panel — slides in from left */
    .cc-edit-sidebar {
      position: fixed; top: 0; left: 0; width: 380px; max-width: 90vw; height: 100vh;
      background: var(--card-bg, #1a1a2e); border-right: 1px solid var(--border, #333);
      z-index: 9999; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1);
      display: flex; flex-direction: column; font-family: inherit;
      box-shadow: 8px 0 32px rgba(0,0,0,.6);
    }
    .cc-edit-sidebar.open { transform: translateX(0); }
    .cc-edit-sidebar-header {
      padding: 16px 20px; border-bottom: 1px solid var(--border, #333);
      display: flex; align-items: center; justify-content: space-between;
    }
    .cc-edit-sidebar-header h3 {
      margin: 0; font-size: 1rem; color: var(--text, #e0e0e0);
    }
    .cc-edit-sidebar-close {
      background: none; border: none; color: var(--text-muted, #888);
      font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 4px;
    }
    .cc-edit-sidebar-close:hover { background: rgba(255,255,255,.08); }
    .cc-edit-sidebar-body { padding: 20px; flex: 1; overflow-y: auto; }
    .cc-edit-component-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, rgba(168,85,247,.15), rgba(99,102,241,.15));
      border: 1px solid rgba(139,92,246,.3); border-radius: 8px;
      padding: 8px 14px; margin-bottom: 16px; font-size: .85rem;
      color: #c4b5fd; width: fit-content;
    }
    .cc-edit-component-badge .wand { font-size: 1rem; }
    .cc-edit-label {
      font-size: .8rem; color: var(--text-muted, #888); margin-bottom: 6px;
      text-transform: uppercase; letter-spacing: .5px;
    }
    .cc-edit-textarea {
      width: 100%; min-height: 120px; background: var(--input-bg, #12121e);
      border: 1px solid var(--border, #333); border-radius: 8px;
      color: var(--text, #e0e0e0); font-family: inherit; font-size: .9rem;
      padding: 12px; resize: vertical; outline: none;
      transition: border-color .2s;
    }
    .cc-edit-textarea:focus { border-color: #a855f7; }
    .cc-edit-char-count {
      font-size: .75rem; color: var(--text-muted, #666); text-align: right; margin-top: 4px;
    }
    .cc-edit-char-count.invalid { color: #ef4444; }
    .cc-edit-submit {
      margin-top: 16px; width: 100%; padding: 12px;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: #fff; border: none; border-radius: 8px;
      font-size: .9rem; font-weight: 600; cursor: pointer;
      transition: opacity .2s, transform .1s;
    }
    .cc-edit-submit:hover:not(:disabled) { opacity: .9; }
    .cc-edit-submit:active:not(:disabled) { transform: scale(.98); }
    .cc-edit-submit:disabled { opacity: .4; cursor: not-allowed; }
    .cc-edit-success {
      margin-top: 12px; padding: 10px 14px; background: rgba(34,197,94,.12);
      border: 1px solid rgba(34,197,94,.3); border-radius: 8px;
      color: #4ade80; font-size: .85rem; text-align: center;
    }
    .cc-edit-url {
      font-size: .75rem; color: var(--text-muted, #666); margin-bottom: 16px;
      word-break: break-all;
    }
    .cc-edit-no-focus {
      color: var(--text-muted, #888); font-size: .9rem; text-align: center;
      padding: 40px 20px; line-height: 1.6;
    }
  `;
  document.head.appendChild(STYLE);

  // ── Edit Mode Controller ────────────────────────────────────────────
  class CcEditMode {
    constructor() {
      this.active = false;
      this.focusedEl = null;
      this.sidebar = null;
      this.wands = [];
    }

    // Cookie helpers — domain-wide across *.alphaclaw.app
    _setCookie(val) {
      const domain = location.hostname.endsWith('.alphaclaw.app') ? '.alphaclaw.app' : location.hostname;
      document.cookie = `cc_edit_mode=${val};path=/;domain=${domain};max-age=${val === '1' ? 86400 : 0};SameSite=Lax`;
    }
    _getCookie() {
      return document.cookie.split(';').some(c => c.trim().startsWith('cc_edit_mode=1'));
    }

    toggle() {
      this.active ? this.deactivate() : this.activate();
    }

    activate() {
      this.active = true;
      this._setCookie('1');
      this._tagComponents();
      this._createSidebar();
      this._addWands();
      document.body.classList.add('cc-edit-active');
      this.sidebar.classList.add('open');
      this._updateSidebarContent(null);
    }

    deactivate() {
      this.active = false;
      this._setCookie('0');
      this._removeWands();
      document.body.classList.remove('cc-edit-active');
      if (this.sidebar) { this.sidebar.classList.remove('open'); setTimeout(() => this.sidebar?.remove(), 300); this.sidebar = null; }
      document.querySelectorAll('.cc-edit-focused').forEach(el => el.classList.remove('cc-edit-focused'));
      document.querySelectorAll('.cc-edit-hoverable').forEach(el => el.classList.remove('cc-edit-hoverable'));
      this.focusedEl = null;
    }

    _tagComponents() {
      document.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();
        const isComponent = tag.startsWith('cc-') || tag.startsWith('lr-');
        const noTag = ['cc-fade-in']; // too generic — children get tagged instead
        if (isComponent && !noTag.includes(tag) && !el.hasAttribute('data-cc-component')) {
          el.setAttribute('data-cc-component', tag);
        }
      });
    }

    _getEditableComponents() {
      return [...document.querySelectorAll('[data-cc-component]')].filter(el => {
        // Skip the edit sidebar itself and tiny utility elements
        if (el.closest('.cc-edit-sidebar')) return false;
        const tag = el.getAttribute('data-cc-component');
        // Skip trivial/internal components
        const skip = ['cc-edit-mode', 'cc-toast', 'cc-auth', 'cc-confetti', 'cc-particles', 'cc-fade-in'];
        return !skip.includes(tag);
      });
    }

    _createSidebar() {
      if (this.sidebar) this.sidebar.remove();
      const sb = document.createElement('div');
      sb.className = 'cc-edit-sidebar';
      sb.innerHTML = `
        <div class="cc-edit-sidebar-header">
          <h3>🪄 Edit Mode</h3>
          <button class="cc-edit-sidebar-close" title="Close">✕</button>
        </div>
        <div class="cc-edit-sidebar-body"></div>
      `;
      document.body.appendChild(sb);
      this.sidebar = sb;
      sb.querySelector('.cc-edit-sidebar-close').addEventListener('click', () => this.deactivate());
    }

    _addWands() {
      this._removeWands();
      const comps = this._getEditableComponents();
      comps.forEach(el => {
        // Ensure element can anchor the absolute wand
        const pos = getComputedStyle(el).position;
        if (pos === 'static') el.style.position = 'relative';
        el.classList.add('cc-edit-hoverable');

        const wand = document.createElement('button');
        wand.className = 'cc-edit-wand';
        wand.innerHTML = '🪄';
        wand.title = `Edit ${el.getAttribute('data-cc-component')}`;
        wand.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this._focusComponent(el);
        });
        el.appendChild(wand);
        this.wands.push(wand);
      });
    }

    _removeWands() {
      this.wands.forEach(w => w.remove());
      this.wands = [];
    }

    _focusComponent(el) {
      document.querySelectorAll('.cc-edit-focused').forEach(e => e.classList.remove('cc-edit-focused'));
      el.classList.add('cc-edit-focused');
      this.focusedEl = el;
      this._updateSidebarContent(el);
    }

    _updateSidebarContent(el) {
      const body = this.sidebar?.querySelector('.cc-edit-sidebar-body');
      if (!body) return;

      const name = el ? el.getAttribute('data-cc-component') : null;
      const appMeta = document.querySelector('meta[name="app-id"]');
      const appSlug = appMeta?.content || location.hostname.split('.')[0] || 'unknown';
      const page = location.pathname.split('/').pop() || 'index.html';

      const contextHtml = `
        <div class="cc-edit-context" style="background:rgba(255,255,255,.04);border:1px solid var(--border,#333);border-radius:8px;padding:12px;margin-bottom:16px;font-size:.8rem;color:var(--text-muted,#aaa);line-height:1.5;">
          <div style="font-weight:600;color:var(--text,#e0e0e0);margin-bottom:6px;">📋 Context (auto-included)</div>
          <div>🏷️ App: <strong style="color:var(--text,#e0e0e0);">${appSlug}</strong></div>
          <div>📄 Page: <strong style="color:var(--text,#e0e0e0);">${page}</strong></div>
          ${name ? `<div>🧩 Component: <strong style="color:var(--accent,#7c6aff);">&lt;${name}&gt;</strong></div>` : '<div>🎯 Target: <em>General page feedback</em></div>'}
        </div>
      `;

      const label = name
        ? `What would you like to change on <strong>&lt;${name}&gt;</strong>?`
        : 'Describe your feedback or change request';

      body.innerHTML = `
        ${contextHtml}
        <div class="cc-edit-label">${label}</div>
        <textarea class="cc-edit-textarea" placeholder="${name ? `e.g. "Change the card background to a darker shade" or "Add hover animation to this component"` : `e.g. "Update the color scheme to feel more professional" or "The hero section needs a stronger CTA"`}" minlength="20"></textarea>
        <div class="cc-edit-char-count">0 / 20 min</div>
        <button class="cc-edit-submit" disabled>🚀 Send to Queue</button>
      `;

      const textarea = body.querySelector('.cc-edit-textarea');
      const charCount = body.querySelector('.cc-edit-char-count');
      const submitBtn = body.querySelector('.cc-edit-submit');

      textarea.addEventListener('input', () => {
        const len = textarea.value.trim().length;
        charCount.textContent = `${len} / 20 min`;
        charCount.classList.toggle('invalid', len > 0 && len < 20);
        submitBtn.disabled = len < 20;
      });

      submitBtn.addEventListener('click', () => this._submit(name, textarea.value.trim(), body));
    }

    async _submit(componentName, message, body) {
      const btn = body.querySelector('.cc-edit-submit');
      btn.disabled = true;
      btn.textContent = '⏳ Sending...';

      // Build a structured prompt with full context
      const appMeta = document.querySelector('meta[name="app-id"]');
      const appSlug = appMeta?.content || location.hostname.split('.')[0] || 'unknown';
      const page = location.pathname.split('/').pop() || 'index.html';
      const pageType = page.replace('.html', '') || 'index';

      let structured = `[From ${appSlug}] `;
      structured += `Edit request for the "${appSlug}" app on the ${pageType} page (${page}).`;
      if (componentName) {
        structured += ` The target component is <${componentName}>.`;
      } else {
        structured += ` This is a general page-level request (no specific component targeted).`;
      }
      structured += `\n\nPage URL: ${window.location.href}`;
      structured += `\nApp: ${appSlug}`;
      structured += `\nPage: ${page}`;
      if (componentName) structured += `\nComponent: ${componentName}`;
      structured += `\n\nUser request: ${message}`;
      structured += `\n\nThis is a one-shot edit request — implement the change in a single pass. Update the orchestration layer (memory/projects/${appSlug}.md) if brand, style, or architectural decisions are made. Use the build-orchestrator skill and check shared components before writing new code.`;

      const payload = {
        message: structured,
        source: appSlug,
        status: 'pending'
      };

      try {
        // Prefer the shared SupabaseClient if available (has the key baked in)
        // Always use REST API with return=representation to get the ID back
        const keyMeta = document.querySelector('meta[name="supabase-key"]');
        const anonKey = keyMeta?.content || SUPABASE_KEY_FALLBACK;
        const urlMeta = document.querySelector('meta[name="supabase-url"]');
        const sbUrl = urlMeta?.content || SUPABASE_URL_FALLBACK;
        const res = await fetch(`${sbUrl}/rest/v1/trigger_queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const [inserted] = await res.json();
        if (inserted?.id) {
          // Store in sessionStorage for polling across page navigations
          const pending = JSON.parse(sessionStorage.getItem('cc-edit-pending') || '[]');
          pending.push({ id: inserted.id, url: window.location.href, message: message.slice(0, 100) });
          sessionStorage.setItem('cc-edit-pending', JSON.stringify(pending));
        }

        btn.textContent = '✅ Sent!';
        // Clear the input and reset char count
        const textarea = body.querySelector('.cc-edit-textarea');
        const charCount = body.querySelector('.cc-edit-char-count');
        if (textarea) textarea.value = '';
        if (charCount) { charCount.textContent = '0 / 20 min'; charCount.classList.remove('invalid'); }
        setTimeout(() => { btn.textContent = '🚀 Send to Queue'; btn.disabled = true; }, 2000);
        if (window.showToast) {
          window.showToast('✨ Your edit request has been queued! Claudia will process it shortly.');
        }

        // Start polling for job completion
        this._startPolling(payload.message);
      } catch (err) {
        btn.textContent = '❌ Failed — try again';
        btn.disabled = false;
        console.error('Edit mode submit error:', err);
      }
    }

    _startPolling(message) {
      if (this._pollTimer) return; // already polling
      this._pollTimer = setInterval(() => this._pollPending(), 5000);
      // Also poll immediately after a short delay
      setTimeout(() => this._pollPending(), 3000);
    }

    async _pollPending() {
      const pending = JSON.parse(sessionStorage.getItem('cc-edit-pending') || '[]');
      if (!pending.length) {
        clearInterval(this._pollTimer);
        this._pollTimer = null;
        return;
      }

      const keyMeta = document.querySelector('meta[name="supabase-key"]');
      const anonKey = keyMeta?.content || SUPABASE_KEY_FALLBACK;
      const urlMeta = document.querySelector('meta[name="supabase-url"]');
      const sbUrl = urlMeta?.content || SUPABASE_URL_FALLBACK;

      try {
        const ids = pending.map(p => p.id).join(',');
        const res = await fetch(`${sbUrl}/rest/v1/trigger_queue?id=in.(${ids})&select=id,status`, {
          headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
        });
        if (!res.ok) return;
        const rows = await res.json();

        const completed = [];
        const still = [];
        for (const p of pending) {
          const row = rows.find(r => r.id === p.id);
          if (row && (row.status === 'done' || row.status === 'error')) {
            completed.push({ ...p, status: row.status });
          } else {
            still.push(p);
          }
        }

        sessionStorage.setItem('cc-edit-pending', JSON.stringify(still));

        for (const c of completed) {
          const isCurrentPage = c.url === window.location.href;
          if (c.status === 'done') {
            if (window.showToast) {
              window.showToast(`✅ Edit complete: "${c.message}…"${isCurrentPage ? ' — refresh to see changes!' : ''}`, 8000);
            }
          } else {
            if (window.showToast) {
              window.showToast(`❌ Edit failed: "${c.message}…"`, 6000);
            }
          }
        }

        if (!still.length) {
          clearInterval(this._pollTimer);
          this._pollTimer = null;
        }
      } catch (e) {
        console.warn('Edit mode poll error:', e);
      }
    }
  }  // end class CcEditMode

  // Expose globally so cc-app-nav can toggle it
  const instance = new CcEditMode();
  window.__ccEditMode = instance;

  // Resume polling on page load if there are pending items in sessionStorage
  const pendingOnLoad = JSON.parse(sessionStorage.getItem('cc-edit-pending') || '[]');
  if (pendingOnLoad.length) {
    instance._startPolling();
  }

  // Auto-activate if edit mode cookie persists from another page
  if (instance._getCookie()) {
    // Wait for DOM + components to load before activating
    const autoActivate = () => {
      instance.activate();
      // Sync the dev-toolbar button state
      const btn = document.querySelector('.cc-dt-edit-btn');
      if (btn) btn.classList.add('cc-dt-edit-active');
    };
    if (document.readyState === 'complete') {
      setTimeout(autoActivate, 100);
    } else {
      window.addEventListener('load', () => setTimeout(autoActivate, 100));
    }
  }
})();
