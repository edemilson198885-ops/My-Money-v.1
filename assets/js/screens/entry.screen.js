window.MM = window.MM || {};
MM.entryScreen = {
  render: function(){
    var editingId = MM.state.editingMovementId || null;
    var editing = editingId ? MM.state.movements.find(function(m){ return m.id === editingId; }) : null;
    var userOptions = MM.ui.renderSelectOptions(MM.services.getUserOptions(false), editing ? editing.belongsTo : null);
    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <h2 style="margin-top:0">${editing ? 'Editar entrada' : 'Nova entrada'}</h2>
        <div class="field"><label>Descrição</label><input id="entry-description" placeholder="Ex.: Pagamento março" value="${editing ? editing.description : ''}" /></div>
                <div class="field"><label>Responsável</label><select id="entry-belongs">${userOptions}</select></div>
        <div class="field"><label>Recorrência</label><select id="entry-recurrence"><option value="variavel" ${editing && editing.recurrence==='variavel'?'selected':''}>Variável</option><option value="fixa" ${editing && editing.recurrence==='fixa'?'selected':''}>Fixa</option></select></div>
                <div class="field"><label>Valor</label><input id="entry-amount" placeholder="Ex.: 1500,00" value="${editing ? String(editing.amount).replace('.', ',') : ''}" /></div>
        <div class="field"><label>Data do pagamento</label><input id="entry-due-date" type="date" value="${editing ? editing.dueDate : ''}" /></div>
        <div class="field"><label>Observação</label><textarea id="entry-note" rows="3" placeholder="Opcional">${editing ? editing.note : ''}</textarea></div>
        <div class="row"><button class="btn secondary" id="entry-cancel-btn" type="button">Cancelar</button><button class="btn blue" id="entry-save-btn" type="button">${editing ? 'Salvar alteração' : 'Salvar entrada'}</button></div>
        <div class="feedback" id="entry-feedback">A data do pagamento deve pertencer à competência atual exibida no topo.</div>
      </section>
    `);

    document.getElementById('entry-cancel-btn').onclick = function(){ MM.state.editingMovementId = null; MM.router.goTo(MM.config.SCREENS.MOVEMENTS); };
    document.getElementById('entry-save-btn').onclick = function(){
      try{
        var movement = MM.models.createMovement({ id: editing ? editing.id : undefined, householdId: MM.state.household.id, type: 'entrada', description: document.getElementById('entry-description').value, category: '', recurrence: document.getElementById('entry-recurrence').value, belongsTo: document.getElementById('entry-belongs').value, settledBy: editing ? editing.settledBy : '', competence: MM.state.currentMonth, amount: MM.helpers.parseCurrency(document.getElementById('entry-amount').value), dueDate: document.getElementById('entry-due-date').value, settledDate: editing ? editing.settledDate : '', note: document.getElementById('entry-note').value, origin: editing ? editing.origin : 'manual', templateId: editing ? editing.templateId : null });
        var movementMonth = movement.dueDate ? movement.dueDate.slice(0,7) : '';
        if(movementMonth !== MM.state.currentMonth){
          throw new Error('A data informada não pertence à competência atual. Altere a competência no topo do sistema antes de salvar.');
        }

        MM.services.validateMovement(movement);
        MM.services.createOrUpdateTemplateFromMovement(movement);
        if(editing){ MM.state.movements = MM.state.movements.map(function(item){ return item.id === movement.id ? movement : item; }); } else { MM.state.movements.push(movement); }
        MM.state.editingMovementId = null;
        MM.storage.syncFromState();
        MM.router.goTo(MM.config.SCREENS.DASHBOARD);
      }catch(err){ MM.ui.showFeedback('entry-feedback', err.message || 'Erro ao salvar entrada.', 'error'); }
    };
  }
};
