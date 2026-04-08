window.MM = window.MM || {};
MM.dashboardScreen = {
  render: function(){
    var m = MM.services.getDashboardMetrics();
    var isMobile = window.innerWidth <= 768;
    var userName = m.activeUser ? m.activeUser.name : 'Visão geral';
    var monthLabel = MM.helpers.formatMonthLabel(MM.state.currentMonth);

    function buildRows(items, emptyText){
      if(!items || !items.length){
        return `<div class="budget-empty">${emptyText}</div>`;
      }
      return items.map(function(item){
        return `<div class="budget-row">
          <div class="budget-row-left"><span class="budget-dot" style="background:${item.color || '#64748b'}"></span><span class="budget-name">${item.name}</span></div>
          <div class="budget-row-right"><strong>${MM.helpers.formatCurrency(item.total)}</strong>${typeof item.percent === 'number' && item.percent > 0 ? `<span>${item.percent}%</span>` : ''}</div>
        </div>`;
      }).join('');
    }

    function buildTable(items, total, titleClass, title){
      var footerLabel = titleClass === 'balance' ? 'Rendimentos menos despesas' : (titleClass === 'income' ? 'Rendimentos totais' : 'Despesas totais');
      return `<section class="budget-box ${titleClass}">
        <div class="budget-box-title">${title}</div>
        <div class="budget-box-body">
          ${buildRows(items, 'Sem dados nesta competência.')}
          <div class="budget-row budget-total-row"><div class="budget-row-left"><span class="budget-name">${footerLabel}</span></div><div class="budget-row-right"><strong>${MM.helpers.formatCurrency(total)}</strong></div></div>
        </div>
      </section>`;
    }

    function buildExpenseDonut(items){
      if(!items || !items.length){
        return `<div class="budget-chart-empty">Sem saídas realizadas para montar o gráfico.</div>`;
      }
      var total = items.reduce(function(sum,item){ return sum + Number(item.total || 0); }, 0) || 1;
      var acc = 0;
      var gradient = items.map(function(item){
        var start = (acc / total) * 100;
        acc += Number(item.total || 0);
        var end = (acc / total) * 100;
        return `${item.color} ${start}% ${end}%`;
      }).join(', ');
      var outerRadius = isMobile ? 120 : 160;
      var holeRadius = isMobile ? 62 : 84;
      var labelRadius = Math.round((outerRadius + holeRadius) / 2);
      var cumulative = 0;
      var labels = items.map(function(item){
        var pct = Number(item.percent || 0);
        var midAngleDeg = -90 + ((cumulative + (pct / 2)) * 3.6);
        cumulative += pct;
        var rad = midAngleDeg * Math.PI / 180;
        var x = Math.cos(rad) * labelRadius;
        var y = Math.sin(rad) * labelRadius;
        return `<div class="budget-donut-label" style="left:calc(50% + ${x.toFixed(1)}px);top:calc(50% + ${y.toFixed(1)}px);">${pct}%</div>`;
      }).join('');
      var legend = items.map(function(item){
        return `<div class="budget-legend-row"><span class="budget-legend-left"><i style="background:${item.color}"></i>${item.name}</span></div>`;
      }).join('');
      return `<div class="budget-chart-wrap">
        <div class="budget-chart-title">Dinheiro Saindo</div>
        <div class="budget-donut" style="background:conic-gradient(${gradient})">
          <div class="budget-donut-hole"></div>
          ${labels}
        </div>
        <div class="budget-legend">${legend}</div>
      </div>`;
    }

    var shell = isMobile ? `
      <section class="budget-dashboard-shell mobile">
        <div class="budget-topline mobile">
          <div>
            <h2>Orçamento</h2>
            <p>${userName}</p>
          </div>
          <small>${monthLabel}</small>
        </div>
        ${buildTable(m.byIncomeSource, m.entradas, 'income', 'Dinheiro Entrando')}
        ${buildTable(m.byCategory, m.saidas, 'expense', 'Dinheiro Saindo')}
        ${buildTable([{name:'Saldo do período',total:m.saldo,percent:0,color:'#3b82f6'}], m.saldo, 'balance', 'Dinheiro Restante')}
        <section class="budget-box chart-only"><div class="budget-box-body">${buildExpenseDonut(m.byCategory)}</div></section>
      </section>
    ` : `
      <section class="budget-dashboard-shell">
        <div class="budget-topline">
          <div>
            <h2>Orçamento</h2>
            <p>${userName} • competência ${monthLabel}</p>
          </div>
          <div class="budget-topline-values">
            <span class="income-chip">Entradas ${MM.helpers.formatCurrency(m.entradas)}</span>
            <span class="expense-chip">Saídas ${MM.helpers.formatCurrency(m.saidas)}</span>
            <span class="balance-chip">Saldo ${MM.helpers.formatCurrency(m.saldo)}</span>
          </div>
        </div>
        <div class="budget-main-grid">
          <div class="budget-left-column">
            ${buildTable(m.byIncomeSource, m.entradas, 'income', 'Dinheiro Entrando')}
            ${buildTable(m.byCategory, m.saidas, 'expense', 'Dinheiro Saindo')}
            ${buildTable([{name:'Saldo do período',total:m.saldo,percent:0,color:'#3b82f6'}], m.saldo, 'balance', 'Dinheiro Restante')}
          </div>
          <div class="budget-right-column">
            ${buildExpenseDonut(m.byCategory)}
          </div>
        </div>
      </section>
    `;

    MM.ui.setHTML('screen-container', shell);
  }
};
