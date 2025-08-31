# ⚡ Быстрый старт PouchDB MCP Server

## 🚀 Установка за 3 шага

### 1. Установка зависимостей
```bash
cd pouchdb-mcp-server
npm install
npm run build
```

### 2. Настройка в Cursor
- `Ctrl + ,` → Settings
- Поиск: "MCP Servers" 
- Add Server:
  - Name: `PouchDB`
  - Command: `node`
  - Args: `["/полный/путь/к/dist/index.js"]`
  - Working Directory: `/полный/путь/к/pouchdb-mcp-server`

### 3. Перезапуск Cursor

## 🎯 Готово! 

Теперь AI ассистент Cursor может работать с PouchDB:
- Создавать документы
- Искать данные
- Обновлять записи
- Управлять базой данных

## 🧪 Тест
```bash
node example.js
```

## 📖 Подробности
См. `INSTALL.md` для детальной инструкции
