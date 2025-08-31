const { spawn } = require('child_process');
const path = require('path');

// Путь к MCP серверу
const mcpServerPath = path.join(__dirname, 'infrastructure/mcp-server/easyredmine-mcp-server/dist/easyredmine-index.js');

// Запускаем MCP сервер
const mcpServer = spawn('node', [mcpServerPath], {
  stdio: ['pipe', 'pipe', 'pipe']
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
      limit: 10,
      offset: 0
    }
  }
};

let toolsList = null;

// Обработка вывода сервера
mcpServer.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log('📡 MCP Response:', JSON.stringify(response, null, 2));
    
    if (response.method === 'tools/list') {
      toolsList = response.result;
      console.log('✅ Получен список инструментов');
      
      // Теперь запрашиваем проекты
      console.log('🔄 Запрашиваем проекты...');
      mcpServer.stdin.write(JSON.stringify(getProjectsRequest) + '\n');
    }
    
    if (response.method === 'tools/call') {
      console.log('✅ Получены проекты из EasyRedmine');
      mcpServer.kill();
    }
  } catch (error) {
    console.log('📝 Raw output:', data.toString());
  }
});

// Обработка ошибок
mcpServer.stderr.on('data', (data) => {
  console.log('❌ MCP Server Error:', data.toString());
});

// Обработка завершения
mcpServer.on('close', (code) => {
  console.log(`🔚 MCP Server exited with code ${code}`);
});

// Отправляем запрос на получение списка инструментов
console.log('🚀 Запускаем MCP сервер EasyRedmine...');
console.log('📋 Запрашиваем список инструментов...');
mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');

// Таймаут для завершения
setTimeout(() => {
  console.log('⏰ Таймаут, завершаем...');
  mcpServer.kill();
}, 10000);
