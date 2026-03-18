window.MM = window.MM || {};

MM.auth = {
  async signInWithEmail(email) {
    email = String(email || '').trim().toLowerCase();
    if (!email) throw new Error('Informe seu e-mail.');

    const { error } = await MM.supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: 'https://edemilson198885-ops.github.io/My-Money-v.1/'
      }
    });

    if (error) throw error;
    return true;
  },

  async getSession() {
    try {
      const { data, error } = await MM.supabase.auth.getSession();
      if (error) return null;
      return data.session || null;
    } catch (e) {
      return null;
    }
  },

  async getUser() {
    try {
      const session = await this.getSession();
      if (!session || !session.user) return null;
      return session.user;
    } catch (e) {
      return null;
    }
  },

  async signOut() {
    const { error } = await MM.supabase.auth.signOut();
    if (error) throw error;
  },

  async onAuthChange(callback) {
    const { data } = MM.supabase.auth.onAuthStateChange(function(event, session) {
      if (typeof callback === 'function') {
        callback(event, session);
      }
    });
    return data.subscription;
  }
};
