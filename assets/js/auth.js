window.MM = window.MM || {};

MM.auth = {
  normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  },

  async signInWithPassword(email, password) {
    email = this.normalizeEmail(email);
    password = String(password || '');

    if (!email) throw new Error('Informe seu e-mail.');
    if (!password) throw new Error('Informe sua senha.');

    const { data, error } = await MM.supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;
    return data;
  },

  async signUpWithPassword(email, password) {
    email = this.normalizeEmail(email);
    password = String(password || '');

    if (!email) throw new Error('Informe seu e-mail.');
    if (!password) throw new Error('Informe sua senha.');
    if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');

    const payload = { email: email, password: password };
    const { data, error } = await MM.supabase.auth.signUp(payload);
    if (error) throw error;
    return data;
  },

  async resetPassword(email) {
    email = this.normalizeEmail(email);
    if (!email) throw new Error('Informe seu e-mail para recuperar a senha.');

    const options = {};
    if (window.location && window.location.protocol !== 'file:') {
      options.redirectTo = window.location.origin + window.location.pathname;
    }

    const { data, error } = await MM.supabase.auth.resetPasswordForEmail(email, options);
    if (error) throw error;
    return data;
  },

  async getSession() {
    try {
      const { data, error } = await MM.supabase.auth.getSession();
      if (error) return null;
      return data && data.session ? data.session : null;
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
        try {
          callback(event, session);
        } catch (e) {
          console.error('onAuthChange callback error:', e);
        }
      }
    });
    return data.subscription;
  }
};
