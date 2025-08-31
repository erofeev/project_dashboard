// Пример использования PouchDB MCP Server
// Этот файл демонстрирует, как можно тестировать MCP сервер

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

// Путь к скомпилированному MCP серверу
const serverPath = './dist/index.js';

// Функция для отправки MCP запроса
async function sendMCPRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
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
        try {
          const response = JSON.parse(output);
          resolve(response);
        } catch (e) {
          reject(new Error(`Не удалось распарсить ответ: ${output}`));
        }
      } else {
        reject(new Error(`Сервер завершился с кодом ${code}: ${errorOutput}`));
      }
    });

    // Отправляем MCP запрос
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: method,
      params: params
    };

    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

// Примеры использования
async function examples() {
  try {
    console.log('🧪 Тестирование PouchDB MCP Server...\n');

    // 1. Создание документа
    console.log('1. Создание документа...');
    const createResult = await sendMCPRequest('tools/call', {
      name: 'create_document',
      arguments: {
        id: 'user1',
        data: {
          name: 'Иван Петров',
          email: 'ivan@example.com',
          age: 25,
          city: 'Москва'
        }
      }
    });
    console.log('✅ Документ создан:', createResult.result?.content?.[0]?.text);

    // 2. Получение документа
    console.log('\n2. Получение документа...');
    const getResult = await sendMCPRequest('tools/call', {
      name: 'get_document',
      arguments: {
        id: 'user1'
      }
    });
    console.log('✅ Документ получен:', getResult.result?.content?.[0]?.text);

    // 3. Создание второго документа
    console.log('\n3. Создание второго документа...');
    await sendMCPRequest('tools/call', {
      name: 'create_document',
      arguments: {
        id: 'user2',
        data: {
          name: 'Мария Сидорова',
          email: 'maria@example.com',
          age: 30,
          city: 'Санкт-Петербург'
        }
      }
    });

    // 4. Список всех документов
    console.log('\n4. Список всех документов...');
    const listResult = await sendMCPRequest('tools/call', {
      name: 'list_documents',
      arguments: {
        limit: 10
      }
    });
    console.log('✅ Список документов:', listResult.result?.content?.[0]?.text);

    // 5. Поиск документов
    console.log('\n5. Поиск документов старше 25 лет...');
    const queryResult = await sendMCPRequest('tools/call', {
      name: 'query_documents',
      arguments: {
        selector: {
          age: { $gte: 25 }
        },
        limit: 10
      }
    });
    console.log('✅ Результаты поиска:', queryResult.result?.content?.[0]?.text);

    console.log('\n🎉 Все тесты прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Запускаем примеры
examples();
