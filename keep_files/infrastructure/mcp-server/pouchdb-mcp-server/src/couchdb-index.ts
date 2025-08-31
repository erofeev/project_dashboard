import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import PouchDB from 'pouchdb';
import httpAdapter from 'pouchdb-adapter-http';

// Регистрируем HTTP адаптер для подключения к CouchDB
PouchDB.plugin(httpAdapter);

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

// Определяем инструменты для работы с базой данных
const tools: Tool[] = [
  {
    name: 'get_user_count',
    description: 'Получает количество пользователей в базе данных',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_project_count',
    description: 'Получает количество проектов в базе данных',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_time_entries_count',
    description: 'Получает количество временных записей в базе данных',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_invoice_count',
    description: 'Получает количество счетов в базе данных',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_payment_count',
    description: 'Получает количество платежей в базе данных',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_database_stats',
    description: 'Получает общую статистику по всем базам данных',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_user',
    description: 'Создает нового пользователя в базе данных',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email пользователя' },
        name: { type: 'string', description: 'Имя пользователя' },
        role: { type: 'string', description: 'Роль пользователя' },
        direction: { type: 'string', description: 'Направление' }
      },
      required: ['email', 'name', 'role', 'direction']
    }
  },
  {
    name: 'get_user_by_email',
    description: 'Получает пользователя по email',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email пользователя' }
      },
      required: ['email']
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
      case 'get_user_count': {
        const result = await usersDb.allDocs({ include_docs: false });
        return {
          content: [
            {
              type: 'text',
              text: `Количество пользователей в базе данных: ${result.total_rows}`,
            },
          ],
        };
      }

      case 'get_project_count': {
        const result = await projectsDb.allDocs({ include_docs: false });
        return {
          content: [
            {
              type: 'text',
              text: `Количество проектов в базе данных: ${result.total_rows}`,
            },
          ],
        };
      }

      case 'get_time_entries_count': {
        const result = await timeEntriesDb.allDocs({ include_docs: false });
        return {
          content: [
            {
              type: 'text',
              text: `Количество временных записей в базе данных: ${result.total_rows}`,
            },
          ],
        };
      }

      case 'get_invoice_count': {
        const result = await invoicesDb.allDocs({ include_docs: false });
        return {
          content: [
            {
              type: 'text',
              text: `Количество счетов в базе данных: ${result.total_rows}`,
            },
          ],
        };
      }

      case 'get_payment_count': {
        const result = await paymentsDb.allDocs({ include_docs: false });
        return {
          content: [
            {
              type: 'text',
              text: `Количество платежей в базе данных: ${result.total_rows}`,
            },
          ],
        };
      }

      case 'get_database_stats': {
        const usersCount = await usersDb.allDocs({ include_docs: false });
        const projectsCount = await projectsDb.allDocs({ include_docs: false });
        const timeEntriesCount = await timeEntriesDb.allDocs({ include_docs: false });
        const invoicesCount = await invoicesDb.allDocs({ include_docs: false });
        const paymentsCount = await paymentsDb.allDocs({ include_docs: false });

        const stats = {
          users: usersCount.total_rows,
          projects: projectsCount.total_rows,
          timeEntries: timeEntriesCount.total_rows,
          invoices: invoicesCount.total_rows,
          payments: paymentsCount.total_rows,
          total: usersCount.total_rows + projectsCount.total_rows + timeEntriesCount.total_rows + invoicesCount.total_rows + paymentsCount.total_rows
        };

        return {
          content: [
            {
              type: 'text',
              text: `📊 Статистика баз данных:\n` +
                    `👥 Пользователи: ${stats.users}\n` +
                    `📋 Проекты: ${stats.projects}\n` +
                    `⏰ Временные записи: ${stats.timeEntries}\n` +
                    `🧾 Счета: ${stats.invoices}\n` +
                    `💰 Платежи: ${stats.payments}\n` +
                    `📈 Всего документов: ${stats.total}`,
            },
          ],
        };
      }

      case 'create_user': {
        const { email, name, role, direction } = args as { email: string; name: string; role: string; direction: string };
        
        const newUser = {
          _id: email,
          email,
          name,
          role,
          direction,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const result = await usersDb.put(newUser);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Пользователь создан успешно:\n` +
                    `Email: ${email}\n` +
                    `Имя: ${name}\n` +
                    `Роль: ${role}\n` +
                    `Направление: ${direction}\n` +
                    `ID: ${result.id}`,
            },
          ],
        };
      }

      case 'get_user_by_email': {
        const { email } = args as { email: string };
        try {
          const user = await usersDb.get(email) as any;
          return {
            content: [
              {
                type: 'text',
                text: `👤 Пользователь найден:\n` +
                      `Email: ${user.email}\n` +
                      `Имя: ${user.name}\n` +
                      `Роль: ${user.role}\n` +
                      `Направление: ${user.direction}\n` +
                      `Активен: ${user.isActive ? 'Да' : 'Нет'}\n` +
                      `Создан: ${user.createdAt}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Пользователь с email ${email} не найден`,
              },
            ],
            isError: true,
          };
        }
      }

      case 'get_all_users': {
        const { limit = 100 } = args as { limit?: number };
        const result = await usersDb.allDocs({ include_docs: true, limit });
        const users = result.rows
          .filter(row => row.doc && !row.id.startsWith('_design/'))
          .map(row => row.doc);
        
        return {
          content: [
            {
              type: 'text',
              text: `👥 Список всех пользователей (${users.length}):\n\n${JSON.stringify(users, null, 2)}`,
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

console.error('PouchDB MCP сервер запущен и подключен к CouchDB');
