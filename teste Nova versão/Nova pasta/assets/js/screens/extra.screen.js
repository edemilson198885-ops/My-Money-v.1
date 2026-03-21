window.MM = window.MM || {};
MM.extraScreen = {
  render: function(){
    var activeUser = MM.services.getActiveUser();

    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <h2 style="margin-top:0">Despesa extra</h2>
        <div class="muted" style="margin-bottom:16px">Cadastro simples para gastos pontuais. Não replica e não usa vencimento.</div>

        <div class="field"><label>Nome da compra</label><input id="extra-description" placeholder="Ex.: Lanche, farmácia, Uber" /></div>
        <div class="field"><label>Usuário do lançamento</label><div class="active-user-field">👤 ${activeUser ? activeUser.name : 'Selecione usuário no topo'}</div></div>
                <div class="field"><label>Data da compra</label><input id="extra-date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
        <div class="field"><label>Valor</label><input id="extra-amount" placeholder="Ex.: 25,90" /></div>
        <div class="field"><label>Observação</label><textarea id="extra-note" rows="3" placeholder="Opcional"></textarea></div>

        <div class="row">
          <button class="btn secondary" id="extra-cancel-btn" type="button">Cancelar</button>
          <button class="btn primary" id="extra-save-btn" type="button">Salvar despesa extra</button>
        </div>
        <div class="feedback" id="extra-feedback">A data da compra deve pertencer à competência atual exibida no topo. A despesa extra nasce como paga e não replica no mês seguinte.</div>
      </section>
    `);

    document.getElementById('extra-cancel-btn').onclick = function(){ MM.router.goTo(MM.config.SCREENS.DASHBOARD); };
    document.getElementById('extra-save-btn').onclick = async function(){
      try{
        if(!activeUser) throw new Error('Selecione o usuário ativo no topo antes de continuar.');
        var movement = MM.models.createMovement({
          householdId: MM.state.household.id,
          type: 'saida',
          description: document.getElementById('extra-description').value,
          category: '',
          recurrence: 'extra',
          belongsTo: (activeUser ? activeUser.id : ''),
          settledBy: (activeUser ? activeUser.id : ''),
          competence: MM.state.currentMonth,
          amount: MM.helpers.parseCurrency(document.getElementById('extra-amount').value),
          dueDate: document.getElementById('extra-date').value,
          settledDate: document.getElementById('extra-date').value,
          note: document.getElementById('extra-note').value,
          origin: 'manual',
          templateId: null
        });

        if(!String(movement.description || '').trim()) throw new Error('Nome da compra obrigatório.');

        var purchaseDate = document.getElementById('extra-date').value;
        var purchaseMonth = purchaseDate ? purchaseDate.slice(0,7) : '';
        if(!purchaseDate) throw new Error('Data da compra obrigatória.');
        if(purchaseMonth !== MM.state.currentMonth){
          throw new Error('A data da compra não pertence à competência atual. Altere a competência no topo do sistema antes de salvar.');
        }

        MM.services.validateMovement(movement);

        MM.state.movements.push(movement);
        await MM.sync.syncNow();
        MM.router.goTo(MM.config.SCREENS.DASHBOARD);
      }catch(err){
        MM.ui.showFeedback('extra-feedback', err.message || 'Erro ao salvar despesa extra.', 'error');
      }
    };
  }
};
