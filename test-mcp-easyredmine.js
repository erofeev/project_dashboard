const { spawn } = require('child_process');
const path = require('path');

// Отключаем проверку SSL сертификата
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🔒 SSL verification disabled');
console.log('🚀 Testing EasyRedmine MCP Server...');

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

// MCP запрос для получения списка инструментов
const listToolsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
};

// MCP запрос для получения проектов
const getProjectsRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "get_projects",
    arguments: {
      limit: 20,
      offset: 0
    }
  }
};

let toolsReceived = false;

// Обработка вывода сервера
mcpServer.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    
    if (response.result && response.result.tools && !toolsReceived) {
      console.log('✅ MCP Server Tools Available:');
      console.log('=' .repeat(50));
      
      response.result.tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}`);
        console.log(`   ${tool.description}`);
        console.log('');
      });
      
      toolsReceived = true;
      
      // Теперь запрашиваем проекты
      console.log('🔄 Requesting projects from EasyRedmine...');
      mcpServer.stdin.write(JSON.stringify(getProjectsRequest) + '\n');
    }
    
    if (response.result && response.result.content) {
      console.log('🚀 EasyRedmine Projects via MCP:');
      console.log('=' .repeat(50));
      
      const projectsData = JSON.parse(response.result.content[0].text);
      
      if (projectsData.projects && projectsData.projects.length > 0) {
        console.log(`📊 Total projects: ${projectsData.total_count}`);
        console.log(`📋 Retrieved: ${projectsData.projects.length}`);
        console.log('');
        
        projectsData.projects.forEach((project, index) => {
          console.log(`${index + 1}. ${project.name}`);
          console.log(`   ID: ${project.id}`);
          console.log(`   Status: ${project.status === 1 ? '🟢 Active' : '🔴 Inactive'}`);
          console.log(`   Created: ${new Date(project.created_on).toLocaleDateString('ru-RU')}`);
          
          if (project.description) {
            const cleanDesc = project.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
            if (cleanDesc) {
              console.log(`   Description: ${cleanDesc.substring(0, 60)}${cleanDesc.length > 60 ? '...' : ''}`);
            }
          }
          console.log('');
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

// Отправляем запрос на получение списка инструментов
console.log('📋 Requesting MCP tools list...');
mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');

// Таймаут для завершения
setTimeout(() => {
  console.log('⏰ Timeout, finishing...');
  mcpServer.kill();
}, 15000);
