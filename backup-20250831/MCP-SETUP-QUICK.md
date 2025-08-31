# 🚀 Быстрая настройка MCP в Cursor для CouchDB

## ⚡ Быстрая настройка (5 минут)

### 1. Убедитесь, что MCP сервер запущен
```bash
cd infrastructure/mcp-server/pouchdb-mcp-server
npm run start:couchdb
```

### 2. Настройте MCP в Cursor

#### Вариант A: Через Settings (рекомендуется)
1. **Cursor** → **Settings** → **Extensions** → **MCP**
2. **Add MCP Server**:
   - **Name**: `pouchdb`
   - **Command**: `node`
   - **Args**: `["./dist/couchdb-index.js"]`
   - **CWD**: `infrastructure/mcp-server/pouchdb-mcp-server`

#### Вариант B: Скопируйте конфигурацию
Скопируйте содержимое файла `.cursor-mcp-config.json` в настройки MCP

### 3. Перезапустите Cursor

### 4. Протестируйте
В AI чате Cursor напишите: **"Покажи всех пользователей в базе данных"**

## 🔧 Конфигурация

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

## 🎯 Доступные команды

- "Покажи всех пользователей в базе данных"
- "Сколько проектов в системе?"
- "Создай нового пользователя test@example.com"
- "Получи статистику базы данных"

## 🚨 Если не работает

1. **Проверьте статус**: `npm run system:status`
2. **Перезапустите MCP**: `npm run start:couchdb`
3. **Перезапустите Cursor**
4. **Проверьте пути** в конфигурации

## 📚 Подробная документация

См. `infrastructure/mcp-server/pouchdb-mcp-server/MCP-SETUP.md`
