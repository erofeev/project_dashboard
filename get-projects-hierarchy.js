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

// MCP запрос для получения всех проектов
const getAllProjectsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "get_projects",
    arguments: {
      limit: 100,
      offset: 0
    }
  }
};

// Функция для построения дерева проектов
function buildProjectTree(projects) {
  const projectMap = new Map();
  const rootProjects = [];
  
  // Создаем карту всех проектов
  projects.forEach(project => {
    projectMap.set(project.id, {
      ...project,
      children: []
    });
  });
  
  // Строим дерево
  projects.forEach(project => {
    if (project.parent && project.parent.id) {
      const parent = projectMap.get(project.parent.id);
      if (parent) {
        parent.children.push(projectMap.get(project.id));
      }
    } else {
      rootProjects.push(projectMap.get(project.id));
    }
  });
  
  return rootProjects;
}

// Функция для отображения дерева проектов
function displayProjectTree(projects, level = 0, prefix = '') {
  projects.forEach((project, index) => {
    const isLast = index === projects.length - 1;
    const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    
    // Статус проекта
    const statusText = project.status === 1 ? '🟢 Активен' : '🔴 Неактивен';
    
    // Тип проекта
    const projectType = project.custom_fields?.find(field => field.name === 'Project Type')?.value || 'Не указан';
    const practice = project.custom_fields?.find(field => field.name === 'Practice')?.value || 'Не указана';
    
    console.log(`${currentPrefix}${project.name} (ID: ${project.id})`);
    console.log(`${childPrefix}   Статус: ${statusText}`);
    console.log(`${childPrefix}   Тип: ${projectType}`);
    console.log(`${childPrefix}   Практика: ${practice}`);
    console.log(`${childPrefix}   Создан: ${new Date(project.created_on).toLocaleDateString('ru-RU')}`);
    
    if (project.description) {
      const cleanDesc = project.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
      if (cleanDesc) {
        console.log(`${childPrefix}   Описание: ${cleanDesc.substring(0, 80)}${cleanDesc.length > 80 ? '...' : ''}`);
      }
    }
    
    // Показываем дочерние проекты
    if (project.children && project.children.length > 0) {
      console.log(`${childPrefix}   📁 Подпроекты (${project.children.length}):`);
      displayProjectTree(project.children, level + 1, childPrefix);
    }
    
    console.log('');
  });
}

// Обработка вывода сервера
mcpServer.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    
    if (response.result && response.result.content) {
      console.log('🌳 Структура проектов EasyRedmine:');
      console.log('=' .repeat(60));
      
      const projectsData = JSON.parse(response.result.content[0].text);
      
      if (projectsData.projects && projectsData.projects.length > 0) {
        console.log(`📊 Всего проектов в системе: ${projectsData.total_count}`);
        console.log(`📋 Получено проектов: ${projectsData.projects.length}`);
        console.log('');
        
        // Строим дерево проектов
        const projectTree = buildProjectTree(projectsData.projects);
        
        // Отображаем дерево
        displayProjectTree(projectTree);
        
        // Статистика по типам проектов
        console.log('📈 Статистика по типам проектов:');
        console.log('-'.repeat(40));
        
        const projectTypes = {};
        const practices = {};
        
        projectsData.projects.forEach(project => {
          const projectType = project.custom_fields?.find(field => field.name === 'Project Type')?.value || 'Не указан';
          const practice = project.custom_fields?.find(field => field.name === 'Practice')?.value || 'Не указана';
          
          projectTypes[projectType] = (projectTypes[projectType] || 0) + 1;
          practices[practice] = (practices[practice] || 0) + 1;
        });
        
        console.log('Типы проектов:');
        Object.entries(projectTypes).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
        
        console.log('\nПрактики:');
        Object.entries(practices).forEach(([practice, count]) => {
          console.log(`  ${practice}: ${count}`);
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

// Отправляем запрос на получение всех проектов
console.log('🔄 Запрашиваем структуру проектов из EasyRedmine...');
console.log('⏳ Ожидаем ответ...');
mcpServer.stdin.write(JSON.stringify(getAllProjectsRequest) + '\n');

// Таймаут для завершения
setTimeout(() => {
  console.log('⏰ Таймаут, завершаем...');
  mcpServer.kill();
}, 20000);
