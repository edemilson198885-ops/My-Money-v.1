window.MM = window.MM || {};
MM.dashboardScreen = {
  render: function(){
    var m = MM.services.getDashboardMetrics();
    var isMobile = window.innerWidth <= 768;

    function buildBalanceList(){
      return m.byUserBalance.map(function(item){
        var toneClass = item.total > 0 ? 'positive' : (item.total < 0 ? 'negative' : 'neutral');
        return `<button class="item dashboard-link balance-user-link ${toneClass}" data-user-id="${item.user.id}" type="button">
          <div class="user-balance-head">
            <strong>${item.user.name}</strong>
            <span class="user-balance-value ${toneClass}">${MM.helpers.formatCurrency(item.total)}</span>
          </div>
          <div class="muted user-balance-meta">Entrou ${MM.helpers.formatCurrency(item.income)} • Saiu ${MM.helpers.formatCurrency(item.expense)}</div>
        </button>`;
      }).join('') || '<div class="muted">Cadastre usuários para visualizar o saldo individual.</div>';
    }

    function buildFlowChart(){
      var chartSeries = Array.isArray(m.monthlyFlow) ? m.monthlyFlow.slice(-4) : [];
      var chartMax = chartSeries.reduce(function(max,item){
        return Math.max(max, Number(item.entradas || 0), Number(item.saidas || 0));
      }, 0) || 1;
      if(!chartSeries.length) return `<div class="mm-chart-empty">Sem histórico suficiente ainda.</div>`;
      return chartSeries.map(function(item){
        var label = item.label.replace(/\/\d{4}$/, '');
        var inPct = Math.max(10, Math.round((Number(item.entradas || 0) / chartMax) * 100));
        var outPct = Math.max(10, Math.round((Number(item.saidas || 0) / chartMax) * 100));
        return `<div class="mm-chart-col-group">
          <div class="mm-chart-bars">
            <div class="mm-chart-bar income" style="height:${inPct}%"></div>
            <div class="mm-chart-bar expense" style="height:${outPct}%"></div>
          </div>
          <div class="mm-chart-values"><span>${MM.helpers.formatCurrency(item.entradas)}</span><span>${MM.helpers.formatCurrency(item.saidas)}</span></div>
          <div class="mm-chart-label">${label}</div>
        </div>`;
      }).join('');
    }

    function buildUserDonut(){
      var palette = [
        ['#22c55e', '#86efac'],
        ['#3b82f6', '#93c5fd'],
        ['#f59e0b', '#fcd34d'],
        ['#a855f7', '#d8b4fe'],
        ['#ef4444', '#fca5a5'],
        ['#14b8a6', '#99f6e4']
      ];
      var slices = [];
      (m.byUserIncome || []).forEach(function(item, idx){
        var total = Number(item.total || 0);
        if(total > 0){
          slices.push({
            name: item.user.name + ' entrada',
            total: total,
            color: palette[idx % palette.length][0]
          });
        }
      });
      (m.byUserExpense || []).forEach(function(item, idx){
        var total = Number(item.total || 0);
        if(total > 0){
          slices.push({
            name: item.user.name + ' saída',
            total: total,
            color: palette[idx % palette.length][1]
          });
        }
      });
      if(!slices.length){
        return `<div class="category-chart-empty">Os movimentos realizados por usuário aparecem aqui.</div>`;
      }
      var total = slices.reduce(function(sum,item){ return sum + Number(item.total || 0); }, 0) || 1;
      var acc = 0;
      var gradient = slices.map(function(item){
        var start = Math.round((acc / total) * 100);
        acc += Number(item.total || 0);
        var end = Math.round((acc / total) * 100);
        return `${item.color} ${start}% ${end}%`;
      }).join(', ');
      var legend = slices.map(function(item){
        return `<div class="category-legend-row"><span class="category-legend-left"><i style="background:${item.color}"></i>${item.name}</span><strong>${MM.helpers.formatCurrency(item.total)}</strong></div>`;
      }).join('');
      return `<div class="category-chart-shell">
        <div class="category-donut" style="background:conic-gradient(${gradient})">
          <div class="category-donut-hole">
            <div class="category-donut-title">Usuários</div>
            <div class="category-donut-value">${MM.helpers.formatCurrency(total)}</div>
          </div>
        </div>
        <div class="category-legend">${legend}</div>
      </div>`;
    }

    function buildMonthDonut(){
      var entradas = Number(m.entradas || 0);
      var saidas = Number(m.saidas || 0);
      var total = Math.max(entradas + saidas, 1);
      var inPct = Math.round((entradas / total) * 100);
      var donut = `conic-gradient(#31d17c 0 ${inPct}%, #7c3aed ${inPct}% 100%)`;
      return `<div class="month-donut-shell month-donut-shell-rich">
        <div class="month-donut" style="background:${donut}">
          <div class="month-donut-hole">
            <small>Saldo</small>
            <strong>${MM.helpers.formatCurrency(m.saldo)}</strong>
          </div>
        </div>
        <div class="month-donut-legend">
          <div class="month-legend-row"><span><i class="good"></i>Entradas</span><strong>${MM.helpers.formatCurrency(entradas)}</strong></div>
          <div class="month-legend-row"><span><i class="bad"></i>Saídas</span><strong>${MM.helpers.formatCurrency(saidas)}</strong></div>
        </div>
      </div>`;
    }

    var balanceList = buildBalanceList();
    var chartHtml = buildFlowChart();
    var categoryChartHtml = buildUserDonut();
    var heroSubtitle = `Caixa real do mês • ${m.monthCashCount} movimentos realizados • ${m.monthOpenCount} pendentes`;
    var insightHtml = `
      <div class="insight-list insight-list-mobile-v7">
        <div class="insight-row"><span>Saldo do caixa</span><strong>${MM.helpers.formatCurrency(m.saldo)}</strong></div>
        <div class="insight-row"><span>Já realizado</span><strong>${m.monthCashCount}</strong></div>
        <div class="insight-row"><span>Ainda pendente</span><strong>${m.monthOpenCount}</strong></div>
        <div class="insight-row"><span>Maior foco</span><strong>${m.byCategory && m.byCategory[0] ? m.byCategory[0].name : 'Sem categoria'}</strong></div>
      </div>`;

    var shell = '';
    if (isMobile) {
      shell = `
        <section class="dashboard-mobile-v7" id="dashboard-mobile-v7">
          <section class="hero-mobile-v7 panel section">
            <div class="mobile-month-switcher" id="mobile-month-switcher">
              <button class="month-nav-btn" id="mobile-month-prev" type="button" aria-label="Competência anterior">‹</button>
              <div class="mobile-month-center">
                <div class="mobile-month-label">Competência</div>
                <strong>${MM.helpers.formatMonthLabel(MM.state.currentMonth)}</strong>
                <small>Arraste para os lados para trocar</small>
              </div>
              <button class="month-nav-btn" id="mobile-month-next" type="button" aria-label="Próxima competência">›</button>
            </div>

            <div class="hero-mobile-kicker">Saldo do mês</div>
            <div class="hero-mobile-value">${MM.helpers.formatCurrency(m.saldo)}</div>
            <div class="hero-mobile-sub">${heroSubtitle}</div>

            <div class="hero-mobile-main-actions">
              <button class="btn primary" id="dashboard-new-entry" type="button">＋ Entrada</button>
              <button class="btn secondary" id="dashboard-new-exit" type="button">－ Saída</button>
            </div>
          </section>

          <section class="mobile-shortcuts-clean mobile-shortcuts-v7">
            <button class="mobile-shortcut-btn" data-target="entry-extra" type="button"><span class="icon">＋</span><span>Entrada+</span></button>
            <button class="mobile-shortcut-btn" data-target="extra" type="button"><span class="icon">－</span><span>Despesa</span></button>
            <button class="mobile-shortcut-btn" data-target="templates" type="button"><span class="icon">▣</span><span>Fixos</span></button>
            <button class="mobile-shortcut-btn" data-target="settings" type="button"><span class="icon">⚙</span><span>Ajustes</span></button>
          </section>

          <section class="mobile-metrics-v7">
            <article class="mobile-metric-card metric-main"><span>Saldo anterior</span><strong>${MM.helpers.formatCurrency(m.saldoAnterior)}</strong></article>
            <article class="mobile-metric-card metric-main"><span>Saldo do caixa</span><strong>${MM.helpers.formatCurrency(m.saldo)}</strong></article>
            <article class="mobile-metric-card"><span>Realizados</span><strong>${m.monthCashCount}</strong></article>
            <article class="mobile-metric-card"><span>Pendentes</span><strong>${m.monthOpenCount}</strong></article>
            <article class="mobile-metric-card"><span>A vencer</span><strong>${m.dueSoon}</strong></article>
            <article class="mobile-metric-card"><span>Atrasadas</span><strong>${m.overdue}</strong></article>
          </section>

          <section class="panel section mobile-panel-v7 mobile-flow-panel-v7">
            <div class="dashboard-v6-head mobile-clean-head"><div><h3>Resumo do mês</h3><p>Saldo, entradas e saídas reais</p></div></div>
            ${buildMonthDonut()}
          </section>

          <section class="panel section mobile-panel-v7 mobile-trend-panel-v7">
            <div class="dashboard-v6-head mobile-clean-head"><div><h3>Fluxo realizado</h3><p>Últimas competências com caixa real</p></div></div>
            <div class="flow-chart flow-chart-clean mobile-flow-chart-v7">${chartHtml}</div>
          </section>

          <section class="panel section mobile-panel-v7 mobile-distribution-panel-v7">
            <div class="dashboard-v6-head mobile-clean-head"><div><h3>Distribuição por usuário</h3><p>Entradas e saídas realizadas</p></div></div>
            <div class="mobile-category-wrap-v7">${categoryChartHtml}</div>
          </section>

          <section class="panel section mobile-panel-v7 mobile-user-balance-panel-v7">
            <div class="dashboard-v6-head mobile-clean-head"><div><h3>Saldo por usuário</h3><p>Resumo individual do caixa</p></div></div>
            <div class="item-list compact-balance-list mobile-balance-list-v7">${balanceList}</div>
          </section>

          <section class="panel section mobile-panel-v7 mobile-insight-panel-v7">
            <div class="dashboard-v6-head mobile-clean-head"><div><h3>Leitura financeira</h3><p>Resumo rápido da competência</p></div></div>
            ${insightHtml}
          </section>
        </section>`;
    } else {
      shell = `
        <section class="dashboard-v6-shell">
          <section class="hero-premium-card">
            <div class="hero-premium-copy">
              <div class="hero-premium-kicker">Residência financeira</div>
              <h2>Saldo atual de caixa</h2>
              <div class="hero-premium-value">${MM.helpers.formatCurrency(m.saldo)}</div>
              <div class="hero-premium-sub">${heroSubtitle}</div>
              <div class="hero-premium-badges">
                <span class="hero-badge good">Entrou ${MM.helpers.formatCurrency(m.entradas)}</span>
                <span class="hero-badge bad">Saiu ${MM.helpers.formatCurrency(m.saidas)}</span>
                <span class="hero-badge neutral">Saldo anterior ${MM.helpers.formatCurrency(m.saldoAnterior)}</span>
              </div>
            </div>
            <div class="hero-premium-actions">
              <button class="btn primary" id="dashboard-new-exit" type="button">Nova saída</button>
              <button class="btn blue" id="dashboard-new-entry" type="button">Nova entrada</button>
              <button class="btn secondary" id="dashboard-new-extra" type="button">Despesa extra</button>
              <button class="btn secondary" id="dashboard-new-entry-extra" type="button">Entrada extra</button>
            </div>
          </section>

          <section class="dashboard-v6-metrics">
            <article class="dashboard-mini-card"><span>Competência</span><strong>${MM.helpers.formatMonthLabel(MM.state.currentMonth)}</strong><small>Organização das contas</small></article>
            <article class="dashboard-mini-card"><span>A vencer</span><strong>${m.dueSoon}</strong><small>Contas abertas próximas</small></article>
            <article class="dashboard-mini-card"><span>Atrasadas</span><strong>${m.overdue}</strong><small>Saídas vencidas sem baixa</small></article>
            <article class="dashboard-mini-card"><span>Realizados</span><strong>${m.monthCashCount}</strong><small>Movimentos que já mexeram no caixa</small></article>
          </section>

          <section class="dashboard-v6-grid">
            <section class="panel section dashboard-v6-panel">
              <div class="dashboard-v6-head"><div><h3>Fluxo realizado</h3><p>Entradas e saídas pelo caixa real</p></div></div>
              <div class="flow-chart flow-chart-clean">${chartHtml}</div>
            </section>
            <section class="panel section dashboard-v6-panel">
              <div class="dashboard-v6-head"><div><h3>Distribuição por usuário</h3><p>Entradas e saídas realizadas no caixa</p></div></div>
              ${categoryChartHtml}
            </section>
          </section>

          <section class="dashboard-v6-grid bottom">
            <section class="panel section dashboard-v6-panel">
              <div class="dashboard-v6-head"><div><h3>Saldo por usuário</h3><p>Somente movimentos realizados no caixa</p></div></div>
              <div class="item-list compact-balance-list">${balanceList}</div>
            </section>
            <section class="panel section dashboard-v6-panel insight-panel">
              <div class="dashboard-v6-head"><div><h3>Leitura financeira</h3><p>Inspeção rápida do mês</p></div></div>
              ${insightHtml}
            </section>
          </section>
        </section>`;
    }

    MM.ui.setHTML('screen-container', shell);

    function changeMonth(direction){
      MM.state.currentMonth = direction < 0 ? MM.helpers.previousMonth(MM.state.currentMonth) : MM.helpers.nextMonth(MM.state.currentMonth);
      MM.app.render();
    }

    var entryBtn = document.getElementById('dashboard-new-entry');
    if(entryBtn) entryBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.ENTRY); };
    var exitBtn = document.getElementById('dashboard-new-exit');
    if(exitBtn) exitBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.EXIT); };
    var entryExtraBtn = document.getElementById('dashboard-new-entry-extra');
    if(entryExtraBtn) entryExtraBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.ENTRY_EXTRA); };
    var extraBtn = document.getElementById('dashboard-new-extra');
    if(extraBtn) extraBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.EXTRA); };

    var prevBtn = document.getElementById('mobile-month-prev');
    var nextBtn = document.getElementById('mobile-month-next');
    if(prevBtn) prevBtn.onclick = function(){ changeMonth(-1); };
    if(nextBtn) nextBtn.onclick = function(){ changeMonth(1); };

    var switcher = document.getElementById('mobile-month-switcher');
    if(switcher){
      var touchStartX = 0;
      var touchStartY = 0;
      switcher.addEventListener('touchstart', function(e){
        var t = e.changedTouches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      }, { passive:true });
      switcher.addEventListener('touchend', function(e){
        var t = e.changedTouches[0];
        var dx = t.clientX - touchStartX;
        var dy = t.clientY - touchStartY;
        if(Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)){
          changeMonth(dx < 0 ? 1 : -1);
        }
      }, { passive:true });
    }

    document.querySelectorAll('.mobile-shortcut-btn').forEach(function(btn){
      btn.onclick = function(e){
        var t = e.currentTarget.dataset.target;
        if(t === 'entry-extra') MM.router.goTo(MM.config.SCREENS.ENTRY_EXTRA);
        else if(t === 'extra') MM.router.goTo(MM.config.SCREENS.EXTRA);
        else if(t === 'templates') MM.router.goTo(MM.config.SCREENS.TEMPLATES);
        else if(t === 'settings') MM.router.goTo(MM.config.SCREENS.SETTINGS);
      };
    });

    document.querySelectorAll('.balance-user-link').forEach(function(btn){
      btn.onclick = function(e){
        MM.state.movementFilters = { type:'todos', belongsTo:e.currentTarget.dataset.userId, status:'todos', text:'', scope:'active' };
        MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
      };
    });
  }
};
