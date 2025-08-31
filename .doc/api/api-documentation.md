# API документация

## Обзор

API системы управления проектами предоставляет RESTful интерфейс для работы с основными сущностями: проекты, пользователи, временные записи, счета, платежи и финансовая аналитика.

## Базовые принципы

### Аутентификация
Все API запросы требуют аутентификации через JWT токен в заголовке `Authorization`:
```
Authorization: Bearer <jwt_token>
```

### Формат ответов
Все ответы возвращаются в формате JSON с единообразной структурой:

**Успешный ответ:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Операция выполнена успешно",
  "timestamp": "2025-01-27T10:30:00Z"
}
```

**Ошибка:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Описание ошибки",
    "details": { ... }
  },
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### Коды статусов HTTP
- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Ошибка валидации
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

### Пагинация
Для списков используется пагинация с параметрами:
- `page` - номер страницы (по умолчанию 1)
- `limit` - количество элементов на странице (по умолчанию 20)
- `sort` - поле для сортировки
- `order` - порядок сортировки (asc/desc)

**Ответ с пагинацией:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

## API Endpoints

### 1. Аутентификация

#### POST /api/auth/login
Вход в систему.

**Запрос:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "Иван",
      "lastName": "Иванов",
      "role": "project_manager",
      "department": "Разработка"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

#### POST /api/auth/refresh
Обновление токена доступа.

**Запрос:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/logout
Выход из системы.

**Запрос:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Пользователи

#### GET /api/users
Получение списка пользователей (только для администраторов).

**Параметры:**
- `role` - фильтр по роли
- `department` - фильтр по отделу
- `isActive` - фильтр по статусу активности

**Ответ:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user-123",
        "email": "user@example.com",
        "firstName": "Иван",
        "lastName": "Иванов",
        "role": "project_manager",
        "department": "Разработка",
        "position": "Руководитель проектов",
        "isActive": true,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### GET /api/users/:id
Получение информации о пользователе.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "middleName": "Иванович",
    "role": "project_manager",
    "department": "Разработка",
    "position": "Руководитель проектов",
    "salary": {
      "type": "monthly",
      "amount": 150000,
      "workingDaysPerMonth": 22
    },
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-27T10:30:00Z"
  }
}
```

#### POST /api/users
Создание нового пользователя (только для суперадминистратора).

**Запрос:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Петр",
  "lastName": "Петров",
  "role": "employee",
  "department": "Разработка",
  "position": "Разработчик",
  "salary": {
    "type": "monthly",
    "amount": 120000,
    "workingDaysPerMonth": 22
  }
}
```

#### PUT /api/users/:id
Обновление пользователя.

**Запрос:**
```json
{
  "firstName": "Петр",
  "lastName": "Петров",
  "department": "Тестирование",
  "salary": {
    "amount": 130000
  }
}
```

#### DELETE /api/users/:id
Деактивация пользователя.

### 3. Проекты

#### GET /api/projects
Получение списка проектов с учетом прав доступа пользователя.

**Параметры:**
- `status` - фильтр по статусу
- `department` - фильтр по отделу
- `participant` - фильтр по участнику
- `startDate` - фильтр по дате начала
- `endDate` - фильтр по дате окончания

**Ответ:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "project-123",
        "name": "E-commerce платформа",
        "description": "Разработка интернет-магазина",
        "department": "Разработка",
        "status": "active",
        "lifecycle": {
          "planning": {
            "estimatedCost": 5000000,
            "estimatedHours": 800,
            "startDate": "2025-01-01T00:00:00Z",
            "endDate": "2025-06-30T00:00:00Z"
          },
          "contract": {
            "contractCost": 5500000,
            "contractDate": "2025-01-15T00:00:00Z"
          },
          "execution": {
            "actualStartDate": "2025-01-20T00:00:00Z",
            "currentCost": 1200000,
            "completedHours": 180
          }
        },
        "participants": [
          {
            "userId": "user-123",
            "role": "project_manager",
            "assignedAt": "2025-01-01T00:00:00Z"
          }
        ],
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### GET /api/projects/:id
Получение детальной информации о проекте.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "project-123",
    "name": "E-commerce платформа",
    "description": "Разработка интернет-магазина",
    "department": "Разработка",
    "status": "active",
    "lifecycle": { ... },
    "participants": [ ... ],
    "visibility": [ ... ],
    "financialMetrics": {
      "totalCost": 1200000,
      "contractValue": 5500000,
      "margin": 4300000,
      "marginPercentage": 78.2,
      "roi": 358.3
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-27T10:30:00Z"
  }
}
```

#### POST /api/projects
Создание нового проекта.

**Запрос:**
```json
{
  "name": "Новый проект",
  "description": "Описание проекта",
  "department": "Разработка",
  "lifecycle": {
    "planning": {
      "estimatedCost": 1000000,
      "estimatedHours": 200,
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": "2025-05-31T00:00:00Z"
    }
  },
  "participants": [
    {
      "userId": "user-123",
      "role": "project_manager"
    }
  ],
  "visibility": ["user-123", "user-456"]
}
```

#### PUT /api/projects/:id
Обновление проекта.

#### DELETE /api/projects/:id
Удаление проекта.

### 4. Временные записи

#### GET /api/time-entries
Получение временных записей с учетом прав доступа.

**Параметры:**
- `projectId` - фильтр по проекту
- `userId` - фильтр по пользователю
- `startDate` - фильтр по начальной дате
- `endDate` - фильтр по конечной дате
- `isApproved` - фильтр по статусу одобрения

**Ответ:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "time-123",
        "projectId": "project-123",
        "userId": "user-123",
        "date": "2025-01-27T00:00:00Z",
        "hours": 8,
        "description": "Разработка API",
        "cost": 12000,
        "isApproved": true,
        "approvedBy": "user-456",
        "approvedAt": "2025-01-28T09:00:00Z",
        "createdAt": "2025-01-27T18:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### POST /api/time-entries
Создание временной записи.

**Запрос:**
```json
{
  "projectId": "project-123",
  "date": "2025-01-27T00:00:00Z",
  "hours": 8,
  "description": "Разработка API"
}
```

#### PUT /api/time-entries/:id
Обновление временной записи.

#### DELETE /api/time-entries/:id
Удаление временной записи.

#### POST /api/time-entries/:id/approve
Одобрение временной записи (только для руководителей).

**Запрос:**
```json
{
  "approvedBy": "user-456",
  "comment": "Одобрено"
}
```

### 5. Счета

#### GET /api/invoices
Получение списка счетов.

**Параметры:**
- `projectId` - фильтр по проекту
- `status` - фильтр по статусу
- `startDate` - фильтр по дате выставления
- `endDate` - фильтр по дате выставления
- `minAmount` - минимальная сумма
- `maxAmount` - максимальная сумма

**Ответ:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "invoice-123",
        "projectId": "project-123",
        "number": "INV-2025-001",
        "amount": 500000,
        "status": "sent",
        "issueDate": "2025-01-15T00:00:00Z",
        "dueDate": "2025-02-15T00:00:00Z",
        "description": "Оплата за первый этап",
        "items": [
          {
            "description": "Разработка архитектуры",
            "quantity": 40,
            "unit": "hours",
            "rate": 2500,
            "amount": 100000
          }
        ],
        "createdAt": "2025-01-15T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### POST /api/invoices
Создание нового счета.

**Запрос:**
```json
{
  "projectId": "project-123",
  "number": "INV-2025-002",
  "amount": 300000,
  "issueDate": "2025-01-27T00:00:00Z",
  "dueDate": "2025-02-27T00:00:00Z",
  "description": "Оплата за второй этап",
  "items": [
    {
      "description": "Разработка модулей",
      "quantity": 60,
      "unit": "hours",
      "rate": 2500,
      "amount": 150000
    }
  ]
}
```

#### PUT /api/invoices/:id
Обновление счета.

#### DELETE /api/invoices/:id
Удаление счета.

#### POST /api/invoices/:id/send
Отправка счета клиенту.

#### POST /api/invoices/:id/mark-paid
Отметка счета как оплаченного.

**Запрос:**
```json
{
  "paidDate": "2025-01-30T00:00:00Z",
  "paymentMethod": "bank_transfer"
}
```

### 6. Платежи

#### GET /api/payments
Получение списка платежей.

**Параметры:**
- `projectId` - фильтр по проекту
- `invoiceId` - фильтр по счету
- `startDate` - фильтр по начальной дате
- `endDate` - фильтр по конечной дате

**Ответ:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "payment-123",
        "invoiceId": "invoice-123",
        "projectId": "project-123",
        "amount": 500000,
        "date": "2025-01-30T00:00:00Z",
        "method": "bank_transfer",
        "reference": "REF-2025-001",
        "description": "Оплата по счету INV-2025-001",
        "createdAt": "2025-01-30T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### POST /api/payments
Создание записи о платеже.

**Запрос:**
```json
{
  "invoiceId": "invoice-123",
  "amount": 500000,
  "date": "2025-01-30T00:00:00Z",
  "method": "bank_transfer",
  "reference": "REF-2025-001",
  "description": "Оплата по счету"
}
```

### 7. Финансовая аналитика

#### GET /api/analytics/project-cost/:projectId
Расчет себестоимости проекта.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "projectId": "project-123",
    "totalCost": 1200000,
    "laborCost": 1000000,
    "materialCost": 150000,
    "overheadCost": 50000,
    "costPerHour": 6666.67,
    "breakdown": [
      {
        "userId": "user-123",
        "userName": "Иван Иванов",
        "hours": 120,
        "rate": 2500,
        "cost": 300000,
        "percentage": 30.0
      }
    ]
  }
}
```

#### GET /api/analytics/project-margin/:projectId
Расчет маржинальности проекта.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "projectId": "project-123",
    "contractValue": 5500000,
    "totalCost": 1200000,
    "grossMargin": 4300000,
    "grossMarginPercentage": 78.2,
    "netMargin": 3440000,
    "netMarginPercentage": 62.5,
    "profitability": "high",
    "forecast": {
      "projectedCost": 1500000,
      "projectedMargin": 4000000,
      "projectedMarginPercentage": 72.7,
      "confidence": 0.85,
      "trend": "improving"
    }
  }
}
```

#### GET /api/analytics/project-roi/:projectId
Расчет ROI проекта.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "projectId": "project-123",
    "totalInvestment": 1200000,
    "totalReturn": 5500000,
    "roi": 4300000,
    "roiPercentage": 358.3,
    "paybackPeriod": 3,
    "npv": 3800000,
    "irr": 45.2,
    "riskAssessment": {
      "level": "low",
      "factors": [ ... ],
      "score": 25
    }
  }
}
```

#### GET /api/analytics/cash-flow/:projectId
Анализ денежных потоков проекта.

**Параметры:**
- `startDate` - начальная дата периода
- `endDate` - конечная дата периода

**Ответ:**
```json
{
  "success": true,
  "data": {
    "projectId": "project-123",
    "period": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-12-31T00:00:00Z"
    },
    "inflows": [ ... ],
    "outflows": [ ... ],
    "netCashFlow": 4300000,
    "cumulativeCashFlow": 4300000,
    "breakEvenPoint": "2025-03-15T00:00:00Z",
    "cashFlowProjection": [ ... ]
  }
}
```

#### GET /api/analytics/employee-efficiency/:userId
Анализ эффективности сотрудника.

**Параметры:**
- `startDate` - начальная дата периода
- `endDate` - конечная дата периода

**Ответ:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "userName": "Иван Иванов",
    "period": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-31T00:00:00Z"
    },
    "metrics": {
      "totalHours": 160,
      "billableHours": 140,
      "utilizationRate": 87.5,
      "averageHourlyRate": 2500,
      "totalRevenue": 350000,
      "costEfficiency": 100.0,
      "qualityScore": 95
    },
    "projects": [ ... ],
    "ranking": 3,
    "recommendations": [
      "Увеличить количество billable часов"
    ]
  }
}
```

### 8. Интеграции

#### GET /api/integrations/openproject/status
Статус интеграции с OpenProject.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "lastSync": "2025-01-27T10:00:00Z",
    "syncInterval": 15,
    "projectsSynced": 25,
    "timeEntriesSynced": 1500,
    "usersSynced": 45
  }
}
```

#### POST /api/integrations/openproject/sync
Запуск синхронизации с OpenProject.

**Запрос:**
```json
{
  "syncType": "full", // full, incremental
  "entities": ["projects", "time_entries", "users"]
}
```

#### GET /api/integrations/erm/status
Статус интеграции с ERM системой.

#### POST /api/integrations/erm/sync
Запуск синхронизации с ERM.

### 9. Системные настройки

#### GET /api/settings
Получение системных настроек (только для администраторов).

#### PUT /api/settings
Обновление системных настроек (только для суперадминистратора).

#### GET /api/system/health
Проверка состояния системы.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-27T10:30:00Z",
    "services": {
      "database": "healthy",
      "cache": "healthy",
      "external_apis": "healthy"
    },
    "metrics": {
      "uptime": "7d 12h 30m",
      "memory_usage": "45%",
      "cpu_usage": "23%"
    }
  }
}
```

## Обработка ошибок

### Коды ошибок

| Код | Описание |
|-----|----------|
| `VALIDATION_ERROR` | Ошибка валидации данных |
| `AUTHENTICATION_ERROR` | Ошибка аутентификации |
| `AUTHORIZATION_ERROR` | Ошибка авторизации |
| `NOT_FOUND_ERROR` | Ресурс не найден |
| `CONFLICT_ERROR` | Конфликт данных |
| `RATE_LIMIT_ERROR` | Превышен лимит запросов |
| `INTEGRATION_ERROR` | Ошибка внешней интеграции |
| `SYSTEM_ERROR` | Внутренняя ошибка системы |

### Примеры ошибок

**Ошибка валидации:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ошибка валидации данных",
    "details": {
      "email": ["Email должен быть корректным"],
      "password": ["Пароль должен содержать минимум 8 символов"]
    }
  }
}
```

**Ошибка авторизации:**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Недостаточно прав для выполнения операции"
  }
}
```

## Rate Limiting

API использует ограничение скорости запросов:
- **Обычные пользователи**: 100 запросов в минуту
- **API ключи**: 1000 запросов в минуту
- **Администраторы**: 500 запросов в минуту

При превышении лимита возвращается ошибка `RATE_LIMIT_ERROR`.

## Версионирование

API использует семантическое версионирование. Текущая версия: `v1`.

Для доступа к определенной версии используйте заголовок:
```
Accept: application/vnd.api.v1+json
```

## WebSocket API

Для real-time обновлений доступен WebSocket API:

**Подключение:**
```
ws://localhost:3000/ws?token=<jwt_token>
```

**События:**
- `project.updated` - обновление проекта
- `time_entry.created` - создание временной записи
- `invoice.status_changed` - изменение статуса счета
- `payment.received` - получение платежа

## Тестирование API

### Swagger документация
Интерактивная документация доступна по адресу:
```
http://localhost:3000/api-docs
```

### Postman коллекция
Готовая коллекция для тестирования доступна по адресу:
```
http://localhost:3000/api/postman-collection.json
```

### Тестовые данные
Для разработки и тестирования доступны тестовые данные:
```
POST /api/test/seed-data
```

## Заключение

API предоставляет полный функционал для:
- Управления проектами и пользователями
- Учета времени и финансов
- Аналитики и отчетности
- Интеграции с внешними системами

Все endpoints защищены аутентификацией и авторизацией, поддерживают пагинацию и возвращают структурированные ответы.
