/**
 * Authentication Module
 */

const Auth = {
  currentUser: null,
  currentProfile: null,

  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      this.currentUser = session.user;
      await this.loadProfile(session.user.id);
      return true;
    }
    return false;
  },

  async loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return null;
    }

    this.currentProfile = data;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    this.currentUser = data.user;
    await this.loadProfile(data.user.id);
    return { success: true };
  },

  async signOut() {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.currentProfile = null;
  },

  getRole() {
    return this.currentProfile?.role || null;
  },

  hasRole(...roles) {
    return roles.includes(this.getRole());
  },

  isAdmin() {
    return this.getRole() === 'admin';
  },

  isCustomer() {
    return this.getRole() === 'customer';
  },

  getUserInitials() {
    if (!this.currentProfile?.full_name) return '?';
    return this.currentProfile.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
};

window.Auth = Auth;
