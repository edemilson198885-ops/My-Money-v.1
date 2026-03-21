window.MM = window.MM || {};
MM.helpers = {
  generateId: function(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2); },
  nowIso: function(){ return new Date().toISOString(); },
  currentMonth: function(){ return new Date().toISOString().slice(0,7); },
  nextMonth: function(month){ var p = month.split('-'); var y = Number(p[0]), m = Number(p[1]); var d = new Date(y, m, 1); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); },
  previousMonth: function(month){ var p = month.split('-'); var y = Number(p[0]), m = Number(p[1]); var d = new Date(y, m - 2, 1); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); },
  formatMonthLabel: function(month){
    if(!month) return '-';
    var parts = month.split('-');
    var year = parts[0];
    var m = parts[1];
    var nomes = {'01':'jan','02':'fev','03':'mar','04':'abr','05':'mai','06':'jun','07':'jul','08':'ago','09':'set','10':'out','11':'nov','12':'dez'};
    return (nomes[m] || m) + '/' + year;
  },
  formatCurrency: function(value){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value || 0); },
  parseCurrency: function(input){ var normalized = String(input).replace(/\./g,'').replace(',', '.').replace(/[^0-9.-]/g,''); var num = Number(normalized); return Number.isFinite(num) ? Math.round(num*100)/100 : NaN; },
  formatDate: function(iso){ if(!iso) return '-'; var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; },
  allExitCategories: function(){ var groups = MM.config.EXIT_CATEGORIES; return Object.keys(groups).reduce(function(acc,key){ return acc.concat(groups[key]); }, []); },
  userName: function(id){ if(id === 'shared') return 'Compartilhado'; var user = MM.state.users.find(function(u){ return u.id === id; }); return user ? user.name : '-'; },
  daysInMonth: function(year, month){ return new Date(year, month, 0).getDate(); }
  ,activeUser: function(){ return MM.state.users.find(function(u){ return u.id === MM.state.activeUserId && !u.inactive; }) || null; },
  activeUserName: function(){ var u = this.activeUser(); return u ? u.name : 'Não selecionado'; }

};
