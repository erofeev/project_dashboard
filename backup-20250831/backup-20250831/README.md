# 🚀 Wone IT - Business Solutions - Project Management

Прогрессивное веб-приложение (PWA) для комплексного управления проектами и финансовой аналитики с использованием PouchDB и CouchDB.

## 🎯 Основные возможности

- **Управление проектами** с полным жизненным циклом
- **Финансовая аналитика** и прогнозирование
- **Учет времени** сотрудников и расчет себестоимости
- **Управление счетами** и платежами
- **Интеграции** с OpenProject и ERM системами
- **PWA функциональность** с офлайн режимом
- **Glassmorphism дизайн** с современным UI/UX

## 🏗️ Архитектура

### База данных
- **Локальная разработка**: PouchDB + IndexedDB
- **Центральная БД**: CouchDB (Docker)
- **Веб-интерфейс**: Fauxton для управления данными
- **Синхронизация**: HTTP API + PouchDB Replication

### Технологический стек
- **Frontend**: Angular 20 + TypeScript
- **База данных**: PouchDB + CouchDB
- **Веб-интерфейс БД**: Fauxton
- **MCP сервер**: Node.js + Model Context Protocol
- **Контейнеризация**: Docker + Docker Compose

## 🚀 Быстрый старт

### 🎯 Один клик - запуск всей системы
```bash
npm run system:start
```
Запускает всю систему автоматически:
- Инициализирует базу данных
- Запускает CouchDB и Fauxton
- Запускает MCP сервер
- Запускает Angular приложение

### 🛑 Остановка системы
```bash
npm run system:stop
```

### 📊 Проверка статуса
```bash
npm run system:status
```

## 🔧 Команды управления системой

### Основные команды
- `npm run system:start` - запуск всей системы
- `npm run system:stop` - остановка всей системы
- `npm run system:status` - проверка статуса
- `npm run system:restart` - перезапуск системы
- `npm run system:test` - тестирование подключений

### Команды разработки
- `npm run dev:start` - быстрый старт для разработки
- `npm run dev:stop` - остановка разработки

### Мониторинг
- `npm run system:logs` - просмотр логов системы
- `npm run system:logs:couchdb` - логи CouchDB
- `npm run system:logs:fauxton` - логи Fauxton

### Утилиты
- `npm run system:info` - информация о сервисах
- `npm run system:clean` - полная очистка системы

📖 **Подробная документация**: [SYSTEM-COMMANDS.md](SYSTEM-COMMANDS.md)

## 📊 Проверка работы

### Через веб-интерфейс
- **CouchDB API**: http://localhost:5984
- **Fauxton (веб-интерфейс)**: http://localhost:8888
- **Angular App**: http://localhost:4200

### Через MCP сервер
MCP сервер предоставляет инструменты для работы с базой данных:

```bash
# Тестирование подключения
npm run system:test

# Проверка статистики
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"get_database_stats"}}'
```

## 🔧 Конфигурация

### CouchDB настройки
- **Порт**: 5984
- **Пользователь**: admin
- **Пароль**: admin123
- **Базы данных**: users, projects, time_entries, invoices, payments, settings

### Fauxton настройки
- **Порт**: 8888
- **Доступ**: http://localhost:8888
- **Пользователь**: admin
- **Пароль**: admin123
- **Функции**: управление документами, запросы, мониторинг

### MCP сервер
- **Протокол**: Model Context Protocol
- **Подключение**: HTTP к CouchDB
- **Инструменты**: CRUD операции, статистика, аналитика

## 📁 Структура проекта

```
├── src/                    # Angular приложение
├── infrastructure/         # Инфраструктура проекта
│   ├── docker/             # Docker конфигурация
│   │   └── docker-compose.yml
│   ├── mcp-server/         # MCP сервер для PouchDB
│   ├── scripts/            # Скрипты инициализации
│   ├── test-mcp-direct.js  # Тест подключения к CouchDB
│   └── README.md           # Документация инфраструктуры
├── .doc/                   # 📚 Полная документация проекта
│   ├── technical-specs/    # Техническое задание
│   ├── architecture/       # Системная архитектура
│   ├── design/             # Дизайн-система
│   ├── algorithms/         # Алгоритмы и расчеты
│   ├── diagrams/           # Схемы и диаграммы
│   ├── api/                # API документация
│   ├── development/        # Руководство по разработке
│   ├── deployment/         # Руководство по развертыванию
│   └── user-guide/         # Пользовательское руководство
├── README-COUCHDB.md       # Детальная документация по CouchDB
├── SYSTEM-COMMANDS.md      # Команды управления системой
└── package.json            # Основной package.json с командами
```

## 🔄 Синхронизация данных

### Локальная разработка
- Angular приложение использует IndexedDB
- MCP сервер подключается к CouchDB
- Fauxton предоставляет веб-интерфейс для управления
- Данные синхронизируются по требованию

### Продакшен
- CouchDB размещается в облаке
- PWA подключается к облачной БД
- Fauxton может быть отключен для безопасности
- Автоматическая синхронизация

## 🚨 Устранение неполадок

### Быстрая диагностика
```bash
# Проверка статуса всех сервисов
npm run system:status

# Просмотр логов
npm run system:logs

# Тестирование подключений
npm run system:test
```

### CouchDB не запускается
```bash
# Проверка логов
npm run system:logs:couchdb

# Перезапуск
npm run system:restart
```

### Fauxton не доступен
```bash
# Проверка логов
npm run system:logs:fauxton

# Проверка доступности
curl http://localhost:8888
```

### Проблемы с MCP сервером
```bash
# Проверка подключения
npm run system:test

# Пересборка
cd infrastructure/mcp-server && npm run build
```

### Ошибки Angular приложения
```bash
# Очистка кэша
npm run clean

# Переустановка зависимостей
rm -rf node_modules && npm install
```

## 📈 Мониторинг

### Метрики CouchDB
- Количество документов по базам
- Размер баз данных
- Время ответа на запросы

### Логи системы
```bash
# CouchDB логи
npm run system:logs:couchdb

# Fauxton логи
npm run system:logs:fauxton

# MCP сервер логи
cd infrastructure/mcp-server && npm run start:couchdb
```

## 🔐 Безопасность

### Разработка
- Базовые учетные данные (admin/admin123)
- Локальный доступ только

### Продакшен
- Смена паролей по умолчанию
- HTTPS настройка
- Ограничение доступа по IP
- Брандмауэр и VPN
- Отключение Fauxton для безопасности

## 🌐 Веб-интерфейс Fauxton

### Возможности:
- **Просмотр документов** - удобный интерфейс для работы с данными
- **Управление БД** - создание, удаление, репликация баз данных
- **Запросы** - выполнение Mango запросов к базе данных
- **Мониторинг** - просмотр статистики и метрик

### Доступ:
1. Откройте http://localhost:8888
2. Войдите с учетными данными **admin / admin123**
3. Перейдите в раздел "Databases"
4. Выберите нужную базу данных

## 📚 Полная документация

### 🎯 Техническое задание
- [Техническое задание](.doc/technical-specs/technical-requirements.md) - полное ТЗ с цветными комментариями о выполненных задачах
- [Техническое задание (оригинал)](BLOG.md) - оригинальное ТЗ

### 🏗️ Архитектура и дизайн
- [Системная архитектура](.doc/architecture/system-architecture.md) - детальная архитектура системы
- [Дизайн-система Glassmorphism](.doc/design/design-system.md) - полная дизайн-система
- [Визуальные схемы и диаграммы](.doc/diagrams/system-diagrams.md) - Mermaid диаграммы архитектуры

### 🔧 Разработка и API
- [Руководство по разработке](.doc/development/development-guide.md) - стандарты кодирования и архитектура
- [API документация](.doc/api/api-documentation.md) - полное описание API системы
- [Алгоритмы финансовых расчетов](.doc/algorithms/financial-calculations.md) - математические алгоритмы

### 🚀 Развертывание и эксплуатация
- [Руководство по развертыванию](.doc/deployment/deployment-guide.md) - инструкции по развертыванию
- [Пользовательское руководство](.doc/user-guide/user-manual.md) - руководство для пользователей

### 📖 Дополнительная документация
- [План реализации](IMPLEMENTATION_STEPS.md) - этапы разработки
- [Интеграция PouchDB](REAL_POUCHDB_INTEGRATION.md) - детали интеграции
- [CouchDB настройка](README-COUCHDB.md) - настройка базы данных
- [Команды управления системой](SYSTEM-COMMANDS.md) - команды для управления
- [Инфраструктура](infrastructure/README.md) - документация инфраструктуры

## 🤝 Вклад в проект

1. Fork репозитория
2. Создание feature branch
3. Коммит изменений
4. Push в branch
5. Создание Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.

## 👥 Команда

- **Разработчик**: Andrey Erofev
- **Компания**: Wone IT - Business Solutions

---

**Статус**: В разработке  
**Версия**: 0.0.0  
**Последнее обновление**: Август 2025