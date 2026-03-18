window.MM = window.MM || {};

MM.storage = {
  async ensureProfile() {
    const user = await MM.auth.getUser();
    if (!user) return null;

    const { data, error } = await MM.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  async loadAppData() {
    try {
      const user = await MM.auth.getUser();

      if (!user) {
        return {
          config: null,
          movements: [],
          templates: [],
          ui: MM.state.ui
        };
      }

      const { data: profile, error: profileError } = await MM.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile || !profile.household_id) {
        return {
          config: null,
          movements: [],
          templates: [],
          ui: MM.state.ui
        };
      }

      const householdId = profile.household_id;

      const [
        householdRes,
        membersRes,
        templatesRes,
        movementsRes
      ] = await Promise.all([
        MM.supabase
          .from('households')
          .select('*')
          .eq('id', householdId)
          .single(),

        MM.supabase
          .from('members')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true }),

        MM.supabase
          .from('templates')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true }),

        MM.supabase
          .from('movements')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: true })
      ]);

      if (householdRes.error) throw householdRes.error;
      if (membersRes.error) throw membersRes.error;
      if (templatesRes.error) throw templatesRes.error;
      if (movementsRes.error) throw movementsRes.error;

      const household = this.mapHouseholdFromDb(householdRes.data);
      const users = (membersRes.data || []).map(this.mapUserFromDb);
      const templates = (templatesRes.data || []).map(this.mapTemplateFromDb);
      const movements = (movementsRes.data || []).map(this.mapMovementFromDb);

      return {
        config: {
          household: household,
          users: users
        },
        movements: movements,
        templates: templates,
        ui: MM.state.ui
      };
    } catch (err) {
      console.error('loadAppData error:', err);
      return {
        config: null,
        movements: [],
        templates: [],
        ui: MM.state.ui
      };
    }
  },

  async bootstrapInitialData(householdName, users) {
    const currentUser = await MM.auth.getUser();
    if (!currentUser) throw new Error('Faça login por e-mail primeiro.');

    const profile = await this.ensureProfile();
    if (profile && profile.household_id) {
      throw new Error('Este usuário já possui uma residência configurada.');
    }

    const firstUserName = (users && users[0] && users[0].name) ? users[0].name : currentUser.email;

    const { data, error } = await MM.supabase.rpc('bootstrap_my_money', {
      p_household_name: householdName,
      p_display_name: firstUserName
    });

    if (error) throw error;
    if (!data || !data.household_id) throw new Error('Não foi possível criar a residência.');

    const householdId = data.household_id;

    const membersPayload = (users || [])
      .map(function(u) {
        return {
          household_id: householdId,
          name: String(u.name || '').trim(),
          inactive: false
        };
      })
      .filter(function(u) { return !!u.name; });

    if (membersPayload.length) {
      const { error: membersError } = await MM.supabase
        .from('members')
        .insert(membersPayload);

      if (membersError) throw membersError;
    }

    return householdId;
  },

  async syncFromState() {
    if (!MM.state.household || !MM.state.household.id) return;

    const householdId = MM.state.household.id;

    const householdPayload = {
      id: MM.state.household.id,
      name: MM.state.household.name,
      owner_id: MM.state.household.ownerId
    };

    const { error: householdError } = await MM.supabase
      .from('households')
      .upsert(householdPayload)
      .select();

    if (householdError) throw householdError;

    const membersPayload = (MM.state.users || []).map(function(u) {
      return {
        id: u.id,
        household_id: householdId,
        name: u.name,
        inactive: !!u.inactive
      };
    });

    const templatesPayload = (MM.state.templates || []).map(function(t) {
      return {
        id: t.id,
        household_id: householdId,
        type: t.type,
        description: t.description,
        category: t.category,
        belongs_to: t.belongsTo,
        amount: Number(t.amount || 0),
        due_day: Number(t.dueDay || 1),
        note: t.note || '',
        active: t.active !== false
      };
    });

    const movementsPayload = (MM.state.movements || []).map(function(m) {
      return {
        id: m.id,
        household_id: householdId,
        type: m.type,
        description: m.description,
        category: m.category,
        recurrence: m.recurrence || 'variavel',
        belongs_to: m.belongsTo,
        settled_by: m.settledBy || '',
        competence: m.competence,
        amount: Number(m.amount || 0),
        due_date: m.dueDate,
        settled_date: m.settledDate || null,
        note: m.note || '',
        origin: m.origin || 'manual',
        template_id: m.templateId || null
      };
    });

    const oldMemberIdsRes = await MM.supabase.from('members').select('id').eq('household_id', householdId);
    if (oldMemberIdsRes.error) throw oldMemberIdsRes.error;

    const oldTemplateIdsRes = await MM.supabase.from('templates').select('id').eq('household_id', householdId);
    if (oldTemplateIdsRes.error) throw oldTemplateIdsRes.error;

    const oldMovementIdsRes = await MM.supabase.from('movements').select('id').eq('household_id', householdId);
    if (oldMovementIdsRes.error) throw oldMovementIdsRes.error;

    const currentMemberIds = membersPayload.map(function(x) { return x.id; });
    const currentTemplateIds = templatesPayload.map(function(x) { return x.id; });
    const currentMovementIds = movementsPayload.map(function(x) { return x.id; });

    const memberIdsToDelete = (oldMemberIdsRes.data || []).map(function(x) { return x.id; }).filter(function(id) { return currentMemberIds.indexOf(id) === -1; });
    const templateIdsToDelete = (oldTemplateIdsRes.data || []).map(function(x) { return x.id; }).filter(function(id) { return currentTemplateIds.indexOf(id) === -1; });
    const movementIdsToDelete = (oldMovementIdsRes.data || []).map(function(x) { return x.id; }).filter(function(id) { return currentMovementIds.indexOf(id) === -1; });

    if (memberIdsToDelete.length) {
      const { error } = await MM.supabase.from('members').delete().in('id', memberIdsToDelete);
      if (error) throw error;
    }

    if (templateIdsToDelete.length) {
      const { error } = await MM.supabase.from('templates').delete().in('id', templateIdsToDelete);
      if (error) throw error;
    }

    if (movementIdsToDelete.length) {
      const { error } = await MM.supabase.from('movements').delete().in('id', movementIdsToDelete);
      if (error) throw error;
    }

    if (membersPayload.length) {
      const { error } = await MM.supabase.from('members').upsert(membersPayload).select();
      if (error) throw error;
    }

    if (templatesPayload.length) {
      const { error } = await MM.supabase.from('templates').upsert(templatesPayload).select();
      if (error) throw error;
    }

    if (movementsPayload.length) {
      const { error } = await MM.supabase.from('movements').upsert(movementsPayload).select();
      if (error) throw error;
    }

    MM.state.ui.lastSavedAt = new Date().toISOString();
  },

  exportBackup: function(){
    var payload = {
      app: 'My Money',
      version: 'supabase-v1',
      exportedAt: new Date().toISOString(),
      config: { household: MM.state.household, users: MM.state.users },
      movements: MM.state.movements,
      templates: MM.state.templates,
      ui: MM.state.ui
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'my-money-backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  importBackupFile: function(file, onDone, onError){
    var reader = new FileReader();

    reader.onload = async function(){
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
        await MM.storage.syncFromState();
        if(onDone) onDone();
      }catch(err){
        if(onError) onError(err);
      }
    };

    reader.readAsText(file, 'utf-8');
  },

  resetLocalData: async function(){
    try {
      await MM.auth.signOut();
    } catch (e) {}
  },

  mapHouseholdFromDb: function(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  mapUserFromDb: function(row) {
    return {
      id: row.id,
      householdId: row.household_id,
      name: row.name,
      inactive: !!row.inactive,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  mapTemplateFromDb: function(row) {
    return {
      id: row.id,
      householdId: row.household_id,
      type: row.type,
      description: row.description,
      category: row.category,
      belongsTo: row.belongs_to,
      amount: Number(row.amount || 0),
      dueDay: Number(row.due_day || 1),
      note: row.note || '',
      active: row.active !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  mapMovementFromDb: function(row) {
    return {
      id: row.id,
      householdId: row.household_id,
      type: row.type,
      description: row.description,
      category: row.category,
      recurrence: row.recurrence,
      belongsTo: row.belongs_to,
      settledBy: row.settled_by || '',
      competence: row.competence,
      amount: Number(row.amount || 0),
      dueDate: row.due_date,
      settledDate: row.settled_date || '',
      note: row.note || '',
      origin: row.origin || 'manual',
      templateId: row.template_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};
