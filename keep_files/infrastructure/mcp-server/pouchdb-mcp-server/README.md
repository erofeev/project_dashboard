# PouchDB MCP Server

MCP (Model Context Protocol) сервер для работы с базой данных PouchDB в Cursor.

## Возможности

- Создание документов
- Получение документов по ID
- Обновление документов
- Удаление документов
- Список всех документов
- Поиск документов по Mango запросу

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Соберите проект:
```bash
npm run build
```

## Настройка в Cursor

1. Откройте настройки Cursor (Ctrl/Cmd + ,)
2. Найдите раздел "MCP Servers"
3. Добавьте новый сервер:
   - **Name**: PouchDB
   - **Command**: `node`
   - **Args**: `["/path/to/pouchdb-mcp-server/dist/index.js"]`
   - **Env**: (оставьте пустым)

## Использование

После настройки MCP сервера в Cursor, вы сможете использовать следующие команды:

- `create_document` - создать документ
- `get_document` - получить документ по ID
- `update_document` - обновить документ
- `delete_document` - удалить документ
- `list_documents` - получить список всех документов
- `query_documents` - выполнить поиск по Mango запросу

## Примеры

### Создание документа
```json
{
  "id": "user1",
  "data": {
    "name": "Иван",
    "email": "ivan@example.com",
    "age": 25
  }
}
```

### Поиск документов
```json
{
  "selector": {
    "age": { "$gte": 18 }
  },
  "limit": 10
}
```

## Разработка

Для разработки используйте:
```bash
npm run dev
```

## Лицензия

MIT
