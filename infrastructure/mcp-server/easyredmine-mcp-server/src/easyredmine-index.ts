#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { EasyRedmineAPI } from './easyredmine-api.js';

const server = new Server(
  {
    name: 'easyredmine-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const easyRedmineAPI = new EasyRedmineAPI();

// Инструмент для получения всех проектов
const getProjectsTool: Tool = {
  name: 'get_projects',
  description: 'Получить список всех проектов из EasyRedmine',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Максимальное количество проектов (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
    },
  },
};

// Инструмент для получения проекта по ID
const getProjectTool: Tool = {
  name: 'get_project',
  description: 'Получить информацию о конкретном проекте по ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID проекта',
      },
    },
    required: ['id'],
  },
};

// Инструмент для получения всех пользователей
const getUsersTool: Tool = {
  name: 'get_users',
  description: 'Получить список всех пользователей из EasyRedmine',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Максимальное количество пользователей (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
    },
  },
};

// Инструмент для получения пользователя по ID
const getUserTool: Tool = {
  name: 'get_user',
  description: 'Получить информацию о конкретном пользователе по ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID пользователя',
      },
    },
    required: ['id'],
  },
};

// Инструмент для получения временных записей
const getTimeEntriesTool: Tool = {
  name: 'get_time_entries',
  description: 'Получить временные записи (часы) из EasyRedmine',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Максимальное количество записей (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
      userId: {
        type: 'number',
        description: 'ID пользователя для фильтрации',
      },
      projectId: {
        type: 'number',
        description: 'ID проекта для фильтрации',
      },
      from: {
        type: 'string',
        description: 'Дата начала периода (YYYY-MM-DD)',
      },
      to: {
        type: 'string',
        description: 'Дата окончания периода (YYYY-MM-DD)',
      },
    },
  },
};

// Инструмент для получения временных записей пользователя
const getUserTimeEntriesTool: Tool = {
  name: 'get_user_time_entries',
  description: 'Получить временные записи конкретного пользователя',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'number',
        description: 'ID пользователя',
      },
      limit: {
        type: 'number',
        description: 'Максимальное количество записей (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
      from: {
        type: 'string',
        description: 'Дата начала периода (YYYY-MM-DD)',
      },
      to: {
        type: 'string',
        description: 'Дата окончания периода (YYYY-MM-DD)',
      },
    },
    required: ['userId'],
  },
};

// Инструмент для получения временных записей проекта
const getProjectTimeEntriesTool: Tool = {
  name: 'get_project_time_entries',
  description: 'Получить временные записи конкретного проекта',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'ID проекта',
      },
      limit: {
        type: 'number',
        description: 'Максимальное количество записей (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
      from: {
        type: 'string',
        description: 'Дата начала периода (YYYY-MM-DD)',
      },
      to: {
        type: 'string',
        description: 'Дата окончания периода (YYYY-MM-DD)',
      },
    },
    required: ['projectId'],
  },
};

// Инструмент для получения всех задач
const getIssuesTool: Tool = {
  name: 'get_issues',
  description: 'Получить список всех задач из EasyRedmine',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Максимальное количество задач (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
      projectId: {
        type: 'number',
        description: 'ID проекта для фильтрации',
      },
      assignedToId: {
        type: 'number',
        description: 'ID назначенного пользователя для фильтрации',
      },
      statusId: {
        type: 'number',
        description: 'ID статуса для фильтрации',
      },
    },
  },
};

// Инструмент для получения задачи по ID
const getIssueTool: Tool = {
  name: 'get_issue',
  description: 'Получить информацию о конкретной задаче по ID',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: 'ID задачи',
      },
    },
    required: ['id'],
  },
};

// Инструмент для получения задач проекта
const getProjectIssuesTool: Tool = {
  name: 'get_project_issues',
  description: 'Получить задачи конкретного проекта',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'ID проекта',
      },
      limit: {
        type: 'number',
        description: 'Максимальное количество задач (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
    },
    required: ['projectId'],
  },
};

// Инструмент для получения задач пользователя
const getUserIssuesTool: Tool = {
  name: 'get_user_issues',
  description: 'Получить задачи, назначенные конкретному пользователю',
  inputSchema: {
    type: 'object',
    properties: {
      assignedToId: {
        type: 'number',
        description: 'ID пользователя',
      },
      limit: {
        type: 'number',
        description: 'Максимальное количество задач (по умолчанию 100)',
        default: 100,
      },
      offset: {
        type: 'number',
        description: 'Смещение для пагинации (по умолчанию 0)',
        default: 0,
      },
    },
    required: ['assignedToId'],
  },
};

// Инструмент для получения статистики часов пользователя
const getUserHoursStatsTool: Tool = {
  name: 'get_user_hours_stats',
  description: 'Получить статистику часов конкретного пользователя',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'number',
        description: 'ID пользователя',
      },
      from: {
        type: 'string',
        description: 'Дата начала периода (YYYY-MM-DD)',
      },
      to: {
        type: 'string',
        description: 'Дата окончания периода (YYYY-MM-DD)',
      },
    },
    required: ['userId'],
  },
};

// Инструмент для получения статистики часов проекта
const getProjectHoursStatsTool: Tool = {
  name: 'get_project_hours_stats',
  description: 'Получить статистику часов конкретного проекта',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'number',
        description: 'ID проекта',
      },
      from: {
        type: 'string',
        description: 'Дата начала периода (YYYY-MM-DD)',
      },
      to: {
        type: 'string',
        description: 'Дата окончания периода (YYYY-MM-DD)',
      },
    },
    required: ['projectId'],
  },
};

// Инструмент для получения общей статистики
const getDatabaseStatsTool: Tool = {
  name: 'get_database_stats',
  description: 'Получить общую статистику по EasyRedmine',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

const tools = [
  getProjectsTool,
  getProjectTool,
  getUsersTool,
  getUserTool,
  getTimeEntriesTool,
  getUserTimeEntriesTool,
  getProjectTimeEntriesTool,
  getIssuesTool,
  getIssueTool,
  getProjectIssuesTool,
  getUserIssuesTool,
  getUserHoursStatsTool,
  getProjectHoursStatsTool,
  getDatabaseStatsTool,
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: No arguments provided for tool ${name}`,
        },
      ],
    };
  }

  try {
    switch (name) {
      case 'get_projects':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getProjects(
                  args.limit as number || 100,
                  args.offset as number || 0
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_project':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getProject(args.id as number),
                null,
                2
              ),
            },
          ],
        };

      case 'get_users':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getUsers(
                  args.limit as number || 100,
                  args.offset as number || 0
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_user':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getUser(args.id as number),
                null,
                2
              ),
            },
          ],
        };

      case 'get_time_entries':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getTimeEntries(
                  args.limit as number || 100,
                  args.offset as number || 0,
                  args.userId as number,
                  args.projectId as number,
                  args.from as string,
                  args.to as string
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_user_time_entries':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getUserTimeEntries(
                  args.userId as number,
                  args.limit as number || 100,
                  args.offset as number || 0,
                  args.from as string,
                  args.to as string
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_project_time_entries':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getProjectTimeEntries(
                  args.projectId as number,
                  args.limit as number || 100,
                  args.offset as number || 0,
                  args.from as string,
                  args.to as string
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_issues':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getIssues(
                  args.limit as number || 100,
                  args.offset as number || 0,
                  args.projectId as number,
                  args.assignedToId as number,
                  args.statusId as number
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_issue':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getIssue(args.id as number),
                null,
                2
              ),
            },
          ],
        };

      case 'get_project_issues':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getProjectIssues(
                  args.projectId as number,
                  args.limit as number || 100,
                  args.offset as number || 0
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_user_issues':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getUserIssues(
                  args.assignedToId as number,
                  args.limit as number || 100,
                  args.offset as number || 0
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_user_hours_stats':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getUserHoursStats(
                  args.userId as number,
                  args.from as string,
                  args.to as string
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_project_hours_stats':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await easyRedmineAPI.getProjectHoursStats(
                  args.projectId as number,
                  args.from as string,
                  args.to as string
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_database_stats':
        try {
          const [projects, users, timeEntries, issues] = await Promise.all([
            easyRedmineAPI.getProjects(1, 0),
            easyRedmineAPI.getUsers(1, 0),
            easyRedmineAPI.getTimeEntries(1, 0),
            easyRedmineAPI.getIssues(1, 0),
          ]);

          const stats = {
            totalProjects: projects.total_count,
            totalUsers: users.total_count,
            totalTimeEntries: timeEntries.total_count,
            totalIssues: issues.total_count,
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting database stats: ${error}`,
              },
            ],
          };
        }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error calling tool ${name}: ${error}`,
        },
      ],
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);

console.error('EasyRedmine MCP server started');
