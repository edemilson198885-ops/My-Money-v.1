window.MM = window.MM || {};
MM.dashboardScreen = {
  render: function(){
    var m = MM.services.getDashboardMetrics();
    var isMobile = window.innerWidth <= 768;

    var balanceList = m.byUserBalance.map(function(item){
      var toneClass = item.total > 0 ? 'positive' : (item.total < 0 ? 'negative' : 'neutral');
      return `<button class="item dashboard-link balance-user-link ${toneClass}" data-user-id="${item.user.id}" type="button">
        <div class="user-balance-head">
          <strong>${item.user.name}</strong>
          <span class="user-balance-value ${toneClass}">${MM.helpers.formatCurrency(item.total)}</span>
        </div>
        <div class="muted user-balance-meta">${MM.helpers.formatCurrency(item.income)} renda • ${MM.helpers.formatCurrency(item.expense)} gastos</div>
      </button>`;
    }).join('');

    var chartSeries = Array.isArray(m.monthlyFlow) ? m.monthlyFlow.slice(-3) : [];
    var chartMax = chartSeries.reduce(function(max,item){
      return Math.max(max, Number(item.entradas || 0), Number(item.saidas || 0));
    }, 0) || 1;
    var chartHtml = chartSeries.length ? chartSeries.map(function(item){
      var label = item.label.replace(/\/\d{4}$/, '');
      var inPct = Math.max(12, Math.round((Number(item.entradas || 0) / chartMax) * 100));
      var outPct = Math.max(12, Math.round((Number(item.saidas || 0) / chartMax) * 100));
      return `<div class="mm-chart-col-group">
        <div class="mm-chart-bars">
          <div class="mm-chart-bar income" style="height:${inPct}%"></div>
          <div class="mm-chart-bar expense" style="height:${outPct}%"></div>
        </div>
        <div class="mm-chart-values">
          <span>${MM.helpers.formatCurrency(item.entradas)}</span>
          <span>${MM.helpers.formatCurrency(item.saidas)}</span>
        </div>
        <div class="mm-chart-label">${label}</div>
      </div>`;
    }).join('') : `<div class="mm-chart-empty">Sem histórico suficiente ainda.</div>`;

    var donutTotal = Number(m.entradas || 0) + Number(m.saidas || 0);
    var inPctDonut = donutTotal > 0 ? Math.round((Number(m.entradas || 0) / donutTotal) * 100) : 50;
    var donutStyle = `background:conic-gradient(#28b67a 0 ${inPctDonut}%, #7c3aed ${inPctDonut}% 100%)`;

    var shortcutHtml = `
      <button class="mm-shortcut-item" data-go="${MM.config.SCREENS.ENTRY_EXTRA}"><span class="mm-shortcut-icon">＋</span><span class="mm-shortcut-text">Entrada+</span></button>
      <button class="mm-shortcut-item" data-go="${MM.config.SCREENS.EXTRA}"><span class="mm-shortcut-icon">－</span><span class="mm-shortcut-text">Despesa</span></button>
      <button class="mm-shortcut-item" data-go="${MM.config.SCREENS.TEMPLATES}"><span class="mm-shortcut-icon">▣</span><span class="mm-shortcut-text">Fixos</span></button>
      <button class="mm-shortcut-item" data-go="${MM.config.SCREENS.SETTINGS}"><span class="mm-shortcut-icon">⚙</span><span class="mm-shortcut-text">Ajustes</span></button>
    `;

    var mobileDashboard = `
      <section class="mm-mobile-dashboard">
        <section class="mm-hero-card-mobile">
          <div class="mm-hero-label-mobile">Saldo do mês</div>
          <div class="mm-hero-value-mobile">${MM.helpers.formatCurrency(m.saldo)}</div>
          <div class="mm-hero-meta-mobile">Entradas ${MM.helpers.formatCurrency(m.entradas)} • Saídas ${MM.helpers.formatCurrency(m.saidas)}</div>
          <div class="mm-hero-actions-mobile">
            <button class="mm-main-action" id="dashboard-new-entry" type="button"><span class="mm-main-action-icon">＋</span><span>Entrada</span></button>
            <button class="mm-main-action alt" id="dashboard-new-exit" type="button"><span class="mm-main-action-icon">－</span><span>Saída</span></button>
          </div>
        </section>

        <section class="mm-shortcuts-grid">${shortcutHtml}</section>

        <section class="mm-status-grid-mobile compact-grid">
          <article class="mm-status-card compact"><div class="mm-status-label">A vencer</div><div class="mm-status-value">${m.dueSoon}</div></article>
          <article class="mm-status-card compact"><div class="mm-status-label">Atrasadas</div><div class="mm-status-value">${m.overdue}</div></article>
          <article class="mm-status-card compact"><div class="mm-status-label">Saldo anterior</div><div class="mm-status-value">${MM.helpers.formatCurrency(m.saldoAnterior)}</div></article>
          <article class="mm-status-card compact"><div class="mm-status-label">Investimentos</div><div class="mm-status-value">${MM.helpers.formatCurrency(0)}</div></article>
        </section>

        <section class="panel section mm-chart-card-mobile mm-chart-card-donut">
          <div class="mm-card-header-mobile"><h3>Fluxo do mês</h3><p>Entradas x saídas</p></div>
          <div class="mm-chart-donut-wrap">
            <div class="mm-donut" style="${donutStyle}">
              <div class="mm-donut-hole">
                <div class="mm-donut-center-label">Saldo</div>
                <div class="mm-donut-center-value">${MM.helpers.formatCurrency(m.saldo)}</div>
              </div>
            </div>
            <div class="mm-donut-legend">
              <div><i class="legend-dot entradas"></i>Entradas <strong>${MM.helpers.formatCurrency(m.entradas)}</strong></div>
              <div><i class="legend-dot saidas"></i>Saídas <strong>${MM.helpers.formatCurrency(m.saidas)}</strong></div>
            </div>
          </div>
        </section>

        <section class="panel section mm-user-card-mobile">
          <div class="mm-card-header-mobile"><h3>Saldo por usuário</h3><p>Resumo individual</p></div>
          <div class="item-list">${balanceList || '<div class="muted">Cadastre usuários para visualizar o saldo individual.</div>'}</div>
        </section>
      </section>`;

    var desktopDashboard = `
      <section class="dashboard-shell dashboard-shell-clean">
        <div class="panel hero-card hero-card-clean">
          <div class="hero-top hero-top-clean">
            <div>
              <div class="hero-label">Saldo do mês</div>
              <div class="hero-value">${MM.helpers.formatCurrency(m.saldo)}</div>
              <div class="hero-sub">Saldo anterior: ${MM.helpers.formatCurrency(m.saldoAnterior)}</div>
            </div>
            <div class="actions-inline dashboard-quick-actions">
              <button class="btn" id="dashboard-new-entry" type="button" style="background:#ffffff1c;color:#fff">Nova entrada</button>
              <button class="btn" id="dashboard-new-entry-extra" type="button" style="background:#ffffff1c;color:#fff">Entrada extra</button>
              <button class="btn" id="dashboard-new-exit" type="button" style="background:#fff;color:#5b21b6">Nova saída</button>
              <button class="btn" id="dashboard-new-extra" type="button" style="background:#ffffff1c;color:#fff">Despesa extra</button>
            </div>
          </div>
        </div>

        <div class="metric-grid metric-grid-clean">
          <div class="panel metric metric-card metric-card-small tone-in"><div class="muted">Entradas</div><div class="metric-mini-value">${MM.helpers.formatCurrency(m.entradas)}</div></div>
          <div class="panel metric metric-card metric-card-small tone-out"><div class="muted">Saídas</div><div class="metric-mini-value">${MM.helpers.formatCurrency(m.saidas)}</div></div>
          <div class="panel metric metric-card metric-card-small tone-neutral"><div class="muted">A vencer</div><div class="metric-mini-value">${m.dueSoon}</div></div>
          <div class="panel metric metric-card metric-card-small tone-neutral"><div class="muted">Atrasadas</div><div class="metric-mini-value">${m.overdue}</div></div>
          <div class="panel metric metric-card metric-card-small tone-neutral"><div class="muted">Saldo anterior</div><div class="metric-mini-value">${MM.helpers.formatCurrency(m.saldoAnterior)}</div></div>
        </div>

        <div class="summary-grid dashboard-middle-grid-clean">
          <div class="panel section chart-panel chart-panel-clean">
            <div class="panel-head-inline panel-head-inline-clean"><div><h3 style="margin:0">Fluxo do mês</h3><div class="muted">Entradas x saídas</div></div><div class="chart-legend"><span><i class="legend-dot entradas"></i>Entradas</span><span><i class="legend-dot saidas"></i>Saídas</span></div></div>
            <div class="flow-chart flow-chart-clean">${chartHtml}</div>
          </div>
          <div class="panel section single-summary-panel"><h3 style="margin:0 0 12px 0">Saldo por usuário</h3><div class="item-list compact-balance-list">${balanceList}</div></div>
        </div>
      </section>`;

    MM.ui.setHTML('screen-container', isMobile ? mobileDashboard : desktopDashboard);

    var entryBtn = document.getElementById('dashboard-new-entry');
    if(entryBtn) entryBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.ENTRY); };
    var exitBtn = document.getElementById('dashboard-new-exit');
    if(exitBtn) exitBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.EXIT); };
    var entryExtraBtn = document.getElementById('dashboard-new-entry-extra');
    if(entryExtraBtn) entryExtraBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.ENTRY_EXTRA); };
    var extraBtn = document.getElementById('dashboard-new-extra');
    if(extraBtn) extraBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.EXTRA); };

    document.querySelectorAll('.balance-user-link').forEach(function(btn){
      btn.onclick = function(e){
        MM.state.movementFilters = { type:'todos', belongsTo:e.currentTarget.dataset.userId, status:'todos', text:'' };
        MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
      };
    });
  }
};
