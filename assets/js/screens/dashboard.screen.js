window.MM = window.MM || {};
MM.dashboardScreen = {
  render: function(){
    var m = MM.services.getDashboardMetrics();
    var isMobile = window.innerWidth <= 768;
    var monthLabel = MM.helpers.formatMonthLabel(MM.state.currentMonth);
    var expenseCategories = (m.byCategory || []).filter(function(item){ return Number(item.total || 0) > 0; });
    var incomeBreakdown = {};
    MM.services.getCashMovementsForMonth(MM.state.currentMonth)
      .filter(function(item){ return item.type === 'entrada'; })
      .forEach(function(item){
        var key = MM.helpers.resolveCategory(item);
        incomeBreakdown[key] = (incomeBreakdown[key] || 0) + Number(item.amount || 0);
      });
    var incomeCategories = Object.keys(incomeBreakdown).map(function(name){
      return { name: name, total: incomeBreakdown[name] };
    }).sort(function(a,b){ return b.total - a.total; });

    function buildDonut(items, total, title){
      if(!items.length){
        return '<div class="mm-budget-empty">Sem dados suficientes para mostrar categorias.</div>';
      }
      var colors = ['#22c55e','#ef4444','#3b82f6','#f59e0b','#8b5cf6','#14b8a6','#ec4899','#64748b'];
      var acc = 0;
      var gradient = items.map(function(item, idx){
        var start = Math.round((acc / total) * 100);
        acc += Number(item.total || 0);
        var end = Math.round((acc / total) * 100);
        return colors[idx % colors.length] + ' ' + start + '% ' + end + '%';
      }).join(', ');
      var legend = items.map(function(item, idx){
        var pct = total ? ((Number(item.total || 0) / total) * 100) : 0;
        return '<div class="mm-budget-legend-row">'
          + '<span class="mm-budget-legend-name"><i style="background:' + colors[idx % colors.length] + '"></i>' + item.name + '</span>'
          + '<span><strong>' + MM.helpers.formatCurrency(item.total) + '</strong> <small>' + pct.toFixed(0) + '%</small></span>'
          + '</div>';
      }).join('');
      return '<div class="mm-budget-donut-wrap">'
        + '<div class="mm-budget-donut" style="background:conic-gradient(' + gradient + ')"><div class="mm-budget-donut-hole"><small>' + title + '</small><strong>' + MM.helpers.formatCurrency(total) + '</strong></div></div>'
        + '<div class="mm-budget-legend">' + legend + '</div>'
        + '</div>';
    }

    function buildCategoryRows(items){
      if(!items.length){
        return '<div class="mm-budget-empty">Nenhuma saída realizada nesta competência.</div>';
      }
      var top = items.slice(0, 8);
      return top.map(function(item, idx){
        var pct = m.saidas ? ((Number(item.total || 0) / m.saidas) * 100) : 0;
        return '<button class="mm-category-row" type="button" data-category="' + item.name + '">'
          + '<div class="mm-category-row-head"><span>' + (idx+1) + '. ' + item.name + '</span><strong>' + MM.helpers.formatCurrency(item.total) + '</strong></div>'
          + '<div class="mm-category-bar"><span style="width:' + Math.max(8, Math.min(100, pct)) + '%"></span></div>'
          + '<div class="mm-category-meta">' + pct.toFixed(1).replace('.',',') + '% das saídas do mês</div>'
          + '</button>';
      }).join('');
    }

    function buildIncomeRows(items){
      if(!items.length){
        return '<div class="mm-budget-empty">Nenhuma entrada realizada nesta competência.</div>';
      }
      return items.slice(0, 6).map(function(item){
        var pct = m.entradas ? ((Number(item.total || 0) / m.entradas) * 100) : 0;
        return '<div class="mm-income-row"><span>' + item.name + '</span><strong>' + MM.helpers.formatCurrency(item.total) + '</strong><small>' + pct.toFixed(0) + '%</small></div>';
      }).join('');
    }

    function buildInsightRows(){
      var focus = expenseCategories[0] ? expenseCategories[0].name : 'Sem movimento';
      var pressure = expenseCategories[0] ? expenseCategories[0].total : 0;
      var ratio = m.entradas > 0 ? (m.saidas / m.entradas) * 100 : 0;
      return [
        ['Entradas realizadas', MM.helpers.formatCurrency(m.entradas)],
        ['Saídas realizadas', MM.helpers.formatCurrency(m.saidas)],
        ['Saldo acumulado', MM.helpers.formatCurrency(m.saldo)],
        ['Categoria com maior peso', focus],
        ['Valor da maior categoria', MM.helpers.formatCurrency(pressure)],
        ['Comprometimento da renda', ratio.toFixed(0) + '%']
      ].map(function(row){
        return '<div class="mm-insight-row"><span>' + row[0] + '</span><strong>' + row[1] + '</strong></div>';
      }).join('');
    }

    var shell = `
      <style>
        .mm-budget-shell{display:grid;gap:16px;padding:0 0 24px}
        .mm-budget-hero,.mm-budget-card{background:linear-gradient(180deg,#0f172a,#111827);color:#fff;border-radius:24px;padding:18px;box-shadow:0 10px 30px rgba(15,23,42,.18)}
        .mm-budget-hero-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
        .mm-budget-kicker{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
        .mm-budget-value{font-size:${isMobile ? '34px' : '42px'};font-weight:800;line-height:1.05;margin-top:6px}
        .mm-budget-sub{opacity:.8;margin-top:6px;font-size:13px}
        .mm-budget-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
        .mm-budget-pill{padding:10px 12px;border-radius:999px;background:rgba(255,255,255,.08);font-size:13px}
        .mm-budget-summary{display:grid;grid-template-columns:repeat(${isMobile ? 1 : 3},1fr);gap:12px}
        .mm-summary-box{background:#fff;color:#0f172a;border-radius:20px;padding:16px;box-shadow:0 8px 24px rgba(15,23,42,.08)}
        .mm-summary-box span{display:block;font-size:12px;color:#64748b;margin-bottom:8px}
        .mm-summary-box strong{font-size:28px;display:block}
        .mm-summary-box small{display:block;margin-top:8px;color:#475569}
        .mm-summary-box.positive strong{color:#16a34a}.mm-summary-box.negative strong{color:#dc2626}.mm-summary-box.neutral strong{color:#2563eb}
        .mm-budget-grid{display:grid;grid-template-columns:repeat(${isMobile ? 1 : 2},minmax(0,1fr));gap:16px}
        .mm-budget-card{background:#fff;color:#0f172a;box-shadow:0 8px 24px rgba(15,23,42,.08)}
        .mm-budget-card h3{margin:0 0 4px;font-size:20px}.mm-budget-card p{margin:0;color:#64748b;font-size:13px}
        .mm-budget-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap}
        .mm-budget-actions{display:flex;gap:8px;flex-wrap:wrap}
        .mm-budget-donut-wrap{display:grid;grid-template-columns:${isMobile ? '1fr' : '220px 1fr'};gap:16px;align-items:center}
        .mm-budget-donut{width:220px;height:220px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto}
        .mm-budget-donut-hole{width:130px;height:130px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:14px;box-shadow:inset 0 0 0 1px #e2e8f0}
        .mm-budget-donut-hole small{font-size:12px;color:#64748b}.mm-budget-donut-hole strong{font-size:20px;line-height:1.2}
        .mm-budget-legend,.mm-category-list,.mm-income-list,.mm-insight-list{display:grid;gap:10px}
        .mm-budget-legend-row,.mm-income-row,.mm-insight-row{display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid #e2e8f0;border-radius:14px;padding:12px}
        .mm-budget-legend-name{display:flex;align-items:center;gap:10px}.mm-budget-legend-name i{display:inline-block;width:10px;height:10px;border-radius:999px}
        .mm-category-row{border:1px solid #e2e8f0;border-radius:16px;padding:12px;background:#fff;text-align:left}
        .mm-category-row-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}
        .mm-category-bar{height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden}.mm-category-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#3b82f6,#22c55e)}
        .mm-category-meta{margin-top:8px;font-size:12px;color:#64748b}
        .mm-budget-empty{padding:18px;border:1px dashed #cbd5e1;border-radius:16px;color:#64748b;text-align:center}
      </style>
      <section class="mm-budget-shell">
        <section class="mm-budget-hero">
          <div class="mm-budget-hero-top">
            <div>
              <div class="mm-budget-kicker">Dashboard por categoria</div>
              <div class="mm-budget-value">${MM.helpers.formatCurrency(m.saldo)}</div>
              <div class="mm-budget-sub">Competência ${monthLabel} • visão estilo orçamento • categorias preenchidas automaticamente</div>
              <div class="mm-budget-pills">
                <span class="mm-budget-pill">Entradas ${MM.helpers.formatCurrency(m.entradas)}</span>
                <span class="mm-budget-pill">Saídas ${MM.helpers.formatCurrency(m.saidas)}</span>
                <span class="mm-budget-pill">Pendentes ${m.monthOpenCount}</span>
                <span class="mm-budget-pill">A vencer ${m.dueSoon}</span>
              </div>
            </div>
            <div class="mm-budget-actions">
              <button class="btn blue" id="dashboard-new-entry" type="button">Nova entrada</button>
              <button class="btn primary" id="dashboard-new-exit" type="button">Nova saída</button>
            </div>
          </div>
        </section>

        <section class="mm-budget-summary">
          <article class="mm-summary-box positive"><span>Dinheiro entrando</span><strong>${MM.helpers.formatCurrency(m.entradas)}</strong><small>${incomeCategories.length} grupos de receita no mês</small></article>
          <article class="mm-summary-box negative"><span>Dinheiro saindo</span><strong>${MM.helpers.formatCurrency(m.saidas)}</strong><small>${expenseCategories.length} categorias identificadas</small></article>
          <article class="mm-summary-box neutral"><span>Resultado final</span><strong>${MM.helpers.formatCurrency(m.entradas - m.saidas)}</strong><small>Fluxo realizado da competência</small></article>
        </section>

        <section class="mm-budget-grid">
          <section class="mm-budget-card">
            <div class="mm-budget-head"><div><h3>Saídas por categoria</h3><p>Agora o foco do app está em entender para onde o dinheiro está indo.</p></div></div>
            ${buildDonut(expenseCategories.slice(0,8), Math.max(m.saidas,1), 'Saídas')}
          </section>
          <section class="mm-budget-card">
            <div class="mm-budget-head"><div><h3>Entradas por origem</h3><p>Salário, vale e extras resumidos em uma visão simples.</p></div></div>
            <div class="mm-income-list">${buildIncomeRows(incomeCategories)}</div>
          </section>
        </section>

        <section class="mm-budget-grid">
          <section class="mm-budget-card">
            <div class="mm-budget-head"><div><h3>Ranking de categorias</h3><p>Toque para abrir os movimentos já filtrados por categoria.</p></div></div>
            <div class="mm-category-list">${buildCategoryRows(expenseCategories)}</div>
          </section>
          <section class="mm-budget-card">
            <div class="mm-budget-head"><div><h3>Leitura financeira</h3><p>Resumo gerencial para o usuário bater o olho e entender o mês.</p></div></div>
            <div class="mm-insight-list">${buildInsightRows()}</div>
          </section>
        </section>
      </section>`;

    MM.ui.setHTML('screen-container', shell);

    function goMonth(direction){
      MM.state.currentMonth = direction < 0 ? MM.helpers.previousMonth(MM.state.currentMonth) : MM.helpers.nextMonth(MM.state.currentMonth);
      MM.app.render();
      try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch(e) { window.scrollTo(0,0); }
    }

    var entryBtn = document.getElementById('dashboard-new-entry');
    if(entryBtn) entryBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.ENTRY); };
    var exitBtn = document.getElementById('dashboard-new-exit');
    if(exitBtn) exitBtn.onclick = function(){ MM.router.goTo(MM.config.SCREENS.EXIT); };

    document.querySelectorAll('.mm-category-row').forEach(function(btn){
      btn.onclick = function(e){
        MM.state.movementFilters = { type:'saida', belongsTo:'todos', status:'todos', text:e.currentTarget.dataset.category || '' };
        MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
      };
    });

    // Desktop month navigation by keyboard arrows, mobile swipe preserved lightly.
    if(isMobile){
      var root = document.querySelector('.mm-budget-shell');
      if(root){
        var startX = 0, startY = 0;
        root.addEventListener('touchstart', function(e){ if(e.touches && e.touches[0]){ startX = e.touches[0].clientX; startY = e.touches[0].clientY; } }, { passive:true });
        root.addEventListener('touchend', function(e){
          if(!(e.changedTouches && e.changedTouches[0])) return;
          var dx = e.changedTouches[0].clientX - startX;
          var dy = e.changedTouches[0].clientY - startY;
          if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70){ goMonth(dx < 0 ? 1 : -1); }
        }, { passive:true });
      }
    }
    document.onkeydown = function(ev){
      if(MM.state.currentScreen !== MM.config.SCREENS.DASHBOARD) return;
      if(ev.key === 'ArrowLeft') goMonth(-1);
      if(ev.key === 'ArrowRight') goMonth(1);
    };
  }
};
