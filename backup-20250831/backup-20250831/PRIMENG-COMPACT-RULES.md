# 📏 Правила компактности PrimeNG компонентов

## 🎯 Основное правило

**ВО ВСЕМ ПРИЛОЖЕНИИ ИСПОЛЬЗУЕМ ТОЛЬКО `size="small"` ДЛЯ ВСЕХ PRIMENG КОМПОНЕНТОВ**

Это правило обязательно для всех разработчиков проекта.

## ✅ Правильное использование

### Кнопки
```html
<!-- ✅ ПРАВИЛЬНО -->
<p-button size="small" label="Сохранить" />
<p-button size="small" icon="pi pi-edit" />
<p-button size="small" severity="secondary" label="Отмена" />

<!-- ❌ НЕПРАВИЛЬНО -->
<p-button label="Сохранить" />  <!-- размер по умолчанию -->
<p-button size="large" />       <!-- слишком большой -->
```

### Поля ввода
```html
<!-- ✅ ПРАВИЛЬНО -->
<input pInputText size="small" />
<p-dropdown size="small" [options]="options" />
<p-calendar size="small" />
<p-multiSelect size="small" />

<!-- ❌ НЕПРАВИЛЬНО -->
<input pInputText />  <!-- размер по умолчанию -->
```

### Таблицы
```html
<!-- ✅ ПРАВИЛЬНО -->
<p-table 
  [value]="data"
  styleClass="p-datatable-sm p-datatable-striped"
  [rows]="25"
  [paginator]="true">
  
  <p-column field="name" header="Название">
    <ng-template pTemplate="body" let-item>
      <p-button size="small" icon="pi pi-edit" />
    </ng-template>
  </p-column>
</p-table>
```

### Диалоги и панели
```html
<!-- ✅ ПРАВИЛЬНО -->
<p-dialog 
  header="Заголовок"
  [(visible)]="display"
  styleClass="compact-dialog">
  
  <div class="compact-form">
    <div class="form-group">
      <label class="form-label">Поле</label>
      <input pInputText size="small" />
    </div>
  </div>
  
  <ng-template pTemplate="footer">
    <p-button size="small" label="Сохранить" />
    <p-button size="small" severity="secondary" label="Отмена" />
  </ng-template>
</p-dialog>

<p-panel header="Панель" styleClass="compact-panel">
  <p>Содержимое</p>
</p-panel>
```

## 🛠️ Базовый компонент

Все новые компоненты должны наследоваться от `BaseComponent`:

```typescript
import { BaseComponent } from '../base/base-component';

@Component({
  // ...
})
export class MyComponent extends BaseComponent implements OnInit {
  
  // Используем готовые конфигурации
  protected tableConfig = this.tableConfig;
  protected buttonConfig = this.buttonConfig;
  protected dialogConfig = this.dialogConfig;
  
  // Используем готовые методы
  getTitle(): string {
    return this.getLocalizedText('Заголовок', 'Title');
  }
  
  formatPrice(amount: number): string {
    return this.formatCurrency(amount);
  }
}
```

## 📊 Готовые конфигурации

### Стандартная таблица
```typescript
// Используйте эту конфигурацию для всех таблиц
const standardTableConfig = {
  paginator: true,
  rows: 25,
  rowsPerPageOptions: [10, 25, 50],
  sortMode: 'multiple',
  scrollable: true,
  scrollHeight: 'calc(100vh - 300px)',
  styleClass: 'p-datatable-striped p-datatable-gridlines p-datatable-sm',
  resizableColumns: true,
  reorderableColumns: true,
  responsiveLayout: 'scroll'
};
```

### Стандартный диалог
```typescript
const standardDialogConfig = {
  modal: true,
  closable: true,
  resizable: false,
  draggable: false,
  styleClass: 'compact-dialog'
};
```

## 🎨 CSS классы

### Готовые классы для компактности
- `.compact-button` - для кнопок
- `.compact-input` - для полей ввода  
- `.compact-table` - для таблиц
- `.compact-card` - для карточек
- `.compact-panel` - для панелей
- `.compact-dialog` - для диалогов
- `.compact-form` - для форм
- `.compact-stats` - для статистики
- `.compact-nav` - для навигации

### Применение классов
```html
<!-- Применяйте к контейнерам компонентов -->
<div class="component-container compact-form">
  <p-card styleClass="compact-card">
    <!-- содержимое -->
  </p-card>
</div>
```

## 📱 Адаптивность

Компактные размеры автоматически адаптируются для мобильных устройств:
- На мобильных: еще более компактные размеры
- Автоматическое уменьшение padding и font-size
- Сохранение читаемости и удобства

## 🚫 Что НЕ делать

```html
<!-- ❌ НИКОГДА не используйте большие размеры -->
<p-button size="large" />
<p-inputText size="large" />

<!-- ❌ НИКОГДА не переопределяйте компактные стили -->
<p-button size="small" style="padding: 20px;" />

<!-- ❌ НИКОГДА не используйте размеры по умолчанию -->
<p-button label="Кнопка" />  <!-- должно быть size="small" -->
```

## ✅ Чек-лист для code review

- [ ] Все PrimeNG компоненты имеют `size="small"`
- [ ] Используются CSS классы `.compact-*` где применимо
- [ ] Компонент наследуется от `BaseComponent` если возможно
- [ ] Локализация поддерживается для RU/EN
- [ ] Тестирование на мобильных устройствах пройдено
- [ ] Glassmorphism эффекты применены корректно

---

**Это правило обязательно для всех компонентов в проекте!**
**При нарушении правила - code review не пройдет.**
