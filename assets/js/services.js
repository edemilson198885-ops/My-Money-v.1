window.MM = window.MM || {};
MM.services = {
  validateHouseholdConfig: function(input){
    var name = String(input.householdName||'').trim(), users = Array.isArray(input.users)?input.users:[];
    if(!name) throw new Error('Informe o nome da residência.');
    if(users.length < 1) throw new Error('Cadastre pelo menos 1 usuário.');
    if(users.length > MM.config.MAX_USERS) throw new Error('Máximo de ' + MM.config.MAX_USERS + ' usuários.');
    var names = users.map(function(u){ return String(u.name||'').trim().toLowerCase(); });
    if(names.some(function(n){ return !n; })) throw new Error('Preencha o nome de todos os usuários.');
    if(new Set(names).size !== names.length) throw new Error('Não repita nomes de usuários.');
    return true;
  },
  validateMovement: function(m){
    if(!String(m.description||'').trim()) throw new Error('Descrição obrigatória.');
    if(!(m.amount > 0)) throw new Error('Valor inválido.');
    if(!m.competence) throw new Error('Competência obrigatória.');
    if(!m.dueDate) throw new Error('Data obrigatória.');
    if(m.type === 'entrada' && m.belongsTo === 'shared') throw new Error('Entrada não pode ser compartilhada.');
    return true;
  },
  validateUsersForSettings: function(users){
    if(users.length < 1) throw new Error('Mantenha pelo menos 1 usuário.');
    if(users.length > MM.config.MAX_USERS) throw new Error('Máximo de ' + MM.config.MAX_USERS + ' usuários.');
    var active = users.filter(function(u){ return !u.inactive; });
    if(active.length < 1) throw new Error('Mantenha pelo menos 1 usuário ativo.');
    var names = active.map(function(u){ return String(u.name||'').trim().toLowerCase(); });
    if(names.some(function(n){ return !n; })) throw new Error('Preencha o nome de todos os usuários ativos.');
    if(new Set(names).size !== names.length) throw new Error('Não repita nomes de usuários ativos.');
  },
  getUserOptions: function(includeShared){
    var users = MM.state.users.filter(function(u){ return !u.inactive; }).map(function(u){ return { value:u.id, label:u.name }; });
    if(includeShared) users.unshift({ value:'shared', label:'Compartilhado' });
    return users;
  },
  getActiveUser: function(){
    return MM.state.users.find(function(u){ return u.id === MM.state.activeUserId && !u.inactive; }) || null;
  },
  setActiveUser: function(userId){
    var user = MM.state.users.find(function(u){ return u.id === userId && !u.inactive; });
    if(!user) return false;
    MM.state.activeUserId = user.id;
    try { localStorage.setItem('mm_active_user_id', user.id); } catch(e) {}
    return true;
  },
  clearActiveUser: function(){
    MM.state.activeUserId = null;
    try { localStorage.removeItem('mm_active_user_id'); } catch(e) {}
  },
  loadActiveUser: function(){
    var activeUsers = MM.state.users.filter(function(u){ return !u.inactive; });
    var saved = '';
    try { saved = localStorage.getItem('mm_active_user_id') || ''; } catch(e) {}
    if(saved && this.setActiveUser(saved)) return this.getActiveUser();
    if(activeUsers.length === 1){
      this.setActiveUser(activeUsers[0].id);
      return this.getActiveUser();
    }
    this.clearActiveUser();
    return null;
  },
  ensureActiveUser: function(){
    var active = this.getActiveUser();
    if(active) return active;
    return this.loadActiveUser();
  },
  normalizeMovementCategory: function(m){
    if(!m) return m;
    var current = String(m.category || '').trim();
    if(!current) m.category = MM.helpers.autoCategory(m.description, m.type);
    return m;
  },
  calculateStatus: function(m){
    var today = new Date().toISOString().slice(0,10);
    if(m.type === 'entrada'){
      if(m.settledDate) return 'recebido';
      return m.dueDate <= today ? 'recebido' : 'previsto';
    }
    if(m.settledDate) return 'pago';
    if(m.dueDate < today) return 'atrasado';
    var diffDays = Math.ceil((new Date(m.dueDate) - new Date(today + 'T00:00:00')) / 86400000);
    if(diffDays >= 0 && diffDays <= 7) return 'vencer';
    return 'aberto';
  },
  getMonthMovements: function(){
    MM.state.movements.forEach(this.normalizeMovementCategory);
    return MM.state.movements.filter(function(m){ return m.competence === MM.state.currentMonth; });
  },
  getMovementCashDate: function(m){
    if(!m) return '';
    if(m.type === 'saida') return m.settledDate || '';
    if(m.settledDate) return m.settledDate;
    if(m.dueDate && m.dueDate <= new Date().toISOString().slice(0,10)) return m.dueDate;
    return '';
  },
  getMovementCashMonth: function(m){
    var d = this.getMovementCashDate(m);
    return d ? d.slice(0,7) : '';
  },
  isMovementRealizedInMonth: function(m, month){
    return this.getMovementCashMonth(m) === month;
  },
  getCashMovementsForMonth: function(month){
    MM.state.movements.forEach(this.normalizeMovementCategory);
    return MM.state.movements.filter(function(m){
      return MM.services.isMovementRealizedInMonth(m, month);
    });
  },
  buildCategoryBreakdown: function(movements){
    var totals = {};
    movements.filter(function(m){ return m.type === 'saida' && Number(m.amount || 0) > 0; }).forEach(function(m){
      var key = String(m.category || '').trim() || MM.helpers.autoCategory(m.description, m.type);
      totals[key] = (totals[key] || 0) + Number(m.amount || 0);
    });
    var totalGeneral = Object.keys(totals).reduce(function(sum,key){ return sum + totals[key]; }, 0) || 1;
    return Object.keys(totals).map(function(name){
      var total = totals[name];
      var meta = MM.helpers.getCategoryMeta(name);
      var percent = Math.round((total / totalGeneral) * 100);
      var limit = Number(meta.limit || 0);
      return {
        name: name,
        total: total,
        percent: percent,
        color: meta.color,
        icon: meta.icon,
        limit: limit,
        limitPercent: limit ? Math.round((total / limit) * 100) : 0,
        exceeded: limit ? total > limit : false
      };
    }).sort(function(a,b){ return b.total - a.total; });
  },
  buildIncomeBreakdown: function(movements){
    var totals = {};
    movements.filter(function(m){ return m.type === 'entrada' && Number(m.amount || 0) > 0; }).forEach(function(m){
      var key = MM.helpers.inferIncomeSource(m.description);
      totals[key] = (totals[key] || 0) + Number(m.amount || 0);
    });
    var totalGeneral = Object.keys(totals).reduce(function(sum,key){ return sum + totals[key]; }, 0) || 1;
    return Object.keys(totals).map(function(name){
      var total = totals[name];
      var meta = MM.helpers.getCategoryMeta(name);
      return {
        name: name,
        total: total,
        percent: Math.round((total / totalGeneral) * 100),
        color: meta.color,
        icon: meta.icon
      };
    }).sort(function(a,b){ return b.total - a.total; });
  },
  getDashboardMetrics: function(){
    var month = MM.state.currentMonth;
    this.generateFixedForMonth(month);
    var activeUser = this.getActiveUser();
    var competenceEntries = this.getMonthMovements();
    var realizedEntries = this.getCashMovementsForMonth(month);
    if(activeUser){
      competenceEntries = competenceEntries.filter(function(m){ return m.belongsTo === activeUser.id; });
      realizedEntries = realizedEntries.filter(function(m){ return m.belongsTo === activeUser.id; });
    }

    var competenceIncomeEntries = competenceEntries.filter(function(m){ return m.type === 'entrada' && Number(m.amount||0) > 0; });
    var entradas = competenceIncomeEntries.reduce(function(sum,m){ return sum + Number(m.amount||0); }, 0);
    var saidas = realizedEntries.filter(function(m){ return m.type === 'saida'; }).reduce(function(sum,m){ return sum + Number(m.amount||0); }, 0);
    var overdue = competenceEntries.filter(function(m){ return m.type === 'saida' && MM.services.calculateStatus(m) === 'atrasado'; }).length;
    var dueSoon = competenceEntries.filter(function(m){ return m.type === 'saida' && MM.services.calculateStatus(m) === 'vencer'; }).length;
    var contasAPagar = competenceEntries.filter(function(m){
      return m.type === 'saida' && !m.settledDate && Number(m.amount || 0) > 0;
    }).reduce(function(sum, m){
      return sum + Number(m.amount || 0);
    }, 0);

    var saldoAnterior = MM.state.movements.reduce(function(sum, m){
      MM.services.normalizeMovementCategory(m);
      if(activeUser && m.belongsTo !== activeUser.id) return sum;
      var cashDate = MM.services.getMovementCashDate(m);
      if(!cashDate || cashDate.slice(0,7) >= month) return sum;
      return sum + (m.type === 'entrada' ? Number(m.amount||0) : -Number(m.amount||0));
    }, 0);

    var byCategory = this.buildCategoryBreakdown(realizedEntries);
    var byIncomeSource = this.buildIncomeBreakdown(competenceIncomeEntries);
    var topExpense = byCategory[0] || null;
    var alerts = [];
    byCategory.forEach(function(item){
      if(item.exceeded){ alerts.push('⚠️ ' + item.name + ' acima da meta (' + MM.helpers.formatCurrency(item.total) + ' de ' + MM.helpers.formatCurrency(item.limit) + ')'); }
    });
    if(topExpense && topExpense.percent >= 35){ alerts.push('📌 Maior peso do mês: ' + topExpense.icon + ' ' + topExpense.name + ' com ' + topExpense.percent + '% das saídas.'); }
    if(saidas > entradas){ alerts.push('💸 Saídas acima das entradas nesta competência.'); }

    return {
      activeUser: activeUser,
      entradas: entradas,
      saidas: saidas,
      saldoAnterior: saldoAnterior,
      saldo: saldoAnterior + (entradas - saidas),
      count: competenceEntries.length,
      byCategory: byCategory,
      byIncomeSource: byIncomeSource,
      overdue: overdue,
      dueSoon: dueSoon,
      contasAPagar: contasAPagar,
      monthCashCount: realizedEntries.length,
      monthOpenCount: competenceEntries.filter(function(m){ return !MM.services.getMovementCashDate(m); }).length,
      alerts: alerts,
      topExpense: topExpense
    };
  },
  filterMovements: function(filters){
    this.getMonthMovements();
    return this.getMonthMovements().filter(function(m){
      var okType = filters.type === 'todos' || m.type === filters.type;
      var okBelongs = filters.belongsTo === 'todos' || m.belongsTo === filters.belongsTo;
      var okStatus = filters.status === 'todos' || MM.services.calculateStatus(m) === filters.status;
      var okText = !filters.text || m.description.toLowerCase().includes(filters.text.toLowerCase());
      var categoryName = String(m.category || '').trim() || MM.helpers.autoCategory(m.description, m.type);
      var okCategory = !filters.category || filters.category === 'todos' || categoryName === filters.category;
      return okType && okBelongs && okStatus && okText && okCategory;
    });
  },
  openMovementsByCategory: function(category){
    var activeUser = this.getActiveUser();
    MM.state.movementFilters = {
      type: 'saida',
      belongsTo: activeUser ? activeUser.id : 'todos',
      status: 'todos',
      text: '',
      category: category || 'todos',
      scope: activeUser ? 'active' : 'all'
    };
    MM.router.goTo(MM.config.SCREENS.MOVEMENTS);
  },
  createOrUpdateTemplateFromMovement: function(movement){
    if(movement.recurrence !== 'fixa') return;
    this.normalizeMovementCategory(movement);
    var dueDay = Number((movement.dueDate || '').slice(8,10));
    var idx = MM.state.templates.findIndex(function(t){ return t.type === movement.type && t.description.toLowerCase() === movement.description.toLowerCase() && t.belongsTo === movement.belongsTo && t.category.toLowerCase() === movement.category.toLowerCase(); });
    var template = MM.models.createTemplate({ id: idx >= 0 ? MM.state.templates[idx].id : undefined, householdId: movement.householdId, type: movement.type, description: movement.description, category: movement.category, belongsTo: movement.belongsTo, amount: movement.amount, dueDay: dueDay, note: movement.note, active: true });
    if(idx >= 0){ MM.state.templates[idx] = template; movement.templateId = template.id; } else { MM.state.templates.push(template); movement.templateId = template.id; }
  },
  createNextRecurringMovementOnSettle: function(movement){
    if(!movement || (movement.recurrence !== 'fixa' && movement.recurrence !== 'variavel')) return null;
    this.normalizeMovementCategory(movement);
    var nextMonth = MM.helpers.nextMonth(movement.competence);
    var day = (movement.dueDate || '').slice(8,10);
    var parts = nextMonth.split('-');
    var year = Number(parts[0]), mm = Number(parts[1]);
    var dueDay = Math.min(Number(day || '1'), MM.helpers.daysInMonth(year, mm));
    var dueDate = year + '-' + String(mm).padStart(2,'0') + '-' + String(dueDay).padStart(2,'0');

    var exists = MM.state.movements.some(function(item){
      MM.services.normalizeMovementCategory(item);
      return item.competence === nextMonth && (
        (movement.templateId && item.templateId && item.templateId === movement.templateId) ||
        (item.type === movement.type && item.description === movement.description && item.category === movement.category && item.belongsTo === movement.belongsTo && item.recurrence === movement.recurrence)
      );
    });
    if(exists) return null;

    var nextMovement = MM.models.createMovement({
      householdId: movement.householdId,
      type: movement.type,
      description: movement.description,
      category: movement.category,
      recurrence: movement.recurrence,
      belongsTo: movement.belongsTo,
      settledBy: '',
      competence: nextMonth,
      amount: movement.recurrence === 'fixa' ? movement.amount : 0,
      dueDate: dueDate,
      settledDate: '',
      note: movement.note,
      origin: 'automatica',
      templateId: movement.templateId || null
    });

    MM.state.movements.push(nextMovement);
    return nextMovement;
  },
  generateFixedForMonth: function(month){
    if(!MM.state.household) return [];
    var created = [];
    MM.state.templates.filter(function(t){ return t.active; }).forEach(function(t){
      var exists = MM.state.movements.some(function(m){ return m.templateId === t.id && m.competence === month; });
      if(exists) return;
      var parts = month.split('-'); var year = Number(parts[0]), mm = Number(parts[1]);
      var day = Math.min(t.dueDay || 1, MM.helpers.daysInMonth(year, mm));
      var dueDate = year + '-' + String(mm).padStart(2,'0') + '-' + String(day).padStart(2,'0');
      created.push(MM.models.createMovement({ householdId: MM.state.household.id, type: t.type, description: t.description, category: t.category || MM.helpers.autoCategory(t.description, t.type), recurrence: 'fixa', belongsTo: t.belongsTo, settledBy: '', competence: month, amount: t.amount, dueDate: dueDate, settledDate: '', note: t.note, origin: 'automatica', templateId: t.id }));
    });
    if(created.length){ MM.state.movements = MM.state.movements.concat(created); MM.sync.syncNow().catch(function(err){ console.error('sync error:', err); MM.ui.showToast(err.message || 'Erro ao sincronizar.', 'error'); }); }
    return created;
  },
  calculateMonthlySummary: function(month){
    var curMov = MM.state.movements.filter(function(m){ MM.services.normalizeMovementCategory(m); return m.competence === month; });
    var saldoAnterior = MM.state.movements.reduce(function(sum, m){
      MM.services.normalizeMovementCategory(m);
      var cashDate = MM.services.getMovementCashDate(m);
      if(!cashDate || cashDate.slice(0,7) >= month) return sum;
      return sum + (m.type === 'entrada' ? Number(m.amount || 0) : -Number(m.amount || 0));
    }, 0);
    var realizedInMonth = MM.state.movements.filter(function(m){ return MM.services.isMovementRealizedInMonth(m, month); });
    var curEnt = realizedInMonth.filter(function(m){ return m.type === 'entrada'; }).reduce(function(sum,m){ return sum + Number(m.amount || 0); }, 0);
    var curSai = realizedInMonth.filter(function(m){ return m.type === 'saida'; }).reduce(function(sum,m){ return sum + Number(m.amount || 0); }, 0);
    return {
      saldoAnterior: saldoAnterior,
      entradas: curEnt,
      saidas: curSai,
      saldoFinal: saldoAnterior + curEnt - curSai,
      byCategory: this.buildCategoryBreakdown(realizedInMonth),
      count: curMov.length
    };
  }
};
