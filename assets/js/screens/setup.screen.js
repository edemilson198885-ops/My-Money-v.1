window.MM = window.MM || {};
MM.setupScreen = (function(){
  var tempUsers = [];
  function renderUsers(){
    var list = document.getElementById('setup-users-list'); if(!list) return;
    list.innerHTML = tempUsers.map(function(user, index){
      return `<div class="user-row"><input class="setup-user-input" data-index="${index}" value="${user.name}" placeholder="Nome do usuário ${index + 1}" /><button class="btn secondary remove-setup-user" data-index="${index}" type="button">Remover</button></div>`;
    }).join('');
    document.querySelectorAll('.setup-user-input').forEach(function(input){ input.oninput = function(e){ var idx = Number(e.target.dataset.index); if(tempUsers[idx]) tempUsers[idx].name = e.target.value; }; });
    document.querySelectorAll('.remove-setup-user').forEach(function(btn){ btn.onclick = function(e){ tempUsers.splice(Number(e.target.dataset.index), 1); renderUsers(); }; });
  }
  function addUser(name){ if(tempUsers.length >= MM.config.MAX_USERS){ MM.ui.showFeedback('setup-feedback','Máximo de ' + MM.config.MAX_USERS + ' usuários.','error'); return; } tempUsers.push({ name:name||'' }); renderUsers(); }
  function handleSubmit(){
    try{
      var householdName = document.getElementById('setup-household-name').value;
      MM.services.validateHouseholdConfig({ householdName: householdName, users: tempUsers });
      var household = MM.models.createHousehold({ name: householdName });
      var users = tempUsers.map(function(u){ return MM.models.createUser({ householdId: household.id, name: u.name }); });
      MM.stateApi.set({ household: household, users: users, movements: [], templates: [], currentScreen: MM.config.SCREENS.DASHBOARD });
      MM.storage.syncFromState();
      MM.app.render();
    }catch(err){ MM.ui.showFeedback('setup-feedback', err.message || 'Erro ao salvar configuração.', 'error'); }
  }
  function render(){
    MM.ui.setHTML('screen-container', `
      <section style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 0">
        <div class="panel section" style="width:min(760px,100%);margin:0 auto">
          <h2 style="margin-top:0">Primeiros passos</h2>
          <div class="field"><label>Nome da residência</label><input id="setup-household-name" placeholder="Ex.: Casa da família" /></div>
          <div class="field">
            <div class="row"><label>Usuários</label><button class="btn secondary" id="add-setup-user-btn" type="button">+ Adicionar usuário</button></div>
            <div id="setup-users-list"></div>
          </div>
          <button class="btn primary" id="save-setup-btn" type="button">Iniciar sistema</button>
          <div class="feedback" id="setup-feedback">Cadastre pelo menos 1 usuário.</div>
        </div>
      </section>
    `);
    if(tempUsers.length === 0) addUser('');
    renderUsers();
    document.getElementById('add-setup-user-btn').onclick = function(){ addUser(''); };
    document.getElementById('save-setup-btn').onclick = handleSubmit;
  }
  function resetTemp(){ tempUsers = []; }
  return { render: render, resetTemp: resetTemp };
})();
