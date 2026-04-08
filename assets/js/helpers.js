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


MM.helpers.normalizeText = function(value){
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
};

MM.helpers.inferCategory = function(movement){
  var description = MM.helpers.normalizeText(movement && movement.description);
  var type = String(movement && movement.type || 'saida').trim();
  if(!description){
    return type === 'entrada' ? 'Receitas' : 'Outros';
  }

  if(type === 'entrada'){
    if(description.includes('vale')) return 'Vale';
    if(description.includes('aluguel')) return 'Renda extra';
    if(description.includes('pagamento')) return 'Salário';
    if(description.includes('bst') || description.includes('cobre') || description.includes('despesa')) return 'Extras';
    return 'Receitas';
  }

  if(description.includes('mercado') || description.includes('marmitex') || description.includes('almoco') || description.includes('almoço') || description.includes('pizza') || description.includes('janta') || description.includes('salgado') || description.includes('container')) return 'Alimentação';
  if(description.includes('luz') || description == 'agua' || description.includes('conta de agua') || description.includes('internet') || description.includes('netflix') || description.includes('vivo bradesco') || description.includes('credito celular') || description.includes('credito vivo') || description.includes('dr monitora')) return 'Utilidades';
  if(description.includes('gasolina') || description.includes('carro') || description.includes('sem parar')) return 'Transporte';
  if(description.includes('senai') || description.includes('faculdade') || description.includes('curso')) return 'Educação';
  if(description.includes('remedio') || description.includes('remédio') || description.includes('fisio') || description.includes('fisioterapia') || description.includes('farmacia')) return 'Saúde';
  if(description.includes('iptu') || description.includes('ipva') || description.includes('imposto')) return 'Impostos';
  if(description.includes('nubank') || description.includes('emprestimo') || description.includes('empréstimo') || description.includes('camila pagamento') || description.includes('camila vale') || description.includes('amor')) return 'Dívidas';
  if(description.includes('fralda') || description.includes('mesada') || description.includes('murilo') || description.includes('elizangela') || description.includes('fernanda')) return 'Família';
  if(description.includes('reserva emergencia') || description.includes('reserva emergência')) return 'Reserva';
  if(description.includes('lazer') || description.includes('shop') || description.includes('shoop') || description.includes('ferias') || description.includes('férias')) return 'Lazer';
  return 'Outros';
};


MM.helpers.getCategoryOptions = function(type){
  var normalizedType = String(type || 'saida').trim();
  if(normalizedType === 'entrada'){
    return ['Automática','Salário','Vale','Renda extra','Extras','Receitas'];
  }
  return ['Automática','Alimentação','Utilidades','Transporte','Educação','Saúde','Impostos','Dívidas','Família','Reserva','Lazer','Outros'];
};

MM.helpers.renderCategoryOptions = function(type, selected){
  var current = String(selected || '').trim();
  return MM.helpers.getCategoryOptions(type).map(function(name){
    var value = name === 'Automática' ? '' : name;
    var isSelected = current === value || (!current && value === '');
    return '<option value="' + value + '" ' + (isSelected ? 'selected' : '') + '>' + name + '</option>';
  }).join('');
};

MM.helpers.resolveCategory = function(movement){
  var current = String(movement && movement.category || '').trim();
  return current || MM.helpers.inferCategory(movement);
};
