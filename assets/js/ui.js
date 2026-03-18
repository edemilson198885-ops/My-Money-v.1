window.MM = window.MM || {};
MM.ui = {
  setHTML: function(id, html){ var el = document.getElementById(id); if(el) el.innerHTML = html; },
  animateScreen: function(){
    var el = document.getElementById('screen-container');
    if(!el) return;
    el.classList.remove('screen-animate');
    void el.offsetWidth;
    el.classList.add('screen-animate');
  },
  showToast: function(msg, type){
    var root = document.getElementById('toast-root');
    if(!root || !msg) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.innerHTML = '<span class="toast-dot"></span><span class="toast-text"></span>';
    toast.querySelector('.toast-text').textContent = msg;
    root.appendChild(toast);
    requestAnimationFrame(function(){ toast.classList.add('show'); });
    setTimeout(function(){
      toast.classList.remove('show');
      setTimeout(function(){ if(toast.parentNode){ toast.parentNode.removeChild(toast); } }, 260);
    }, 2400);
  },
  showFeedback: function(id, msg, type){
    var el = document.getElementById(id);
    if(!el) return;
    el.textContent = msg;
    el.dataset.type = type || 'info';
    el.classList.remove('is-visible');
    void el.offsetWidth;
    el.classList.add('is-visible');
    this.showToast(msg, type || 'info');
    clearTimeout(el._feedbackTimer);
    el._feedbackTimer = setTimeout(function(){ el.classList.remove('is-visible'); }, 2400);
  },
  icon: function(name){
    var icons = {
      dashboard:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h6V4H4z"></path><path d="M14 20h6v-9h-6z"></path><path d="M14 10h6V4h-6z"></path><path d="M4 20h6v-3H4z"></path></svg>',
      movements:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11"></path><path d="M7 12h7"></path><path d="M7 17h11"></path><path d="M4 7h.01"></path><path d="M4 12h.01"></path><path d="M4 17h.01"></path></svg>',
      entry:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
      entry_extra:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16"></path><path d="M5 12h14"></path><circle cx="17" cy="7" r="3"></circle></svg>',
      exit:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path></svg>',
      extra:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18"></path><path d="M3 12h18"></path><path d="M5 5l14 14"></path><path d="M19 5L5 19"></path></svg>',
      templates:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M8 9h8"></path><path d="M8 13h8"></path><path d="M8 17h5"></path></svg>',
      closing:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4"></path><path d="M17 3v4"></path><rect x="4" y="5" width="16" height="16" rx="3"></rect><path d="M8 13l2.5 2.5L16 10"></path></svg>',
      settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3"></path><path d="M12 18v3"></path><path d="M3 12h3"></path><path d="M18 12h3"></path><path d="M5.6 5.6l2.1 2.1"></path><path d="M16.3 16.3l2.1 2.1"></path><path d="M18.4 5.6l-2.1 2.1"></path><path d="M7.7 16.3l-2.1 2.1"></path><circle cx="12" cy="12" r="3.5"></circle></svg>'
    };
    return icons[name] || icons.dashboard;
  },
  navItem: function(current, key, title, subtitle){
    return `<button class="nav-btn ${current===key?'active':''}" data-go="${key}"><span class="nav-icon">${this.icon(key)}</span><span class="nav-copy"><span class="nav-title">${title}</span><span class="nav-subtitle">${subtitle}</span></span></button>`;
  },
  renderSidebar: function(){
    var current = MM.state.currentScreen;
    var hasHousehold = !!MM.state.household;
    var sidebar = document.getElementById('sidebar');
    if(!hasHousehold){
      if(sidebar) sidebar.innerHTML = '';
      if(sidebar) sidebar.style.display = 'none';
      return;
    }
    if(sidebar) sidebar.style.display = '';
    this.setHTML('sidebar', `
      <div class="sidebar-brand">
        <div class="brand-kicker">My Money <span class="brand-kicker-version">v${MM.config.APP_VERSION}</span></div>
        <div class="brand-name">Seu controle</div>
        <div class="brand-version">Financeiro simples e forte</div>
      </div>
      <nav class="sidebar-nav">
        ${this.navItem(current,'dashboard','Dashboard','Visão geral')}
        ${this.navItem(current,'movements','Movimentações','Tudo em um só lugar')}
        ${this.navItem(current,'entry','Nova entrada','Receita recorrente')}
        ${this.navItem(current,'entry_extra','Entrada extra','Receita pontual')}
        ${this.navItem(current,'exit','Nova saída','Registrar gasto')}
        ${this.navItem(current,'extra','Despesa extra','Saída pontual')}
        ${this.navItem(current,'templates','Fixos automáticos','Recorrência mensal')}
        ${this.navItem(current,'closing','Fechamento mensal','Virada do mês')}
        ${this.navItem(current,'settings','Configurações','Pessoas e regras')}
      </nav>
      <div class="sidebar-footer">
        Controle simples, visual limpo e foco total no saldo do mês.
      </div>
    `);
  },
  renderTopbar: function(){
    var hasHousehold = !!MM.state.household;
    var topbar = document.getElementById('topbar');
    if(!hasHousehold){
      if(topbar) topbar.innerHTML = '';
      if(topbar) topbar.style.display = 'none';
      return;
    }
    if(topbar) topbar.style.display = '';
    var house = MM.state.household.name;
    var saved = MM.state.ui.lastSavedAt ? new Date(MM.state.ui.lastSavedAt).toLocaleString('pt-BR') : 'Ainda não salvo';
    var syncStatus = MM.state.ui.syncStatus || (navigator.onLine ? 'online' : 'offline');
    var syncMessage = MM.state.ui.syncMessage || (navigator.onLine ? 'Online' : 'Offline');
    var cloudTime = MM.state.ui.lastCloudSyncAt ? new Date(MM.state.ui.lastCloudSyncAt).toLocaleTimeString('pt-BR') : 'sem sync';
    this.setHTML('topbar', `
      <div class="panel section topbar-mobile-compact">
        <div class="topbar-brand-row">
          <div class="topbar-brand-mark">MM</div>
          <div class="topbar-brand-copy">
            <div class="topbar-brand-title">${MM.config.APP_NAME}</div>
            <div class="topbar-brand-version">v${MM.config.APP_VERSION}</div>
          </div>
          <div class="topbar-house-chip">${house}</div>
        </div>
        <div class="topbar-meta-line">Competência ${MM.state.currentMonth}</div>
        <div class="topbar-controls-row">
          <input id="global-month" type="month" value="${MM.state.currentMonth}" class="topbar-month-input" />
          <div class="cloud-sync-wrap">
            <div class="cloud-sync-row">
              <span id="cloud-sync-status" class="sync-pill ${syncStatus}">${syncMessage}</span>
              <button class="btn secondary" id="cloud-refresh-btn" type="button">Baixar nuvem</button>
              <button class="btn primary" id="cloud-sync-btn" type="button">Sincronizar</button>
            </div>
            <div id="cloud-sync-message" class="topbar-saved-text">${syncMessage} · ${cloudTime}</div>
            <div class="topbar-saved-text">Atualizado ${saved}</div>
          </div>
        </div>
      </div>
    `);
    document.getElementById('global-month').onchange = function(e){
      MM.state.currentMonth = e.target.value || MM.helpers.currentMonth();
      MM.app.render();
    };
    document.getElementById('cloud-sync-btn').onclick = async function(){
      try {
        await MM.sync.syncNow();
        MM.ui.showToast('Dados enviados para a nuvem.', 'info');
        MM.app.render();
      } catch(err) {
        MM.ui.showToast(err.message || 'Erro ao sincronizar.', 'error');
      }
    };
    document.getElementById('cloud-refresh-btn').onclick = async function(){
      try {
        await MM.sync.refreshFromCloud();
        MM.ui.showToast('Dados atualizados da nuvem.', 'info');
        MM.app.render();
      } catch(err) {
        MM.ui.showToast(err.message || 'Erro ao baixar da nuvem.', 'error');
      }
    };
  },

  renderCloudStatusOnly: function(){
    var statusEl = document.getElementById('cloud-sync-status');
    if (statusEl) {
      statusEl.className = 'sync-pill ' + (MM.state.ui.syncStatus || 'offline');
      statusEl.textContent = MM.state.ui.syncMessage || 'Offline';
    }
    var messageEl = document.getElementById('cloud-sync-message');
    if (messageEl) {
      var base = MM.state.ui.syncMessage || 'Offline';
      messageEl.textContent = MM.state.ui.lastCloudSyncAt ? (base + ' · ' + new Date(MM.state.ui.lastCloudSyncAt).toLocaleTimeString('pt-BR')) : base;
    }
  },

  renderBottomNav: function(){
    var hasHousehold = !!MM.state.household;
    var nav = document.getElementById('bottom-nav');
    if(!nav){ return; }
    if(!hasHousehold){ nav.innerHTML = ''; nav.style.display = 'none'; return; }
    nav.style.display = '';
    var current = MM.state.currentScreen;
    function item(screen, icon, textLabel){
      return `<button class="mm-bottom-item ${current===screen?'active':''}" data-go="${screen}"><span class="mm-bottom-icon">${icon}</span><span class="mm-bottom-text">${textLabel}</span></button>`;
    }
    function toggleItem(icon, textLabel){
      return `<button class="mm-bottom-item" data-toggle-sidebar="1"><span class="mm-bottom-icon">${icon}</span><span class="mm-bottom-text">${textLabel}</span></button>`;
    }
    nav.innerHTML = `<div class="mm-bottom-nav-wrap">
      ${item(MM.config.SCREENS.DASHBOARD,'⌂','Painel')}
      ${item(MM.config.SCREENS.MOVEMENTS,'≣','Movimentos')}
      ${item(MM.config.SCREENS.CLOSING,'✓','Fechar')}
      ${toggleItem('☰','Menu')}
    </div>`;
  },
  renderSelectOptions: function(options, selected){
    return options.map(function(opt){ return `<option value="${opt.value}" ${String(selected)===String(opt.value)?'selected':''}>${opt.label}</option>`; }).join('');
  },
  createRipple: function(target, event){
    if(!target || !event || typeof event.clientX !== 'number') return;
    if(target.classList.contains('no-ripple')) return;
    var rect = target.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var ripple = document.createElement('span');
    ripple.className = 'ui-ripple';
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
    target.appendChild(ripple);
    setTimeout(function(){ if(ripple.parentNode){ ripple.parentNode.removeChild(ripple); } }, 520);
  },
  openSidebar: function(){ document.body.classList.add('sidebar-open'); },
  closeSidebar: function(){ document.body.classList.remove('sidebar-open'); },
  toggleSidebar: function(){ document.body.classList.toggle('sidebar-open'); }
};
