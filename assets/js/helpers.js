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

  ,slugifyText: function(value){ return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim(); },
  autoDetectExitCategory: function(description, currentCategory){
    var existing = String(currentCategory || '').trim();
    if(existing) return existing;
    var text = this.slugifyText(description);
    if(!text) return 'Outros';
    if(text.includes('mercado') || text.includes('marmitex') || text.includes('almoco') || text.includes('janta') || text.includes('pizza') || text.includes('salgado')) return 'Alimentação';
    if(text.includes('agua') || text.includes('luz') || text.includes('internet') || text.includes('netflix') || text.includes('container') || text.includes('credito celular') || text.includes('credito vivo') || text.includes('vivo bradesco')) return 'Utilidades';
    if(text.includes('gasolina') || text.includes('carro') || text.includes('sem parar') || text.includes('uber') || text.includes('combust')) return 'Transporte';
    if(text.includes('faculdade') || text.includes('senai') || text.includes('curso')) return 'Educação';
    if(text.includes('remedio') || text.includes('fisio') || text.includes('fisioterapia') || text.includes('farmacia')) return 'Saúde';
    if(text.includes('nubank') || text.includes('emprestimo') || text.includes('pagamento') && text.includes('camila') || text.includes('vale') && text.includes('camila') || text.includes('cartao')) return 'Dívidas';
    if(text.includes('iptu') || text.includes('ipva') || text.includes('imposto') || text.includes('licenciamento')) return 'Moradia';
    if(text.includes('fralda') || text.includes('murilo') || text.includes('elizangela') || text.includes('amor') || text.includes('fernanda')) return 'Família';
    if(text.includes('reserva')) return 'Reserva';
    return 'Outros';
  },
  autoDetectIncomeSource: function(description, currentCategory){
    var existing = String(currentCategory || '').trim();
    if(existing) return existing;
    var text = this.slugifyText(description);
    if(!text) return 'Outras entradas';
    if(text.includes('vale')) return 'Vale';
    if(text.includes('salario') || text.includes('pagamento') || text.includes('pagamento marco')) return 'Salário';
    if(text.includes('aluguel')) return 'Aluguel';
    if(text.includes('reembolso') || text.includes('despesa')) return 'Reembolso';
    if(text.includes('bonus') || text.includes('extra') || text.includes('cobre') || text.includes('bst') || text.includes('telesites') || text.includes('amor')) return 'Extras';
    return 'Outras entradas';
  },
  getMovementCategoryLabel: function(m){
    if(!m) return '-';
    if(m.type === 'entrada') return this.autoDetectIncomeSource(m.description, m.category);
    return this.autoDetectExitCategory(m.description, m.category);
  },
  getBudgetColor: function(index){
    var palette = ['#1da1f2','#69dc43','#ffc928','#ff4d3d','#e544a7','#57c7ff','#7f63ff','#18b7a0','#64748b'];
    return palette[index % palette.length];
  }

};
