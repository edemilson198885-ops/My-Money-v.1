window.MM = window.MM || {};
MM.entryExtraScreen = {
  render: function(){
    var editingId = MM.state.editingMovementId || null;
    var editing = editingId ? MM.state.movements.find(function(m){ return m.id === editingId; }) : null;
    var activeUser = MM.services.getActiveUser();
    var selectedUser = editing ? (MM.state.users.find(function(u){ return u.id === editing.belongsTo; }) || activeUser) : activeUser;
    var today = new Date().toISOString().slice(0,10);

    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <h2 style="margin-top:0">${editing ? 'Editar entrada extra' : 'Entrada extra'}</h2>
        <div class="muted" style="margin-bottom:16px">Cadastro simples para receitas pontuais. Não replica no mês seguinte.</div>

        <div class="field"><label>Descrição</label><input id="entry-extra-description" placeholder="Ex.: Venda avulsa, bônus, reembolso" value="${editing ? editing.description : ''}" /></div>
        <div class="field"><label>Usuário do lançamento</label><div class="active-user-field">👤 ${selectedUser ? selectedUser.name : 'Selecione usuário no topo'}</div></div>
        <div class="field"><label>Data do recebimento</label><input id="entry-extra-date" type="date" value="${editing ? editing.dueDate : today}" /></div>
        <div class="field"><label>Valor</label><input id="entry-extra-amount" placeholder="Ex.: 250,00" value="${editing ? String(editing.amount).replace('.', ',') : ''}" /></div>
        <div class="field"><label>Observação</label><textarea id="entry-extra-note" rows="3" placeholder="Opcional">${editing ? editing.note : ''}</textarea></div>

        <div class="row">
          <button class="btn secondary" id="entry-extra-cancel-btn" type="button">Cancelar</button>
          <button class="btn primary" id="entry-extra-save-btn" type="button">${editing ? 'Salvar alteração' : 'Salvar entrada extra'}</button>
        </div>
        <div class="feedback" id="entry-extra-feedback">A data do recebimento deve pertencer à competência atual exibida no topo. A entrada extra é pontual e não replica no mês seguinte.</div>
      </section>
    `);

    document.getElementById('entry-extra-cancel-btn').onclick = function(){
      MM.state.editingMovementId = null;
      MM.router.goTo(editing ? MM.config.SCREENS.MOVEMENTS : MM.config.SCREENS.DASHBOARD);
    };

    document.getElementById('entry-extra-save-btn').onclick = async function(){
      try{
        if(!selectedUser) throw new Error('Selecione o usuário ativo no topo antes de continuar.');
        var receiveDate = document.getElementById('entry-extra-date').value;
        var movement = MM.models.createMovement({
          id: editing ? editing.id : undefined,
          householdId: MM.state.household.id,
          type: 'entrada',
          description: document.getElementById('entry-extra-description').value,
          category: '',
          recurrence: 'extra',
          belongsTo: (selectedUser ? selectedUser.id : ''),
          settledBy: editing ? editing.settledBy : '',
          competence: MM.state.currentMonth,
          amount: MM.helpers.parseCurrency(document.getElementById('entry-extra-amount').value),
          dueDate: receiveDate,
          settledDate: editing ? editing.settledDate : '',
          note: document.getElementById('entry-extra-note').value,
          origin: editing ? editing.origin : 'manual',
          templateId: null,
          createdAt: editing ? editing.createdAt : undefined
        });

        if(!String(movement.description || '').trim()) throw new Error('Descrição obrigatória.');
        if(!receiveDate) throw new Error('Data do recebimento obrigatória.');
        if(receiveDate.slice(0,7) !== MM.state.currentMonth){
          throw new Error('A data do recebimento não pertence à competência atual. Altere a competência no topo do sistema antes de salvar.');
        }

        MM.services.validateMovement(movement);

        if(editing){
          MM.state.movements = MM.state.movements.map(function(item){ return item.id === movement.id ? movement : item; });
        } else {
          MM.state.movements.push(movement);
        }

        MM.state.editingMovementId = null;
        await MM.sync.syncNow();
        MM.router.goTo(MM.config.SCREENS.DASHBOARD);
      }catch(err){
        MM.ui.showFeedback('entry-extra-feedback', err.message || 'Erro ao salvar entrada extra.', 'error');
      }
    };
  }
};
