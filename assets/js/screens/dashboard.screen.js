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
      var income = Number(m.entradas || 0);
      var expense = Number(m.saidas || 0);
      var total = income + expense;
      if(total <= 0){
        return `<div class="mm-mobile-flow-empty">Sem movimentos realizados no caixa neste mês.</div>`;
      }
      var inPct = Math.round((income / total) * 100);
      var gradient = `#22c55e 0 ${inPct}%, #7c3aed ${inPct}% 100%`;
      return `<div class="mm-mobile-flow-shell">
        <div class="mm-mobile-flow-donut" style="background:conic-gradient(${gradient})">
          <div class="mm-mobile-flow-hole">
            <div class="mm-mobile-flow-hole-label">Saldo</div>
            <div class="mm-mobile-flow-hole-value">${MM.helpers.formatCurrency(m.saldo)}</div>
          </div>
        </div>
        <div class="mm-mobile-flow-legend">
          <div class="mm-mobile-flow-row"><span class="dot income"></span><span>Entradas</span><strong>${MM.helpers.formatCurrency(income)}</strong></div>
          <div class="mm-mobile-flow-row"><span class="dot expense"></span><span>Saídas</span><strong>${MM.helpers.formatCurrency(expense)}</strong></div>
        </div>
      </div>`;
    }

    var balanceList = buildBalanceList();
    var chartHtml = buildFlowChart();
    var categoryChartHtml = buildUserDonut();
    var heroSubtitle = `Caixa real do mês • ${m.monthCashCount} movimentos realizados • ${m.monthOpenCount} pendentes`;

    var shell;
    if(isMobile){
      shell = `
      <section class="dashboard-mobile-clean-shell">
        <section class="hero-premium-card mobile-clean-hero">
          <div class="hero-premium-copy">
            <div class="hero-premium-kicker">Residência financeira</div>
            <h2>Saldo atual de caixa</h2>
            <div class="hero-premium-value">${MM.helpers.formatCurrency(m.saldo)}</div>
            <div class="hero-premium-sub">${heroSubtitle}</div>
            <div class="hero-premium-badges mobile-clean-badges">
              <span class="hero-badge good">Entradas ${MM.helpers.formatCurrency(m.entradas)}</span>
              <span class="hero-badge bad">Saídas ${MM.helpers.formatCurrency(m.saidas)}</span>
              <span class="hero-badge neutral">Saldo anterior ${MM.helpers.formatCurrency(m.saldoAnterior)}</span>
            </div>
          </div>
          <div class="hero-premium-actions mobile-clean-actions">
            <button class="btn primary" id="dashboard-new-exit" type="button">Nova saída</button>
            <button class="btn blue" id="dashboard-new-entry" type="button">Nova entrada</button>
            <button class="btn secondary" id="dashboard-new-extra" type="button">Despesa extra</button>
            <button class="btn secondary" id="dashboard-new-entry-extra" type="button">Entrada extra</button>
          </div>
        </section>

        <section class="dashboard-v6-metrics mobile-clean-metrics">
          <article class="dashboard-mini-card"><span>Competência</span><strong>${MM.helpers.formatMonthLabel(MM.state.currentMonth)}</strong></article>
          <article class="dashboard-mini-card"><span>A vencer</span><strong>${m.dueSoon}</strong></article>
          <article class="dashboard-mini-card"><span>Atrasadas</span><strong>${m.overdue}</strong></article>
          <article class="dashboard-mini-card"><span>Realizados</span><strong>${m.monthCashCount}</strong></article>
        </section>

        <section class="panel section dashboard-v6-panel mobile-flow-panel">
          <div class="dashboard-v6-head"><div><h3>Fluxo do mês</h3><p>Entradas x saídas</p></div></div>
          ${buildMonthDonut()}
        </section>

        <section class="panel section dashboard-v6-panel mobile-balance-panel">
          <div class="dashboard-v6-head"><div><h3>Saldo por usuário</h3><p>Resumo individual</p></div></div>
          <div class="item-list compact-balance-list mobile-balance-list">${balanceList}</div>
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
            <div class="insight-list">
              <div class="insight-row"><span>Saldo do caixa</span><strong>${MM.helpers.formatCurrency(m.saldo)}</strong></div>
              <div class="insight-row"><span>Já realizado</span><strong>${m.monthCashCount}</strong></div>
              <div class="insight-row"><span>Ainda pendente</span><strong>${m.monthOpenCount}</strong></div>
              <div class="insight-row"><span>Maior foco</span><strong>${m.byCategory && m.byCategory[0] ? m.byCategory[0].name : 'Sem categoria'}</strong></div>
            </div>
          </section>
        </section>
      </section>`;
    }
    MM.ui.setHTML('screen-container', shell);

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
