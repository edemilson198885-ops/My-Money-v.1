window.MM = window.MM || {};
MM.closingScreen = {
  render: function(){
    var s = MM.services.calculateMonthlySummary(MM.state.currentMonth);
    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <h2 style="margin-top:0">Fechamento mensal</h2>
        <div class="metric-grid">
          <div class="panel metric"><div class="muted">Saldo anterior</div><div class="value">${MM.helpers.formatCurrency(s.saldoAnterior)}</div></div>
          <div class="panel metric"><div class="muted">Entradas</div><div class="value">${MM.helpers.formatCurrency(s.entradas)}</div></div>
          <div class="panel metric"><div class="muted">Saídas</div><div class="value">${MM.helpers.formatCurrency(s.saidas)}</div></div>
          <div class="panel metric"><div class="muted">Saldo atual</div><div class="value">${MM.helpers.formatCurrency(s.saldoMes)}</div></div>
          <div class="panel metric"><div class="muted">A vencer</div><div class="value">${s.vencer}</div></div>
          <div class="panel metric"><div class="muted">Atrasadas</div><div class="value">${s.atrasadas}</div></div>
        </div>
        <div class="feedback">Competência analisada: ${s.competence}</div>
      </section>
    `);
  }
};
