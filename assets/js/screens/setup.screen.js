window.MM = window.MM || {};

MM.setupScreen = (function(){
  var tempUsers = [];

  function renderUsers() {
    var list = document.getElementById('setup-users-list');
    if (!list) return;

    list.innerHTML = tempUsers.map(function(user, index){
      return `
        <div class="user-row">
          <input class="setup-user-input" data-index="${index}" value="${user.name}" placeholder="Nome do usuário ${index + 1}" />
          <button class="btn secondary remove-setup-user" data-index="${index}" type="button">Remover</button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.setup-user-input').forEach(function(input){
      input.oninput = function(e){
        var idx = Number(e.target.dataset.index);
        if (tempUsers[idx]) tempUsers[idx].name = e.target.value;
      };
    });

    document.querySelectorAll('.remove-setup-user').forEach(function(btn){
      btn.onclick = function(e){
        tempUsers.splice(Number(e.target.dataset.index), 1);
        renderUsers();
      };
    });
  }

  function addUser(name) {
    if (tempUsers.length >= MM.config.MAX_USERS) {
      MM.ui.showFeedback('setup-feedback', 'Máximo de ' + MM.config.MAX_USERS + ' usuários.', 'error');
      return;
    }
    tempUsers.push({ name: name || '' });
    renderUsers();
  }

  async function handleLogin() {
    try {
      var email = document.getElementById('setup-email').value.trim();
      var password = document.getElementById('setup-password').value;

      await MM.auth.signInWithPassword(email, password);
      MM.ui.showFeedback('setup-feedback', 'Login realizado com sucesso.', 'info');

      setTimeout(async function() {
        await MM.app.hydrate();
        MM.app.render();
      }, 300);
    } catch (err) {
      MM.ui.showFeedback('setup-feedback', err.message || 'Erro ao entrar.', 'error');
    }
  }

  async function handleSubmit() {
    try {
      var householdName = document.getElementById('setup-household-name').value;
      MM.services.validateHouseholdConfig({ householdName: householdName, users: tempUsers });

      await MM.storage.bootstrapInitialData(householdName, tempUsers);

      var data = await MM.storage.loadAppData();

      if (data.config && data.config.household) {
        MM.state.household = data.config.household;
        MM.state.users = data.config.users || [];
        MM.state.movements = data.movements || [];
        MM.state.templates = data.templates || [];
        MM.state.currentScreen = MM.config.SCREENS.DASHBOARD;
      }

      MM.app.render();
      MM.ui.showFeedback('setup-feedback', 'Configuração inicial concluída com sucesso.', 'info');
    } catch (err) {
      MM.ui.showFeedback('setup-feedback', err.message || 'Erro ao criar residência.', 'error');
    }
  }

  async function render() {
    var session = await MM.auth.getSession();
    var isLogged = !!session;

    MM.ui.setHTML('screen-container', `
      <section style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 0">
        <div class="panel section" style="width:min(760px,100%);margin:0 auto">
          <h2 style="margin-top:0">Primeiros passos</h2>

          ${!isLogged ? `
            <div class="field">
              <label>Seu e-mail</label>
              <input id="setup-email" type="email" placeholder="seuemail@exemplo.com" />
            </div>

            <div class="field">
              <label>Sua senha</label>
              <input id="setup-password" type="password" placeholder="Digite sua senha" />
            </div>

            <button class="btn primary" id="login-btn" type="button">Entrar</button>
            <div style="height:16px"></div>
          ` : `
            <div class="feedback" style="display:block;background:#eef8ff;color:#145ea8;border:1px solid #c8e4ff;">
              Você já está autenticado. Agora crie sua residência.
            </div>
          `}

          <div class="field">
            <label>Nome da residência</label>
            <input id="setup-household-name" placeholder="Ex.: Casa da família" ${!isLogged ? 'disabled' : ''} />
          </div>

          <div class="field">
            <div class="row">
              <label>Usuários</label>
              <button class="btn secondary" id="add-setup-user-btn" type="button" ${!isLogged ? 'disabled' : ''}>+ Adicionar usuário</button>
            </div>
            <div id="setup-users-list"></div>
          </div>

          <button class="btn primary" id="save-setup-btn" type="button" ${!isLogged ? 'disabled' : ''}>Iniciar sistema</button>
          <div class="feedback" id="setup-feedback">${!isLogged ? 'Entre com e-mail e senha para começar.' : 'Pronto para configurar sua residência.'}</div>
        </div>
      </section>
    `);

    if (tempUsers.length === 0) addUser('');

    renderUsers();

    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = handleLogin;

    var addBtn = document.getElementById('add-setup-user-btn');
    if (addBtn) addBtn.onclick = function(){ addUser(''); };

    var saveBtn = document.getElementById('save-setup-btn');
    if (saveBtn) saveBtn.onclick = handleSubmit;
  }

  function resetTemp() {
    tempUsers = [];
  }

  return {
    render: render,
    resetTemp: resetTemp
  };
})();
