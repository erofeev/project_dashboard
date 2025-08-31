import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';

// Регистрируем адаптер для работы в памяти
PouchDB.plugin(memoryAdapter);

// Создаем базу данных PouchDB в памяти
const db = new PouchDB('mcp-pouchdb', { adapter: 'memory' });

// Определяем инструменты для работы с базой данных
const tools: Tool[] = [
  {
    name: 'create_document',
    description: 'Создает новый документ в базе данных PouchDB',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID документа' },
        data: { type: 'object', description: 'Данные документа' }
      },
      required: ['id', 'data']
    }
  },
  {
    name: 'get_document',
    description: 'Получает документ по ID из базы данных PouchDB',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID документа для получения' }
      },
      required: ['id']
    }
  },
  {
    name: 'update_document',
    description: 'Обновляет существующий документ в базе данных PouchDB',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID документа для обновления' },
        data: { type: 'object', description: 'Новые данные документа' }
      },
      required: ['id', 'data']
    }
  },
  {
    name: 'delete_document',
    description: 'Удаляет документ по ID из базы данных PouchDB',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID документа для удаления' }
      },
      required: ['id']
    }
  },
  {
    name: 'list_documents',
    description: 'Получает список всех документов из базы данных PouchDB',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Максимальное количество документов' }
      }
    }
  },
  {
    name: 'query_documents',
    description: 'Выполняет поиск документов по Mango запросу',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'object', description: 'Mango selector для поиска' },
        limit: { type: 'number', description: 'Максимальное количество результатов' }
      },
      required: ['selector']
    }
  }
];

// Создаем MCP сервер
const server = new Server(
  {
    name: 'pouchdb-mcp-server',
    version: '1.0.0',
  }
);

// Устанавливаем capabilities для инструментов
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Обработчик для вызова инструментов
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_document': {
        const { id, data } = args as { id: string; data: any };
        const result = await db.put({ _id: id, ...data });
        return {
          content: [
            {
              type: 'text',
              text: `Документ создан успешно: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      case 'get_document': {
        const { id } = args as { id: string };
        const doc = await db.get(id);
        return {
          content: [
            {
              type: 'text',
              text: `Документ найден: ${JSON.stringify(doc)}`,
            },
          ],
        };
      }

      case 'update_document': {
        const { id, data } = args as { id: string; data: any };
        const existingDoc = await db.get(id);
        const updatedDoc = { ...existingDoc, ...data };
        const result = await db.put(updatedDoc);
        return {
          content: [
            {
              type: 'text',
              text: `Документ обновлен успешно: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      case 'delete_document': {
        const { id } = args as { id: string };
        const existingDoc = await db.get(id);
        const result = await db.remove(existingDoc);
        return {
          content: [
            {
              type: 'text',
              text: `Документ удален успешно: ${JSON.stringify(result)}`,
            },
          ],
        };
      }

      case 'list_documents': {
        const { limit = 100 } = args as { limit?: number };
        const result = await db.allDocs({ include_docs: true, limit });
        return {
          content: [
            {
              type: 'text',
              text: `Найдено документов: ${result.rows.length}\n${JSON.stringify(result.rows, null, 2)}`,
            },
          ],
        };
      }

      case 'query_documents': {
        const { selector, limit = 100 } = args as { selector: any; limit?: number };
        const result = await db.find({ selector, limit });
        return {
          content: [
            {
              type: 'text',
              text: `Результаты поиска: ${result.docs.length} документов\n${JSON.stringify(result.docs, null, 2)}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Неизвестный инструмент: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Ошибка: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Запускаем сервер
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('PouchDB MCP сервер запущен');
