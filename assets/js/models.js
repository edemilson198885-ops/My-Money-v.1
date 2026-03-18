window.MM = window.MM || {};
MM.models = {
  createHousehold: function(data){ var now = MM.helpers.nowIso(); return { id:data.id||MM.helpers.generateId(), name:String(data.name||'').trim(), createdAt:data.createdAt||now, updatedAt:now }; },
  createUser: function(data){ var now = MM.helpers.nowIso(); return { id:data.id||MM.helpers.generateId(), householdId:data.householdId, name:String(data.name||'').trim(), inactive:!!data.inactive, createdAt:data.createdAt||now, updatedAt:now }; },
  createMovement: function(data){
    var now = MM.helpers.nowIso();
    return {
      id: data.id || MM.helpers.generateId(),
      householdId: data.householdId,
      type: data.type,
      description: String(data.description||'').trim(),
      category: String(data.category||'').trim(),
      recurrence: data.recurrence || 'variavel',
      belongsTo: data.belongsTo,
      settledBy: data.settledBy || '',
      competence: data.competence,
      amount: Number(data.amount),
      dueDate: data.dueDate,
      settledDate: data.settledDate || '',
      note: String(data.note||'').trim(),
      origin: data.origin || 'manual',
      templateId: data.templateId || null,
      createdAt: data.createdAt || now,
      updatedAt: now
    };
  },
  createTemplate: function(data){
    var now = MM.helpers.nowIso();
    return {
      id: data.id || MM.helpers.generateId(),
      householdId: data.householdId,
      type: data.type,
      description: String(data.description||'').trim(),
      category: String(data.category||'').trim(),
      belongsTo: data.belongsTo,
      amount: Number(data.amount),
      dueDay: Number(data.dueDay),
      note: String(data.note||'').trim(),
      active: data.active !== false,
      createdAt: data.createdAt || now,
      updatedAt: now
    };
  }
};
