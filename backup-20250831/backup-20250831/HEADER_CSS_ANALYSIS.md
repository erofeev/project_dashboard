# Анализ CSS стилей хедера

## Проблемы и дублирования

### 1. Источники стилей для хедера:
- `/src/app/components/header/app-header.component.ts` - встроенные стили (950+ строк)
- `/src/app/app.component.ts` - дополнительные стили хедера (2800+ строк)
- `/src/styles/primeng-glassmorphism.scss` - PrimeNG переопределения
- `/src/styles.scss` - глобальные стили тем

### 2. Дублированные стили:

#### Кнопки хедера:
- `app-header.component.ts` - стили для `.theme-toggle`, `.language-toggle`, `.admin-button`
- `app.component.ts` - дублированные стили для тех же кнопок
- `primeng-glassmorphism.scss` - переопределения PrimeNG кнопок

#### Меню пользователя:
- `app-header.component.ts` - стили для `.user-dropdown-menu`
- `app.component.ts` - дублированные стили `.user-dropdown-menu`
- `styles.scss` - глобальные стили для `.dropdown-item`

#### Поиск:
- `app-header.component.ts` - стили для `.search-input`, `.search-dropdown`
- `app.component.ts` - дублированные стили для поиска

### 3. Конфликты:

#### Проблема 1: Темы
- В `app.component.ts` есть стили `:host-context(.theme-dark)` И `.theme-dark`
- В `app-header.component.ts` только `:host-context(.theme-dark)`
- В `styles.scss` только `.theme-dark`
- **Результат**: стили не применяются корректно

#### Проблема 2: PrimeNG переопределения
- PrimeNG стили имеют высокую специфичность
- Наши кастомные стили перезаписываются
- Используем устаревший синтаксис `[outlined]="true"` вместо `variant="outlined"`

#### Проблема 3: Меню пользователя
- Используем кастомное меню вместо PrimeNG Menu
- Стили конфликтуют между компонентами
- Z-index проблемы

## Рекомендации по исправлению:

### 1. Консолидация стилей:
- Убрать дублированные стили из `app.component.ts`
- Оставить стили хедера только в `app-header.component.ts`
- Глобальные PrimeNG стили в `primeng-glassmorphism.scss`

### 2. Унификация селекторов тем:
- Использовать только `.theme-dark` и `.theme-light`
- Убрать `:host-context()` селекторы
- Добавить высокую специфичность для переопределения PrimeNG

### 3. Исправление меню пользователя:
- Полностью переписать на PrimeNG Menu
- Убрать кастомные стили dropdown
- Использовать правильные MenuItem[] структуры

### 4. Тестирование:
- Использовать Playwright для автоматического тестирования
- Проверить работу в обеих темах
- Протестировать все меню и кнопки
