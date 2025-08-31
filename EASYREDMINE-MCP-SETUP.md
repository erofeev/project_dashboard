# Быстрая настройка EasyRedmine MCP сервера

## Шаг 1: Установка зависимостей
```bash
cd infrastructure/mcp-server/easyredmine-mcp-server
npm install
```

## Шаг 2: Сборка проекта
```bash
npm run build
```

## Шаг 3: Настройка в Cursor

1. Откройте **Settings** → **Extensions** → **MCP**
2. Добавьте новый MCP сервер:

```json
{
  "mcpServers": {
    "easyredmine": {
      "command": "node",
      "args": ["./dist/easyredmine-index.js"],
      "env": {},
      "cwd": "infrastructure/mcp-server/easyredmine-mcp-server"
    }
  }
}
```

## Шаг 4: Перезапуск Cursor

Перезапустите Cursor для применения изменений.

## Шаг 5: Тестирование

После настройки вы сможете использовать команды:

- "Покажи все проекты в EasyRedmine"
- "Сколько пользователей в системе?"
- "Получи часы работы пользователя с ID 123"
- "Покажи задачи проекта с ID 456"
- "Какая статистика по часам за последний месяц?"

## Доступные инструменты

### Проекты
- `get_projects` - список всех проектов
- `get_project` - информация о проекте по ID

### Пользователи
- `get_users` - список всех пользователей
- `get_user` - информация о пользователе по ID

### Часы работы
- `get_time_entries` - временные записи с фильтрацией
- `get_user_time_entries` - часы конкретного пользователя
- `get_project_time_entries` - часы конкретного проекта

### Задачи
- `get_issues` - список всех задач
- `get_issue` - информация о задаче по ID
- `get_project_issues` - задачи проекта
- `get_user_issues` - задачи пользователя

### Статистика
- `get_user_hours_stats` - статистика часов пользователя
- `get_project_hours_stats` - статистика часов проекта
- `get_database_stats` - общая статистика системы

## Конфигурация

Настройки EasyRedmine находятся в `infrastructure/mcp-server/easyredmine-mcp-server/config.ts`:

```typescript
export const config = {
  easyredmine: {
    url: 'https://easyredmine.awara.pro',
    apiKey: '763c9fa14fcc0343773389494e8ba3004ef3cd65'
  }
};
```

## Устранение проблем

1. **Ошибка сборки**: Убедитесь, что установлены все зависимости
2. **Ошибка подключения**: Проверьте URL и API ключ в config.ts
3. **MCP не работает**: Перезапустите Cursor после настройки
4. **API ошибки**: Проверьте права доступа API ключа

## Структура файлов

```
easyredmine-mcp-server/
├── src/
│   ├── types.ts              # TypeScript типы
│   ├── easyredmine-api.ts    # API клиент
│   └── easyredmine-index.ts  # MCP сервер
├── config.ts                 # Конфигурация
├── package.json             # Зависимости
├── tsconfig.json           # TypeScript
└── README.md               # Документация
```
