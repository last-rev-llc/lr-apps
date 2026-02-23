// ─── Auth Gate ────────────────────────────────────────────
// Usage: <cc-auth></cc-auth>
// Pure auth gate — no nav/lock UI (that's now in <cc-topbar>).
class CcAuth extends HTMLElement {
  connectedCallback() {
    const PASS = this.getAttribute('password') || 'lr2026';
    const KEY = this.getAttribute('storage-key') || 'cc_auth';

    if (localStorage.getItem(KEY) === PASS) return;

    document.documentElement.style.visibility = 'hidden';

    const showGate = () => {
      document.body.style.visibility = 'hidden';
      const overlay = document.createElement('div');
      overlay.id = 'auth-gate';
      overlay.innerHTML = `
        <div class="auth-gate-overlay">
          <div class="auth-gate-modal">
            <div class="auth-gate-icon">🔒</div>
            <div class="auth-gate-title">Enter Password</div>
            <input id="auth-input" type="password" placeholder="Password" class="auth-gate-input">
            <div id="auth-error" class="auth-gate-error">Incorrect password</div>
            <button id="auth-submit" class="auth-gate-submit">Unlock</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.style.visibility = 'visible';

      const input = document.getElementById('auth-input');
      const err = document.getElementById('auth-error');
      const btn = document.getElementById('auth-submit');

      const tryAuth = () => {
        if (input.value === PASS) {
          localStorage.setItem(KEY, PASS);
          overlay.remove();
          document.documentElement.style.visibility = '';
          document.body.style.visibility = '';
        } else {
          err.style.display = 'block';
          input.value = '';
          input.focus();
        }
      };

      btn.onclick = tryAuth;
      input.onkeydown = (e) => { if (e.key === 'Enter') tryAuth(); };
      input.focus();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showGate);
    } else {
      showGate();
    }
  }
}
customElements.define('cc-auth', CcAuth);
