# PrimeNG MCP Server

MCP сервер для работы с компонентами PrimeNG в Cursor IDE.

## Возможности

- 📋 Получение списка всех компонентов PrimeNG
- 🔍 Поиск компонентов по названию и описанию
- 📖 Получение полной документации компонентов
- 💻 Примеры кода для каждого компонента
- 🎨 Информация о CSS классах и design tokens
- 📦 Инструкции по установке и настройке

## Доступные инструменты

### `get_primeng_component`
Получить информацию о конкретном компоненте PrimeNG.

**Параметры:**
- `name` (string) - Название компонента (например: editor, button, table)

### `get_all_primeng_components`
Получить список всех доступных компонентов PrimeNG.

**Параметры:**
- `category` (string, опционально) - Фильтр по категории (Form, Button, Data, Panel, Overlay, Menu, Chart, Messages, Media, File, Misc)

### `search_primeng_components`
Поиск компонентов PrimeNG по названию или описанию.

**Параметры:**
- `query` (string) - Поисковый запрос

### `get_primeng_component_documentation`
Получить полную документацию компонента с примерами кода.

**Параметры:**
- `name` (string) - Название компонента

### `get_primeng_component_example`
Получить пример использования конкретного компонента.

**Параметры:**
- `name` (string) - Название компонента
- `exampleType` (string, опционально) - Тип примера (basic, template, reactive, readonly и т.д.)

### `get_primeng_categories`
Получить список всех категорий компонентов PrimeNG.

### `get_primeng_installation_guide`
Получить инструкцию по установке и настройке PrimeNG.

**Параметры:**
- `component` (string, опционально) - Название компонента для получения специфичной инструкции

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Соберите проект:
```bash
npm run build
```

3. Запустите сервер:
```bash
npm start
```

## Настройка в Cursor

Добавьте в конфигурацию MCP серверов в Cursor:

```json
{
  "mcpServers": {
    "primeng": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {},
      "cwd": "infrastructure/mcp-server/primeng-mcp-server"
    }
  }
}
```

## Примеры использования

После настройки вы сможете использовать команды:

- "Покажи информацию о компоненте editor"
- "Найди все компоненты для работы с формами"
- "Как установить PrimeNG?"
- "Покажи пример использования table компонента"
- "Какие есть категории компонентов?"

## Поддерживаемые компоненты

### Form
- AutoComplete, CascadeSelect, Checkbox, ColorPicker, DatePicker, Editor, FloatLabel, IconField, IftaLabel, InputGroup, InputMask, InputNumber, InputOtp, InputText, KeyFilter, Knob, Listbox, MultiSelect, Password, RadioButton, Rating, Select, SelectButton, Slider, Textarea, ToggleButton, ToggleSwitch, TreeSelect

### Button
- Button, SpeedDial, SplitButton

### Data
- DataView, OrderList, OrgChart, Paginator, PickList, Table, Timeline, Tree, TreeTable, VirtualScroller

### Panel
- Accordion, Card, Divider, Fieldset, Panel, ScrollPanel, Splitter, Stepper, Tabs, Toolbar

### Overlay
- ConfirmDialog, ConfirmPopup, Dialog, Drawer, DynamicDialog, Popover, Tooltip

### Menu
- Breadcrumb, ContextMenu, Dock, Menu, Menubar, MegaMenu, PanelMenu, TieredMenu

### Chart
- Chart.js

### Messages
- Message, Toast

### Media
- Carousel, Galleria, Image, ImageCompare

### File
- Upload

### Misc
- Avatar, Badge, BlockUI, Chip, Inplace, MeterGroup, ProgressBar, ProgressSpinner, ScrollTop, Skeleton, Tag, Terminal
