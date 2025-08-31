export const environment = {
  production: false,
  
  // ЕРМ система интеграция
  erm: {
    baseUrl: 'https://your-erm-system.com', // Замените на реальный URL
    apiKey: 'your-api-key' // Замените на реальный API ключ
  },
  
  // OpenProject интеграция
  openProject: {
    baseUrl: 'https://your-openproject-system.com', // Замените на реальный URL
    apiKey: 'your-openproject-api-key' // Замените на реальный API ключ
  },
  
  // Системные настройки
  app: {
    name: 'Wone IT Project Management',
    version: '1.0.0',
    defaultLocale: 'ru'
  },
  
  // PouchDB настройки
  pouchdb: {
    name: 'wone-it-pm',
    syncUrl: 'http://localhost:5984/wone-it-pm'
  },
  
  // API настройки
  api: {
    timeout: 30000,
    retryAttempts: 3
  }
};
