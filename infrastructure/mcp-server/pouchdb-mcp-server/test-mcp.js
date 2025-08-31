// Простой тест MCP сервера
import { spawn } from 'child_process';

const serverPath = './dist/index.js';

// Тестируем MCP сервер
function testMCPServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Сервер завершился с кодом ${code}: ${errorOutput}`));
      }
    });

    // Отправляем MCP запрос на получение списка инструментов
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

// Запускаем тест
console.log('🧪 Тестирование MCP сервера...');

testMCPServer()
  .then(output => {
    console.log('✅ MCP сервер работает!');
    console.log('Ответ:', output);
  })
  .catch(error => {
    console.error('❌ Ошибка MCP сервера:', error.message);
  });
