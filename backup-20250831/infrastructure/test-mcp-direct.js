const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-adapter-http'));

// Создаем подключения к базам данных CouchDB
const usersDb = new PouchDB('http://admin:admin123@localhost:5984/users', { 
  adapter: 'http',
  skip_setup: false
});

const projectsDb = new PouchDB('http://admin:admin123@localhost:5984/projects', { 
  adapter: 'http',
  skip_setup: false
});

const timeEntriesDb = new PouchDB('http://admin:admin123@localhost:5984/time_entries', { 
  adapter: 'http',
  skip_setup: false
});

const invoicesDb = new PouchDB('http://admin:admin123@localhost:5984/invoices', { 
  adapter: 'http',
  skip_setup: false
});

const paymentsDb = new PouchDB('http://admin:admin123@localhost:5984/payments', { 
  adapter: 'http',
  skip_setup: false
});

async function testCouchDBConnection() {
  try {
    console.log('🔍 Тестирование подключения к CouchDB...');
    
    // Тест 1: Получение количества пользователей
    const usersCount = await usersDb.allDocs({ include_docs: false });
    console.log(`✅ Пользователей: ${usersCount.total_rows}`);
    
    // Тест 2: Получение количества проектов
    const projectsCount = await projectsDb.allDocs({ include_docs: false });
    console.log(`✅ Проектов: ${projectsCount.total_rows}`);
    
    // Тест 3: Получение количества временных записей
    const timeEntriesCount = await timeEntriesDb.allDocs({ include_docs: false });
    console.log(`✅ Временных записей: ${timeEntriesCount.total_rows}`);
    
    // Тест 4: Получение количества счетов
    const invoicesCount = await invoicesDb.allDocs({ include_docs: false });
    console.log(`✅ Счетов: ${invoicesCount.total_rows}`);
    
    // Тест 5: Получение количества платежей
    const paymentsCount = await paymentsDb.allDocs({ include_docs: false });
    console.log(`✅ Платежей: ${paymentsCount.total_rows}`);
    
    // Тест 6: Общая статистика
    const totalDocs = usersCount.total_rows + projectsCount.total_rows + 
                     timeEntriesCount.total_rows + invoicesCount.total_rows + 
                     paymentsCount.total_rows;
    console.log(`📊 Всего документов: ${totalDocs}`);
    
    // Тест 7: Получение информации о суперадминистраторе
    try {
      const adminUser = await usersDb.get('admin@admin.ru');
      console.log(`👤 Суперадминистратор: ${adminUser.name} (${adminUser.role})`);
    } catch (error) {
      console.log('❌ Суперадминистратор не найден');
    }
    
    // Тест 8: Создание тестового пользователя
    const testUser = {
      _id: `test-${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      name: 'Тестовый пользователь',
      role: 'employee',
      direction: 'test',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      const result = await usersDb.put(testUser);
      console.log(`✅ Тестовый пользователь создан: ${result.id}`);
      
      // Удаляем тестового пользователя
      await usersDb.remove(result.id, result.rev);
      console.log(`🗑️ Тестовый пользователь удален`);
    } catch (error) {
      console.log('⚠️ Ошибка создания тестового пользователя:', error.message);
    }
    
    console.log('\n🎉 Все тесты завершены успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    console.log('\n💡 Возможные решения:');
    console.log('   1. Убедитесь, что CouchDB запущен: docker compose ps');
    console.log('   2. Проверьте, что CouchDB доступен на порту 5984');
    console.log('   3. Проверьте логи: docker compose logs couchdb');
  }
}

// Запускаем тесты
testCouchDBConnection();
