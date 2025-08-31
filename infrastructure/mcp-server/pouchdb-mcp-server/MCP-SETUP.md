# 🚀 Настройка MCP сервера в Cursor

## 📋 Обзор

MCP (Model Context Protocol) сервер для PouchDB позволяет Cursor взаимодействовать с вашей базой данных CouchDB через AI ассистента.

## 🔧 Установка

### 1. Сборка MCP сервера
```bash
cd infrastructure/mcp-server/pouchdb-mcp-server
npm install
npm run build
```

### 2. Запуск MCP сервера
```bash
npm run start:couchdb
```

## ⚙️ Настройка Cursor

### Вариант 1: Через Settings (рекомендуется)

1. Откройте Cursor
2. Перейдите в **Settings** → **Extensions** → **MCP**
3. Добавьте новый MCP сервер:
   - **Name**: `pouchdb`
   - **Command**: `node`
   - **Args**: `["./dist/couchdb-index.js"]`
   - **CWD**: `infrastructure/mcp-server/pouchdb-mcp-server`

### Вариант 2: Через конфигурационный файл

Создайте файл `.cursorrules` в корне проекта:

```json
{
  "mcpServers": {
    "pouchdb": {
      "command": "node",
      "args": ["./dist/couchdb-index.js"],
      "env": {},
      "cwd": "infrastructure/mcp-server/pouchdb-mcp-server"
    }
  }
}
```

### Вариант 3: Через cursor-mcp-config.json

Файл уже настроен в папке MCP сервера.

## 🧪 Тестирование

После настройки MCP сервера в Cursor, вы сможете использовать следующие команды:

### Получение данных
- "Покажи всех пользователей в базе данных"
- "Сколько проектов в системе?"
- "Получи статистику базы данных"

### Создание данных
- "Создай нового пользователя с email test@example.com"
- "Добавь проект 'Новый проект'"

## 🔍 Доступные инструменты

### Пользователи
- `get_user_count` - количество пользователей
- `get_all_users` - список всех пользователей
- `get_user_by_email` - пользователь по email
- `create_user` - создание пользователя

### Статистика
- `get_database_stats` - общая статистика
- `get_project_count` - количество проектов
- `get_time_entries_count` - количество временных записей
- `get_invoice_count` - количество счетов
- `get_payment_count` - количество платежей

## 🚨 Устранение неполадок

### MCP сервер не отвечает
1. Проверьте, что сервер запущен: `ps aux | grep couchdb-index`
2. Перезапустите сервер: `npm run start:couchdb`
3. Проверьте логи на ошибки

### Cursor не видит MCP сервер
1. Убедитесь, что путь в конфигурации правильный
2. Проверьте, что файл `couchdb-index.js` существует
3. Перезапустите Cursor

### Ошибки подключения к CouchDB
1. Проверьте, что CouchDB запущен: `npm run system:status`
2. Убедитесь, что порт 5984 доступен
3. Проверьте учетные данные admin/admin123

## 📚 Дополнительные ресурсы

- [MCP документация](https://modelcontextprotocol.io/)
- [Cursor MCP настройка](https://cursor.sh/docs/mcp)
- [PouchDB документация](https://pouchdb.com/)

## 🎯 Примеры использования

### В Cursor AI чате:
```
Пользователь: "Покажи всех пользователей в базе данных"
AI: Использую инструмент get_all_users для получения списка пользователей...

Пользователь: "Создай нового пользователя test@example.com"
AI: Использую инструмент create_user для создания пользователя...
```

---

**Примечание**: После изменения конфигурации MCP сервера перезапустите Cursor для применения изменений.
