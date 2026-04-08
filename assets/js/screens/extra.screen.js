window.MM = window.MM || {};
MM.extraScreen = {
  render: function(){
    var editingId = MM.state.editingMovementId || null;
    var editing = editingId ? MM.state.movements.find(function(m){ return m.id === editingId; }) : null;
    var activeUser = MM.services.getActiveUser();
    var selectedUser = editing ? (MM.state.users.find(function(u){ return u.id === editing.belongsTo; }) || activeUser) : activeUser;
    var defaultDate = editing ? editing.dueDate : new Date().toISOString().slice(0,10);

    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <h2 style="margin-top:0">${editing ? 'Editar despesa extra' : 'Despesa extra'}</h2>
        <div class="muted" style="margin-bottom:16px">Cadastro simples para gastos pontuais. Não replica e não usa vencimento.</div>

        <div class="field"><label>Nome da compra</label><input id="extra-description" placeholder="Ex.: Lanche, farmácia, Uber" value="${editing ? editing.description : ''}" /></div>
        <div class="field"><label>Usuário do lançamento</label><div class="active-user-field">👤 ${selectedUser ? selectedUser.name : 'Selecione usuário no topo'}</div></div>
        <div class="field"><label>Data da compra</label><input id="extra-date" type="date" value="${defaultDate}" /></div>
        <div class="field"><label>Valor</label><input id="extra-amount" placeholder="Ex.: 25,90" value="${editing ? String(editing.amount).replace('.', ',') : ''}" /></div>
        <div class="field"><label>Observação</label><textarea id="extra-note" rows="3" placeholder="Opcional">${editing ? (editing.note || '') : ''}</textarea></div>

        <div class="row">
          <button class="btn secondary" id="extra-cancel-btn" type="button">Cancelar</button>
          <button class="btn primary" id="extra-save-btn" type="button">${editing ? 'Salvar alteração' : 'Salvar despesa extra'}</button>
        </div>
        <div class="feedback" id="extra-feedback">A data da compra deve pertencer à competência atual exibida no topo. A despesa extra nasce como paga e não replica no mês seguinte.</div>
      </section>
    `);

    document.getElementById('extra-cancel-btn').onclick = function(){
      MM.state.editingMovementId = null;
      MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
    };

    document.getElementById('extra-save-btn').onclick = async function(){
      try{
        if(!selectedUser) throw new Error('Selecione o usuário ativo no topo antes de continuar.');
        var purchaseDate = document.getElementById('extra-date').value;
        var movement = MM.models.createMovement({
          id: editing ? editing.id : undefined,
          householdId: MM.state.household.id,
          type: 'saida',
          description: document.getElementById('extra-description').value,
          category: editing ? (editing.category || '') : '',
          recurrence: 'extra',
          belongsTo: (selectedUser ? selectedUser.id : ''),
          settledBy: (selectedUser ? selectedUser.id : ''),
          competence: MM.state.currentMonth,
          amount: MM.helpers.parseCurrency(document.getElementById('extra-amount').value),
          dueDate: purchaseDate,
          settledDate: purchaseDate,
          note: document.getElementById('extra-note').value,
          origin: editing ? editing.origin : 'manual',
          templateId: null,
          createdAt: editing ? editing.createdAt : undefined
        });

        if(!String(movement.description || '').trim()) throw new Error('Nome da compra obrigatório.');
        if(!purchaseDate) throw new Error('Data da compra obrigatória.');
        if(purchaseDate.slice(0,7) !== MM.state.currentMonth){
          throw new Error('A data da compra não pertence à competência atual. Altere a competência no topo do sistema antes de salvar.');
        }

        MM.services.validateMovement(movement);

        if(editing){
          MM.state.movements = MM.state.movements.map(function(item){ return item.id === movement.id ? movement : item; });
        } else {
          MM.state.movements.push(movement);
        }
        MM.state.editingMovementId = null;
        await MM.sync.syncNow();
        MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
      }catch(err){
        MM.ui.showFeedback('extra-feedback', err.message || 'Erro ao salvar despesa extra.', 'error');
      }
    };
  }
};
