window.MM = window.MM || {};
MM.templatesScreen = {
  render: function(){
    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <div class="row"><div><h2 style="margin:0">Fixos automáticos</h2><div class="muted">Modelos fixos usados como referência. Contas fixas criam o próximo lançamento somente ao liquidar o atual. O novo item aparece na competência seguinte.</div></div><button class="btn secondary" id="generate-current-month-btn" type="button">Gerar manualmente competência atual</button></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Pertence a</th><th>Valor</th><th>Dia</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody id="templates-table-body"></tbody>
          </table>
        </div>
      </section>
    `);
    function renderRows(){
      var body = document.getElementById('templates-table-body');
      body.innerHTML = MM.state.templates.length ? MM.state.templates.map(function(t){
        return `<tr><td><strong>${t.description}</strong></td><td><span class="badge ${t.type}">${t.type}</span></td><td>${t.category}</td><td>${MM.helpers.userName(t.belongsTo)}</td><td>${MM.helpers.formatCurrency(t.amount)}</td><td>${String(t.dueDay).padStart(2,'0')}</td><td>${t.active ? '<span class="badge ativo">ativo</span>' : '<span class="badge inativo">inativo</span>'}</td><td><button class="btn secondary toggle-template-btn" data-id="${t.id}" type="button">${t.active ? 'Desativar' : 'Ativar'}</button></td></tr>`;
      }).join('') : '<tr><td colspan="8" class="muted">Nenhum template automático cadastrado.</td></tr>';
      document.querySelectorAll('.toggle-template-btn').forEach(function(btn){ btn.onclick = function(e){ var id = e.target.dataset.id; MM.state.templates = MM.state.templates.map(function(t){ if(t.id === id) t.active = !t.active; return t; }); MM.storage.syncFromState(); renderRows(); }; });
    }
    document.getElementById('generate-current-month-btn').onclick = function(){ MM.services.generateFixedForMonth(MM.state.currentMonth); MM.app.render(); };
    renderRows();
  }
};
