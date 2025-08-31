# Визуальные схемы и диаграммы системы

## 1. Общая архитектура системы

### Диаграмма компонентов высокого уровня

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Angular PWA App] --> B[Service Worker]
        A --> C[PWA Manifest]
        A --> D[Glassmorphism UI]
    end
    
    subgraph "Business Logic Layer"
        E[Auth Service] --> F[Project Service]
        F --> G[Financial Service]
        G --> H[Integration Service]
        H --> I[Analytics Service]
    end
    
    subgraph "Data Layer"
        J[PouchDB Local] --> K[CouchDB Remote]
        J --> L[Sync Engine]
        J --> M[IndexedDB Cache]
    end
    
    subgraph "External Integrations"
        N[OpenProject API] --> H
        O[ERM System] --> H
        P[Future: 1C API] --> H
    end
    
    subgraph "Infrastructure"
        Q[Docker Containers] --> R[CouchDB]
        Q --> S[Fauxton UI]
        Q --> T[MCP Server]
    end
    
    A --> E
    E --> J
    K --> N
    K --> O
```

### Диаграмма потоков данных

```mermaid
flowchart TD
    A[User Input] --> B[Angular Component]
    B --> C[Service Layer]
    C --> D[Data Validation]
    D --> E{PouchDB Local}
    E --> F[Sync Engine]
    F --> G[CouchDB Remote]
    G --> H[External Systems]
    
    H --> I[Data Processing]
    I --> J[Business Logic]
    J --> K[Data Storage]
    K --> L[Response Generation]
    L --> M[UI Update]
    
    style A fill:#e1f5fe
    style M fill:#e8f5e8
    style H fill:#fff3e0
```

## 2. Жизненный цикл проекта

### Диаграмма состояний проекта

```mermaid
stateDiagram-v2
    [*] --> Planning: Создание проекта
    Planning --> Contract: Подписание договора
    Contract --> Execution: Начало работ
    Execution --> Billing: Выставление счетов
    Billing --> Payment: Получение платежей
    Payment --> Analysis: Финансовый анализ
    Analysis --> [*]: Завершение проекта
    
    Execution --> Planning: Перепланирование
    Billing --> Execution: Дополнительные работы
    Payment --> Billing: Частичная оплата
    
    state Execution {
        [*] --> Active: Работы идут
        Active --> Paused: Приостановка
        Paused --> Active: Возобновление
        Active --> [*]: Завершение работ
    }
    
    state Billing {
        [*] --> Draft: Черновик счета
        Draft --> Sent: Отправлен клиенту
        Sent --> Paid: Оплачен
        Sent --> Overdue: Просрочен
        Overdue --> Paid: Оплачен с задержкой
    }
```

### Диаграмма финансового цикла

```mermaid
graph LR
    A[Планирование] --> B[Бюджет проекта]
    B --> C[Расчет стоимости]
    C --> D[Договор]
    D --> E[Выполнение работ]
    E --> F[Учет времени]
    F --> G[Расчет себестоимости]
    G --> H[Выставление счетов]
    H --> I[Получение платежей]
    I --> J[Финансовый анализ]
    J --> K[Расчет маржи]
    
    style A fill:#e3f2fd
    style D fill:#e8f5e8
    style H fill:#fff3e0
    style K fill:#fce4ec
```

## 3. Структура базы данных

### ER-диаграмма основных сущностей

```mermaid
erDiagram
    USERS {
        string _id PK
        string email UK
        string password
        string role
        string firstName
        string lastName
        object salary
        string department
        string position
        boolean isActive
        date createdAt
        date updatedAt
    }
    
    PROJECTS {
        string _id PK
        string name
        string description
        string department
        string status
        object lifecycle
        array participants
        array visibility
        date createdAt
        date updatedAt
    }
    
    TIME_ENTRIES {
        string _id PK
        string projectId FK
        string userId FK
        date date
        number hours
        string description
        number cost
        boolean isApproved
        string approvedBy FK
        date approvedAt
        date createdAt
        date updatedAt
    }
    
    INVOICES {
        string _id PK
        string projectId FK
        string number
        number amount
        string status
        date issueDate
        date dueDate
        date paidDate
        string description
        array items
        date createdAt
        date updatedAt
    }
    
    PAYMENTS {
        string _id PK
        string invoiceId FK
        string projectId FK
        number amount
        date date
        string method
        string reference
        string description
        date createdAt
    }
    
    USERS ||--o{ TIME_ENTRIES : "creates"
    PROJECTS ||--o{ TIME_ENTRIES : "contains"
    PROJECTS ||--o{ INVOICES : "generates"
    PROJECTS ||--o{ PAYMENTS : "receives"
    INVOICES ||--o{ PAYMENTS : "receives"
    USERS ||--o{ PROJECTS : "participates"
```

### Диаграмма индексов и запросов

```mermaid
graph TD
    A[User Query] --> B[Find Users by Role]
    B --> C[Index: type + role]
    
    D[Project Query] --> E[Find Projects by User]
    E --> F[Index: type + participants.userId]
    E --> G[Index: type + visibility]
    
    H[Time Query] --> I[Find Time by Project & Date]
    I --> J[Index: type + projectId + date]
    
    K[Invoice Query] --> L[Find Invoices by Status]
    L --> M[Index: type + status + dueDate]
    
    N[Financial Query] --> O[Calculate Project Costs]
    O --> P[MapReduce: project-cost-calculation]
    
    style A fill:#e1f5fe
    style N fill:#e8f5e8
    style P fill:#fff3e0
```

## 4. Система ролей и прав доступа

### Диаграмма иерархии ролей

```mermaid
graph TD
    A[Суперадминистратор] --> B[Генеральный директор]
    B --> C[Директор направления]
    C --> D[Руководитель проекта]
    D --> E[Сотрудник]
    
    A --> F[Системные настройки]
    A --> G[Управление пользователями]
    A --> H[Интеграции]
    
    B --> I[Все проекты компании]
    B --> J[Финансовая аналитика]
    B --> K[Управление директорами]
    
    C --> L[Проекты направления]
    C --> M[Назначение руководителей]
    C --> N[Финансы направления]
    
    D --> O[Назначенные проекты]
    D --> P[Управление участниками]
    D --> Q[Создание счетов]
    
    E --> R[Доступные проекты]
    E --> S[Личная аналитика]
    E --> T[Учет времени]
    
    style A fill:#ffebee
    style B fill:#e8f5e8
    style C fill:#e3f2fd
    style D fill:#fff3e0
    style E fill:#f3e5f5
```

### Диаграмма матрицы прав доступа

```mermaid
graph LR
    subgraph "Модули системы"
        A[Проекты]
        B[Финансы]
        C[Счета]
        D[Платежи]
        E[Аналитика]
        F[Пользователи]
        G[Настройки]
    end
    
    subgraph "Роли"
        H[Суперадмин]
        I[Ген. директор]
        J[Директор]
        K[Руководитель]
        L[Сотрудник]
    end
    
    H --> A
    H --> B
    H --> C
    H --> D
    H --> E
    H --> F
    H --> G
    
    I --> A
    I --> B
    I --> C
    I --> D
    I --> E
    
    J --> A
    J --> B
    J --> C
    J --> D
    J --> E
    
    K --> A
    K --> B
    K --> C
    K --> D
    
    L --> A
    L --> B
```

## 5. Интеграции с внешними системами

### Диаграмма интеграции OpenProject

```mermaid
sequenceDiagram
    participant PWA as PWA App
    participant SW as Service Worker
    participant API as Integration API
    participant OP as OpenProject
    participant DB as PouchDB
    
    PWA->>SW: Запрос синхронизации
    SW->>API: Синхронизация проектов
    API->>OP: GET /api/v3/projects
    OP-->>API: Список проектов
    API->>API: Маппинг данных
    API->>DB: Сохранение проектов
    
    PWA->>SW: Синхронизация времени
    SW->>API: Синхронизация time entries
    API->>OP: GET /api/v3/time_entries
    OP-->>API: Временные записи
    API->>API: Расчет стоимости
    API->>DB: Сохранение времени
    
    PWA->>SW: Синхронизация пользователей
    SW->>API: Синхронизация пользователей
    API->>OP: GET /api/v3/users
    OP-->>API: Список пользователей
    API->>DB: Обновление пользователей
```

### Диаграмма интеграции ERM

```mermaid
graph TD
    A[ERM System] --> B[API Gateway]
    B --> C[Data Mapper]
    C --> D[Validation Engine]
    D --> E[Business Rules]
    E --> F[PouchDB]
    
    subgraph "ERM Data"
        G[Project Master Data]
        H[Financial Information]
        I[Department Structure]
        J[User Master Data]
    end
    
    subgraph "Mapping Rules"
        K[Project Mapping]
        L[Financial Mapping]
        M[User Mapping]
        N[Department Mapping]
    end
    
    G --> K
    H --> L
    I --> N
    J --> M
    
    K --> C
    L --> C
    M --> C
    N --> C
    
    style A fill:#e3f2fd
    style F fill:#e8f5e8
    style C fill:#fff3e0
```

## 6. PWA архитектура

### Диаграмма Service Worker

```mermaid
graph TD
    A[Service Worker] --> B[Install Event]
    A --> C[Activate Event]
    A --> D[Fetch Event]
    A --> E[Sync Event]
    A --> F[Push Event]
    
    B --> G[Cache Resources]
    G --> H[IndexedDB Setup]
    
    C --> I[Clean Old Caches]
    C --> J[Update Caches]
    
    D --> K{Request Type}
    K -->|Static| L[Cache First]
    K -->|API| M[Network First]
    K -->|Dynamic| N[Stale While Revalidate]
    
    E --> O[Background Sync]
    O --> P[Sync Data]
    
    F --> Q[Push Notification]
    Q --> R[Show Notification]
    
    style A fill:#e1f5fe
    style L fill:#e8f5e8
    style M fill:#fff3e0
    style N fill:#fce4ec
```

### Диаграмма стратегий кэширования

```mermaid
graph LR
    subgraph "Cache Strategies"
        A[Cache First]
        B[Network First]
        C[Stale While Revalidate]
        D[Network Only]
        E[Cache Only]
    end
    
    subgraph "Resource Types"
        F[HTML/CSS/JS]
        G[Images/Fonts]
        H[API Responses]
        I[User Data]
        J[Configuration]
    end
    
    F --> A
    G --> A
    H --> B
    I --> C
    J --> E
    
    style A fill:#e8f5e8
    style B fill:#fff3e0
    style C fill:#e3f2fd
    style D fill:#ffebee
    style E fill:#f3e5f5
```

## 7. Финансовые алгоритмы

### Диаграмма расчета себестоимости

```mermaid
flowchart TD
    A[Временные записи] --> B[Расчет почасовых ставок]
    B --> C[Трудовые затраты]
    
    D[Материальные затраты] --> E[Прямые расходы]
    
    C --> F[Общие затраты]
    E --> F
    F --> G[Накладные расходы 20%]
    F --> H[Итоговая себестоимость]
    G --> H
    
    I[Планируемая стоимость] --> J[Расчет маржи]
    H --> J
    J --> K[Маржинальность проекта]
    
    style A fill:#e1f5fe
    style H fill:#e8f5e8
    style K fill:#fff3e0
```

### Диаграмма анализа ROI

```mermaid
graph TD
    A[Инвестиции] --> B[Расчет ROI]
    C[Доходы] --> B
    B --> D[ROI %]
    
    E[Период проекта] --> F[Расчет NPV]
    A --> F
    C --> F
    F --> G[Чистая приведенная стоимость]
    
    H[Риск-факторы] --> I[Оценка рисков]
    I --> J[Риск-скор]
    
    D --> K[Финансовый анализ]
    G --> K
    J --> K
    K --> L[Рекомендации]
    
    style A fill:#ffebee
    style C fill:#e8f5e8
    style K fill:#e3f2fd
    style L fill:#fff3e0
```

## 8. Пользовательские интерфейсы

### Диаграмма структуры компонентов

```mermaid
graph TD
    A[App Component] --> B[Header Component]
    A --> C[Sidebar Component]
    A --> D[Main Content]
    A --> E[Footer Component]
    
    B --> F[User Menu]
    B --> G[Notifications]
    B --> H[Search]
    
    C --> I[Navigation Menu]
    I --> J[Dashboard]
    I --> K[Projects]
    I --> L[Finance]
    I --> M[Analytics]
    I --> N[Settings]
    
    D --> O[Router Outlet]
    O --> P[Page Components]
    
    P --> Q[Project List]
    P --> R[Project Detail]
    P --> S[Financial Dashboard]
    P --> T[Invoice Management]
    P --> U[User Management]
    
    style A fill:#e1f5fe
    style I fill:#e8f5e8
    style P fill:#fff3e0
```

### Диаграмма навигации

```mermaid
graph LR
    A[Login] --> B[Dashboard]
    
    B --> C[Projects]
    B --> D[Finance]
    B --> E[Analytics]
    B --> F[Integrations]
    B --> G[Settings]
    
    C --> H[Project List]
    C --> I[Project Create]
    C --> J[Project Detail]
    
    D --> K[Invoices]
    D --> L[Payments]
    D --> M[Cash Flow]
    
    E --> N[Financial Reports]
    E --> O[ROI Analysis]
    E --> P[Employee Efficiency]
    
    F --> Q[OpenProject]
    F --> R[ERM System]
    
    G --> S[User Management]
    G --> T[System Settings]
    G --> U[Integration Config]
    
    style A fill:#e8f5e8
    style B fill:#e3f2fd
    style G fill:#fff3e0
```

## 9. Процессы синхронизации

### Диаграмма синхронизации данных

```mermaid
sequenceDiagram
    participant Local as PouchDB Local
    participant Sync as Sync Engine
    participant Remote as CouchDB Remote
    participant Ext as External Systems
    
    loop Every 15 minutes
        Local->>Sync: Check for changes
        Sync->>Remote: Push local changes
        Remote->>Sync: Push remote changes
        Sync->>Local: Apply remote changes
        
        Sync->>Ext: Check for updates
        Ext-->>Sync: New data available
        Sync->>Local: Update local data
        Sync->>Remote: Push to remote
    end
    
    Local->>Sync: Manual sync request
    Sync->>Remote: Full sync
    Remote-->>Sync: All data
    Sync->>Local: Update local
```

### Диаграмма обработки конфликтов

```mermaid
graph TD
    A[Обнаружение конфликта] --> B{Тип конфликта}
    
    B -->|Данные| C[Merge Strategy]
    B -->|Удаление| D[Conflict Resolution]
    B -->|Создание| E[Duplicate Handling]
    
    C --> F[Smart Merge]
    F --> G[Validation]
    
    D --> H[Keep Latest]
    D --> I[Keep Local]
    D --> J[Manual Resolution]
    
    E --> K[Generate New ID]
    E --> L[Link Related]
    
    G --> M[Apply Changes]
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Update All Systems]
    
    style A fill:#ffebee
    style M fill:#e8f5e8
    style N fill:#e3f2fd
```

## 10. Мониторинг и аналитика

### Диаграмма метрик производительности

```mermaid
graph TD
    A[Performance Metrics] --> B[Frontend Metrics]
    A --> C[Backend Metrics]
    A --> D[Database Metrics]
    A --> E[Integration Metrics]
    
    B --> F[Page Load Time]
    B --> G[Time to Interactive]
    B --> H[First Contentful Paint]
    
    C --> I[API Response Time]
    C --> J[Error Rate]
    C --> K[Throughput]
    
    D --> L[Query Performance]
    D --> M[Sync Speed]
    D --> N[Storage Usage]
    
    E --> O[External API Latency]
    E --> P[Sync Success Rate]
    E --> Q[Data Freshness]
    
    R[Dashboard] --> S[Real-time Monitoring]
    S --> T[Alert System]
    T --> U[Email/SMS Notifications]
    
    style A fill:#e1f5fe
    style R fill:#e8f5e8
    style U fill:#fff3e0
```

### Диаграмма системы логирования

```mermaid
graph LR
    A[Application Logs] --> B[Log Aggregator]
    C[System Logs] --> B
    D[Error Logs] --> B
    E[Performance Logs] --> B
    
    B --> F[Log Processor]
    F --> G[Log Storage]
    F --> H[Log Analysis]
    
    G --> I[Elasticsearch]
    G --> J[File System]
    
    H --> K[Error Patterns]
    H --> L[Performance Trends]
    H --> M[User Behavior]
    
    K --> N[Alert System]
    L --> N
    M --> O[Analytics Dashboard]
    
    style A fill:#e1f5fe
    style N fill:#ffebee
    style O fill:#e8f5e8
```

## Заключение

Представленные диаграммы и схемы обеспечивают:

1. **Визуальное понимание** архитектуры системы
2. **Документирование** процессов и потоков данных
3. **Планирование** разработки и тестирования
4. **Обучение** новых разработчиков
5. **Анализ** производительности и оптимизации

Все диаграммы созданы с использованием Mermaid.js и могут быть легко обновлены при изменении системы.
