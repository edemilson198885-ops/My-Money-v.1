window.MM = window.MM || {};
MM.state = {
  household:null,
  users:[],
  movements:[],
  templates:[],
  currentScreen:MM.config.SCREENS.SETUP,
  currentMonth:MM.helpers.currentMonth(),
  currentView:'general',
  ui:{
    lastSavedAt:null,
    syncStatus:'offline',
    syncMessage:'Offline',
    lastCloudSyncAt:null,
    overdueAlertDismissed:false
  },
  activeUserId:null,
  editingMovementId:null,
  movementFilters:{ type:'todos', belongsTo:'todos', status:'todos', text:'', scope:'active' }
};
MM.stateApi = {
  initialize: function(){
    MM.state.household=null;
    MM.state.users=[];
    MM.state.movements=[];
    MM.state.templates=[];
    MM.state.currentScreen=MM.config.SCREENS.SETUP;
    MM.state.currentMonth=MM.helpers.currentMonth();
    MM.state.currentView='general';
    MM.state.ui={ lastSavedAt:null, syncStatus:(navigator.onLine ? 'online' : 'offline'), syncMessage:(navigator.onLine ? 'Online' : 'Offline'), lastCloudSyncAt:null, overdueAlertDismissed:false };
    MM.state.activeUserId = null;
    MM.state.editingMovementId=null;
    MM.state.movementFilters={ type:'todos', belongsTo:'todos', status:'todos', text:'', scope:'active' };
  },
  set: function(patch){ Object.assign(MM.state, patch); }
};
