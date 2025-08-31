# UI Style Guide - Wone IT Project Management

## 🎯 Глобальные правила дизайна

### 📏 Размеры компонентов
**ПРАВИЛО #1: Везде используем компактные размеры**
- Все PrimeNG компоненты должны использовать `size="small"`
- Кастомные компоненты должны следовать компактной парадигме
- Цель: максимальное использование экранного пространства

```typescript
// ✅ ПРАВИЛЬНО
<p-button size="small" label="Сохранить" />
<p-inputText size="small" />
<p-dropdown size="small" />

// ❌ НЕПРАВИЛЬНО
<p-button label="Сохранить" />  // размер по умолчанию слишком большой
```

### 🎨 Glassmorphism эффекты
**ПРАВИЛО #2: Единая стилистика glassmorphism**
- Прозрачность: 35% для основных элементов
- Размытие: 3px для всех glassmorphism элементов
- Границы: полупрозрачные с цветными акцентами

```scss
// Стандартный glassmorphism класс
.glassmorphism-element {
  background: rgba(30, 41, 59, 0.35);
  backdrop-filter: blur(3px);
  border: 1px solid rgba(59, 130, 246, 0.2);
}
```

### 🌓 Поддержка тем
**ПРАВИЛО #3: Обязательная поддержка светлой и темной темы**
- Все компоненты должны корректно работать в обеих темах
- Цвета берем из CSS переменных
- Тестируем переключение тем

```scss
/* Темная тема */
.theme-dark .component {
  background: rgba(30, 41, 59, 0.35);
  color: #f8fafc;
}

/* Светлая тема */
.theme-light .component {
  background: rgba(255, 255, 255, 0.35);
  color: #1e293b;
}
```

### 🌍 Локализация
**ПРАВИЛО #4: Поддержка русского и английского языков**
- Все тексты должны поддерживать RU/EN
- Используем условные выражения или ngx-translate
- Форматы дат, чисел, валют локализованы

```typescript
// ✅ ПРАВИЛЬНО
text: string = this.currentLang === 'ru' ? 'Сохранить' : 'Save';

// ✅ ИЛИ с ngx-translate
{{ 'BUTTON.SAVE' | translate }}
```

## 📊 Компоненты данных

### 📋 Таблицы
**Стандартная конфигурация для всех таблиц:**
```typescript
<p-table 
  [value]="data"
  [paginator]="true" 
  [rows]="25"
  [rowsPerPageOptions]="[10, 25, 50]"
  [sortMode]="'multiple'"
  [scrollable]="true"
  scrollHeight="calc(100vh - 300px)"
  styleClass="p-datatable-striped p-datatable-gridlines p-datatable-sm"
  [resizableColumns]="true"
  [reorderableColumns]="true"
  responsiveLayout="scroll">
```

### 🎛️ Формы
**Стандартная структура форм:**
```html
<div class="form-group">
  <label class="form-label">Название поля</label>
  <div class="input-container">
    <input pInputText size="small" />
    <div class="input-icon">
      <i class="pi pi-icon"></i>
    </div>
  </div>
  <div class="field-error" *ngIf="hasError">
    Сообщение об ошибке
  </div>
</div>
```

### 🔘 Кнопки
**Стандартные размеры и стили:**
```html
<!-- Основные действия -->
<p-button size="small" label="Действие" />

<!-- Вторичные действия -->
<p-button size="small" severity="secondary" />

<!-- Иконки в таблицах -->
<p-button size="small" icon="pi pi-edit" />
```

## 🎯 Компоненты из Excel функционала

### 📈 Таблицы данных времени
- Аналог `TimeEntriesTable` из Excel
- Колонки: User, Project, Activity, Date, Hours, Cost
- Фильтры-срезы по месяцам, пользователям, проектам
- Итоговые подсчеты внизу таблицы

### 📊 Pivot отчеты  
- Аналог `PivotReport` из Excel
- Интерактивные кнопки переключения
- Группировка по пользователям/проектам
- Поддержка разных полей данных

### 💰 Отчеты по марже
- Аналог `ProjectMarginReport` из Excel
- Таблица: Проект, Себестоимость, Цена, Марже, % Маржи
- Диаграммы маржинальности
- Цветовая индикация прибыльности

## 🏗️ Архитектурные правила

### 📁 Структура компонентов
```
src/app/components/
├── auth/           # Аутентификация
├── dashboard/      # Главная страница  
├── time-entries/   # Учет времени (из Excel)
├── projects/       # Управление проектами
├── employees/      # Сотрудники
├── invoices/       # Счета и платежи
├── analytics/      # Аналитика и отчеты
├── admin/          # Администрирование
└── settings/       # Настройки
```

### 🔧 Сервисы
- `AuthService` - аутентификация
- `DatabaseService` - работа с данными
- `UserSettingsService` - пользовательские настройки
- `ERMService` - интеграция с EasyRedmine
- `FinancialCalculatorService` - расчеты

### 🛡️ Guards
- `AuthGuard` - защита авторизованных страниц
- `AdminGuard` - доступ только для админов

## 💡 Рекомендации

### ⚡ Производительность
- Используйте `OnPush` change detection где возможно
- Lazy loading для всех страниц
- TrackBy функции для *ngFor
- Виртуализация для больших списков

### 🎨 UX/UI
- Плавные анимации (0.3s ease)
- Feedback для всех действий пользователя
- Loading состояния для асинхронных операций
- Адаптивность для мобильных устройств

### 🔒 Безопасность
- Валидация на клиенте И сервере
- Санитизация пользовательского ввода
- Proper error handling без раскрытия системной информации

---

**Этот документ должен соблюдаться всеми разработчиками проекта!**
