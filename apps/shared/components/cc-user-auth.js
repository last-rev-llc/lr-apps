/* ── User Auth Component ─────────────────────────────────────
   Full auth UI: login/signup modal, user menu dropdown, account page.
   
   Usage:
     <cc-user-auth></cc-user-auth>
     
   Attributes:
     mode="gate"     — Blocks page until signed in (default: shows login button)
     mode="menu"     — Shows user avatar/menu when signed in, login button when not
     providers="email,google,github" — Comma-separated auth providers
     redirect="/dashboard"  — Redirect after login
     
   Requires: supabase-auth.js loaded before this component.
*/

class CcUserAuth extends HTMLElement {
  connectedCallback() {
    this._mode = this.getAttribute('mode') || 'menu';
    this._providers = (this.getAttribute('providers') || 'email').split(',').map(s => s.trim());
    this._redirect = this.getAttribute('redirect');
    this._allowSignup = this.getAttribute('allow-signup') !== 'false';
    this._view = 'login'; // login | signup | forgot | account
    
    // Wait for sbAuth
    if (!window.sbAuth) {
      const check = setInterval(() => {
        if (window.sbAuth) { clearInterval(check); this._init(); }
      }, 50);
      setTimeout(() => clearInterval(check), 5000);
    } else {
      this._init();
    }
  }

  _init() {
    window.sbAuth.onAuthStateChange((event, session) => {
      this._render();
      if (event === 'SIGNED_IN' && this._redirect && this._mode === 'gate') {
        window.location.href = this._redirect;
      }
    });
    this._render();
  }

  _render() {
    const user = window.sbAuth?.getUser();
    
    if (this._mode === 'gate' && !user) {
      this._renderGate();
    } else if (user) {
      this._renderUserMenu(user);
    } else {
      this._renderLoginButton();
    }
  }

  _renderLoginButton() {
    this.innerHTML = `
      <button class="ua-login-btn" aria-label="Sign in">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        Sign In
      </button>`;
    this.querySelector('.ua-login-btn').onclick = () => this._showModal('login');
  }

  _renderUserMenu(user) {
    const initial = (user.email || 'U')[0].toUpperCase();
    const name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
    this.innerHTML = `
      <div class="ua-user-menu">
        <button class="ua-avatar-btn" aria-label="Account menu">
          <span class="ua-avatar">${initial}</span>
          <span class="ua-name">${name}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="ua-dropdown">
          <div class="ua-dropdown-header">
            <span class="ua-avatar ua-avatar-lg">${initial}</span>
            <div>
              <div class="ua-dropdown-name">${name}</div>
              <div class="ua-dropdown-email">${user.email || ''}</div>
            </div>
          </div>
          <div class="ua-dropdown-divider"></div>
          <button class="ua-dropdown-item" data-action="account">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Account
          </button>
          <button class="ua-dropdown-item" data-action="billing">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Billing
          </button>
          <div class="ua-dropdown-divider"></div>
          <button class="ua-dropdown-item ua-logout" data-action="logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>`;
    
    const avatarBtn = this.querySelector('.ua-avatar-btn');
    const dropdown = this.querySelector('.ua-dropdown');
    
    avatarBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('ua-show');
    };
    
    document.addEventListener('click', () => dropdown.classList.remove('ua-show'), { once: false });
    
    this.querySelectorAll('.ua-dropdown-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.remove('ua-show');
        const action = btn.dataset.action;
        if (action === 'logout') this._logout();
        else if (action === 'account') this._showModal('account');
        else if (action === 'billing') this._showModal('billing');
      };
    });
  }

  _renderGate() {
    document.documentElement.style.visibility = 'hidden';
    const showGate = () => {
      document.body.style.visibility = 'hidden';
      this._showModal('login', true);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showGate);
    } else {
      showGate();
    }
  }

  _showModal(view, isGate = false) {
    this._view = view;
    // Remove existing modal
    document.getElementById('ua-modal')?.remove();
    
    const modal = document.createElement('div');
    modal.id = 'ua-modal';
    modal.className = 'ua-modal-overlay';
    
    let content = '';
    if (view === 'login') content = this._loginHTML();
    else if (view === 'signup') content = this._signupHTML();
    else if (view === 'forgot') content = this._forgotHTML();
    else if (view === 'account') content = this._accountHTML();
    else if (view === 'billing') content = this._billingHTML();
    
    modal.innerHTML = `
      <div class="ua-modal">
        ${!isGate ? '<button class="ua-modal-close" aria-label="Close">&times;</button>' : ''}
        ${content}
      </div>`;
    
    // Ensure modal is visible even when gate hides body
    modal.style.visibility = 'visible';
    document.body.appendChild(modal);
    
    if (!isGate) {
      modal.querySelector('.ua-modal-close')?.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }
    
    this._bindModalEvents(view, modal, isGate);
    modal.querySelector('input')?.focus();
  }

  _loginHTML() {
    return `
      <div class="ua-modal-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #f59e0b)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h2 class="ua-modal-title">Welcome Back</h2>
      <p class="ua-modal-subtitle">Sign in to your account</p>
      <div class="ua-error" id="ua-error"></div>
      <form class="ua-form" id="ua-form">
        <input type="email" name="email" placeholder="Email" class="ua-input" required autocomplete="email">
        <input type="password" name="password" placeholder="Password" class="ua-input" required autocomplete="current-password">
        <button type="submit" class="ua-submit-btn">Sign In</button>
      </form>
      <div class="ua-form-links">
        <button class="ua-link" data-goto="forgot">Forgot password?</button>
        ${this._allowSignup ? '<span class="ua-separator">·</span><button class="ua-link" data-goto="signup">Create account</button>' : ''}
      </div>
      ${this._oauthButtonsHTML()}`;
  }

  _signupHTML() {
    return `
      <div class="ua-modal-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #f59e0b)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
      </div>
      <h2 class="ua-modal-title">Create Account</h2>
      <p class="ua-modal-subtitle">Start your free account</p>
      <div class="ua-error" id="ua-error"></div>
      <form class="ua-form" id="ua-form">
        <input type="text" name="name" placeholder="Display name" class="ua-input" autocomplete="name">
        <input type="email" name="email" placeholder="Email" class="ua-input" required autocomplete="email">
        <input type="password" name="password" placeholder="Password (min 6 characters)" class="ua-input" required autocomplete="new-password" minlength="6">
        <button type="submit" class="ua-submit-btn">Create Account</button>
      </form>
      <div class="ua-form-links">
        <button class="ua-link" data-goto="login">Already have an account? Sign in</button>
      </div>
      ${this._oauthButtonsHTML()}`;
  }

  _forgotHTML() {
    return `
      <div class="ua-modal-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #f59e0b)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <h2 class="ua-modal-title">Reset Password</h2>
      <p class="ua-modal-subtitle">We'll send you a magic link</p>
      <div class="ua-error" id="ua-error"></div>
      <div class="ua-success" id="ua-success"></div>
      <form class="ua-form" id="ua-form">
        <input type="email" name="email" placeholder="Email" class="ua-input" required autocomplete="email">
        <button type="submit" class="ua-submit-btn">Send Magic Link</button>
      </form>
      <div class="ua-form-links">
        <button class="ua-link" data-goto="login">Back to sign in</button>
      </div>`;
  }

  _accountHTML() {
    const user = window.sbAuth?.getUser();
    if (!user) return '<p>Not signed in</p>';
    const name = user.user_metadata?.display_name || user.email?.split('@')[0] || '';
    return `
      <div class="ua-modal-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #f59e0b)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <h2 class="ua-modal-title">Account</h2>
      <div class="ua-error" id="ua-error"></div>
      <div class="ua-success" id="ua-success"></div>
      <form class="ua-form" id="ua-form">
        <label class="ua-label">Display Name</label>
        <input type="text" name="name" value="${name}" placeholder="Display name" class="ua-input">
        <label class="ua-label">Email</label>
        <input type="email" name="email" value="${user.email || ''}" class="ua-input" disabled>
        <button type="submit" class="ua-submit-btn">Save Changes</button>
      </form>`;
  }

  _billingHTML() {
    return `
      <div class="ua-modal-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #f59e0b)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      </div>
      <h2 class="ua-modal-title">Billing</h2>
      <div id="ua-billing-content">
        <p class="ua-modal-subtitle">Loading subscription details...</p>
      </div>`;
  }

  _oauthButtonsHTML() {
    const oauthProviders = this._providers.filter(p => p !== 'email');
    if (oauthProviders.length === 0) return '';
    
    const icons = {
      google: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>',
      github: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>'
    };
    
    const buttons = oauthProviders.map(p => `
      <button class="ua-oauth-btn" data-provider="${p}">
        ${icons[p] || ''}
        <span>Continue with ${p[0].toUpperCase() + p.slice(1)}</span>
      </button>`).join('');
    
    return `<div class="ua-divider"><span>or</span></div><div class="ua-oauth-buttons">${buttons}</div>`;
  }

  _bindModalEvents(view, modal, isGate) {
    // Navigation links
    modal.querySelectorAll('[data-goto]').forEach(link => {
      link.onclick = () => {
        if (link.dataset.goto === 'signup' && !this._allowSignup) return;
        this._showModal(link.dataset.goto, isGate);
      };
    });
    
    // OAuth buttons
    modal.querySelectorAll('[data-provider]').forEach(btn => {
      btn.onclick = () => window.sbAuth.signInWithOAuth(btn.dataset.provider);
    });
    
    // Form submit
    const form = modal.querySelector('#ua-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const err = modal.querySelector('#ua-error');
        const success = modal.querySelector('#ua-success');
        const submitBtn = form.querySelector('.ua-submit-btn');
        
        err.textContent = '';
        if (success) success.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
        
        try {
          if (view === 'login') {
            await window.sbAuth.signIn(data.get('email'), data.get('password'));
            modal.remove();
            if (isGate) {
              document.documentElement.style.visibility = '';
              document.body.style.visibility = '';
            }
          } else if (view === 'signup') {
            const res = await window.sbAuth.signUp(data.get('email'), data.get('password'), {
              display_name: data.get('name')
            });
            // Create app profile
            if (window.sbAuth.isAuthenticated()) {
              await window.sbAuth.updateProfile({ display_name: data.get('name') });
              modal.remove();
              if (isGate) {
                document.documentElement.style.visibility = '';
                document.body.style.visibility = '';
              }
            } else {
              // Email confirmation required
              if (success) {
                success.textContent = 'Check your email to confirm your account!';
                success.style.display = 'block';
              }
            }
          } else if (view === 'forgot') {
            await window.sbAuth.signInWithMagicLink(data.get('email'));
            if (success) {
              success.textContent = 'Magic link sent! Check your email.';
              success.style.display = 'block';
            }
          } else if (view === 'account') {
            await window.sbAuth.updateProfile({ display_name: data.get('name') });
            if (success) {
              success.textContent = 'Profile updated!';
              success.style.display = 'block';
            }
          }
        } catch (error) {
          err.textContent = error.message;
          err.style.display = 'block';
        } finally {
          submitBtn.disabled = false;
          if (view === 'login') submitBtn.textContent = 'Sign In';
          else if (view === 'signup') submitBtn.textContent = 'Create Account';
          else if (view === 'forgot') submitBtn.textContent = 'Send Magic Link';
          else if (view === 'account') submitBtn.textContent = 'Save Changes';
        }
      };
    }
    
    // Load billing info
    if (view === 'billing') {
      this._loadBilling(modal);
    }
  }

  async _loadBilling(modal) {
    const container = modal.querySelector('#ua-billing-content');
    try {
      const sub = await window.sbAuth.getSubscription();
      if (!sub || sub.plan === 'free') {
        container.innerHTML = `
          <div class="ua-billing-plan">
            <span class="ua-plan-badge ua-plan-free">Free</span>
            <p>You're on the free plan.</p>
          </div>
          <p class="ua-modal-subtitle">Upgrade to unlock premium features.</p>
          <button class="ua-submit-btn" id="ua-upgrade-btn">View Plans</button>`;
        container.querySelector('#ua-upgrade-btn')?.addEventListener('click', () => {
          // Dispatch event for cc-pricing to handle
          this.dispatchEvent(new CustomEvent('show-pricing', { bubbles: true }));
          modal.remove();
        });
      } else {
        const statusColor = sub.status === 'active' ? '#22c55e' : '#ef4444';
        container.innerHTML = `
          <div class="ua-billing-plan">
            <span class="ua-plan-badge">${sub.plan}</span>
            <span class="ua-plan-status" style="color:${statusColor}">${sub.status}</span>
          </div>
          ${sub.current_period_end ? `<p class="ua-modal-subtitle">Renews ${new Date(sub.current_period_end).toLocaleDateString()}</p>` : ''}
          ${sub.cancel_at_period_end ? '<p class="ua-cancel-notice">⚠️ Cancels at end of billing period</p>' : ''}
          <div class="ua-billing-actions">
            <button class="ua-submit-btn" id="ua-manage-btn">Manage Subscription</button>
          </div>`;
        container.querySelector('#ua-manage-btn')?.addEventListener('click', () => {
          // Opens Stripe Customer Portal — requires server-side session creation
          this.dispatchEvent(new CustomEvent('manage-billing', { bubbles: true, detail: { subscription: sub } }));
        });
      }
    } catch (e) {
      container.innerHTML = `<p class="ua-error" style="display:block">Failed to load billing info</p>`;
    }
  }

  async _logout() {
    await window.sbAuth?.signOut();
    this._render();
  }
}

customElements.define('cc-user-auth', CcUserAuth);

/* ── Styles ── */
(function() {
  if (document.getElementById('cc-user-auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'cc-user-auth-styles';
  style.textContent = `
    /* Login button */
    .ua-login-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border, #333);
      background: var(--surface, #1a1a2e); color: var(--text, #e0e0e0);
      font-size: 14px; cursor: pointer; transition: all .2s;
    }
    .ua-login-btn:hover { background: var(--surface-hover, #252540); border-color: var(--accent, #f59e0b); }

    /* User menu */
    .ua-user-menu { position: relative; }
    .ua-avatar-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 10px 4px 4px; border-radius: 8px; border: 1px solid transparent;
      background: transparent; color: var(--text, #e0e0e0); cursor: pointer; transition: all .2s;
    }
    .ua-avatar-btn:hover { background: var(--surface, #1a1a2e); border-color: var(--border, #333); }
    .ua-avatar {
      width: 28px; height: 28px; border-radius: 50%; background: var(--accent, #f59e0b);
      color: #000; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px;
    }
    .ua-avatar-lg { width: 36px; height: 36px; font-size: 15px; }
    .ua-name { font-size: 13px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Dropdown */
    .ua-dropdown {
      display: none; position: absolute; right: 0; top: calc(100% + 4px);
      background: var(--surface, #1a1a2e); border: 1px solid var(--border, #333);
      border-radius: 12px; min-width: 220px; padding: 8px; z-index: 1000;
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }
    .ua-dropdown.ua-show { display: block; }
    .ua-dropdown-header { display: flex; align-items: center; gap: 10px; padding: 8px; }
    .ua-dropdown-name { font-weight: 600; font-size: 14px; color: var(--text, #e0e0e0); }
    .ua-dropdown-email { font-size: 12px; color: var(--text-muted, #888); }
    .ua-dropdown-divider { height: 1px; background: var(--border, #333); margin: 4px 0; }
    .ua-dropdown-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px;
      border: none; background: none; color: var(--text, #e0e0e0); font-size: 13px;
      border-radius: 8px; cursor: pointer; text-align: left; transition: background .15s;
    }
    .ua-dropdown-item:hover { background: var(--surface-hover, #252540); }
    .ua-logout:hover { color: #ef4444; }

    /* Modal */
    .ua-modal-overlay {
      position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
    }
    .ua-modal {
      position: relative; background: var(--surface, #1a1a2e); border: 1px solid var(--border, #333);
      border-radius: 16px; padding: 32px; width: 90%; max-width: 400px;
      box-shadow: 0 16px 64px rgba(0,0,0,.5);
    }
    .ua-modal-close {
      position: absolute; top: 12px; right: 16px; background: none; border: none;
      color: var(--text-muted, #888); font-size: 24px; cursor: pointer; line-height: 1;
    }
    .ua-modal-close:hover { color: var(--text, #e0e0e0); }
    .ua-modal-icon { text-align: center; margin-bottom: 12px; }
    .ua-modal-title { text-align: center; font-size: 20px; font-weight: 700; color: var(--text, #e0e0e0); margin: 0 0 4px; }
    .ua-modal-subtitle { text-align: center; font-size: 14px; color: var(--text-muted, #888); margin: 0 0 20px; }

    /* Form */
    .ua-form { display: flex; flex-direction: column; gap: 12px; }
    .ua-label { font-size: 12px; color: var(--text-muted, #888); margin-bottom: -8px; }
    .ua-input {
      padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border, #333);
      background: var(--bg, #0d0d1a); color: var(--text, #e0e0e0); font-size: 14px;
      outline: none; transition: border-color .2s;
    }
    .ua-input:focus { border-color: var(--accent, #f59e0b); }
    .ua-input:disabled { opacity: .5; }
    .ua-submit-btn {
      padding: 10px 20px; border-radius: 8px; border: none;
      background: var(--accent, #f59e0b); color: #000; font-weight: 600; font-size: 14px;
      cursor: pointer; transition: opacity .2s;
    }
    .ua-submit-btn:hover { opacity: .9; }
    .ua-submit-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* Links */
    .ua-form-links { text-align: center; margin-top: 12px; }
    .ua-link { background: none; border: none; color: var(--accent, #f59e0b); font-size: 13px; cursor: pointer; }
    .ua-link:hover { text-decoration: underline; }
    .ua-separator { color: var(--text-muted, #888); margin: 0 8px; }

    /* OAuth */
    .ua-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
    .ua-divider::before, .ua-divider::after { content: ''; flex: 1; height: 1px; background: var(--border, #333); }
    .ua-divider span { font-size: 12px; color: var(--text-muted, #888); }
    .ua-oauth-buttons { display: flex; flex-direction: column; gap: 8px; }
    .ua-oauth-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 10px; border-radius: 8px; border: 1px solid var(--border, #333);
      background: var(--surface, #1a1a2e); color: var(--text, #e0e0e0); font-size: 14px;
      cursor: pointer; transition: all .2s;
    }
    .ua-oauth-btn:hover { background: var(--surface-hover, #252540); border-color: var(--accent, #f59e0b); }

    /* Error/Success */
    .ua-error { display: none; color: #ef4444; font-size: 13px; text-align: center; padding: 8px; border-radius: 8px; background: rgba(239,68,68,.1); }
    .ua-success { display: none; color: #22c55e; font-size: 13px; text-align: center; padding: 8px; border-radius: 8px; background: rgba(34,197,94,.1); }

    /* Billing */
    .ua-billing-plan { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .ua-plan-badge {
      display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;
      background: var(--accent, #f59e0b); color: #000; text-transform: capitalize;
    }
    .ua-plan-badge.ua-plan-free { background: var(--border, #333); color: var(--text-muted, #888); }
    .ua-plan-status { font-size: 13px; font-weight: 500; text-transform: capitalize; }
    .ua-cancel-notice { color: #f59e0b; font-size: 13px; margin: 8px 0; }
    .ua-billing-actions { margin-top: 16px; }
  `;
  document.head.appendChild(style);
})();
