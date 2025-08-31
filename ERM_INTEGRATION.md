# 🔄 Интеграция с EasyRedmine

## 📋 Обзор

Полная интеграция с системой EasyRedmine для автоматической синхронизации данных пользователей, проектов, временных записей и активностей.

## 🏗️ Архитектура

### Основные компоненты:

1. **ERMWorkerService** - основной сервис для синхронизации
2. **PouchDBService** - расширенный сервис для работы с локальными данными
3. **ERMSyncComponent** - UI компонент для управления синхронизацией
4. **McpPouchDBService** - адаптер для интеграции с существующими компонентами

## 🔄 Поток данных

```
EasyRedmine API → ERMWorkerService → PouchDBService → Локальная база данных
                                    ↓
                              ERMSyncComponent (UI)
```

### Этапы синхронизации:

1. **Инициализация** - проверка подключения и загрузка конфигурации
2. **Синхронизация** - параллельная загрузка пользователей, проектов и временных записей
3. **Кэширование** - сохранение данных в PouchDB для быстрого доступа
4. **Автосинхронизация** - фоновое обновление по расписанию

## 🎯 Ключевые особенности

- ✅ **Не использует MCP сервер** - работает напрямую через REST API
- ✅ **Реактивное состояние** - Angular сигналы для отслеживания статуса
- ✅ **Обработка ошибок** - детальное логирование и уведомления
- ✅ **Производительность** - пакетная загрузка и параллельная обработка
- ✅ **Безопасность** - безопасное хранение API ключей в localStorage
- ✅ **Автосинхронизация** - настраиваемый интервал обновления

## 📊 Что синхронизируется

### Пользователи
- ID, логин, имя, email
- Статус и даты создания/последнего входа
- Синхронизация в базу `users`

### Проекты
- ID, название, описание, статус
- Идентификатор и публичность
- Синхронизация в базу `projects`

### Временные записи
- ID, проект, пользователь, активность
- Часы, дата, комментарии
- Синхронизация в базу `time_entries`

### Активности
- ID, название, статус по умолчанию
- Синхронизация в базу `activities`

## 🚀 Использование

### 1. Настройка конфигурации

```typescript
// В ERMSyncComponent
configForm: ERMConfig = {
  apiUrl: 'https://your-redmine.com',
  apiKey: 'your-api-key',
  syncInterval: 30, // минуты
  enabled: true
};
```

### 2. Запуск синхронизации

```typescript
// Ручная синхронизация
await this.ermWorkerService.startSync();

// Принудительная синхронизация
await this.ermWorkerService.forceSync();
```

### 3. Мониторинг статуса

```typescript
// Получение статуса
const status = this.ermWorkerService.getSyncStatus();

// Подписка на изменения
this.ermWorkerService.syncStatus.subscribe(status => {
  console.log('Статус синхронизации:', status);
});
```

## 🔧 API методы

### ERMWorkerService

```typescript
// Конфигурация
updateConfig(config: Partial<ERMConfig>): void
getConfig(): ERMConfig

// Синхронизация
startSync(): Promise<void>
stopSync(): Promise<void>
forceSync(): Promise<void>
testConnection(): Promise<boolean>

// Данные
getSyncStats(): Promise<any>
clearData(): Promise<void>

// Статус
getSyncStatus(): SyncStatus
```

### PouchDBService

```typescript
// Основные операции
createDocument<T>(dbName: string, doc: T): Promise<T>
getDocument<T>(dbName: string, id: string): Promise<T | null>
updateDocument<T>(dbName: string, doc: T): Promise<T>
deleteDocument(dbName: string, id: string): Promise<void>

// Upsert операции
upsertDocument<T>(dbName: string, id: string, data: Partial<T>): Promise<T>
bulkUpsert<T>(dbName: string, documents: T[]): Promise<T[]>

// Поиск и фильтрация
findDocuments<T>(dbName: string, query: PouchDBQuery): Promise<T[]>
searchDocuments<T>(dbName: string, searchTerm: string, fields: string[]): Promise<T[]>

// Статистика
getDocumentCount(dbName: string): Promise<number>
getAllDocuments<T>(dbName: string, limit?: number): Promise<T[]>

// Очистка
clearDatabase(dbName: string): Promise<void>
```

## 🎨 UI компоненты

### ERMSyncComponent

Полнофункциональный интерфейс для управления синхронизацией:

- **Конфигурация подключения** - настройка API URL и ключа
- **Управление синхронизацией** - запуск, остановка, принудительная синхронизация
- **Мониторинг статуса** - отображение прогресса и ошибок
- **Статистика данных** - количество синхронизированных записей
- **Тестирование подключения** - проверка доступности API

## 📱 Интеграция в приложение

### 1. Добавление в маршруты

```typescript
// app.routes.ts
{ 
  path: 'sync/erm', 
  loadComponent: () => import('./features/sync/erm-sync.component').then(c => c.ERMSyncComponent)
}
```

### 2. Добавление в меню

```typescript
// app.menu.ts
{
  label: 'Синхронизация',
  items: [
    { 
      label: 'EasyRedmine', 
      icon: 'pi pi-fw pi-sync', 
      routerLink: ['/sync/erm'],
      badge: 'NEW',
      badgeClass: 'p-badge-success'
    }
  ]
}
```

### 3. Использование в компонентах

```typescript
// В любом компоненте
constructor(private ermWorkerService: ERMWorkerService) {}

async loadData() {
  const stats = await this.ermWorkerService.getSyncStats();
  console.log('Статистика синхронизации:', stats);
}
```

## 🔒 Безопасность

- API ключи хранятся в localStorage (зашифрованы)
- Все HTTP запросы используют HTTPS
- Валидация входных данных
- Обработка ошибок без раскрытия чувствительной информации

## 📈 Производительность

- **Пакетная загрузка** - данные загружаются порциями
- **Параллельная обработка** - одновременная синхронизация разных типов данных
- **Кэширование** - локальное хранение для быстрого доступа
- **Индексы** - оптимизированный поиск в PouchDB
- **Автосинхронизация** - фоновое обновление без блокировки UI

## 🐛 Обработка ошибок

- Детальное логирование всех операций
- Повторные попытки при временных сбоях
- Уведомления пользователя об ошибках
- Graceful degradation при недоступности API

## 📋 Требования

- Angular 20+
- PouchDB
- EasyRedmine с включенным REST API
- Валидный API ключ

## 🚀 Готово к использованию

Интеграция полностью готова и может быть использована в вашем PWA приложении. 

**Доступные маршруты:**
- `/sync/erm` - Управление синхронизацией с EasyRedmine

**Следующие шаги:**
1. Настройте конфигурацию EasyRedmine в ERMSyncComponent
2. Протестируйте подключение
3. Запустите первую синхронизацию
4. Настройте автоматическую синхронизацию

Интеграция обеспечивает полную синхронизацию данных между EasyRedmine и вашим аналитическим порталом с сохранением всех glassmorphism эффектов и современного дизайна Sakai PrimeNG.
