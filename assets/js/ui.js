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
      <div class="sidebar-brand sidebar-brand-v6">
        <div class="sidebar-logo-wrap"><img src="./assets/img/logo-home-money.png" alt="Logo da residência" class="sidebar-logo-img" /></div>
        <div class="brand-name brand-name-v6">Residência em ordem</div>
        <div class="brand-version">Saldo, contas e família no mesmo lugar</div>
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
      <div class="sidebar-footer">Caixa real: pagou ou recebeu, o saldo muda na hora.</div>
    `);
    var navButtons = sidebar ? sidebar.querySelectorAll('[data-go]') : [];
    navButtons.forEach(function(btn){
      btn.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();
        var go = btn.getAttribute('data-go');
        if(!go) return;
        MM.router.goTo(go);
        if(window.innerWidth <= 980){ MM.ui.closeSidebar(); }
      };
    });
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
    var activeUser = MM.services.ensureActiveUser();
    this.setHTML('topbar', `
      <div class="panel section topbar-v6 topbar-v6-clean">
        <div class="topbar-v6-main topbar-v6-main-clean">
          <div class="topbar-brand-v6 topbar-brand-v6-clean">
            <img src="./assets/img/logo-home-money.png" alt="Logo do app" class="topbar-logo" />
            <div class="topbar-brand-copy-v6">
              <div class="topbar-app-name-v6">My Money</div>
              <div class="topbar-brand-title-v6">${house}</div>
              <div class="topbar-meta-line">Competência ${MM.helpers.formatMonthLabel(MM.state.currentMonth)}</div>
              <button class="topbar-active-user topbar-active-user-btn" id="topbar-active-user-btn" type="button">👤 ${activeUser ? activeUser.name : 'Selecione usuário'}</button>
            </div>
          </div>
          <div class="topbar-actions-v6 topbar-actions-v6-clean">
            <input id="global-month" type="month" value="${MM.state.currentMonth}" class="topbar-month-input" />
            <span id="cloud-sync-status" class="sync-pill ${syncStatus}">${syncMessage}</span>
          </div>
        </div>
        <div class="topbar-v6-meta topbar-v6-meta-clean">
          <div id="cloud-sync-message" class="topbar-saved-text">${syncMessage} · ${cloudTime}</div>
          <div class="topbar-saved-text">Último salvamento ${saved}</div>
        </div>
      </div>
    `);
    document.getElementById('global-month').onchange = function(e){
      MM.state.currentMonth = e.target.value || MM.helpers.currentMonth();
      MM.app.render();
    };
    document.getElementById('topbar-active-user-btn').onclick = function(){ MM.ui.openActiveUserSelector(); };
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


  openActiveUserSelector: function(){
    var users = (MM.state.users || []).filter(function(u){ return !u.inactive; });
    if(!users.length) return;
    var existing = document.getElementById('active-user-modal');
    if(existing) existing.parentNode.removeChild(existing);
    var active = MM.services.ensureActiveUser();
    var overlay = document.createElement('div');
    overlay.id = 'active-user-modal';
    overlay.className = 'active-user-modal-backdrop';
    overlay.innerHTML = '<div class="active-user-modal-card"><div class="active-user-modal-title">Quem está usando agora?</div><div class="active-user-modal-subtitle">Os lançamentos novos serão atribuídos ao usuário escolhido.</div><div class="active-user-modal-list"></div><button class="btn secondary active-user-close-btn" type="button">Fechar</button></div>';
    var list = overlay.querySelector('.active-user-modal-list');
    users.forEach(function(user){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'active-user-option ' + (active && active.id === user.id ? 'is-active' : '');
      btn.innerHTML = '<span class="active-user-option-name">' + user.name + '</span><span class="active-user-option-check">' + ((active && active.id === user.id) ? 'Ativo' : 'Selecionar') + '</span>';
      btn.onclick = function(){
        MM.services.setActiveUser(user.id);
        MM.state.movementFilters = { type:'todos', belongsTo:user.id, status:'todos', text:'', scope:'active' };
        MM.state.ui.overdueAlertDismissed = false;
        MM.ui.dismissOverdueAlert();
        MM.ui.closeActiveUserSelector();
        MM.ui.showToast('Usuário ativo: ' + user.name, 'info');
        MM.app.render();
        MM.ui.scheduleOverdueAlertCheck(5000);
      };
      list.appendChild(btn);
    });
    overlay.querySelector('.active-user-close-btn').onclick = function(){ MM.ui.closeActiveUserSelector(); };
    overlay.addEventListener('click', function(e){ if(e.target === overlay) MM.ui.closeActiveUserSelector(); });
    document.body.appendChild(overlay);
  },
  closeActiveUserSelector: function(){
    var modal = document.getElementById('active-user-modal');
    if(modal && modal.parentNode) modal.parentNode.removeChild(modal);
  },
  promptActiveUserIfNeeded: function(){
    if(!MM.state.household) return;
    var users = (MM.state.users || []).filter(function(u){ return !u.inactive; });
    if(!users.length) return;
    var active = MM.services.ensureActiveUser();
    if(active) return;
    if(users.length === 1){
      MM.services.setActiveUser(users[0].id);
      MM.state.movementFilters = { type:'todos', belongsTo:users[0].id, status:'todos', text:'', scope:'active' };
      MM.app.render();
      MM.ui.scheduleOverdueAlertCheck(5000);
      return;
    }
    this.openActiveUserSelector();
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
  toggleSidebar: function(){ document.body.classList.toggle('sidebar-open'); },


  scheduleOverdueAlertCheck: function(delay){
    clearTimeout(MM.ui._overdueTimer);
    MM.ui._overdueTimer = setTimeout(function(){
      MM.state.ui.overdueAlertDismissed = false;
      MM.ui.maybeShowOverdueAlert();
    }, typeof delay === 'number' ? delay : 5000);
  },

  hasOverdueMovements: function(){
    if(!MM.state.household) return false;
    var activeUser = MM.services.getActiveUser();
    if(!activeUser) return false;
    var month = MM.state.currentMonth;
    return (MM.state.movements || []).some(function(m){
      return m && m.type === 'saida' && m.belongsTo === activeUser.id && m.competence === month && MM.services.calculateStatus(m) === 'atrasado';
    });
  },

  dismissOverdueAlert: function(){
    MM.state.ui.overdueAlertDismissed = true;
    var el = document.getElementById('overdue-alert-card');
    if(el){ el.classList.remove('show'); setTimeout(function(){ if(el && el.parentNode) el.parentNode.removeChild(el); }, 180); }
  },

  pulseOverdueAlert: function(card){
    if(!card) return;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    setTimeout(function(){ card.classList.remove('shake'); }, 650);
    try {
      if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    } catch(e) {}
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if(!AudioCtx) return;
      var ctx = MM.ui._alertAudioCtx || new AudioCtx();
      MM.ui._alertAudioCtx = ctx;
      if (ctx.state === 'suspended' && ctx.resume) {
        ctx.resume().catch(function(){});
      }
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  },

  showOverdueAlert: function(){
    if(document.getElementById('overdue-alert-card')) return;
    var activeUser = MM.services.getActiveUser();
    if(!activeUser) return;
    var count = (MM.state.movements || []).filter(function(m){
      return m && m.type === 'saida' && m.belongsTo === activeUser.id && m.competence === MM.state.currentMonth && MM.services.calculateStatus(m) === 'atrasado';
    }).length;
    if(!count) return;

    var card = document.createElement('div');
    card.id = 'overdue-alert-card';
    card.className = 'overdue-alert-card';
    card.innerHTML = `
      <div class="overdue-alert-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3L1 21h22L12 3zm1 14h-2v-2h2v2zm0-4h-2V9h2v4z" fill="currentColor"></path></svg>
      </div>
      <div class="overdue-alert-copy">
        <div class="overdue-alert-title">Atenção crítica</div>
        <div class="overdue-alert-text">Você possui ${count} conta${count > 1 ? 's' : ''} em atraso para pagar. Deseja regularizar agora?</div>
      </div>
      <div class="overdue-alert-actions">
        <button type="button" class="btn danger overdue-alert-pay">Pagar agora</button>
        <button type="button" class="btn secondary overdue-alert-ignore">Ignorar</button>
      </div>
    `;
    document.body.appendChild(card);
    requestAnimationFrame(function(){ card.classList.add('show'); MM.ui.pulseOverdueAlert(card); });

    card.querySelector('.overdue-alert-pay').onclick = function(){
      MM.state.ui.overdueAlertDismissed = true;
      var activeUser = MM.services.getActiveUser();
      MM.state.movementFilters = { type:'saida', belongsTo:(activeUser ? activeUser.id : 'todos'), status:'atrasado', text:'' };
      MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
      MM.ui.dismissOverdueAlert();
      MM.ui.showToast('Abrindo movimentações com contas atrasadas.', 'info');
    };

    card.querySelector('.overdue-alert-ignore').onclick = function(){
      MM.ui.dismissOverdueAlert();
    };
  },

  maybeShowOverdueAlert: function(){
    if(!MM.state.household) return;
    if(MM.state.currentScreen === MM.config.SCREENS.SETUP) return;
    if(!MM.services.getActiveUser()) return;
    if(MM.state.ui.overdueAlertDismissed) return;
    if(!this.hasOverdueMovements()) return;
    this.showOverdueAlert();
  },

};
