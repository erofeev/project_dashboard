# Project Management PWA

## Описание проекта

PWA веб-приложение для управления проектами с финансовой аналитикой, разработанное на Angular 17 с использованием PouchDB для локального хранения данных. Приложение поддерживает интеграции с OpenProject и ERM системами.

## 🚀 Особенности

### Архитектура
- **Frontend**: Angular 17 + TypeScript
- **База данных**: PouchDB (локальная + синхронизация)
- **Дизайн**: Glassmorphism с 3D эффектами
- **Мультиязычность**: Русский язык по умолчанию
- **PWA**: Полная поддержка Progressive Web App

### Финансовая модель
- Автоматический расчет дневных рейтов из ЗП сотрудников
- Расчет себестоимости проектов в реальном времени
- Прогнозирование маржинальности
- Анализ рентабельности по направлениям

### Роли пользователей
1. **Генеральный директор** - полный доступ ко всем данным
2. **Директор направления** - управление своим направлением
3. **Руководитель проекта** - управление назначенными проектами
4. **Сотрудник** - доступ согласно настройкам видимости

## 🛠 Технологии

- **Angular 17** - основной фреймворк
- **TypeScript** - типизированный JavaScript
- **PouchDB** - локальная база данных
- **SCSS** - препроцессор CSS
- **ngx-translate** - мультиязычность
- **Angular Material** - UI компоненты
- **Chart.js** - графики и диаграммы

## 📁 Структура проекта

```
project-management-pwa/
├── src/
│   ├── app/
│   │   ├── components/          # Angular компоненты
│   │   │   ├── dashboard/       # Дашборд
│   │   │   ├── projects/        # Управление проектами
│   │   │   ├── employees/       # Управление сотрудниками
│   │   │   ├── analytics/       # Финансовая аналитика
│   │   │   └── database-settings/ # Настройки БД
│   │   ├── models/              # TypeScript интерфейсы
│   │   ├── services/            # Бизнес-логика
│   │   │   ├── database.service.ts      # Основной сервис БД
│   │   │   ├── database-config.service.ts # Конфигурация PouchDB
│   │   │   └── database-migration.service.ts # Миграции БД
│   │   └── shared/              # Общие компоненты
│   ├── assets/
│   │   └── i18n/                # Файлы локализации
│   ├── styles/                  # SCSS стили
│   └── polyfills.ts             # Полифиллы для PouchDB
├── public/                       # PWA манифест и иконки
├── angular.json                  # Конфигурация Angular
├── IMPLEMENTATION_STEPS.md       # Детальная документация реализации
├── CHANGELOG.md                  # История изменений
├── REAL_POUCHDB_INTEGRATION.md  # Документация интеграции PouchDB
├── BLOG.md                       # 🚀 Блог разработчика
└── SUMMARY.md                    # Краткий обзор проекта
```

## 📚 Документация

- **[IMPLEMENTATION_STEPS.md](IMPLEMENTATION_STEPS.md)** - Детальный анализ выполнения ТЗ по этапам
- **[CHANGELOG.md](CHANGELOG.md)** - История всех изменений в проекте
- **[REAL_POUCHDB_INTEGRATION.md](REAL_POUCHDB_INTEGRATION.md)** - Техническая документация интеграции PouchDB
- **[BLOG.md](BLOG.md)** - 🚀 Блог разработчика о проблемах и решениях

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+ 
- npm 9+

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm start
```

### Сборка для продакшена
```bash
npm run build
```

### Запуск тестов
```bash
npm test
```

## 📊 Модели данных

### Пользователь (User)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  direction?: string;
  salary?: number;
  hourlyRate?: number;
  workingDaysPerMonth: number;
  isActive: boolean;
}
```

### Проект (Project)
```typescript
interface Project {
  id: string;
  name: string;
  direction: string;
  status: ProjectStatus;
  contractValue: number;
  plannedHours: number;
  actualHours: number;
  costPrice: number;
  margin: number;
  marginPercentage: number;
}
```

### Временная запись (TimeEntry)
```typescript
interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  hours: number;
  date: Date;
  calculatedCost: number;
  userHourlyRate: number;
}
```

## 🎨 Дизайн-система

### Glassmorphism
Приложение использует современный стеклянный дизайн с:
- Прозрачными элементами
- Эффектом размытия фона
- 3D трансформациями
- Адаптивной версткой

### Цветовая схема
- Основной фон: градиент сине-фиолетовый
- Элементы: полупрозрачные белые
- Акценты: неоновые эффекты

## 🔧 Конфигурация

### Мультиязычность
По умолчанию используется русский язык. Файлы локализации находятся в `src/assets/i18n/`.

### PWA настройки
- Service Worker автоматически регистрируется
- Манифест настроен для установки на устройство
- Иконки различных размеров включены

### База данных
PouchDB автоматически создает локальные базы:
- `users` - пользователи
- `projects` - проекты  
- `time_entries` - временные записи

## 📱 PWA возможности

- Установка на домашний экран
- Работа офлайн
- Push-уведомления
- Автоматическая синхронизация

## 🔌 Интеграции

### OpenProject
- Выгрузка проектов и структуры
- Синхронизация временных записей
- Маппинг пользователей

### ERM система
- Мастер-данные проектов
- Финансовые показатели
- Планирование ресурсов

## 📈 Финансовые расчеты

### Расчет рейтов
```typescript
// Дневной рейт из ЗП
dailyRate = salary / workingDaysPerMonth;

// Часовой рейт
hourlyRate = dailyRate / 8;
```

### Себестоимость проекта
```typescript
costPrice = timeEntries.reduce((sum, entry) => 
  sum + entry.calculatedCost, 0
);
```

### Маржа проекта
```typescript
margin = contractValue - costPrice;
marginPercentage = (margin / contractValue) * 100;
```

## 🧪 Тестирование

### Unit тесты
```bash
npm run test
```

### E2E тесты
```bash
npm run e2e
```

## 🚀 Развертывание

### Статический хостинг
```bash
npm run build
# Загрузить содержимое dist/ на хостинг
```

### Docker
```dockerfile
FROM nginx:alpine
COPY dist/project-management-pwa /usr/share/nginx/html
EXPOSE 80
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте feature ветку
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License

## 📞 Поддержка

По вопросам обращайтесь к команде разработки.

---

**Версия**: 0.1.0  
**Последнее обновление**: 19 декабря 2024  
**Статус**: Этап 1 завершен (90%), реальная PouchDB интегрирована ✅