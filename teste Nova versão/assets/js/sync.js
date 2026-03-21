window.MM = window.MM || {};

MM.sync = {
  intervalId: null,
  isRunning: false,

  setStatus: function(status, message) {
    MM.state.ui = MM.state.ui || {};
    MM.state.ui.syncStatus = status;
    MM.state.ui.syncMessage = message || this.defaultMessage(status);
    var statusEl = document.getElementById('cloud-sync-status');
    if (statusEl) {
      statusEl.className = 'sync-pill ' + status;
      statusEl.textContent = MM.state.ui.syncMessage;
    }
    var messageEl = document.getElementById('cloud-sync-message');
    if (messageEl) {
      messageEl.textContent = MM.state.ui.lastCloudSyncAt
        ? (MM.state.ui.syncMessage + ' · ' + new Date(MM.state.ui.lastCloudSyncAt).toLocaleTimeString('pt-BR'))
        : MM.state.ui.syncMessage;
    }
  },

  defaultMessage: function(status) {
    var map = {
      online: 'Online',
      offline: 'Offline',
      sending: 'Enviando',
      receiving: 'Recebendo'
    };
    return map[status] || 'Online';
  },

  isOnline: function() {
    return navigator.onLine;
  },

  start: function() {
    var self = this;
    if (this.intervalId) clearInterval(this.intervalId);

    window.addEventListener('online', function() {
      self.setStatus('online', 'Online');
      self.refreshFromCloud(true);
    });

    window.addEventListener('offline', function() {
      self.setStatus('offline', 'Offline');
    });

    this.setStatus(this.isOnline() ? 'online' : 'offline');

    this.intervalId = setInterval(function() {
      self.refreshFromCloud(true);
    }, 60000);
  },

  async syncNow() {
    if (!this.isOnline()) {
      this.setStatus('offline', 'Offline');
      throw new Error('Sem internet no momento.');
    }
    if (!MM.state.household) {
      this.setStatus('online', 'Online');
      return;
    }
    this.setStatus('sending', 'Enviando');
    await MM.storage.syncFromState();
    await this.refreshFromCloud(true);
    this.setStatus('online', 'Online');
  },

  async refreshFromCloud(silent) {
    if (!this.isOnline()) {
      this.setStatus('offline', 'Offline');
      return;
    }
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      this.setStatus('receiving', 'Recebendo');
      var data = await MM.storage.loadAppData({ silent: true });
      if (data && data.config && data.config.household) {
        MM.state.household = data.config.household;
        MM.state.users = data.config.users || [];
        MM.state.movements = data.movements || [];
        MM.state.templates = data.templates || [];
        MM.state.ui = Object.assign({}, MM.state.ui, data.ui || {});
        MM.state.ui.lastCloudSyncAt = new Date().toISOString();
        if (!silent) MM.app.render();
        else MM.ui.renderCloudStatusOnly();
      }
      this.setStatus('online', 'Online');
    } catch (err) {
      console.error('refreshFromCloud error:', err);
      this.setStatus(this.isOnline() ? 'online' : 'offline', this.isOnline() ? 'Online' : 'Offline');
    } finally {
      this.isRunning = false;
    }
  }
};
