# Дизайн-система Glassmorphism

## Концепция дизайна

### Философия Glassmorphism
Дизайн-система построена на принципах **Glassmorphism** - современного стиля, который создает ощущение глубины и объема через:
- **Полупрозрачность** элементов с размытием фона
- **Тонкие границы** и мягкие тени
- **Трехмерность** и слоистость интерфейса
- **Световую игру** и преломление

### Принципы дизайна
1. **Минимализм** - убираем лишнее, оставляем суть
2. **Глубина** - создаем иерархию через слои и тени
3. **Читаемость** - обеспечиваем контраст и четкость
4. **Адаптивность** - работаем на всех устройствах
5. **Доступность** - соблюдаем стандарты WCAG 2.1

## Цветовая палитра

### Основные цвета

#### Primary (Основные)
```css
:root {
  --primary-50: #e3f2fd;   /* Светло-голубой */
  --primary-100: #bbdefb;  /* Голубой */
  --primary-500: #2196f3;  /* Синий */
  --primary-600: #1e88e5;  /* Темно-синий */
  --primary-900: #0d47a1;  /* Очень темно-синий */
}
```

#### Secondary (Дополнительные)
```css
:root {
  --secondary-50: #f3e5f5;   /* Светло-фиолетовый */
  --secondary-100: #e1bee7;  /* Фиолетовый */
  --secondary-500: #9c27b0;  /* Фиолетовый */
  --secondary-600: #8e24aa;  /* Темно-фиолетовый */
}
```

#### Financial Status Colors (Финансовые статусы)
```css
:root {
  /* Прибыльные проекты */
  --success-50: #e8f5e8;
  --success-500: #4caf50;
  --success-600: #388e3c;
  
  /* Проекты с низкой маржой */
  --warning-50: #fff8e1;
  --warning-500: #ff9800;
  --warning-600: #f57c00;
  
  /* Убыточные проекты */
  --error-50: #ffebee;
  --error-500: #f44336;
  --error-600: #d32f2f;
  
  /* Новые/планируемые проекты */
  --info-50: #e3f2fd;
  --info-500: #2196f3;
  --info-600: #1976d2;
}
```

#### Neutral (Нейтральные)
```css
:root {
  --neutral-50: #fafafa;   /* Почти белый */
  --neutral-100: #f5f5f5;  /* Светло-серый */
  --neutral-200: #eeeeee;  /* Серый */
  --neutral-300: #e0e0e0;  /* Средне-серый */
  --neutral-400: #bdbdbd;  /* Серый */
  --neutral-500: #9e9e9e;  /* Серый */
  --neutral-600: #757575;  /* Темно-серый */
  --neutral-700: #616161;  /* Очень темно-серый */
  --neutral-800: #424242;  /* Почти черный */
  --neutral-900: #212121;  /* Черный */
}
```

### Семантические цвета
```css
:root {
  /* Текст */
  --text-primary: var(--neutral-900);
  --text-secondary: var(--neutral-600);
  --text-disabled: var(--neutral-400);
  
  /* Фоны */
  --background-primary: #ffffff;
  --background-secondary: var(--neutral-50);
  --background-glass: rgba(255, 255, 255, 0.25);
  
  /* Границы */
  --border-light: rgba(255, 255, 255, 0.18);
  --border-medium: rgba(255, 255, 255, 0.25);
  --border-strong: rgba(255, 255, 255, 0.4);
}
```

## Типографика

### Шрифты
```css
:root {
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
```

### Размеры шрифтов
```css
:root {
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
}
```

### Веса шрифтов
```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Высота строк
```css
:root {
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

## Компоненты Glassmorphism

### Карточки (Cards)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  padding: 24px;
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 40px 0 rgba(31, 38, 135, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

### Кнопки (Buttons)
```css
.glass-button {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  padding: 12px 24px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.glass-button:active {
  transform: translateY(0);
}
```

### Поля ввода (Input Fields)
```css
.glass-input {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.glass-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  background: rgba(255, 255, 255, 0.25);
}
```

### Модальные окна (Modals)
```css
.glass-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
```

## Эффекты и анимации

### Тени (Shadows)
```css
:root {
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 16px 64px rgba(0, 0, 0, 0.25);
  
  --shadow-glass: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
```

### Переходы (Transitions)
```css
:root {
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
  --transition-bounce: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Анимации (Animations)
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.fade-in { animation: fadeIn 0.5s ease; }
.slide-in { animation: slideIn 0.3s ease; }
.pulse { animation: pulse 2s infinite; }
```

## Адаптивность

### Breakpoints
```css
:root {
  --breakpoint-xs: 0px;
  --breakpoint-sm: 600px;
  --breakpoint-md: 960px;
  --breakpoint-lg: 1280px;
  --breakpoint-xl: 1920px;
}
```

### Медиа-запросы
```css
/* Мобильные устройства */
@media (max-width: 599px) {
  .glass-card {
    padding: 16px;
    border-radius: 12px;
  }
}

/* Планшеты */
@media (min-width: 600px) and (max-width: 959px) {
  .glass-card {
    padding: 20px;
    border-radius: 14px;
  }
}

/* Десктопы */
@media (min-width: 960px) {
  .glass-card {
    padding: 24px;
    border-radius: 16px;
  }
}
```

## Финансовые индикаторы

### Цветовая кодировка статусов
```css
/* Прибыльные проекты */
.status-profitable {
  background: linear-gradient(135deg, var(--success-50), var(--success-100));
  border-color: var(--success-500);
  color: var(--success-600);
}

/* Проекты с низкой маржой */
.status-low-margin {
  background: linear-gradient(135deg, var(--warning-50), var(--warning-100));
  border-color: var(--warning-500);
  color: var(--warning-600);
}

/* Убыточные проекты */
.status-unprofitable {
  background: linear-gradient(135deg, var(--error-50), var(--error-100));
  border-color: var(--error-500);
  color: var(--error-600);
}

/* Новые проекты */
.status-new {
  background: linear-gradient(135deg, var(--info-50), var(--info-100));
  border-color: var(--info-500);
  color: var(--info-600);
}
```

## Иконки и иллюстрации

### Стиль иконок
- **Outline** стиль для основной навигации
- **Filled** стиль для активных состояний
- **Duotone** стиль для финансовых показателей
- **Размеры**: 16px, 20px, 24px, 32px, 48px

### Иллюстрации
- **Минималистичные** векторные изображения
- **Абстрактные** геометрические формы
- **Цветовая схема** соответствует основной палитре
- **Анимации** для улучшения UX

## Доступность

### Контрастность
- **Минимальный контраст**: 4.5:1 для обычного текста
- **Высокий контраст**: 7:1 для мелкого текста
- **Цветовые индикаторы** дополняются текстовыми

### Фокус
- **Видимый фокус** для всех интерактивных элементов
- **Логический порядок** навигации
- **Клавиатурная навигация** полностью поддерживается

### Скрин-ридеры
- **Семантическая разметка** HTML
- **ARIA-атрибуты** для сложных компонентов
- **Альтернативный текст** для изображений

## Примеры использования

### Дашборд
```html
<div class="dashboard">
  <div class="glass-card metrics-card">
    <h3>Общая прибыль</h3>
    <div class="metric-value">₽ 2,450,000</div>
    <div class="metric-change positive">+12.5%</div>
  </div>
  
  <div class="glass-card projects-card">
    <h3>Активные проекты</h3>
    <div class="project-list">
      <div class="project-item status-profitable">
        <span class="project-name">E-commerce платформа</span>
        <span class="project-margin">+45%</span>
      </div>
    </div>
  </div>
</div>
```

### Форма
```html
<form class="glass-form">
  <div class="form-group">
    <label for="project-name">Название проекта</label>
    <input type="text" id="project-name" class="glass-input" required>
  </div>
  
  <div class="form-actions">
    <button type="submit" class="glass-button primary">Создать проект</button>
    <button type="button" class="glass-button secondary">Отмена</button>
  </div>
</form>
```

## Заключение

Дизайн-система Glassmorphism создает современный, элегантный и функциональный интерфейс, который:
- **Улучшает UX** через визуальную иерархию и глубину
- **Обеспечивает доступность** для всех пользователей
- **Поддерживает адаптивность** на всех устройствах
- **Соответствует трендам** современного веб-дизайна
- **Легко масштабируется** для новых компонентов
