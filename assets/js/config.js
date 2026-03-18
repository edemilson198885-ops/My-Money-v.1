window.MM = window.MM || {};
MM.config = {
  APP_NAME: 'My Money',
  APP_VERSION: '1.1.3',
  MAX_USERS: 10,
  STORAGE_KEYS: {
    config: 'mm_core_config',
    movements: 'mm_core_movements',
    templates: 'mm_core_templates',
    ui: 'mm_core_ui'
  },
  SCREENS: {
    SETUP: 'setup',
    DASHBOARD: 'dashboard',
    MOVEMENTS: 'movements',
    ENTRY: 'entry',
    ENTRY_EXTRA: 'entry_extra',
    EXIT: 'exit',
    EXTRA: 'extra',
    TEMPLATES: 'templates',
    CLOSING: 'closing',
    SETTINGS: 'settings'
  },
  EXIT_CATEGORIES: {
    home: ['Água','Luz','Internet','Gás','IPTU','IPVA','Licenciamento','Sem Parar'],
    services: ['Netflix','Spotify','Plano celular','TV','Vivo Bradesco'],
    family: ['Fralda','Mesada','Fisioterapia','Dentista','Faculdade','Remédio','Vitaminas','Cabelo','Material'],
    financial: ['Cartão crédito','Nubank','Empréstimo','Parcelas'],
    variable: ['Mercado','Compras','Investimentos','Férias','Escritura','Outros']
  }
};
