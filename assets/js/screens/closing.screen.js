window.MM = window.MM || {};
MM.closingScreen = {
  render: function(){
    var raw = MM.services.calculateMonthlySummary(MM.state.currentMonth) || {};

    var saldoAnterior = Number(raw.saldoAnterior || 0);
    var entradas = Number(raw.entradas || 0);
    var saidas = Number(raw.saidas || 0);
    var saldoAtual = Number(
      raw.saldoMes != null ? raw.saldoMes :
      raw.saldoAtual != null ? raw.saldoAtual :
      (saldoAnterior + entradas - saidas)
    );

    var aVencer = Number(
      raw.vencer != null ? raw.vencer :
      raw.aVencer != null ? raw.aVencer : 0
    );

    var atrasadas = Number(
      raw.atrasadas != null ? raw.atrasadas :
      raw.atrasado != null ? raw.atrasado : 0
    );

    var competencia = raw.competence || raw.competencia || MM.state.currentMonth || '---';

    MM.ui.setHTML('screen-container', `
      <section class="panel section closing-summary-panel">
        <h2 style="margin-top:0">Fechamento mensal</h2>
        <div class="metric-grid">
          <div class="panel metric"><div class="muted">Saldo anterior</div><div class="value">${MM.helpers.formatCurrency(saldoAnterior)}</div></div>
          <div class="panel metric"><div class="muted">Entradas</div><div class="value">${MM.helpers.formatCurrency(entradas)}</div></div>
          <div class="panel metric"><div class="muted">Saídas</div><div class="value">${MM.helpers.formatCurrency(saidas)}</div></div>
          <div class="panel metric"><div class="muted">Saldo atual</div><div class="value">${MM.helpers.formatCurrency(saldoAtual)}</div></div>
          <div class="panel metric"><div class="muted">A vencer</div><div class="value">${aVencer}</div></div>
          <div class="panel metric"><div class="muted">Atrasadas</div><div class="value">${atrasadas}</div></div>
        </div>
        <div class="feedback">Competência analisada: ${competencia}</div>
      </section>
    `);
  }
};
