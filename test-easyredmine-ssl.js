const { spawn } = require('child_process');
const path = require('path');

// Отключаем проверку SSL сертификата
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🔒 SSL verification disabled for this process');

// Путь к MCP серверу
const mcpServerPath = path.join(__dirname, 'infrastructure/mcp-server/easyredmine-mcp-server/dist/easyredmine-index.js');

// Запускаем MCP сервер с переменной окружения
const mcpServer = spawn('node', [mcpServerPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_TLS_REJECT_UNAUTHORIZED: '0'
  }
});

// MCP запрос для получения проектов
const getProjectsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "get_projects",
    arguments: {
      limit: 10,
      offset: 0
    }
  }
};

// Обработка вывода сервера
mcpServer.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    
    if (response.result && response.result.content) {
      console.log('🚀 EasyRedmine Projects:');
      console.log('=' .repeat(50));
      
      const projectsData = JSON.parse(response.result.content[0].text);
      
      if (projectsData.projects && projectsData.projects.length > 0) {
        console.log(`📊 Всего проектов: ${projectsData.total_count}`);
        console.log(`📋 Показано: ${projectsData.projects.length}`);
        console.log('');
        
        projectsData.projects.forEach((project, index) => {
          console.log(`${index + 1}. ${project.name}`);
          console.log(`   ID: ${project.id}`);
          console.log(`   Идентификатор: ${project.identifier}`);
          console.log(`   Статус: ${project.status}`);
          console.log(`   Создан: ${new Date(project.created_on).toLocaleDateString('ru-RU')}`);
          console.log(`   Обновлен: ${new Date(project.updated_on).toLocaleDateString('ru-RU')}`);
          if (project.description) {
            const cleanDesc = project.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
            console.log(`   Описание: ${cleanDesc.substring(0, 100)}${cleanDesc.length > 100 ? '...' : ''}`);
          }
          console.log('');
        });
      } else {
        console.log('❌ Проекты не найдены или произошла ошибка');
        console.log('Ответ сервера:', JSON.stringify(projectsData, null, 2));
      }
      
      mcpServer.kill();
    }
  } catch (error) {
    // Игнорируем ошибки парсинга для служебных сообщений
  }
});

// Обработка ошибок
mcpServer.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message && !message.includes('EasyRedmine MCP server started')) {
    console.log('⚠️  MCP Server:', message);
  }
});

// Обработка завершения
mcpServer.on('close', (code) => {
  if (code !== 0) {
    console.log(`🔚 MCP Server exited with code ${code}`);
  }
});

// Отправляем запрос на получение проектов
console.log('🔄 Запрашиваем проекты из EasyRedmine...');
console.log('⏳ Ожидаем ответ...');
mcpServer.stdin.write(JSON.stringify(getProjectsRequest) + '\n');

// Таймаут для завершения
setTimeout(() => {
  console.log('⏰ Таймаут, завершаем...');
  mcpServer.kill();
}, 15000);
