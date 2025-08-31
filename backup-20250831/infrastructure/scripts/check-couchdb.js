const nano = require('nano');

// Конфигурация подключения к CouchDB
const COUCHDB_URL = 'http://admin:admin123@localhost:5984';

async function checkCouchDB() {
  try {
    console.log('🔍 Проверка состояния CouchDB...');
    
    // Подключаемся к CouchDB
    const couch = nano(COUCHDB_URL);
    
    // Проверяем доступность сервера
    const serverInfo = await couch.info();
    console.log('✅ CouchDB доступен');
    console.log(`   Версия: ${serverInfo.version}`);
    console.log(`   UUID: ${serverInfo.uuid}`);
    
    // Получаем список баз данных
    const dbNames = await couch.db.list();
    console.log(`📋 Найдено баз данных: ${dbNames.length}`);
    
    // Проверяем каждую базу данных
    for (const dbName of dbNames) {
      try {
        const dbInfo = await couch.use(dbName).info();
        console.log(`\n📊 База данных: ${dbName}`);
        console.log(`   Документов: ${dbInfo.doc_count}`);
        console.log(`   Размер: ${(dbInfo.sizes.file / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Статус: ${dbInfo.purge_seq === 0 ? '🟢 Активна' : '🟡 Обновляется'}`);
        
        // Если это база users, показываем детальную информацию
        if (dbName === 'users') {
          const usersDb = couch.use(dbName);
          const users = await usersDb.list({ include_docs: true });
          console.log(`   Пользователей: ${users.rows.length}`);
          
          // Группируем по ролям
          const roleCounts = {};
          users.rows.forEach(row => {
            const role = row.doc.role || 'unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          });
          
          console.log('   По ролям:');
          Object.entries(roleCounts).forEach(([role, count]) => {
            console.log(`     ${role}: ${count}`);
          });
        }
        
        // Если это база projects, показываем детальную информацию
        if (dbName === 'projects') {
          const projectsDb = couch.use(dbName);
          const projects = await projectsDb.list({ include_docs: true });
          console.log(`   Проектов: ${projects.rows.length}`);
          
          // Группируем по статусам
          const statusCounts = {};
          projects.rows.forEach(row => {
            const status = row.doc.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          
          console.log('   По статусам:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`     ${status}: ${count}`);
          });
        }
        
        // Если это база time_entries, показываем детальную информацию
        if (dbName === 'time_entries') {
          const timeEntriesDb = couch.use(dbName);
          const timeEntries = await timeEntriesDb.list({ include_docs: true });
          console.log(`   Временных записей: ${timeEntries.rows.length}`);
          
          // Считаем общее время
          let totalHours = 0;
          timeEntries.rows.forEach(row => {
            totalHours += row.doc.hours || 0;
          });
          console.log(`   Общее время: ${totalHours.toFixed(2)} часов`);
        }
        
        // Если это база invoices, показываем детальную информацию
        if (dbName === 'invoices') {
          const invoicesDb = couch.use(dbName);
          const invoices = await invoicesDb.list({ include_docs: true });
          console.log(`   Счетов: ${invoices.rows.length}`);
          
          // Группируем по статусам
          const statusCounts = {};
          let totalAmount = 0;
          invoices.rows.forEach(row => {
            const status = row.doc.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            totalAmount += row.doc.amount || 0;
          });
          
          console.log(`   Общая сумма: ${totalAmount.toFixed(2)} RUB`);
          console.log('   По статусам:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`     ${status}: ${count}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Ошибка проверки базы ${dbName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Проверка CouchDB завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка подключения к CouchDB:', error.message);
    console.log('\n💡 Возможные решения:');
    console.log('   1. Убедитесь, что Docker контейнер запущен: docker-compose up -d');
    console.log('   2. Проверьте, что CouchDB доступен на порту 5984');
    console.log('   3. Проверьте логи: docker-compose logs couchdb');
    process.exit(1);
  }
}

// Запускаем проверку
checkCouchDB();
