window.MM = window.MM || {};

MM.app = {
  hydrate: async function() {
    try {
      var data = await MM.storage.loadAppData({ silent: true });
      if (data.config && data.config.household) {
        MM.state.household = data.config.household;
        MM.state.users = data.config.users || [];
        MM.state.movements = data.movements || [];
        MM.state.templates = data.templates || [];
        MM.state.ui = Object.assign({}, MM.state.ui, data.ui || {});
        MM.state.currentScreen = MM.config.SCREENS.DASHBOARD;
      } else {
        MM.state.currentScreen = MM.config.SCREENS.SETUP;
      }
    } catch (err) {
      console.error('Hydrate error:', err);
      MM.stateApi.initialize();
      MM.state.currentScreen = MM.config.SCREENS.SETUP;
    }
  },

  registerScreens: function() {
    MM.router.register(MM.config.SCREENS.SETUP, MM.setupScreen.render);
    MM.router.register(MM.config.SCREENS.DASHBOARD, MM.dashboardScreen.render);
    MM.router.register(MM.config.SCREENS.MOVEMENTS, MM.movementsScreen.render);
    MM.router.register(MM.config.SCREENS.ENTRY, MM.entryScreen.render);
    MM.router.register(MM.config.SCREENS.ENTRY_EXTRA, MM.entryExtraScreen.render);
    MM.router.register(MM.config.SCREENS.EXIT, MM.exitScreen.render);
    MM.router.register(MM.config.SCREENS.EXTRA, MM.extraScreen.render);
    MM.router.register(MM.config.SCREENS.TEMPLATES, MM.templatesScreen.render);
    MM.router.register(MM.config.SCREENS.CLOSING, MM.closingScreen.render);
    MM.router.register(MM.config.SCREENS.SETTINGS, MM.settingsScreen.render);
  },

  render: function() {
    var root = document.getElementById('app-root');
    var hasHousehold = !!MM.state.household;
    if (root) root.style.gridTemplateColumns = hasHousehold ? '260px 1fr' : '1fr';
    MM.ui.renderSidebar();
    MM.ui.renderTopbar();
    MM.ui.renderBottomNav();
    MM.router.renderCurrent();
    MM.ui.animateScreen();
    MM.ui.renderCloudStatusOnly();
  },

  boot: async function() {
    document.title = MM.config.APP_NAME;
    MM.stateApi.initialize();
    this.registerScreens();
    MM.events.bindGlobal();
    MM.sync.start();
    await this.hydrate();

    try {
      await MM.auth.onAuthChange(async function(event) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          await MM.app.hydrate();
          MM.app.render();
          MM.sync.setStatus(navigator.onLine ? 'online' : 'offline');
        }
        if (event === 'SIGNED_OUT') {
          MM.stateApi.initialize();
          MM.setupScreen.resetTemp();
          MM.app.render();
          MM.sync.setStatus(navigator.onLine ? 'online' : 'offline');
        }
      });
    } catch (e) {
      console.error('Auth listener error:', e);
    }

    this.render();
  }
};
window.addEventListener('DOMContentLoaded', function(){ MM.app.boot(); });
