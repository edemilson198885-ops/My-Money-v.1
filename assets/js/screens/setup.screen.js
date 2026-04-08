window.MM = window.MM || {};

MM.setupScreen = (function(){
  var tempUsers = [];
  var mode = 'login'; // login | register

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

  function switchMode(nextMode) {
    mode = nextMode === 'register' ? 'register' : 'login';
    render();
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
      }, 250);
    } catch (err) {
      MM.ui.showFeedback('setup-feedback', err.message || 'Erro ao entrar.', 'error');
    }
  }

  async function handleResetPassword() {
    try {
      var email = document.getElementById('setup-email').value.trim();
      await MM.auth.resetPassword(email);
      MM.ui.showFeedback('setup-feedback', 'Enviamos o e-mail de redefinição de senha.', 'info');
    } catch (err) {
      MM.ui.showFeedback('setup-feedback', err.message || 'Erro ao enviar recuperação de senha.', 'error');
    }
  }

  async function handleRegister() {
    try {
      var email = document.getElementById('setup-email').value.trim();
      var password = document.getElementById('setup-password').value;
      var householdName = document.getElementById('setup-household-name').value;

      MM.services.validateHouseholdConfig({ householdName: householdName, users: tempUsers });
      await MM.auth.signUpWithPassword(email, password);
      await MM.auth.signInWithPassword(email, password);
      await MM.storage.bootstrapInitialData(householdName, tempUsers);

      var data = await MM.storage.loadAppData({ silent: true });
      if (data.config && data.config.household) {
        MM.state.household = data.config.household;
        MM.state.users = data.config.users || [];
        MM.state.movements = data.movements || [];
        MM.state.templates = data.templates || [];
        MM.state.currentScreen = MM.config.SCREENS.DASHBOARD;
      }

      MM.ui.showFeedback('setup-feedback', 'Conta criada com sucesso.', 'info');
      MM.app.render();
    } catch (err) {
      MM.ui.showFeedback('setup-feedback', err.message || 'Erro ao criar conta.', 'error');
    }
  }

  function renderLogin() {
    MM.ui.setHTML('screen-container', `
      <section style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 0">
        <div class="panel section" style="width:min(560px,100%);margin:0 auto">
          <h2 style="margin-top:0">Acessar sistema</h2>
          <div class="field">
            <label>Seu e-mail</label>
            <input id="setup-email" type="email" placeholder="seuemail@exemplo.com" />
          </div>
          <div class="field">
            <label>Sua senha</label>
            <input id="setup-password" type="password" placeholder="Digite sua senha" />
          </div>
          <div class="actions-inline">
            <button class="btn primary" id="login-btn" type="button">Entrar</button>
            <button class="btn secondary" id="goto-register-btn" type="button">Criar acesso</button>
            <button class="btn secondary" id="reset-password-btn" type="button">Esqueci minha senha</button>
          </div>
          <div class="feedback" id="setup-feedback">Entre com seu e-mail e senha.</div>
        </div>
      </section>
    `);

    document.getElementById('login-btn').onclick = handleLogin;
    document.getElementById('goto-register-btn').onclick = function(){ switchMode('register'); };
    document.getElementById('reset-password-btn').onclick = handleResetPassword;
  }

  function renderRegister() {
    if (tempUsers.length === 0) addUser('');

    MM.ui.setHTML('screen-container', `
      <section style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 0">
        <div class="panel section" style="width:min(760px,100%);margin:0 auto">
          <h2 style="margin-top:0">Criar acesso</h2>
          <div class="field">
            <label>Seu e-mail</label>
            <input id="setup-email" type="email" placeholder="seuemail@exemplo.com" />
          </div>
          <div class="field">
            <label>Sua senha</label>
            <input id="setup-password" type="password" placeholder="Crie uma senha" />
          </div>
          <div class="field">
            <label>Nome da residência</label>
            <input id="setup-household-name" placeholder="Ex.: Casa da família" />
          </div>
          <div class="field">
            <div class="row">
              <label>Usuários</label>
              <button class="btn secondary" id="add-setup-user-btn" type="button">+ Adicionar usuário</button>
            </div>
            <div id="setup-users-list"></div>
          </div>
          <div class="actions-inline">
            <button class="btn primary" id="save-setup-btn" type="button">Criar conta e iniciar sistema</button>
            <button class="btn secondary" id="goto-login-btn" type="button">Voltar para entrar</button>
          </div>
          <div class="feedback" id="setup-feedback">Cadastre e-mail, senha, residência e usuários para começar.</div>
        </div>
      </section>
    `);

    renderUsers();
    document.getElementById('add-setup-user-btn').onclick = function(){ addUser(''); };
    document.getElementById('save-setup-btn').onclick = handleRegister;
    document.getElementById('goto-login-btn').onclick = function(){ switchMode('login'); };
  }

  async function render() {
    var session = await MM.auth.getSession();
    var hasHousehold = !!MM.state.household;

    if (session && hasHousehold) {
      MM.app.render();
      return;
    }

    if (session && !hasHousehold) {
      mode = 'register';
    }

    if (mode === 'register') renderRegister();
    else renderLogin();
  }

  function resetTemp() {
    tempUsers = [];
    mode = 'login';
  }

  return {
    render: render,
    resetTemp: resetTemp,
    switchMode: switchMode
  };
})();
