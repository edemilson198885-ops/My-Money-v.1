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
    const { data, error } = await MM.supabase.auth.getSession();
    if (error) throw error;
    return data.session || null;
  },

  async getUser() {
    const { data, error } = await MM.supabase.auth.getUser();
    if (error) throw error;
    return data.user || null;
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
