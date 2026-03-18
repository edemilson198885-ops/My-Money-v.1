window.MM = window.MM || {};
MM.storage = {
  loadAppData: function(){
    var k = MM.config.STORAGE_KEYS;
    return { config: JSON.parse(localStorage.getItem(k.config) || 'null'), movements: JSON.parse(localStorage.getItem(k.movements) || '[]'), templates: JSON.parse(localStorage.getItem(k.templates) || '[]'), ui: JSON.parse(localStorage.getItem(k.ui) || 'null') };
  },
  syncFromState: function(){
    var k = MM.config.STORAGE_KEYS;
    localStorage.setItem(k.config, JSON.stringify({ household: MM.state.household, users: MM.state.users }));
    localStorage.setItem(k.movements, JSON.stringify(MM.state.movements));
    localStorage.setItem(k.templates, JSON.stringify(MM.state.templates));
    MM.state.ui.lastSavedAt = new Date().toISOString();
    localStorage.setItem(k.ui, JSON.stringify(MM.state.ui));
  },
  exportBackup: function(){
    var payload = { app:'My Money', version:'core-local-test-v4.2', exportedAt:new Date().toISOString(), config:{ household:MM.state.household, users:MM.state.users }, movements:MM.state.movements, templates:MM.state.templates, ui:MM.state.ui };
    var blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'my-money-backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  },
  importBackupFile: function(file, onDone, onError){
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var data = JSON.parse(reader.result);
        if(!data || !data.config || !data.config.household || !Array.isArray(data.config.users) || !Array.isArray(data.movements) || !Array.isArray(data.templates)){
          throw new Error('Arquivo de backup inválido.');
        }
        MM.state.household = data.config.household;
        MM.state.users = data.config.users;
        MM.state.movements = data.movements;
        MM.state.templates = data.templates;
        MM.state.ui = data.ui || MM.state.ui;
        MM.state.currentScreen = MM.config.SCREENS.DASHBOARD;
        MM.storage.syncFromState();
        if(onDone) onDone();
      }catch(err){
        if(onError) onError(err);
      }
    };
    reader.readAsText(file, 'utf-8');
  },
  resetLocalData: function(){ var k=MM.config.STORAGE_KEYS; Object.keys(k).forEach(function(key){ localStorage.removeItem(k[key]); }); }
};
