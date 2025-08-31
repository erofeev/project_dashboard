# Интеграция с EasyRedmine

## Обзор

Этот модуль обеспечивает интеграцию PWA приложения с EasyRedmine через REST API. Интеграция включает:

- **ERMWorkerService** - основной сервис для синхронизации данных
- **ERMSyncComponent** - UI компонент для управления синхронизацией
- **Автоматическая синхронизация** - фоновое обновление данных
- **Локальное кэширование** - хранение данных в PouchDB

## Архитектура

### 1. ERMWorkerService

Основной сервис для работы с EasyRedmine:

```typescript
// Запуск полной синхронизации
await ermWorkerService.startFullSync();

// Получение статуса синхронизации
const status = ermWorkerService.getSyncStatus();

// Обновление конфигурации
ermWorkerService.updateSyncConfig({
  autoSync: true,
  syncInterval: 30, // минуты
  syncUsers: true,
  syncProjects: true,
  syncTimeEntries: true
});
```

### 2. Синхронизация данных

Сервис синхронизирует следующие типы данных:

- **Пользователи** - из ERM в PouchDB
- **Проекты** - из ERM в PouchDB  
- **Временные записи** - из ERM в PouchDB

### 3. Автоматическая синхронизация

- Настраиваемый интервал (5-1440 минут)
- Фоновая работа без блокировки UI
- Обработка ошибок и повторные попытки

## Использование

### 1. Инициализация

```typescript
// В app.config.ts или main.ts
import { ERMWorkerService } from './core/services/erm-worker.service';

// Сервис автоматически инициализируется при первом использовании
```

### 2. Настройка конфигурации

```typescript
// Обновление конфигурации синхронизации
ermWorkerService.updateSyncConfig({
  autoSync: true,
  syncInterval: 30,
  syncUsers: true,
  syncProjects: true,
  syncTimeEntries: true,
  dateRange: {
    from: '2024-01-01',
    to: '2024-12-31'
  },
  userFilter: ['Иван Иванов', 'Петр Петров'] // опционально
});
```

### 3. Мониторинг статуса

```typescript
// Подписка на изменения статуса
ermWorkerService.syncStatus$.subscribe(status => {
  console.log('Статус синхронизации:', status);
  
  if (status.isRunning) {
    console.log(`Прогресс: ${status.progress}%`);
    console.log(`Текущая задача: ${status.currentTask}`);
  }
  
  if (status.error) {
    console.error('Ошибка синхронизации:', status.error);
  }
});
```

### 4. Управление синхронизацией

```typescript
// Запуск синхронизации
try {
  await ermWorkerService.startFullSync();
} catch (error) {
  console.error('Ошибка синхронизации:', error);
}

// Остановка синхронизации
ermWorkerService.stopSync();

// Очистка данных
await ermWorkerService.clearSyncData();

// Проверка подключения
const isConnected = await ermWorkerService.checkConnection();
```

## Конфигурация

### 1. Настройки ERM

Конфигурация EasyRedmine настраивается через `ConfigService`:

```typescript
// В config.service.ts
getERMConfig(): {
  baseUrl: string;
  apiKey: string;
  startDate: string;
  endDate: string;
  projectId?: string;
}
```

### 2. Настройки синхронизации

```typescript
interface SyncConfig {
  autoSync: boolean;           // Автоматическая синхронизация
  syncInterval: number;        // Интервал в минутах
  syncUsers: boolean;          // Синхронизировать пользователей
  syncProjects: boolean;       // Синхронизировать проекты
  syncTimeEntries: boolean;    // Синхронизировать временные записи
  dateRange: {                 // Диапазон дат
    from: string;
    to: string;
  };
  userFilter?: string[];       // Фильтр пользователей
}
```

## UI Компонент

### ERMSyncComponent

Компонент предоставляет полный интерфейс для управления синхронизацией:

- **Статус подключения** - проверка связи с EasyRedmine
- **Статус синхронизации** - текущий прогресс и состояние
- **Конфигурация** - настройки автоматической синхронизации
- **Управление** - запуск/остановка/очистка
- **Статистика** - количество синхронизированных данных

### Использование компонента

```html
<!-- В любом компоненте -->
<app-erm-sync></app-erm-sync>
```

## Обработка ошибок

### 1. Ошибки подключения

- Автоматическая проверка подключения
- Уведомления пользователя
- Повторные попытки

### 2. Ошибки синхронизации

- Детальное логирование
- Уведомления об ошибках
- Возможность повторного запуска

### 3. Ошибки данных

- Валидация данных
- Пропуск некорректных записей
- Логирование проблемных записей

## Производительность

### 1. Оптимизации

- Пакетная загрузка данных (100 записей за раз)
- Кэширование справочников
- Индексы в PouchDB для быстрого поиска

### 2. Мониторинг

- Прогресс-бар для длительных операций
- Статистика производительности
- Логирование времени выполнения

## Безопасность

### 1. API ключи

- Безопасное хранение в конфигурации
- Не передаются в UI компоненты
- Шифрование при необходимости

### 2. Данные

- Локальное хранение в PouchDB
- Возможность очистки данных
- Контроль доступа

## Развертывание

### 1. Требования

- Angular 17+
- PrimeNG компоненты
- PouchDB для локального хранения
- HTTP клиент для API запросов

### 2. Настройка

1. Настройте конфигурацию EasyRedmine в `ConfigService`
2. Инициализируйте `PouchDBService`
3. Добавьте `ERMSyncComponent` в нужные страницы
4. Настройте автоматическую синхронизацию

### 3. Мониторинг

- Проверяйте логи синхронизации
- Мониторьте статус подключения
- Отслеживайте производительность

## Устранение неполадок

### 1. Проблемы подключения

```typescript
// Проверка конфигурации
const config = configService.getERMConfig();
console.log('ERM Config:', config);

// Тест подключения
const isConnected = await ermWorkerService.checkConnection();
console.log('Подключение:', isConnected);
```

### 2. Проблемы синхронизации

```typescript
// Проверка статуса
const status = ermWorkerService.getSyncStatus();
console.log('Статус синхронизации:', status);

// Очистка и повторная синхронизация
await ermWorkerService.clearSyncData();
await ermWorkerService.startFullSync();
```

### 3. Проблемы данных

```typescript
// Проверка статистики
const stats = await ermWorkerService.getSyncStats();
console.log('Статистика:', stats);

// Проверка PouchDB
const pouchStats = await pouchdbService.getDatabaseStats();
console.log('PouchDB статистика:', pouchStats);
```

## Будущие улучшения

- [ ] Web Workers для фоновой синхронизации
- [ ] Инкрементальная синхронизация
- [ ] Синхронизация в реальном времени
- [ ] Расширенная аналитика
- [ ] Экспорт/импорт конфигурации
- [ ] Множественные источники данных
