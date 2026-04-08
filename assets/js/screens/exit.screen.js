window.MM = window.MM || {};
MM.exitScreen = {
  render: function(){
    var editingId = MM.state.editingMovementId || null;
    var editing = editingId ? MM.state.movements.find(function(m){ return m.id === editingId; }) : null;
    var activeUser = MM.services.getActiveUser();
    var selectedUser = editing ? (MM.state.users.find(function(u){ return u.id === editing.belongsTo; }) || activeUser) : activeUser;
    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <h2 style="margin-top:0">${editing ? 'Editar saída' : 'Nova saída'}</h2>
        <div class="field"><label>Descrição</label><input id="exit-description" placeholder="Ex.: Conta de água" value="${editing ? editing.description : ''}" /></div>
                <div class="field"><label>Usuário do lançamento</label><div class="active-user-field">👤 ${selectedUser ? selectedUser.name : 'Selecione usuário no topo'}</div></div>
        <div class="field"><label>Recorrência</label><select id="exit-recurrence"><option value="variavel" ${editing && editing.recurrence==='variavel'?'selected':''}>Variável</option><option value="fixa" ${editing && editing.recurrence==='fixa'?'selected':''}>Fixa</option></select></div>
        <div class="field"><label>Categoria</label><select id="exit-category">${MM.helpers.renderCategoryOptions('saida', editing ? editing.category : 'auto')}</select></div>
                <div class="field"><label>Valor</label><input id="exit-amount" placeholder="Ex.: 120,50" value="${editing ? String(editing.amount).replace('.', ',') : ''}" /></div>
        <div class="field"><label>Vencimento</label><input id="exit-due-date" type="date" value="${editing ? editing.dueDate : ''}" /></div>
        <div class="field"><label>Observação</label><textarea id="exit-note" rows="3" placeholder="Opcional">${editing ? editing.note : ''}</textarea></div>
        <div class="row"><button class="btn secondary" id="exit-cancel-btn" type="button">Cancelar</button><button class="btn primary" id="exit-save-btn" type="button">${editing ? 'Salvar alteração' : 'Salvar saída'}</button></div>
        <div class="feedback" id="exit-feedback">A vencimento deve pertencer à competência atual exibida no topo.</div>
      </section>
    `);

    document.getElementById('exit-cancel-btn').onclick = function(){ MM.state.editingMovementId = null; MM.router.goTo(MM.config.SCREENS.MOVEMENTS); };
    document.getElementById('exit-save-btn').onclick = async function(){
      try{
        if(!selectedUser) throw new Error('Selecione o usuário ativo no topo antes de continuar.');
        var movement = MM.models.createMovement({ id: editing ? editing.id : undefined, householdId: MM.state.household.id, type: 'saida', description: document.getElementById('exit-description').value, category: (document.getElementById('exit-category').value === 'auto' ? MM.helpers.autoCategory(document.getElementById('exit-description').value, 'saida') : document.getElementById('exit-category').value), recurrence: document.getElementById('exit-recurrence').value, belongsTo: (selectedUser ? selectedUser.id : ''), settledBy: editing ? editing.settledBy : '', competence: MM.state.currentMonth, amount: MM.helpers.parseCurrency(document.getElementById('exit-amount').value), dueDate: document.getElementById('exit-due-date').value, settledDate: editing ? editing.settledDate : '', note: document.getElementById('exit-note').value, origin: editing ? editing.origin : 'manual', templateId: editing ? editing.templateId : null });
        var movementMonth = movement.dueDate ? movement.dueDate.slice(0,7) : '';
        if(movementMonth !== MM.state.currentMonth){
          throw new Error('A data informada não pertence à competência atual. Altere a competência no topo do sistema antes de salvar.');
        }

        MM.services.validateMovement(movement);
        MM.services.createOrUpdateTemplateFromMovement(movement);
        if(editing){ MM.state.movements = MM.state.movements.map(function(item){ return item.id === movement.id ? movement : item; }); } else { MM.state.movements.push(movement); }
        MM.state.editingMovementId = null;
        await MM.sync.syncNow();
        MM.router.goTo(MM.config.SCREENS.DASHBOARD);
      }catch(err){ MM.ui.showFeedback('exit-feedback', err.message || 'Erro ao salvar saída.', 'error'); }
    };
  }
};
