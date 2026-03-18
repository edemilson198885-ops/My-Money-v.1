window.MM = window.MM || {};
MM.movementsScreen = {
  render: function(){
    var userOptions = MM.services.getUserOptions(true);
    var belongsOptions = [{ value:'todos', label:'Todos' }].concat(userOptions);
    var preset = MM.state.movementFilters || { type:'todos', belongsTo:'todos', status:'todos', text:'' };

    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <div class="row" style="margin-bottom:12px">
          <div>
            <h2 style="margin:0">Movimentações</h2>
            <div class="muted">Lista recolhida do mês atual. Clique em um lançamento para ver detalhes e ações.</div>
          </div>
        </div>

        <div class="toolbar">
          <select id="filter-type">
            <option value="todos" ${preset.type==='todos'?'selected':''}>Entrada e saída</option>
            <option value="entrada" ${preset.type==='entrada'?'selected':''}>Entradas</option>
            <option value="saida" ${preset.type==='saida'?'selected':''}>Saídas</option>
          </select>
          <select id="filter-belongs">${MM.ui.renderSelectOptions(belongsOptions, preset.belongsTo)}</select>
          <select id="filter-status">
            <option value="todos" ${preset.status==='todos'?'selected':''}>Todos status</option>
            <option value="previsto" ${preset.status==='previsto'?'selected':''}>Previsto</option>
            <option value="recebido" ${preset.status==='recebido'?'selected':''}>Recebido</option>
            <option value="aberto" ${preset.status==='aberto'?'selected':''}>Aberto</option>
            <option value="pago" ${preset.status==='pago'?'selected':''}>Pago</option>
            <option value="vencer" ${preset.status==='vencer'?'selected':''}>A vencer</option>
            <option value="atrasado" ${preset.status==='atrasado'?'selected':''}>Atrasado</option>
          </select>
          <input id="filter-text" placeholder="Buscar descrição" value="${preset.text || ''}" />
          <button class="btn secondary" id="apply-filters-btn" type="button">Aplicar</button>
          <button class="btn secondary" id="clear-filters-btn" type="button">Limpar filtro</button>
        </div>

        <div class="feedback" id="movements-feedback">Clique em um lançamento para ver os detalhes e ações.</div>
        <div class="movement-list" id="movements-list"></div>
      </section>
    `);

    function movementDetails(m, status){
      var recurrenceMap = {
        fixa: 'Fixa',
        variavel: 'Variável',
        extra: 'Extra'
      };
      return `
        <div class="movement-details-grid">
          <div class="movement-detail"><span class="movement-detail-label">Tipo</span><strong>${m.type === 'entrada' ? 'Entrada' : 'Saída'}</strong></div>
          <div class="movement-detail"><span class="movement-detail-label">Usuário</span><strong>${MM.helpers.userName(m.belongsTo)}</strong></div>
          <div class="movement-detail"><span class="movement-detail-label">Recorrência</span><strong>${recurrenceMap[m.recurrence] || m.recurrence || '-'}</strong></div>
          <div class="movement-detail"><span class="movement-detail-label">Data</span><strong>${MM.helpers.formatDate(m.dueDate)}</strong></div>
          <div class="movement-detail movement-detail-wide"><span class="movement-detail-label">Observação</span><strong>${m.note ? m.note : 'Sem observação'}</strong></div>
        </div>
        <div class="actions-inline movement-actions">
          <button class="btn secondary edit-movement-btn" data-id="${m.id}" type="button">Editar</button>
          ${m.type === 'saida' ? `<button class="btn secondary settle-movement-btn" data-id="${m.id}" type="button">${m.settledDate ? 'Desfazer' : 'Liquidar'}</button>` : ''}
          <button class="btn danger delete-movement-btn" data-id="${m.id}" type="button">Excluir</button>
        </div>
      `;
    }

    function toggleMovement(id){
      MM.state.expandedMovementId = MM.state.expandedMovementId === id ? null : id;
      renderRows();
    }

    async function settleMovement(id, mode){
      var createdNext = null;
      MM.state.movements = MM.state.movements.map(function(item){
        if(item.id !== id) return item;

        if(item.settledDate){
          item.settledDate = '';
          item.settledBy = '';
        } else {
          item.settledDate = new Date().toISOString().slice(0,10);
          item.settledBy = item.belongsTo === 'shared' ? '' : item.belongsTo;
        }
        item.updatedAt = MM.helpers.nowIso();
        return item;
      });

      var settledMovement = MM.state.movements.find(function(item){ return item.id === id; });
      if(settledMovement && settledMovement.settledDate){
        createdNext = MM.services.createNextRecurringMovementOnSettle(settledMovement);
      }

      await MM.storage.syncFromState();
      renderRows();
      MM.ui.renderTopbar();

      var feedback = document.getElementById('movements-feedback');
      if(feedback){
        if(mode === 'quick' && settledMovement && settledMovement.settledDate){
          feedback.textContent = 'Saída marcada como paga e data de pagamento gravada com sucesso.';
        } else if(createdNext && settledMovement && settledMovement.recurrence === 'fixa'){
          feedback.textContent = 'Lançamento fixo liquidado e próximo mês criado com o mesmo valor.';
        } else if(createdNext && settledMovement && settledMovement.recurrence === 'variavel'){
          feedback.textContent = 'Lançamento variável liquidado e próximo mês criado sem valor para preenchimento.';
        } else if(settledMovement && settledMovement.settledDate && (settledMovement.recurrence === 'fixa' || settledMovement.recurrence === 'variavel')){
          feedback.textContent = 'Lançamento liquidado. O próximo mês já existia e não foi duplicado.';
        } else if(settledMovement && settledMovement.settledDate){
          feedback.textContent = 'Lançamento liquidado com sucesso.';
        } else {
          feedback.textContent = 'Liquidação desfeita com sucesso.';
        }
      }
    }

    function renderQuickAction(m, status){
      if(m.type !== 'saida') return '';
      if(status === 'pago'){
        return `
          <span class="quick-pay-done" title="Pago em ${MM.helpers.formatDate(m.settledDate)}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg>
            Pago
          </span>
        `;
      }
      return `
        <button class="quick-pay-btn ${status === 'atrasado' ? 'alert' : ''}" data-id="${m.id}" type="button" title="Marcar saída como paga hoje">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"></path></svg>
          <span>${status === 'vencer' ? 'Pagar' : (status === 'atrasado' ? 'Pagar agora' : 'Quitar')}</span>
        </button>
      `;
    }

    function renderStatusSlot(m, status){
      if(m.type === 'saida' && status === 'pago') return '';
      return `<span class="badge ${status}">${status}</span>`;
    }

    function bindActionButtons(){
      document.querySelectorAll('.movement-card-toggle').forEach(function(btn){
        btn.onclick = function(){
          toggleMovement(btn.dataset.id);
        };
      });

      document.querySelectorAll('.movement-chevron-btn').forEach(function(btn){
        btn.onclick = function(){
          toggleMovement(btn.dataset.id);
        };
      });

      document.querySelectorAll('.quick-pay-btn').forEach(function(btn){
        btn.onclick = async function(e){
          e.stopPropagation();
          var id = btn.dataset.id;
          var movement = MM.state.movements.find(function(item){ return item.id === id; });
          if(!movement) return;
          if(!confirm('Confirmar pagamento de ' + MM.helpers.formatCurrency(movement.amount) + '?')) return;
          settleMovement(id, 'quick').catch(function(err){ MM.ui.showFeedback('movements-feedback', err.message || 'Erro ao sincronizar movimentação.', 'error'); });
        };
      });

      document.querySelectorAll('.edit-movement-btn').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          var id=e.target.dataset.id;
          var m=MM.state.movements.find(function(item){ return item.id===id; });
          if(!m) return;
          MM.state.editingMovementId=id;
          if(m.type === 'entrada'){
            MM.router.goTo(m.recurrence === 'extra' ? MM.config.SCREENS.ENTRY_EXTRA : MM.config.SCREENS.ENTRY);
          } else {
            MM.router.goTo(MM.config.SCREENS.EXIT);
          }
        };
      });

      document.querySelectorAll('.delete-movement-btn').forEach(function(btn){
        btn.onclick = async function(e){
          e.stopPropagation();
          var id=e.target.dataset.id;
          if(!confirm('Excluir esta movimentação?')) return;
          MM.state.movements = MM.state.movements.filter(function(item){ return item.id !== id; });
          if(MM.state.expandedMovementId === id) MM.state.expandedMovementId = null;
          try {
            await MM.storage.syncFromState();
            renderRows();
            MM.ui.renderTopbar();
          } catch (err) {
            MM.ui.showFeedback('movements-feedback', err.message || 'Erro ao excluir movimentação.', 'error');
          }
        };
      });

      document.querySelectorAll('.settle-movement-btn').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          settleMovement(e.target.dataset.id, 'detail').catch(function(err){ MM.ui.showFeedback('movements-feedback', err.message || 'Erro ao sincronizar movimentação.', 'error'); });
        };
      });
    }

    function renderRows(){
      var filters = {
        type: document.getElementById('filter-type').value,
        belongsTo: document.getElementById('filter-belongs').value,
        status: document.getElementById('filter-status').value,
        text: document.getElementById('filter-text').value
      };
      MM.state.movementFilters = filters;
      var list = MM.services.filterMovements(filters);
      var root = document.getElementById('movements-list');

      if(MM.state.expandedMovementId && !list.some(function(item){ return item.id === MM.state.expandedMovementId; })){
        MM.state.expandedMovementId = null;
      }

      root.innerHTML = list.length ? list.map(function(m){
        var status = MM.services.calculateStatus(m);
        var isOpen = MM.state.expandedMovementId === m.id;
        return `
          <article class="movement-card ${isOpen ? 'open' : ''}">
            <div class="movement-card-head">
              <button class="movement-card-toggle" data-id="${m.id}" type="button" aria-expanded="${isOpen ? 'true' : 'false'}">
                <div class="movement-card-main">
                  <div class="movement-card-copy">
                    <strong class="movement-card-title">${m.description}</strong>
                    <span class="movement-card-meta">${MM.helpers.userName(m.belongsTo)}</span>
                  </div>
                  <div class="movement-card-side">
                    <strong class="movement-card-value">${MM.helpers.formatCurrency(m.amount)}</strong>
                    ${renderStatusSlot(m, status)}
                  </div>
                </div>
              </button>
              <div class="movement-head-actions">
                ${renderQuickAction(m, status)}
                <button class="movement-chevron movement-chevron-btn ${isOpen ? 'open' : ''}" data-id="${m.id}" type="button" aria-label="${isOpen ? 'Fechar detalhes' : 'Abrir detalhes'}">
                  <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"></path></svg>
                </button>
              </div>
            </div>
            ${isOpen ? `<div class="movement-card-body">${movementDetails(m, status)}</div>` : ''}
          </article>
        `;
      }).join('') : '<div class="panel section muted">Nenhuma movimentação encontrada.</div>';

      bindActionButtons();
    }

    document.getElementById('apply-filters-btn').onclick = renderRows;
    document.getElementById('clear-filters-btn').onclick = function(){
      MM.state.movementFilters = { type:'todos', belongsTo:'todos', status:'todos', text:'' };
      MM.state.expandedMovementId = null;
      MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
    };

    renderRows();
  }
};
