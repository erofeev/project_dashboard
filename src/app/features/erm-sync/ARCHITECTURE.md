# Архитектура интеграции с EasyRedmine

## Общая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                        PWA Application                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │ ERMSyncComponent│    │ ERMWorkerService│    │ ERMService   │ │
│  │ (UI Management) │◄──►│ (Sync Logic)    │◄──►│ (API Client) │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                       │      │
│           │                       │                       │      │
│           ▼                       ▼                       ▼      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │ Notification    │    │ PouchDBService  │    │ ConfigService│ │
│  │ Service         │    │ (Local Storage) │    │ (Settings)   │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EasyRedmine REST API                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ /projects    │ │ /users       │ │ /time_entries│            │
│  │ /issues      │ │ /activities  │ │ /easy_queries│            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Поток данных

### 1. Инициализация

```
App Start → ConfigService → ERMWorkerService → PouchDBService
    ↓
Check Connection → ERMService → EasyRedmine API
    ↓
Load Config → Auto-sync Setup
```

### 2. Синхронизация данных

```
User Action/Trigger → ERMWorkerService.startFullSync()
    ↓
Check Connection → ERMService.testConnection()
    ↓
Refresh Service Data → ERMService.refreshServiceData()
    ↓
Parallel Sync:
├── Sync Users → ERMService.getUsers() → PouchDBService.upsertDocument()
├── Sync Projects → ERMService.getProjects() → PouchDBService.upsertDocument()
└── Sync Time Entries → ERMService.getTimeEntries() → PouchDBService.upsertDocument()
    ↓
Update Status → NotificationService → UI Update
```

### 3. Автоматическая синхронизация

```
Timer (30 min) → ERMWorkerService.autoSync()
    ↓
Check if Running → Skip if Active
    ↓
Start Full Sync → Same as Manual Sync
    ↓
Update Last Sync Time
```

## Компоненты системы

### 1. ERMSyncComponent (UI Layer)

**Ответственность:**
- Отображение статуса синхронизации
- Управление конфигурацией
- Запуск/остановка синхронизации
- Отображение статистики

**Взаимодействие:**
- Подписывается на `ERMWorkerService.syncStatus$`
- Вызывает методы `ERMWorkerService`
- Отображает уведомления через `NotificationService`

### 2. ERMWorkerService (Business Logic)

**Ответственность:**
- Управление процессом синхронизации
- Конфигурация автоматической синхронизации
- Обработка ошибок и повторных попыток
- Предоставление статуса синхронизации

**Взаимодействие:**
- Использует `ERMService` для API вызовов
- Использует `PouchDBService` для локального хранения
- Использует `NotificationService` для уведомлений
- Предоставляет сигналы для UI

### 3. ERMService (API Client)

**Ответственность:**
- HTTP запросы к EasyRedmine API
- Кэширование справочников
- Обработка API ошибок
- Преобразование данных

**Взаимодействие:**
- Использует `ConfigService` для настроек
- Использует `HttpClient` для запросов
- Предоставляет методы для получения данных

### 4. PouchDBService (Data Layer)

**Ответственность:**
- Локальное хранение данных
- CRUD операции
- Индексы для быстрого поиска
- Синхронизация с удаленным CouchDB

**Взаимодействие:**
- Предоставляет методы для работы с документами
- Управляет несколькими базами данных
- Обеспечивает целостность данных

## Потоки данных

### 1. Входящие данные (ERM → PWA)

```
EasyRedmine API → ERMService → ERMWorkerService → PouchDBService → Local Storage
```

**Типы данных:**
- Пользователи (users)
- Проекты (projects)
- Временные записи (time_entries)
- Задачи (issues)
- Активности (activities)

### 2. Исходящие данные (PWA → ERM)

```
Local Changes → PouchDBService → ERMWorkerService → ERMService → EasyRedmine API
```

**Примечание:** В текущей реализации только чтение данных из ERM

### 3. Конфигурация

```
User Input → ERMSyncComponent → ERMWorkerService → ConfigService → Local Storage
```

## Обработка ошибок

### 1. Ошибки подключения

```
API Error → ERMService.handleError() → ERMWorkerService → NotificationService → UI
```

**Типы ошибок:**
- 401: Неверный API ключ
- 404: Сервер недоступен
- 0: CORS или сетевые проблемы

### 2. Ошибки синхронизации

```
Sync Error → ERMWorkerService → Update Status → NotificationService → UI
```

**Обработка:**
- Логирование ошибки
- Обновление статуса
- Уведомление пользователя
- Возможность повторного запуска

### 3. Ошибки данных

```
Data Error → Validation → Skip Invalid → Log Warning → Continue Sync
```

## Производительность

### 1. Оптимизации

- **Пакетная загрузка:** 100 записей за раз
- **Параллельная синхронизация:** Пользователи, проекты, записи одновременно
- **Кэширование:** Справочники в памяти
- **Индексы:** Быстрый поиск в PouchDB

### 2. Мониторинг

- **Прогресс-бар:** Отображение текущего прогресса
- **Статистика:** Количество обработанных записей
- **Логирование:** Время выполнения операций

## Безопасность

### 1. API ключи

- Хранение в `ConfigService`
- Не передаются в UI
- Шифрование при необходимости

### 2. Данные

- Локальное хранение в PouchDB
- Возможность очистки
- Контроль доступа

## Масштабируемость

### 1. Горизонтальное масштабирование

- Независимые компоненты
- Асинхронная обработка
- Обработка больших объемов данных

### 2. Вертикальное масштабирование

- Оптимизация запросов
- Кэширование
- Ленивая загрузка

## Мониторинг и отладка

### 1. Логирование

```typescript
// Уровни логирования
console.log('Info: Sync started');
console.warn('Warning: Invalid data skipped');
console.error('Error: Connection failed');
```

### 2. Метрики

- Время синхронизации
- Количество записей
- Частота ошибок
- Использование памяти

### 3. Отладка

```typescript
// Проверка статуса
const status = ermWorkerService.getSyncStatus();
console.log('Sync Status:', status);

// Проверка конфигурации
const config = ermWorkerService.getSyncConfig();
console.log('Sync Config:', config);

// Проверка статистики
const stats = await ermWorkerService.getSyncStats();
console.log('Sync Stats:', stats);
```

## Будущие улучшения

### 1. Web Workers

```
Main Thread → Web Worker → ERMWorkerService → Background Sync
```

### 2. Инкрементальная синхронизация

```
Last Sync Time → Only New/Modified Data → Faster Sync
```

### 3. Real-time синхронизация

```
WebSocket → Live Updates → Real-time Data
```

### 4. Множественные источники

```
ERM + Other Systems → Unified Data → Single Interface
```
