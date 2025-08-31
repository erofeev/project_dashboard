#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { PrimeNGService } from './primeng-service.js';

class PrimeNGMCPServer {
  private server: Server;
  private primeNGService: PrimeNGService;

  constructor() {
    this.server = new Server(
      {
        name: 'primeng-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.primeNGService = new PrimeNGService();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_primeng_component',
            description: 'Получить информацию о конкретном компоненте PrimeNG',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Название компонента (например: editor, button, table)',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'get_all_primeng_components',
            description: 'Получить список всех доступных компонентов PrimeNG',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Фильтр по категории (Form, Button, Data, Panel, Overlay, Menu, Chart, Messages, Media, File, Misc)',
                },
              },
            },
          },
          {
            name: 'search_primeng_components',
            description: 'Поиск компонентов PrimeNG по названию или описанию',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Поисковый запрос',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_primeng_component_documentation',
            description: 'Получить полную документацию компонента с примерами кода',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Название компонента',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'get_primeng_component_example',
            description: 'Получить пример использования конкретного компонента',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Название компонента',
                },
                exampleType: {
                  type: 'string',
                  description: 'Тип примера (basic, template, reactive, readonly и т.д.)',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'get_primeng_categories',
            description: 'Получить список всех категорий компонентов PrimeNG',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_primeng_installation_guide',
            description: 'Получить инструкцию по установке и настройке PrimeNG',
            inputSchema: {
              type: 'object',
              properties: {
                component: {
                  type: 'string',
                  description: 'Название компонента для получения специфичной инструкции по установке',
                },
              },
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error('Аргументы не предоставлены');
      }

      try {
        switch (name) {
          case 'get_primeng_component': {
            const componentName = args.name as string;
            if (!componentName) {
              throw new Error('Название компонента не указано');
            }
            const component = await this.primeNGService.getComponent(componentName);
            return {
              content: [
                {
                  type: 'text',
                  text: component 
                    ? JSON.stringify(component, null, 2)
                    : `Компонент "${componentName}" не найден`,
                },
              ],
            };
          }

          case 'get_all_primeng_components': {
            const category = args.category as string | undefined;
            const components = category
              ? await this.primeNGService.getComponentsByCategory(category)
              : await this.primeNGService.getAllComponents();
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(components, null, 2),
                },
              ],
            };
          }

          case 'search_primeng_components': {
            const query = args.query as string;
            if (!query) {
              throw new Error('Поисковый запрос не указан');
            }
            const components = await this.primeNGService.searchComponents(query);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(components, null, 2),
                },
              ],
            };
          }

          case 'get_primeng_component_documentation': {
            const componentName = args.name as string;
            if (!componentName) {
              throw new Error('Название компонента не указано');
            }
            const documentation = await this.primeNGService.getComponentDocumentation(componentName);
            return {
              content: [
                {
                  type: 'text',
                  text: documentation
                    ? JSON.stringify(documentation, null, 2)
                    : `Документация для компонента "${componentName}" не найдена`,
                },
              ],
            };
          }

          case 'get_primeng_component_example': {
            const componentName = args.name as string;
            const exampleType = args.exampleType as string | undefined;
            if (!componentName) {
              throw new Error('Название компонента не указано');
            }
            const example = await this.primeNGService.getComponentExample(componentName, exampleType);
            return {
              content: [
                {
                  type: 'text',
                  text: example
                    ? JSON.stringify(example, null, 2)
                    : `Пример для компонента "${componentName}" не найден`,
                },
              ],
            };
          }

          case 'get_primeng_categories': {
            const categories = await this.primeNGService.getCategories();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(categories, null, 2),
                },
              ],
            };
          }

          case 'get_primeng_installation_guide': {
            const component = args.component as string | undefined;
            const guide = this.getInstallationGuide(component);
            return {
              content: [
                {
                  type: 'text',
                  text: guide,
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
              text: `Ошибка при выполнении ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getInstallationGuide(component?: string): string {
    let guide = `# Установка PrimeNG

## 1. Установка основных пакетов

\`\`\`bash
npm install primeng
npm install @angular/animations
npm install primeicons
\`\`\`

## 2. Настройка стилей

Добавьте в angular.json:

\`\`\`json
"styles": [
  "node_modules/primeng/resources/themes/aura-light-blue/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css"
]
\`\`\`

## 3. Импорт модулей

\`\`\`typescript
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
// ... другие модули

@NgModule({
  imports: [
    ButtonModule,
    InputTextModule,
    // ... другие модули
  ]
})
\`\`\`

## 4. Базовое использование

\`\`\`html
<p-button label="Click me" />
<input pInputText placeholder="Enter text" />
\`\`\`
`;

    if (component) {
      switch (component.toLowerCase()) {
        case 'editor':
          guide += `

## Дополнительно для Editor

\`\`\`bash
npm install quill
\`\`\`

\`\`\`typescript
import { EditorModule } from 'primeng/editor';

@NgModule({
  imports: [EditorModule]
})
\`\`\`

\`\`\`html
<p-editor [(ngModel)]="text" [style]="{ height: '320px' }" />
\`\`\`
`;
          break;
        case 'chart':
          guide += `

## Дополнительно для Chart

\`\`\`bash
npm install chart.js
\`\`\`

\`\`\`typescript
import { ChartModule } from 'primeng/chart';
\`\`\`
`;
          break;
      }
    }

    return guide;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PrimeNG MCP Server запущен');
  }
}

const server = new PrimeNGMCPServer();
server.run().catch(console.error);
