# Руководство по разработке

## Обзор

Документ содержит руководство по разработке PWA приложения управления проектами, включая настройку окружения, стандарты кодирования, архитектуру компонентов и процесс разработки.

## Настройка окружения разработки

### Требования

- **Node.js**: версия 18.17.0 или выше
- **npm**: версия 9.0.0 или выше
- **Angular CLI**: версия 20.0.0 или выше
- **Git**: версия 2.30.0 или выше
- **Docker**: версия 20.10.0 или выше
- **Docker Compose**: версия 2.0.0 или выше

### Установка зависимостей

```bash
# Клонирование репозитория
git clone <repository-url>
cd project-management-pwa

# Установка зависимостей
npm install

# Установка Angular CLI глобально
npm install -g @angular/cli@20

# Проверка версий
node --version
npm --version
ng version
```

### Настройка IDE

#### VS Code (рекомендуется)

**Обязательные расширения:**
- Angular Language Service
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- GitLens
- Docker
- CouchDB

**Настройки workspace:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "angular.enable-strict-mode-prompt": false,
  "files.associations": {
    "*.md": "markdown"
  }
}
```

#### WebStorm/IntelliJ IDEA

**Настройки:**
- Включить TypeScript strict mode
- Настроить ESLint и Prettier
- Включить Angular support

### Переменные окружения

Создайте файл `.env.local` в корне проекта:

```bash
# База данных
COUCHDB_URL=http://localhost:5984
COUCHDB_USERNAME=admin
COUCHDB_PASSWORD=admin123

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=3600

# Интеграции
OPENPROJECT_API_URL=https://your-openproject.com/api/v3
OPENPROJECT_API_KEY=your-api-key

ERM_API_URL=https://your-erm-system.com/api
ERM_API_KEY=your-api-key

# PWA
PWA_MANIFEST_URL=/manifest.json
SERVICE_WORKER_URL=/ngsw-worker.js
```

## Архитектура проекта

### Структура папок

```
src/
├── app/
│   ├── core/                 # Основные сервисы и guards
│   │   ├── auth/            # Аутентификация
│   │   ├── guards/          # Guards для маршрутов
│   │   ├── interceptors/    # HTTP interceptors
│   │   ├── services/        # Основные сервисы
│   │   └── models/          # Интерфейсы и типы
│   ├── shared/              # Общие компоненты и модули
│   │   ├── components/      # Переиспользуемые компоненты
│   │   ├── directives/      # Директивы
│   │   ├── pipes/           # Пайпы
│   │   └── modules/         # Общие модули
│   ├── features/            # Функциональные модули
│   │   ├── dashboard/       # Главный дашборд
│   │   ├── projects/        # Управление проектами
│   │   ├── finance/         # Финансовый модуль
│   │   ├── analytics/       # Аналитика
│   │   ├── integrations/    # Интеграции
│   │   └── admin/           # Административная панель
│   ├── layout/              # Компоненты макета
│   │   ├── header/          # Заголовок
│   │   ├── sidebar/         # Боковая панель
│   │   └── footer/          # Подвал
│   └── app.component.ts     # Главный компонент
├── assets/                  # Статические ресурсы
│   ├── icons/              # Иконки PWA
│   ├── images/             # Изображения
│   └── styles/             # Глобальные стили
├── environments/            # Конфигурация окружений
└── main.ts                 # Точка входа
```

### Модульная архитектура

#### Core Module
```typescript
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule
  ],
  providers: [
    AuthService,
    AuthGuard,
    RoleGuard,
    AuthInterceptor,
    ErrorInterceptor
  ]
})
export class CoreModule { }
```

#### Shared Module
```typescript
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  declarations: [
    GlassCardComponent,
    GlassButtonComponent,
    GlassInputComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    GlassCardComponent,
    GlassButtonComponent,
    GlassInputComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ]
})
export class SharedModule { }
```

#### Feature Modules
```typescript
@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(PROJECTS_ROUTES)
  ],
  declarations: [
    ProjectListComponent,
    ProjectDetailComponent,
    ProjectFormComponent,
    ProjectCardComponent
  ],
  providers: [
    ProjectService,
    ProjectResolver
  ]
})
export class ProjectsModule { }
```

## Стандарты кодирования

### TypeScript

#### Строгий режим
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Интерфейсы и типы
```typescript
// Строго типизированные интерфейсы
export interface User {
  readonly id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;
}

// Union типы для статусов
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';

// Enum для ролей
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  GENERAL_DIRECTOR = 'general_director',
  DIRECTOR = 'director',
  PROJECT_MANAGER = 'project_manager',
  EMPLOYEE = 'employee'
}

// Utility типы
export type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserRequest = Partial<Omit<User, 'id' | 'createdAt'>>;
```

#### Асинхронные операции
```typescript
// Использование async/await
export class ProjectService {
  async getProject(id: string): Promise<Project> {
    try {
      const response = await this.http.get<ApiResponse<Project>>(`/api/projects/${id}`).toPromise();
      return response.data;
    } catch (error) {
      this.handleError('Ошибка при получении проекта', error);
      throw error;
    }
  }

  // Observable для real-time обновлений
  getProjectUpdates(id: string): Observable<Project> {
    return this.http.get<ApiResponse<Project>>(`/api/projects/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          this.handleError('Ошибка при получении обновлений проекта', error);
          return throwError(() => error);
        })
      );
  }
}
```

### Angular

#### Компоненты
```typescript
@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectCardComponent implements OnInit, OnDestroy {
  @Input() project!: Project;
  @Output() projectSelected = new EventEmitter<string>();
  
  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Подписка на обновления
    this.projectService.getProjectUpdates(this.project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.project = project;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onProjectClick(): void {
    this.projectSelected.emit(this.project.id);
  }
}
```

#### Сервисы
```typescript
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly apiUrl = '/api/projects';
  private projectsCache = new Map<string, Project>();

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private notificationService: NotificationService
  ) {}

  // Получение проектов с кэшированием
  getProjects(params: ProjectQueryParams): Observable<PaginatedResponse<Project>> {
    const cacheKey = this.generateCacheKey(params);
    
    if (this.projectsCache.has(cacheKey)) {
      return of(this.projectsCache.get(cacheKey)!);
    }

    return this.http.get<ApiResponse<PaginatedResponse<Project>>>(this.apiUrl, { params })
      .pipe(
        map(response => response.data),
        tap(projects => this.projectsCache.set(cacheKey, projects)),
        catchError(error => this.handleError('Ошибка при получении проектов', error))
      );
  }

  // Создание проекта
  createProject(project: CreateProjectRequest): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, project)
      .pipe(
        map(response => response.data),
        tap(project => {
          this.notificationService.showSuccess('Проект успешно создан');
          this.clearCache();
        }),
        catchError(error => this.handleError('Ошибка при создании проекта', error))
      );
  }

  private generateCacheKey(params: ProjectQueryParams): string {
    return JSON.stringify(params);
  }

  private clearCache(): void {
    this.projectsCache.clear();
  }

  private handleError(message: string, error: any): Observable<never> {
    this.errorHandler.handleError(message, error);
    return throwError(() => error);
  }
}
```

#### Guards и Interceptors
```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.notificationService.showError('Необходима авторизация');
    return this.router.createUrlTree(['/auth/login']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const requiredRoles = route.data['roles'] as UserRole[];
    const userRole = this.authService.getCurrentUser()?.role;

    if (requiredRoles.includes(userRole!)) {
      return true;
    }

    return this.router.createUrlTree(['/access-denied']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
```

### Стили и CSS

#### SCSS структура
```scss
// _variables.scss
:root {
  // Цвета
  --primary-50: #e3f2fd;
  --primary-500: #2196f3;
  --primary-900: #0d47a1;
  
  // Размеры
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  // Тени
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
}

// _mixins.scss
@mixin glass-effect($opacity: 0.25, $blur: 10px) {
  background: rgba(255, 255, 255, $opacity);
  backdrop-filter: blur($blur);
  -webkit-backdrop-filter: blur($blur);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

@mixin responsive($breakpoint) {
  @if $breakpoint == tablet {
    @media (min-width: 768px) { @content; }
  } @else if $breakpoint == desktop {
    @media (min-width: 1024px) { @content; }
  } @else if $breakpoint == large {
    @media (min-width: 1440px) { @content; }
  }
}

// Компонент
.project-card {
  @include glass-effect();
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
  
  @include responsive(tablet) {
    padding: var(--spacing-xl);
  }
  
  &__header {
    margin-bottom: var(--spacing-md);
    
    h3 {
      color: var(--primary-900);
      font-size: 1.25rem;
      font-weight: 600;
    }
  }
  
  &__content {
    color: var(--text-secondary);
    line-height: 1.6;
  }
}
```

## PWA разработка

### Service Worker

#### ngsw-config.json
```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.json"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-freshness",
      "urls": [
        "/api/projects",
        "/api/time-entries",
        "/api/invoices"
      ],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 100,
        "maxAge": "3d",
        "timeout": "10s"
      }
    },
    {
      "name": "api-performance",
      "urls": [
        "/api/analytics/**",
        "/api/settings"
      ],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 20,
        "maxAge": "1d"
      }
    }
  ]
}
```

#### Кастомный Service Worker
```typescript
// sw.js
const CACHE_NAME = 'project-management-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Установка
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API запросы
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Статические ресурсы
  if (request.destination === 'document' || request.destination === 'script') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Остальные ресурсы
  event.respondWith(handleOtherRequest(request));
});

async function handleApiRequest(request) {
  try {
    // Сначала пробуем сеть
    const response = await fetch(request);
    
    if (response.ok) {
      // Кэшируем успешные ответы
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Если сеть недоступна, возвращаем из кэша
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Возвращаем fallback
    return new Response(JSON.stringify({ error: 'Network error' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function handleOtherRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return fetch(request);
}
```

### PWA Manifest

```json
{
  "name": "Wone IT - Project Management",
  "short_name": "WonePM",
  "description": "Управление проектами и финансовая аналитика",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196f3",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "ru",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Новый проект",
      "short_name": "Проект",
      "description": "Создать новый проект",
      "url": "/projects/new",
      "icons": [
        {
          "src": "assets/icons/icon-96x96.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Учет времени",
      "short_name": "Время",
      "description": "Записать время",
      "url": "/time-entries/new",
      "icons": [
        {
          "src": "assets/icons/icon-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

## Тестирование

### Unit тесты

#### Компоненты
```typescript
describe('ProjectCardComponent', () => {
  let component: ProjectCardComponent;
  let fixture: ComponentFixture<ProjectCardComponent>;
  let mockProjectService: jasmine.SpyObj<ProjectService>;

  beforeEach(async () => {
    mockProjectService = jasmine.createSpyObj('ProjectService', ['getProjectUpdates']);
    
    await TestBed.configureTestingModule({
      declarations: [ProjectCardComponent],
      imports: [SharedModule],
      providers: [
        { provide: ProjectService, useValue: mockProjectService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit project ID when clicked', () => {
    const project: Project = {
      id: 'test-id',
      name: 'Test Project',
      // ... остальные поля
    };
    
    component.project = project;
    spyOn(component.projectSelected, 'emit');
    
    component.onProjectClick();
    
    expect(component.projectSelected.emit).toHaveBeenCalledWith('test-id');
  });
});
```

#### Сервисы
```typescript
describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    mockErrorHandler = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProjectService,
        { provide: ErrorHandlerService, useValue: mockErrorHandler }
      ]
    });
    
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should retrieve projects successfully', () => {
    const mockProjects: PaginatedResponse<Project> = {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    };

    service.getProjects({}).subscribe(projects => {
      expect(projects).toEqual(mockProjects);
    });

    const req = httpMock.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockProjects });
  });

  it('should handle errors properly', () => {
    service.getProjects({}).subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('/api/projects');
    req.error(new ErrorEvent('Network error'));
    
    expect(mockErrorHandler.handleError).toHaveBeenCalled();
  });
});
```

### E2E тесты

```typescript
describe('Project Management E2E', () => {
  beforeEach(async () => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@admin.ru');
    await page.fill('[data-testid="password-input"]', 'admin');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  it('should create a new project', async () => {
    await page.click('[data-testid="new-project-button"]');
    await page.waitForURL('/projects/new');
    
    await page.fill('[data-testid="project-name-input"]', 'Test Project');
    await page.fill('[data-testid="project-description-input"]', 'Test Description');
    await page.selectOption('[data-testid="department-select"]', 'development');
    
    await page.click('[data-testid="save-project-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/\d+/);
  });

  it('should track time for a project', async () => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-child');
    
    await page.click('[data-testid="add-time-button"]');
    await page.fill('[data-testid="hours-input"]', '8');
    await page.fill('[data-testid="description-input"]', 'Development work');
    await page.click('[data-testid="save-time-button"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

## Процесс разработки

### Git workflow

#### Ветки
- `main` - основная ветка с продакшен кодом
- `develop` - ветка разработки
- `feature/*` - ветки для новых функций
- `bugfix/*` - ветки для исправления багов
- `hotfix/*` - срочные исправления для продакшена

#### Коммиты
```bash
# Формат: type(scope): description
git commit -m "feat(projects): add project creation form"
git commit -m "fix(auth): resolve login validation issue"
git commit -m "docs(api): update authentication endpoints"
git commit -m "test(components): add unit tests for ProjectCard"
git commit -m "refactor(services): improve error handling"
```

#### Pull Request процесс
1. Создание feature ветки от `develop`
2. Разработка функционала
3. Написание тестов
4. Обновление документации
5. Создание Pull Request
6. Code Review
7. Merge в `develop`

### Code Review чеклист

- [ ] Код соответствует стандартам проекта
- [ ] Добавлены/обновлены тесты
- [ ] Обновлена документация
- [ ] Проверена производительность
- [ ] Проверена безопасность
- [ ] Проверена доступность
- [ ] Проверена совместимость с PWA
- [ ] Проверена работа в офлайн режиме

### CI/CD

#### GitHub Actions
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test:ci
    
    - name: Run E2E tests
      run: npm run e2e:ci
    
    - name: Build application
      run: npm run build:prod
    
    - name: Build PWA
      run: npm run build:pwa

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: echo "Deploy to production"
```

## Производительность

### Оптимизация

#### Lazy Loading
```typescript
const routes: Routes = [
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects.module').then(m => m.ProjectsModule)
  },
  {
    path: 'finance',
    loadChildren: () => import('./features/finance/finance.module').then(m => m.FinanceModule)
  }
];
```

#### OnPush стратегия
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent {
  projects$ = this.projectService.getProjects();
  
  constructor(private projectService: ProjectService) {}
}
```

#### Virtual Scrolling
```typescript
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="100" class="project-list">
      <div *cdkVirtualFor="let project of projects$ | async" class="project-item">
        <app-project-card [project]="project"></app-project-card>
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
export class ProjectListComponent {
  projects$ = this.projectService.getProjects();
}
```

### Мониторинг

#### Performance API
```typescript
@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  measurePageLoad(): void {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
      
      console.log('Performance metrics:', metrics);
      this.sendMetrics(metrics);
    }
  }

  private sendMetrics(metrics: any): void {
    // Отправка метрик в систему мониторинга
  }
}
```

## Безопасность

### Защита от XSS
```typescript
// Использование Angular sanitization
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  template: `<div [innerHTML]="sanitizedContent"></div>`
})
export class SafeContentComponent {
  constructor(private sanitizer: DomSanitizer) {}
  
  get sanitizedContent(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.userContent);
  }
}
```

### CSRF защита
```typescript
@Injectable({
  providedIn: 'root'
})
export class CsrfInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'GET') {
      const token = this.getCsrfToken();
      req = req.clone({
        setHeaders: {
          'X-CSRF-Token': token
        }
      });
    }
    return next.handle(req);
  }
}
```

## Заключение

Данное руководство обеспечивает:

1. **Стандартизацию** процесса разработки
2. **Качество** кода и архитектуры
3. **Производительность** приложения
4. **Безопасность** и надежность
5. **Масштабируемость** и поддерживаемость

Следуйте этим принципам для создания качественного PWA приложения управления проектами.
