window.MM = window.MM || {};
MM.settingsScreen = {
  render: function(){
    var usersHtml = MM.state.users.map(function(user){
      return `
        <div class="user-row">
          <input class="settings-user-name" data-id="${user.id}" value="${user.name}" ${user.inactive ? 'disabled' : ''} />
          <span class="badge ${user.inactive ? 'inativo' : 'ativo'}">${user.inactive ? 'inativo' : 'ativo'}</span>
          <button class="btn secondary toggle-user-btn" data-id="${user.id}" type="button">${user.inactive ? 'Reativar' : 'Desativar'}</button>
        </div>
      `;
    }).join('');

    MM.ui.setHTML('screen-container', `
      <section class="panel section">
        <h2 style="margin-top:0">Configurações</h2>
        <div class="settings-grid">
          <div>
            <div class="panel section settings-section">
              <h3 style="margin-top:0">Usuários</h3>
              <div class="field">
                <label>Nome da residência</label>
                <input id="settings-household-name" value="${MM.state.household ? MM.state.household.name : ''}" />
              </div>
              <div id="settings-users-list">${usersHtml}</div>
              <div class="actions-inline" style="margin-top:12px">
                <button class="btn secondary" id="add-settings-user-btn" type="button">+ Adicionar usuário</button>
                <button class="btn primary" id="save-settings-btn" type="button">Salvar ajustes</button>
              </div>
            </div>
          </div>

          <div>
            <div class="panel section settings-section">
              <h3 style="margin-top:0">Backup</h3>
              <div class="actions-inline">
                <button class="btn secondary" id="export-backup-btn" type="button">Exportar backup</button>
                <button class="btn secondary" id="import-backup-btn" type="button">Importar backup</button>
                <input id="import-backup-file" type="file" accept=".json,application/json" class="hidden" />
              </div>
            </div>

            <div class="panel section settings-section">
              <h3 style="margin-top:0">Sistema</h3>
          <div class="field"><label>Usuário ativo</label><div class="active-user-field">👤 ${MM.helpers.activeUserName()}</div></div>
          <div class="row" style="margin-bottom:12px"><button class="btn secondary" id="settings-change-user-btn" type="button">Trocar usuário ativo</button></div>
              <div class="actions-inline">
                <button class="btn secondary" id="settings-refresh-btn" type="button">Baixar da nuvem</button>
                <button class="btn primary" id="settings-sync-btn" type="button">Sincronizar agora</button>
                <button class="btn danger" id="reset-local-btn" type="button">Sair desta conta</button>
              </div>
            </div>
          </div>
        </div>

        <div class="feedback" id="settings-feedback">Backup, usuários e ajustes do sistema.</div>
      </section>
    `);

    document.querySelectorAll('.toggle-user-btn').forEach(function(btn){
      btn.onclick = function(e){
        var id = e.target.dataset.id;
        MM.state.users = MM.state.users.map(function(u){
          if(u.id === id){ u.inactive = !u.inactive; }
          return u;
        });
        MM.settingsScreen.render();
      };
    });

    document.getElementById('add-settings-user-btn').onclick = function(){
      if(MM.state.users.length >= MM.config.MAX_USERS){
        MM.ui.showFeedback('settings-feedback', 'Máximo de ' + MM.config.MAX_USERS + ' usuários.', 'error');
        return;
      }
      MM.state.users.push(MM.models.createUser({ householdId: MM.state.household.id, name: 'Novo usuário' }));
      MM.settingsScreen.render();
    };

    document.getElementById('save-settings-btn').onclick = async function(){
      try{
        var newHouseName = document.getElementById('settings-household-name').value.trim();
        var updatedUsers = MM.state.users.map(function(u){
          var input = document.querySelector('.settings-user-name[data-id="' + u.id + '"]');
          return Object.assign({}, u, { name: input ? input.value.trim() : u.name });
        });

        MM.services.validateUsersForSettings(updatedUsers);
        MM.state.household.name = newHouseName || MM.state.household.name;
        MM.state.users = updatedUsers;
        await MM.sync.syncNow();
        MM.app.render();
        MM.ui.showFeedback('settings-feedback', 'Configurações salvas com sucesso.', 'info');
      }catch(err){
        MM.ui.showFeedback('settings-feedback', err.message || 'Erro ao salvar configurações.', 'error');
      }
    };

    document.getElementById('settings-sync-btn').onclick = async function(){
      try{
        await MM.sync.syncNow();
        MM.app.render();
        MM.ui.showFeedback('settings-feedback', 'Dados enviados para a nuvem.', 'info');
      }catch(err){
        MM.ui.showFeedback('settings-feedback', err.message || 'Erro ao sincronizar.', 'error');
      }
    };

    document.getElementById('settings-refresh-btn').onclick = async function(){
      try{
        await MM.sync.refreshFromCloud();
        MM.app.render();
        MM.ui.showFeedback('settings-feedback', 'Dados baixados da nuvem.', 'info');
      }catch(err){
        MM.ui.showFeedback('settings-feedback', err.message || 'Erro ao atualizar da nuvem.', 'error');
      }
    };

    document.getElementById('export-backup-btn').onclick = function(){
      MM.storage.exportBackup();
      MM.ui.showFeedback('settings-feedback', 'Backup exportado com sucesso.', 'info');
    };

    document.getElementById('import-backup-btn').onclick = function(){
      document.getElementById('import-backup-file').click();
    };

    document.getElementById('import-backup-file').onchange = function(e){
      var file = e.target.files && e.target.files[0];
      if(!file) return;
      if(!confirm('Importar backup vai substituir os dados atuais. Deseja continuar?')){
        e.target.value = '';
        return;
      }
      MM.storage.importBackupFile(file, function(){
        MM.app.render();
        MM.ui.showFeedback('settings-feedback', 'Backup importado com sucesso.', 'info');
      }, function(err){
        MM.ui.showFeedback('settings-feedback', err.message || 'Erro ao importar backup.', 'error');
      });
      e.target.value = '';
    };

    var changeBtn = document.getElementById('settings-change-user-btn');
    if(changeBtn) changeBtn.onclick = function(){ MM.ui.openActiveUserSelector(); };

    document.getElementById('reset-local-btn').onclick = async function(){
      if(!confirm('Tem certeza que deseja sair da conta neste dispositivo?')) return;
      try {
        await MM.auth.signOut();
      } catch (err) {
        console.error('Erro ao sair da conta:', err);
      }
      await MM.storage.resetLocalData();
      MM.stateApi.initialize();
      MM.setupScreen.resetTemp();
      MM.app.render();
    };
  }
};
