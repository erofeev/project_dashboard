const nano = require('nano');

// Конфигурация подключения к CouchDB
const COUCHDB_URL = 'http://admin:admin123@localhost:5984';
const dbNames = ['users', 'projects', 'time_entries', 'invoices', 'payments', 'settings'];

async function initializeCouchDB() {
  try {
    console.log('🚀 Инициализация CouchDB...');
    
    // Подключаемся к CouchDB
    const couch = nano(COUCHDB_URL);
    
    // Получаем список существующих баз данных
    const existingDbs = await couch.db.list();
    console.log('📋 Существующие базы данных:', existingDbs);
    
    // Создаем базы данных, если они не существуют
    for (const dbName of dbNames) {
      if (!existingDbs.includes(dbName)) {
        try {
          await couch.db.create(dbName);
          console.log(`✅ База данных '${dbName}' создана`);
        } catch (error) {
          console.log(`⚠️  База данных '${dbName}' уже существует или ошибка:`, error.message);
        }
      } else {
        console.log(`ℹ️  База данных '${dbName}' уже существует`);
      }
    }
    
    // Создаем индексы для базы данных users
    const usersDb = couch.use('users');
    try {
      await usersDb.createIndex({
        index: { fields: ['email', 'role', 'direction'] },
        name: 'users-email-role-direction'
      });
      console.log('✅ Индекс для users создан');
    } catch (error) {
      console.log('ℹ️  Индекс для users уже существует');
    }
    
    // Создаем индексы для базы данных projects
    const projectsDb = couch.use('projects');
    try {
      await projectsDb.createIndex({
        index: { fields: ['direction', 'status', 'startDate'] },
        name: 'projects-direction-status-date'
      });
      console.log('✅ Индекс для projects создан');
    } catch (error) {
      console.log('ℹ️  Индекс для projects уже существует');
    }
    
    // Создаем индексы для базы данных time_entries
    const timeEntriesDb = couch.use('time_entries');
    try {
      await timeEntriesDb.createIndex({
        index: { fields: ['projectId', 'userId', 'date'] },
        name: 'time-entries-project-user-date'
      });
      console.log('✅ Индекс для time_entries создан');
    } catch (error) {
      console.log('ℹ️  Индекс для time_entries уже существует');
    }
    
    // Создаем индексы для базы данных invoices
    const invoicesDb = couch.use('invoices');
    try {
      await invoicesDb.createIndex({
        index: { fields: ['projectId', 'status', 'dueDate'] },
        name: 'invoices-project-status-due'
      });
      console.log('✅ Индекс для invoices создан');
    } catch (error) {
      console.log('ℹ️  Индекс для invoices уже существует');
    }
    
    // Создаем базового суперадминистратора
    const adminUser = {
      _id: 'admin@admin.ru',
      email: 'admin@admin.ru',
      password: 'admin', // В продакшене должен быть хеш
      role: 'superadmin',
      name: 'Суперадминистратор',
      direction: 'system',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await usersDb.insert(adminUser);
      console.log('✅ Суперадминистратор создан');
    } catch (error) {
      if (error.statusCode === 409) {
        console.log('ℹ️  Суперадминистратор уже существует');
      } else {
        console.log('⚠️  Ошибка создания суперадминистратора:', error.message);
      }
    }
    
    // Создаем базовые настройки системы
    const systemSettings = {
      _id: 'system_settings',
      companyName: 'Wone IT - Business Solutions',
      defaultCurrency: 'RUB',
      workingDaysPerMonth: 22,
      timeTrackingEnabled: true,
      integrations: {
        openproject: { enabled: false, url: '', apiKey: '' },
        erm: { enabled: false, url: '', apiKey: '' }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await couch.use('settings').insert(systemSettings);
      console.log('✅ Системные настройки созданы');
    } catch (error) {
      if (error.statusCode === 409) {
        console.log('ℹ️  Системные настройки уже существуют');
      } else {
        console.log('⚠️  Ошибка создания системных настроек:', error.message);
      }
    }
    
    console.log('🎉 Инициализация CouchDB завершена успешно!');
    console.log('📊 Статистика баз данных:');
    
    for (const dbName of dbNames) {
      try {
        const dbInfo = await couch.use(dbName).info();
        console.log(`   ${dbName}: ${dbInfo.doc_count} документов`);
      } catch (error) {
        console.log(`   ${dbName}: ошибка получения информации`);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка инициализации CouchDB:', error);
    process.exit(1);
  }
}

// Запускаем инициализацию
initializeCouchDB();
