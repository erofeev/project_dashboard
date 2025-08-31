const { spawn } = require('child_process');
const path = require('path');

// Отключаем проверку SSL сертификата
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🔒 SSL verification disabled');
console.log('🚀 Getting EasyRedmine Projects via MCP Server...');

// Путь к MCP серверу
const mcpServerPath = path.join(__dirname, 'infrastructure/mcp-server/easyredmine-mcp-server/dist/easyredmine-index.js');

// Запускаем MCP сервер
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
      limit: 50,
      offset: 0
    }
  }
};

// Обработка вывода сервера
mcpServer.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    
    if (response.result && response.result.content) {
      console.log('🚀 EasyRedmine Projects via MCP:');
      console.log('=' .repeat(60));
      
      const projectsData = JSON.parse(response.result.content[0].text);
      
      if (projectsData.projects && projectsData.projects.length > 0) {
        console.log(`📊 Total projects: ${projectsData.total_count}`);
        console.log(`📋 Retrieved: ${projectsData.projects.length}`);
        console.log('');
        
        // Группируем проекты по типам
        const projectsByType = {};
        const projectsByPractice = {};
        
        projectsData.projects.forEach((project, index) => {
          const projectType = project.custom_fields?.find(field => field.name === 'Project Type')?.value || 'Не указан';
          const practice = project.custom_fields?.find(field => field.name === 'Practice')?.value || 'Не указана';
          
          if (!projectsByType[projectType]) projectsByType[projectType] = [];
          if (!projectsByPractice[practice]) projectsByPractice[practice] = [];
          
          projectsByType[projectType].push(project);
          projectsByPractice[practice].push(project);
          
          console.log(`${index + 1}. ${project.name}`);
          console.log(`   ID: ${project.id}`);
          console.log(`   Status: ${project.status === 1 ? '🟢 Active' : '🔴 Inactive'}`);
          console.log(`   Type: ${projectType}`);
          console.log(`   Practice: ${practice}`);
          console.log(`   Created: ${new Date(project.created_on).toLocaleDateString('ru-RU')}`);
          
          if (project.description) {
            const cleanDesc = project.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
            if (cleanDesc) {
              console.log(`   Description: ${cleanDesc.substring(0, 80)}${cleanDesc.length > 80 ? '...' : ''}`);
            }
          }
          console.log('');
        });
        
        // Статистика по типам
        console.log('📈 Projects by Type:');
        console.log('-'.repeat(40));
        Object.entries(projectsByType).forEach(([type, projects]) => {
          console.log(`${type}: ${projects.length} projects`);
        });
        
        console.log('\n📈 Projects by Practice:');
        console.log('-'.repeat(40));
        Object.entries(projectsByPractice).forEach(([practice, projects]) => {
          console.log(`${practice}: ${projects.length} projects`);
        });
        
      } else {
        console.log('❌ No projects found or error occurred');
        console.log('Response:', JSON.stringify(projectsData, null, 2));
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
console.log('🔄 Requesting projects from EasyRedmine via MCP...');
mcpServer.stdin.write(JSON.stringify(getProjectsRequest) + '\n');

// Таймаут для завершения
setTimeout(() => {
  console.log('⏰ Timeout, finishing...');
  mcpServer.kill();
}, 20000);
