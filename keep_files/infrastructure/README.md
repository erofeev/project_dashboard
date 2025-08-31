# 🏗️ Инфраструктура проекта

Эта папка содержит всю инфраструктуру для системы управления проектами.

## 📁 Структура

```
infrastructure/
├── docker/                 # Docker конфигурация
│   └── docker-compose.yml  # Конфигурация CouchDB и Fauxton
├── mcp-server/             # MCP сервер для PouchDB
│   ├── src/                # Исходный код
│   ├── dist/               # Собранные файлы
│   └── package.json        # Зависимости MCP сервера
├── scripts/                # Скрипты инициализации
│   ├── init-couchdb.js     # Инициализация базы данных
│   ├── check-couchdb.js    # Проверка состояния БД
│   └── package.json        # Зависимости скриптов
├── test-mcp-direct.js      # Тест подключения к CouchDB
└── README.md               # Этот файл
```

## 🚀 Быстрый старт

### Запуск всей инфраструктуры
```bash
# Из корневой директории проекта
npm run system:start
```

### Остановка инфраструктуры
```bash
npm run system:stop
```

### Проверка статуса
```bash
npm run system:status
```

## 🔧 Компоненты

### Docker (CouchDB + Fauxton)
- **CouchDB**: База данных NoSQL
- **Fauxton**: Веб-интерфейс для управления CouchDB
- **Порт CouchDB**: 5984
- **Порт Fauxton**: 8888
- **Логин**: admin / admin123

### MCP Сервер
- **Назначение**: Model Context Protocol сервер для работы с PouchDB
- **Функции**: CRUD операции, статистика, аналитика
- **Подключение**: HTTP к CouchDB

### Скрипты инициализации
- **init-couchdb.js**: Создание баз данных и индексов
- **check-couchdb.js**: Проверка состояния системы
- **test-mcp-direct.js**: Тестирование подключений

## 🔐 Доступ к сервисам

### CouchDB
- **URL**: http://localhost:5984
- **Пользователь**: admin
- **Пароль**: admin123

### Fauxton (веб-интерфейс)
- **URL**: http://localhost:8888
- **Пользователь**: admin
- **Пароль**: admin123

## 📊 Базы данных

Система создает следующие базы данных:
- `users` - пользователи системы
- `projects` - проекты
- `time_entries` - временные записи
- `invoices` - счета
- `payments` - платежи
- `settings` - настройки системы

## 🧪 Тестирование

### Тест подключения к CouchDB
```bash
cd infrastructure
node test-mcp-direct.js
```

### Проверка состояния базы данных
```bash
cd infrastructure/scripts
npm run check
```

## 🚨 Устранение неполадок

### Проблемы с Docker
```bash
# Проверка статуса контейнеров
cd infrastructure/docker
docker compose ps

# Просмотр логов
docker compose logs

# Перезапуск
docker compose restart
```

### Проблемы с MCP сервером
```bash
# Пересборка
cd infrastructure/mcp-server
npm run build

# Запуск в режиме отладки
npm run dev:couchdb
```

### Проблемы с базой данных
```bash
# Переинициализация
cd infrastructure/scripts
npm run init

# Проверка состояния
npm run check
```

## 🔄 Развертывание

### Локальная разработка
```bash
npm run system:start
```

### Продакшен
1. Измените пароли в `docker-compose.yml`
2. Настройте HTTPS
3. Ограничьте доступ по IP
4. Отключите Fauxton для безопасности

## 📚 Документация

- [Основной README](../README.md)
- [Команды управления системой](../SYSTEM-COMMANDS.md)
- [CouchDB настройка](../README-COUCHDB.md)

---

**Примечание**: Все команды управления инфраструктурой выполняются из корневой директории проекта через npm скрипты.
