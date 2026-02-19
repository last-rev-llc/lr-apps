/* ── Supabase Auth Client ────────────────────────────────────
   Lightweight GoTrue REST client for Supabase Auth.
   Works alongside supabase-client.js (data) — this handles identity.
   
   Usage:
     // Auto-inits as window.sbAuth when supabase meta tags are present
     await sbAuth.signUp('email@example.com', 'password');
     await sbAuth.signIn('email@example.com', 'password');
     await sbAuth.signOut();
     const user = sbAuth.getUser();
     const session = sbAuth.getSession();
*/

class SupabaseAuth {
  constructor(url, anonKey, appId) {
    this.url = url.replace(/\/$/, '');
    this.anonKey = anonKey;
    this.appId = appId || 'default';
    this._session = null;
    this._user = null;
    this._listeners = [];
    this._storageKey = `sb_auth_${this.appId}`;
    this._restoreSession();
  }

  /* ── Public API ── */

  /** Sign up with email + password */
  async signUp(email, password, metadata = {}) {
    const res = await this._goTrue('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        data: { app_id: this.appId, ...metadata }
      })
    });
    if (res.access_token) {
      this._setSession(res);
    }
    return res;
  }

  /** Sign in with email + password */
  async signIn(email, password) {
    const res = await this._goTrue('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.access_token) {
      this._setSession(res);
    }
    return res;
  }

  /** Sign in with magic link (passwordless) */
  async signInWithMagicLink(email, redirectTo) {
    return this._goTrue('/auth/v1/magiclink', {
      method: 'POST',
      body: JSON.stringify({
        email,
        data: { app_id: this.appId },
        ...(redirectTo && { redirect_to: redirectTo })
      })
    });
  }

  /** Sign in with OAuth provider (redirects to provider) */
  signInWithOAuth(provider, redirectTo) {
    const params = new URLSearchParams({
      provider,
      redirect_to: redirectTo || window.location.origin + window.location.pathname
    });
    window.location.href = `${this.url}/auth/v1/authorize?${params}`;
  }

  /** Sign out */
  async signOut() {
    if (this._session?.access_token) {
      try {
        await this._goTrue('/auth/v1/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this._session.access_token}` }
        });
      } catch (e) { /* ignore logout errors */ }
    }
    this._clearSession();
  }

  /** Get current user (null if not signed in) */
  getUser() {
    return this._user;
  }

  /** Get current session (null if not signed in) */
  getSession() {
    return this._session;
  }

  /** Check if user is authenticated */
  isAuthenticated() {
    return !!this._session?.access_token;
  }

  /** Refresh the access token */
  async refreshSession() {
    if (!this._session?.refresh_token) return null;
    try {
      const res = await this._goTrue('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: this._session.refresh_token })
      });
      if (res.access_token) {
        this._setSession(res);
        return res;
      }
    } catch (e) {
      this._clearSession();
    }
    return null;
  }

  /** Get user profile for this app from app_profiles table */
  async getProfile() {
    if (!this._user || !window.supabase) return null;
    const rows = await this._authedSelect('app_profiles', {
      filters: { user_id: `eq.${this._user.id}`, app_id: `eq.${this.appId}` },
      limit: 1
    });
    return rows[0] || null;
  }

  /** Update user profile for this app */
  async updateProfile(data) {
    if (!this._user || !window.supabase) return null;
    const profile = {
      user_id: this._user.id,
      app_id: this.appId,
      email: this._user.email,
      ...data,
      updated_at: new Date().toISOString()
    };
    return this._authedUpsert('app_profiles', profile);
  }

  /** Get subscription for this app */
  async getSubscription() {
    if (!this._user) return null;
    const rows = await this._authedSelect('app_subscriptions', {
      filters: { user_id: `eq.${this._user.id}`, app_id: `eq.${this.appId}` },
      limit: 1
    });
    return rows[0] || null;
  }

  /** Listen for auth state changes */
  onAuthStateChange(callback) {
    this._listeners.push(callback);
    // Immediately fire with current state
    callback(this._user ? 'SIGNED_IN' : 'SIGNED_OUT', this._session);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  /* ── Authed data helpers (use user's JWT instead of anon key) ── */

  async _authedSelect(table, opts = {}) {
    if (!this._session?.access_token) throw new Error('Not authenticated');
    const { filters = {}, order, limit, select = '*' } = opts;
    let qs = `select=${select}`;
    for (const [k, v] of Object.entries(filters)) qs += `&${k}=${v}`;
    if (order) qs += `&order=${order}`;
    if (limit) qs += `&limit=${limit}`;
    const res = await fetch(`${this.url}/rest/v1/${table}?${qs}`, {
      headers: {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this._session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`Auth SELECT ${table}: ${res.status}`);
    return res.json();
  }

  async _authedUpsert(table, rows) {
    if (!this._session?.access_token) throw new Error('Not authenticated');
    const body = Array.isArray(rows) ? rows : [rows];
    const res = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this._session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Auth UPSERT ${table}: ${res.status}`);
    return res.json();
  }

  /* ── Internal ── */

  async _goTrue(path, opts = {}) {
    const headers = {
      'apikey': this.anonKey,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    };
    const res = await fetch(`${this.url}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error_description || data.msg || data.error || `Auth error ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  _setSession(data) {
    this._session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || (Date.now() / 1000 + (data.expires_in || 3600)),
      token_type: data.token_type || 'bearer'
    };
    this._user = data.user || this._decodeUser(data.access_token);
    localStorage.setItem(this._storageKey, JSON.stringify(this._session));
    this._notify('SIGNED_IN');
    this._scheduleRefresh();
  }

  _clearSession() {
    this._session = null;
    this._user = null;
    localStorage.removeItem(this._storageKey);
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._notify('SIGNED_OUT');
  }

  _restoreSession() {
    try {
      const stored = localStorage.getItem(this._storageKey);
      if (!stored) return;
      const session = JSON.parse(stored);
      if (!session.access_token) return;

      // Check if expired
      const now = Date.now() / 1000;
      if (session.expires_at && session.expires_at < now) {
        // Try refresh
        this._session = session;
        this._user = this._decodeUser(session.access_token);
        this.refreshSession();
        return;
      }

      this._session = session;
      this._user = this._decodeUser(session.access_token);
      this._scheduleRefresh();
    } catch (e) {
      localStorage.removeItem(this._storageKey);
    }
  }

  _decodeUser(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {}
      };
    } catch (e) {
      return null;
    }
  }

  _scheduleRefresh() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    if (!this._session?.expires_at) return;
    const expiresIn = (this._session.expires_at - Date.now() / 1000) * 1000;
    // Refresh 60 seconds before expiry
    const refreshIn = Math.max(expiresIn - 60000, 1000);
    this._refreshTimer = setTimeout(() => this.refreshSession(), refreshIn);
  }

  _notify(event) {
    for (const cb of this._listeners) {
      try { cb(event, this._session); } catch (e) { console.error('Auth listener error:', e); }
    }
  }

  /** Handle OAuth/magic link callback (hash fragment contains tokens) */
  handleCallback() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return false;
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const expires_in = parseInt(params.get('expires_in') || '3600');
    if (access_token) {
      this._setSession({ access_token, refresh_token, expires_in });
      // Clean URL
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    }
    return false;
  }
}

/* ── Global singleton ── */
window.SupabaseAuth = SupabaseAuth;

/* Auto-init if config is on the page */
(function() {
  const meta = document.querySelector('meta[name="supabase-url"]');
  const key = document.querySelector('meta[name="supabase-key"]');
  const appMeta = document.querySelector('meta[name="app-id"]');
  if (meta && key) {
    const appId = appMeta?.content || document.querySelector('cc-app-nav')?.getAttribute('app') || 'default';
    window.sbAuth = new SupabaseAuth(meta.content, key.content, appId);
    // Handle OAuth/magic link callbacks
    window.sbAuth.handleCallback();
  }
})();
