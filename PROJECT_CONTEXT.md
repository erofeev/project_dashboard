# PWA Project Analytics - Контекст проекта для AI разработки

## 🎯 ТЕХНИЧЕСКОЕ ЗАДАНИЕ

### Основная цель
Разработать PWA приложение для управления проектами с финансовой аналитикой, включающее:

1. **Исторические ставки сотрудников** - поддержка изменения зарплат/рейтов во времени с датами начала/окончания действия
2. **3D анимированный ландшафт-фон** - динамическая сетка точек с волновой анимацией (БЕЗ падающих капель)
3. **Premium Glassmorphism UI** - изысканный стеклянный дизайн для руководителей (утонченный, не кричащий)
4. **Календарное управление** - рабочие часы по месяцам хранятся в PouchDB как системные данные
5. **ERM интеграция (ПРИОРИТЕТ)** - подключение к EasyRedmine для загрузки реальных данных

### Ключевые технические требования
- **Angular 18+** с TypeScript
- **PrimeNG 20+** для всех UI компонентов (ВСЕГДА использовать PrimeNG!)
- **Sakai Template** как основа дизайна
- **PouchDB** для локального хранения данных
- **Three.js** для 3D фона
- **@primeuix/themes** для кастомизации тем

## 🏗️ АРХИТЕКТУРА ПРОЕКТА

### Структура сервисов

#### Core Services
- `PouchDBService` - центральный сервис БД с методами:
  - `initializeDatabases()` - инициализация 5 БД: users, projects, time_entries, invoices, payments, activities
  - `getSystemCalendar()`, `saveSystemCalendar()` - работа с календарем как системными данными
  - `upsertDocument()`, `getDocument()`, `deleteDocument()`, `clearDatabase()` - CRUD операции
  - **ВАЖНО**: отключена синхронизация с CouchDB для development

- `ConfigService` - управление конфигурацией:
  - `UserRate` интерфейс с `startDate`/`endDate` для исторических ставок
  - `getERMConfig()` - возвращает **реальный пользовательский URL** (https://easyredmine.awara.pro)
  - `getRatesForDate()` - расчет ставки на конкретную дату

- `ERMService` - интеграция с EasyRedmine:
  - `getBaseUrl()` - **автоматически заменяет внешние URL на `/api/erm` для прокси**
  - `extractUsersFromIssues()` - извлечение "наших" сотрудников из задач (как в Excel макросе)
  - `executeLoadingStrategy()` - 3 стратегии загрузки: `'projects'`, `'users'`, `'full'`
  - `saveMasterDataToDB()` - ВСЕГДА сохраняет справочники (users, projects, activities)
  - `saveSelectedDataToDB()` - сохраняет time_entries только для выбранных пользователей/проектов
  - `testConnection()` - тест подключения через `getProjects(1, 0)`

- `InitializationService` - инициализация приложения:
  - **КРИТИЧНО**: вызывает `await this.pouchDBService.initializeDatabases()` перед загрузкой данных
  - сохраняет конфигурацию с **реальным пользовательским URL**: `baseUrl: 'https://easyredmine.awara.pro'`

- `Three3DService` - 3D фон:
  - `enableDroplets: false` - капли ОТКЛЮЧЕНЫ
  - `particleSize: 4.0` - увеличенный размер точек
  - камера ближе: `camera.position.set(0, 15, 12)`

### CORS прокси конфигурация

#### proxy.conf.json
```json
{
  "/api/erm/*": {
    "target": "https://easyredmine.awara.pro",
    "secure": false,  // ВАЖНО: отключено из-за проблем с SSL сертификатом
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": { "^/api/erm": "" }
  }
}
```

#### angular.json
```json
"development": {
  "proxyConfig": "proxy.conf.json"
}
```

### ERM интеграция - логика из Excel макроса

#### Стратегии загрузки данных:
1. **"Quick Load Master Data"** - загрузка справочников (users, projects, activities) + ВСЕГДА сохраняем в БД
2. **"Load by Projects"** - получаем все проекты → для каждого проекта получаем time_entries
3. **"Quick Time Entries for Users"** - для выбранных пользователей получаем их time_entries за период

#### Селективное сохранение:
- **Справочники** (users, projects, activities) - ВСЕГДА сохраняем полностью
- **Time entries** - сохраняем только для пользователей/проектов выбранных пользователем в UI

#### Обнаружение "наших" сотрудников:
```typescript
// Извлекаем пользователей из всех доступных issues (как в Excel макросе)
const issues = await this.getIssues();
const users = this.extractUsersFromIssues(issues);
```

## 🎨 UI/UX ДИЗАЙН

### Glassmorphism Theme
- Применен к компоненту Settings: `src/app/features/settings/settings.component.scss`
- Используется Sakai template как основа
- **ВСЕГДА используем PrimeNG компоненты** - проверяем через MCP server

### 3D Background
- Сетка анимированных точек без капель
- Размер точек: 4.0
- Камера приближена для лучшего восприятия

### MCP серверы для PrimeNG
```json
{
  "mcpServers": {
    "primeng": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "infrastructure/mcp-server/primeng-mcp-server"
    }
  }
}
```

## ✅ РЕАЛИЗОВАННЫЕ ФУНКЦИИ

### База данных
- [x] PouchDB с 5 базами данных
- [x] SystemCalendar для общих календарных данных
- [x] Отключена синхронизация с CouchDB для development
- [x] CRUD методы для всех сущностей

### ERM интеграция  
- [x] CORS прокси настроен (`secure: false` для SSL проблем)
- [x] Логика извлечения пользователей из issues
- [x] 3 стратегии загрузки данных
- [x] Селективное сохранение данных
- [x] UI для выбора пользователей и проектов
- [x] Тест подключения к ERM

### UI компоненты
- [x] Settings компонент с ERM интеграцией
- [x] Glassmorphism стили для Settings
- [x] Кнопки для разных стратегий загрузки
- [x] Чекбоксы для выбора пользователей
- [x] Статус панель ERM интеграции

### 3D фон
- [x] Three.js сетка точек
- [x] Волновая анимация
- [x] Отключены падающие капли  
- [x] Увеличены точки до размера 4.0
- [x] Камера приближена

## 🐛 ИЗВЕСТНЫЕ ПРОБЛЕМЫ И РЕШЕНИЯ

### 1. CORS ошибки с EasyRedmine
**Проблема**: `Access to XMLHttpRequest blocked by CORS policy`
**Решение**: 
- Настроен Angular proxy `/api/erm/*` → `https://easyredmine.awara.pro`
- `secure: false` из-за проблем с SSL сертификатом
- В коде автоматическая замена внешних URL на прокси

### 2. SSL Certificate проблемы
**Проблема**: `SSL certificate problem: unable to get local issuer certificate`
**Решение**: Установлен `"secure": false` в proxy.conf.json

### 3. Историческиe ставки
**Проблема**: Были ошибки с интерфейсом `UserRate`
**Решение**: Изменен на `startDate`/`endDate` вместо `dateFrom`

### 4. PouchDB инициализация
**Проблема**: `База пользователей не инициализирована`
**Решение**: Добавлен явный `await this.pouchDBService.initializeDatabases();`

## 🎯 ТЕКУЩИЙ СТАТУС И ЗАДАЧИ

### Последнее состояние:
- ✅ Исправлена передача пользовательского URL в ERM сервис
- ✅ Настроен CORS прокси с `secure: false`
- ⚠️ Получена ошибка 500 Internal Server Error при тесте подключения
- 🔄 Приложение перезапущено с новой конфигурацией прокси

### Следующие шаги:
1. **ПРИОРИТЕТ**: Отладить подключение к ERM API (ошибка 500)
2. Протестировать все стратегии загрузки данных
3. Проверить селективное сохранение данных
4. Улучшить glassmorphism стили для других компонентов
5. Добавить обработку больших объемов данных ERM

## 📋 ПРАВИЛА РАЗРАБОТКИ

### КРИТИЧНЫЕ ПРАВИЛА (НЕ НАРУШАТЬ):
1. **ВСЕГДА используйте PrimeNG компоненты** - проверяйте через MCP server
2. **НЕ УДАЛЯЙТЕ реализованные функции ERM интеграции** - только дополняйте
3. **Сохраняйте архитектуру прокси**: пользовательский URL → автозамена → прокси
4. **НЕ включайте падающие капли** в 3D фоне (`enableDroplets: false`)
5. **Календарные данные ТОЛЬКО в PouchDB**, НЕ в localStorage
6. **Справочники ВСЕГДА сохраняем**, time_entries - селективно

### Файловая структура (НЕ ИЗМЕНЯТЬ):
```
src/app/
├── core/services/
│   ├── pouchdb.service.ts        # Центральная БД
│   ├── config.service.ts         # Конфигурация
│   ├── erm.service.ts           # EasyRedmine API  
│   ├── initialization.service.ts # Инициализация
│   └── three3d.service.ts       # 3D фон
├── features/settings/           # UI настроек
│   ├── settings.component.ts    # ERM интеграция UI
│   ├── settings.component.html  # Стратегии + выбор пользователей
│   └── settings.component.scss  # Glassmorphism стили
├── components/animated-landscape/ # 3D фон компонент
proxy.conf.json                   # CORS прокси
angular.json                       # Конфиг с прокси
```

### Интерфейсы данных (НЕ ИЗМЕНЯТЬ):
```typescript
// Исторические ставки
interface UserRate {
  startDate: Date | string;
  endDate?: Date | string | null;
  grossPerMonth?: number;
  hourlyRate?: number;
}

// ERM конфигурация  
interface ERMConfig {
  baseUrl: string;  // Пользовательский URL
  apiKey: string;
  startDate: string;
  endDate: string;
}

// Системный календарь
interface SystemCalendar {
  _id: string;
  year: number;
  monthlyHours: { [monthKey: string]: number };
  lastUpdated: string;
}
```

## 🔧 КОМАНДЫ ДЛЯ ЗАПУСКА

```bash
# Разработка
npm start                    # Angular + прокси
npm run build               # Продакшн сборка

# Отладка
npm run start:couchdb       # CouchDB (если нужен)
```

## 📞 КОНТАКТЫ И ССЫЛКИ

- **EasyRedmine**: https://easyredmine.awara.pro
- **API Key**: 763c9fa14fcc0343773389494e8ba3004ef3cd65
- **Локальный порт**: http://localhost:4200
- **Прокси эндпоинт**: http://localhost:4200/api/erm/*

---

**⚠️ ВАЖНО ДЛЯ AI РАЗРАБОТЧИКА**: 
- Этот файл содержит ПОЛНЫЙ контекст проекта
- НЕ удаляйте реализованные функции без явного указания
- Всегда проверяйте MCP server для PrimeNG компонентов
- При изменении архитектуры - обновите этот файл
- Текущая проблема: ошибка 500 при подключении к ERM через прокси

*Последнее обновление: 2025-01-20, статус: отладка ERM подключения*
