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
  daysInMonth: function(year, month){ return new Date(year, month, 0).getDate(); },
  activeUser: function(){ return MM.state.users.find(function(u){ return u.id === MM.state.activeUserId && !u.inactive; }) || null; },
  activeUserName: function(){ var u = this.activeUser(); return u ? u.name : 'Não selecionado'; },
  normalizeText: function(value){
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  },

  incomeCategoryOptions: function(){
    return ['auto','Salário','Vale','Aluguel','Reembolso','Extras','Outras entradas'];
  },
  expenseCategoryOptions: function(){
    return ['auto','Moradia','Alimentação','Transporte','Utilidades','Lazer','Educação','Saúde','Dívidas','Família','Reserva','Outros'];
  },
  categoryLabel: function(value, type){
    if(value === 'auto') return type === 'entrada' ? 'Automática (pela descrição da entrada)' : 'Automática (pela descrição da saída)';
    return value;
  },
  renderCategoryOptions: function(type, selected){
    var list = type === 'entrada' ? this.incomeCategoryOptions() : this.expenseCategoryOptions();
    var current = selected && String(selected).trim() ? String(selected).trim() : 'auto';
    return list.map(function(item){
      var label = MM.helpers.categoryLabel(item, type);
      return '<option value="' + item + '" ' + (item === current ? 'selected' : '') + '>' + label + '</option>';
    }).join('');
  },
  inferIncomeSource: function(description){
    var text = this.normalizeText(description);
    if(!text) return 'Outras entradas';
    if(text.includes('vale')) return 'Vale';
    if(text.includes('salario') || text.includes('pagamento') || text.includes('pagto')) return 'Salário';
    if(text.includes('aluguel')) return 'Aluguel';
    if(text.includes('despesa')) return 'Reembolso';
    return 'Extras';
  },
  autoCategory: function(description, type){
    if(type === 'entrada') return this.inferIncomeSource(description);
    var text = this.normalizeText(description);
    if(!text) return 'Outros';

    if(text.includes('mercado') || text.includes('marmit') || text.includes('almoco') || text.includes('almoço') || text.includes('pizza') || text.includes('janta') || text.includes('salgado')) return 'Alimentação';
    if(text.includes('luz') || text.includes('agua') || text.includes('água') || text.includes('internet') || text.includes('netflix') || text.includes('vivo') || text.includes('celular') || text.includes('gas')) return 'Utilidades';
    if(text.includes('gasolina') || text.includes('carro') || text.includes('sem parar') || text.includes('ipva') || text.includes('licenciamento')) return 'Transporte';
    if(text.includes('faculdade') || text.includes('senai') || text.includes('curso') || text.includes('material')) return 'Educação';
    if(text.includes('remedio') || text.includes('remédio') || text.includes('fisio') || text.includes('fisioterapia') || text.includes('farmacia') || text.includes('farmácia') || text.includes('dentista')) return 'Saúde';
    if(text.includes('nubank') || text.includes('emprest') || text.includes('cartao') || text.includes('cartão') || text.includes('parcela') || text.includes('bradesco')) return 'Dívidas';
    if(text.includes('iptu') || text.includes('imposto') || text.includes('seguro')) return 'Moradia';
    if(text.includes('fralda') || text.includes('murilo') || text.includes('mesada') || text.includes('elizangela') || text.includes('camila') || text.includes('amor') || text.includes('fernanda')) return 'Família';
    if(text.includes('reserva') || text.includes('invest')) return 'Reserva';
    if(text.includes('lazer') || text.includes('shoop') || text.includes('shopping') || text.includes('ferias') || text.includes('férias') || text.includes('viagem')) return 'Lazer';

    return 'Outros';
  },
  getCategoryMeta: function(category){
    var map = {
      'Moradia': { icon:'🏠', color:'#2d9cdb', limit:1500 },
      'Alimentação': { icon:'🍔', color:'#67d93d', limit:800 },
      'Transporte': { icon:'🚗', color:'#f5c423', limit:500 },
      'Utilidades': { icon:'💡', color:'#ff4b38', limit:300 },
      'Lazer': { icon:'🎉', color:'#e243a3', limit:250 },
      'Educação': { icon:'📚', color:'#5bb4e6', limit:250 },
      'Saúde': { icon:'💊', color:'#f59e0b', limit:250 },
      'Dívidas': { icon:'💳', color:'#7c5cff', limit:600 },
      'Família': { icon:'👨‍👩‍👦', color:'#ec4899', limit:700 },
      'Reserva': { icon:'🛟', color:'#14b8a6', limit:300 },
      'Outros': { icon:'📦', color:'#64748b', limit:300 },
      'Salário': { icon:'💼', color:'#22c55e', limit:0 },
      'Vale': { icon:'🧾', color:'#0ea5e9', limit:0 },
      'Aluguel': { icon:'🏘️', color:'#8b5cf6', limit:0 },
      'Reembolso': { icon:'🔁', color:'#f97316', limit:0 },
      'Extras': { icon:'✨', color:'#10b981', limit:0 },
      'Outras entradas': { icon:'➕', color:'#22c55e', limit:0 }
    };
    return map[category] || { icon:'📦', color:'#64748b', limit:0 };
  }
};
