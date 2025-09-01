import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { PouchDBService } from './pouchdb.service';

// === ИНТЕРФЕЙСЫ ERM API (из вашего VBA анализа) ===

export interface ERMUser {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  mail: string;
  status: number;
}

export interface ERMProject {
  id: number;
  name: string;
  identifier: string;
  description?: string;
  status: number;
  is_public: boolean;
  created_on: string;
  updated_on: string;
}

export interface ERMTimeEntry {
  id: number;
  project: { id: number; name: string };
  issue?: { id: number };
  user: { id: number; name: string };
  activity: { id: number; name: string };
  hours: number;
  paid_hours: number;
  comments: string;
  spent_on: string;
  created_on: string;
}

export interface ERMActivity {
  id: number;
  name: string;
  is_default: boolean;
}

export interface ERMIssue {
  id: number;
  project: { id: number; name: string; identifier: string };
  tracker: { id: number; name: string };
  status: { id: number; name: string };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  subject: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  done_ratio: number;
  is_private: boolean;
  estimated_hours?: number;
  total_estimated_hours?: number;
  spent_hours: number;
  total_spent_hours: number;
  created_on: string;
  updated_on: string;
  closed_on?: string;
}

export interface ERMResponse<T> {
  total_count: number;
  offset: number;
  limit: number;
  projects?: T[];
  users?: T[];
  time_entry_activities?: T[];
  time_entries?: T[];
  issues?: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ERMService {
  private configService = inject(ConfigService);
  private pouchDBService = inject(PouchDBService);

  // Кэш для служебных данных (аналог ServiceData в Excel)
  private usersCache: Map<string, number> = new Map(); // name -> id
  private projectsCache: Map<string, number> = new Map(); // name -> id  
  private activitiesCache: Map<string, number> = new Map(); // name -> id

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const config = this.configService.getERMConfig();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Redmine-API-Key': config.apiKey,
      'Accept': 'application/json'
    });
  }

  private getBaseUrl(): string {
    const originalUrl = this.configService.getERMConfig().baseUrl;
    
    // Автоматически заменяем внешние URL на прокси для обхода CORS
    if (originalUrl.startsWith('https://') || originalUrl.startsWith('http://')) {
      console.log('🔄 Заменяем внешний URL на прокси:', originalUrl, '→ /api/erm');
      return '/api/erm';
    }
    
    return originalUrl;
  }

  // === СЛУЖЕБНЫЕ ДАННЫЕ (Аналог RefreshServiceData в VBA) ===
  
  /**
   * Обновляет все служебные справочники (проекты, пользователи, активности)
   * Аналог RefreshServiceData() в VBA макросе
   */
  public async refreshServiceData(): Promise<{
    projects: ERMProject[],
    users: ERMUser[],
    activities: ERMActivity[]
  }> {
    const config = this.configService.getERMConfig();
    if (!config?.baseUrl || !config?.apiKey) {
      throw new Error('ERM конфигурация не настроена');
    }

    try {
      // Параллельно загружаем все справочники
      const [projects, users, activities] = await Promise.all([
        this.getProjects().toPromise(),
        this.getUsers().toPromise(), 
        this.getActivities().toPromise()
      ]);

      // Обновляем кэши для быстрого поиска
      this.updateCaches(projects || [], users || [], activities || []);

      return {
        projects: projects || [],
        users: users || [],
        activities: activities || []
      };
    } catch (error) {
      console.error('Ошибка обновления служебных данных:', error);
      throw error;
    }
  }

  private updateCaches(projects: ERMProject[], users: ERMUser[], activities: ERMActivity[]) {
    // Очищаем старые кэши
    this.projectsCache.clear();
    this.usersCache.clear();
    this.activitiesCache.clear();

    // Заполняем кэши проектов
    projects.forEach(project => {
      this.projectsCache.set(project.name, project.id);
    });

    // Заполняем кэш пользователей
    users.forEach(user => {
      const fullName = `${user.firstname} ${user.lastname}`.trim();
      this.usersCache.set(fullName, user.id);
      this.usersCache.set(user.name, user.id); // Альтернативное имя
    });

    // Заполняем кэш активностей
    activities.forEach(activity => {
      this.activitiesCache.set(activity.name, activity.id);
    });
  }

  // === API МЕТОДЫ ===

  /**
   * Получает список проектов
   */
  getProjects(limit = 100, offset = 0): Observable<ERMProject[]> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return throwError('Конфигурация не найдена');

    const url = `${baseUrl}/projects.json?limit=${limit}&offset=${offset}`;
    
    return this.http.get<ERMResponse<ERMProject>>(url, { 
      headers: this.getHeaders()
    }).pipe(
      map(response => response.projects || []),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Получает список пользователей
   */
  getUsers(limit = 100, offset = 0): Observable<ERMUser[]> {
    const config = this.configService.getERMConfig();
    if (!config) return throwError('Конфигурация не найдена');

    const url = `${config.baseUrl}/users.json?limit=${limit}&offset=${offset}&status=1`;
    
    return this.http.get<ERMResponse<ERMUser>>(url, { 
      headers: this.getHeaders()
    }).pipe(
      map(response => response.users || []),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Получает список активностей
   */
  getActivities(): Observable<ERMActivity[]> {
    const config = this.configService.getERMConfig();
    if (!config) return throwError('Конфигурация не найдена');

    const url = `${config.baseUrl}/enumerations/time_entry_activities.json`;
    
    return this.http.get<ERMResponse<ERMActivity>>(url, { 
      headers: this.getHeaders()
    }).pipe(
      map(response => response.time_entry_activities || []),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Получает временные записи (аналог основной функции VBA макроса)
   * GetEasyRedmineTime_FilterInMemory()
   */
  getTimeEntries(params?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
    userId?: string;
    userIds?: number[];
    limit?: number;
    offset?: number;
  }): Observable<ERMTimeEntry[]> {
    const config = this.configService.getERMConfig();
    if (!config) return throwError('Конфигурация не найдена');

    // Строим URL с параметрами (аналог VBA кода)
    let url = `${config.baseUrl}/easy_time_entries.json?easy_query_p=set_filter=0`;
    
    const limit = params?.limit || 100;
    const offset = params?.offset || 0;
    
    url += `&limit=${limit}&offset=${offset}`;
    
    // Даты (из конфигурации или параметров)
    const startDate = params?.startDate || config.startDate;
    const endDate = params?.endDate || config.endDate;
    
    if (startDate) url += `&from=${startDate}`;
    if (endDate) url += `&to=${endDate}`;
    
    // Фильтр по проекту
    if (params?.projectId || config.projectId) {
      url += `&project_id=${params?.projectId || config.projectId}`;
    }
    
    // Фильтр по пользователям (быстрый метод из VBA)
    if (params?.userIds && params.userIds.length > 0) {
      url += `&user_id=${params.userIds.join('|')}`;
    }

    return this.http.get<ERMResponse<ERMTimeEntry>>(url, { 
      headers: this.getHeaders()
    }).pipe(
      map(response => response.time_entries || []),
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * Массовая загрузка временных записей с прогрессом
   * Аналог основного цикла в VBA макросе
   */
  async getAllTimeEntriesWithProgress(
    userFilter?: string[],
    progressCallback?: (current: number, total: number, message: string) => void
  ): Promise<ERMTimeEntry[]> {
    const config = this.configService.getERMConfig();
    if (!config) throw new Error('Конфигурация не найдена');

    let allEntries: ERMTimeEntry[] = [];
    let offset = 0;
    const limit = 100;
    let totalCount = 0;
    let fetchedCount = 0;

    // Определяем метод загрузки (быстрый/стандартный)
    let userIds: number[] = [];
    let useFastMethod = false;

    if (userFilter && userFilter.length > 0) {
      // Преобразуем имена пользователей в ID (аналог VBA кода)
      for (const userName of userFilter) {
        const userId = this.usersCache.get(userName);
        if (userId) {
          userIds.push(userId);
        }
      }
      
      if (userIds.length === userFilter.length) {
        useFastMethod = true;
        progressCallback?.(0, 1, 'Выбран быстрый метод (фильтрация на сервере)');
      } else {
        progressCallback?.(0, 1, 'Выбран стандартный метод (фильтрация в клиенте)');
      }
    }

    try {
      do {
        const params: any = { limit, offset };
        
        if (useFastMethod && userIds.length > 0) {
          params.userIds = userIds;
        }
        
        const batch = await this.getTimeEntries(params).toPromise();
        
        if (batch && batch.length > 0) {
          if (offset === 0) {
            totalCount = 1000; // Примерная оценка
          }
          
          if (useFastMethod) {
            // Быстрый метод: добавляем все записи
            allEntries.push(...batch);
            fetchedCount += batch.length;
          } else {
            // Медленный метод: фильтруем по пользователям
            for (const entry of batch) {
              if (!userFilter || userFilter.includes(entry.user.name)) {
                allEntries.push(entry);
              }
              fetchedCount++;
            }
          }
          
          progressCallback?.(
            fetchedCount, 
            totalCount, 
            `Загружено ${allEntries.length} записей из ${fetchedCount} просканированных`
          );
          
          offset += limit;
        } else {
          break; // Больше записей нет
        }
        
      } while (fetchedCount < 20000); // Лимит безопасности
      
      return allEntries;
      
    } catch (error) {
      console.error('Ошибка массовой загрузки:', error);
      throw error;
    }
  }

  // === ISSUES API (Логика из Excel макроса) ===

  /**
   * Получает все доступные issues для извлечения списка "наших" пользователей
   * Это основа логики из Excel макроса - вместо прямого запроса к users API
   */
  public getIssues(params: {
    limit?: number;
    offset?: number;
    project_id?: number;
    assigned_to_id?: number;
    status_id?: string;
    created_on?: string; // ><2023-01-01|2023-12-31
  } = {}): Observable<ERMResponse<ERMIssue>> {
    const searchParams = new URLSearchParams({
      limit: (params.limit || 100).toString(),
      offset: (params.offset || 0).toString(),
      ...Object.fromEntries(
        Object.entries(params).filter(([key, value]) => 
          key !== 'limit' && key !== 'offset' && value !== undefined
        ).map(([key, value]) => [key, value.toString()])
      )
    });

    const url = `${this.getBaseUrl()}/issues.json?${searchParams}`;
    
    return this.http.get<ERMResponse<ERMIssue>>(url, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  /**
   * Извлекает уникальных пользователей из issues (логика Excel макроса)
   * Это наши реальные сотрудники, а не все пользователи системы
   */
  public async extractUsersFromIssues(limit: number = 1000): Promise<ERMUser[]> {
    const allUsers = new Map<number, ERMUser>();
    let offset = 0;
    const batchSize = 100;

    try {
      while (offset < limit) {
        const response = await this.getIssues({ 
          limit: batchSize, 
          offset 
        }).toPromise();

        if (!response || !response.issues || response.issues.length === 0) {
          break;
        }

        // Извлекаем assigned_to пользователей
        response.issues.forEach(issue => {
          if (issue.assigned_to && !allUsers.has(issue.assigned_to.id)) {
            allUsers.set(issue.assigned_to.id, {
              id: issue.assigned_to.id,
              name: issue.assigned_to.name,
              firstname: issue.assigned_to.name.split(' ')[0] || '',
              lastname: issue.assigned_to.name.split(' ').slice(1).join(' ') || '',
              mail: '', // Будет заполнено позже при получении полных данных
              status: 1 // Активный
            });
          }
        });

        // Если получили меньше чем запрашивали - это последняя страница
        if (response.issues.length < batchSize) {
          break;
        }

        offset += batchSize;
      }

      console.log(`🎯 Извлечено ${allUsers.size} уникальных пользователей из issues`);
      return Array.from(allUsers.values());

    } catch (error) {
      console.error('Ошибка при извлечении пользователей из issues:', error);
      throw error;
    }
  }

  /**
   * Получает временные записи по конкретным пользователям (логика Excel)
   * Используется после получения списка "наших" пользователей из issues
   */
  public getTimeEntriesByUsers(
    userIds: number[],
    dateFrom?: string, 
    dateTo?: string,
    limit: number = 1000
  ): Observable<ERMResponse<ERMTimeEntry>> {
    const params: any = {
      limit: limit.toString(),
      user_id: userIds.join(',') // Можно передать несколько ID через запятую
    };

    if (dateFrom) params.spent_on = `><${dateFrom}`;
    if (dateTo && dateFrom) params.spent_on = `><${dateFrom}|${dateTo}`;

    const searchParams = new URLSearchParams(params);
    const url = `${this.getBaseUrl()}/time_entries.json?${searchParams}`;
    
    return this.http.get<ERMResponse<ERMTimeEntry>>(url, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // === СТРАТЕГИИ ЗАГРУЗКИ (Логика из Excel) ===

  /**
   * СТРАТЕГИЯ 1: Быстрая загрузка - показать кэшированных пользователей
   * Возвращает пользователей из локального кэша PouchDB
   */
  public async getQuickUsers(): Promise<ERMUser[]> {
    // TODO: Получить из PouchDB кэш пользователей
    console.log('🚀 Быстрая загрузка пользователей из кэша');
    return Array.from(this.usersCache.entries()).map(([name, id]) => ({
      id,
      name,
      firstname: name.split(' ')[0] || '',
      lastname: name.split(' ').slice(1).join(' ') || '',
      mail: '',
      status: 1
    }));
  }

  /**
   * СТРАТЕГИЯ 2: Медленная полная загрузка (Excel логика)
   * Загружает ВСЕ issues для извлечения всех доступных пользователей
   * Issues не сохраняются, только пополняется список пользователей
   */
  public async getFullUsersDiscovery(): Promise<ERMUser[]> {
    console.log('🐌 Медленная полная загрузка - извлечение пользователей из ALL issues');
    
    try {
      // Загружаем большое количество issues для извлечения всех пользователей
      const allUsers = await this.extractUsersFromIssues(10000); // Много issues
      
      // Обновляем кэш пользователей
      allUsers.forEach(user => {
        this.usersCache.set(user.name, user.id);
      });
      
      console.log(`✅ Обнаружено ${allUsers.length} пользователей через полную загрузку issues`);
      return allUsers;
      
    } catch (error) {
      console.error('❌ Ошибка полной загрузки пользователей:', error);
      throw error;
    }
  }

  /**
   * СТРАТЕГИЯ 3: Загрузка по проектам (ваше предложение)  
   * 1. Получить все проекты
   * 2. По каждому проекту загрузить time entries
   * 3. Извлечь пользователей и данные
   */
  public async getDataByProjects(dateFrom?: string, dateTo?: string): Promise<{
    projects: ERMProject[],
    users: ERMUser[],
    timeEntries: ERMTimeEntry[]
  }> {
    console.log('📁 Загрузка по проектам - сначала все проекты, потом по каждому данные');
    
    try {
      // 1. Получаем все проекты
      const projects = await this.getProjects(1000, 0).toPromise() || [];
      
      console.log(`📁 Найдено ${projects.length} проектов`);
      
      // 2. Собираем данные по каждому проекту
      const allTimeEntries: ERMTimeEntry[] = [];
      const allUsers = new Map<number, ERMUser>();
      
      for (const project of projects) {
        try {
          console.log(`📊 Загрузка данных для проекта: ${project.name}`);
          
          // Получаем time entries для конкретного проекта
          const params: any = { 
            limit: 1000,
            project_id: project.id 
          };
          
          if (dateFrom) params.spent_on = `><${dateFrom}`;
          if (dateTo && dateFrom) params.spent_on = `><${dateFrom}|${dateTo}`;
          
          const projectTimeEntries = await this.getTimeEntries(params).toPromise() || [];
          
          // Добавляем в общий массив
          allTimeEntries.push(...projectTimeEntries);
          
          // Извлекаем пользователей
          projectTimeEntries.forEach((entry: ERMTimeEntry) => {
            if (entry.user && !allUsers.has(entry.user.id)) {
              allUsers.set(entry.user.id, {
                id: entry.user.id,
                name: entry.user.name,
                firstname: entry.user.name.split(' ')[0] || '',
                lastname: entry.user.name.split(' ').slice(1).join(' ') || '',
                mail: '',
                status: 1
              });
            }
          });
          
        } catch (projectError) {
          console.warn(`⚠️ Ошибка загрузки проекта ${project.name}:`, projectError);
          // Продолжаем с другими проектами
        }
      }
      
      const users = Array.from(allUsers.values());
      
      console.log(`✅ Стратегия по проектам завершена:`);
      console.log(`   📁 Проектов: ${projects.length}`);
      console.log(`   👥 Пользователей: ${users.length}`);
      console.log(`   ⏱️ Временных записей: ${allTimeEntries.length}`);
      
      return {
        projects,
        users,
        timeEntries: allTimeEntries
      };
      
    } catch (error) {
      console.error('❌ Ошибка загрузки по проектам:', error);
      throw error;
    }
  }

  /**
   * СТРАТЕГИЯ 4: Быстрая выборка по известным пользователям (Excel логика)
   * После того как пользователи известны, быстро получаем их time entries
   */
  public async getQuickTimeEntriesForUsers(
    userIds: number[], 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<ERMTimeEntry[]> {
    console.log(`⚡ Быстрая выборка time entries для ${userIds.length} пользователей`);
    
    try {
      const response = await this.getTimeEntriesByUsers(userIds, dateFrom, dateTo, 10000).toPromise();
      const timeEntries = response?.time_entries || [];
      
      console.log(`✅ Получено ${timeEntries.length} временных записей`);
      return timeEntries;
      
    } catch (error) {
      console.error('❌ Ошибка быстрой выборки:', error);
      throw error;
    }
  }

  // === СЕЛЕКТИВНОЕ СОХРАНЕНИЕ В БД ===

  /**
   * Сохраняет справочники (всегда полностью)
   * Пользователи и проекты - это справочная информация
   */
  public async saveMasterDataToDB(
    users: ERMUser[], 
    projects: ERMProject[],
    activities?: ERMActivity[]
  ): Promise<void> {
    try {
      console.log('💾 Сохранение справочников в БД...');
      
      // Сохраняем всех пользователей (справочник)
      for (const user of users) {
        await this.pouchDBService.upsertDocument('users', `erm_${user.id}`, {
          ermId: user.id,
          name: user.name,
          firstname: user.firstname,
          lastname: user.lastname,
          mail: user.mail,
          status: user.status,
          source: 'erm', // Источник данных
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Сохраняем все проекты (справочник)
      for (const project of projects) {
        await this.pouchDBService.upsertDocument('projects', `erm_${project.id}`, {
          ermId: project.id,
          name: project.name,
          identifier: project.identifier,
          description: project.description,
          status: project.status,
          is_public: project.is_public,
          created_on: project.created_on,
          updated_on: project.updated_on,
          source: 'erm',
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Сохраняем активности (если есть)
      if (activities) {
        for (const activity of activities) {
          await this.pouchDBService.upsertDocument('activities', `erm_${activity.id}`, {
            ermId: activity.id,
            name: activity.name,
            is_default: activity.is_default,
            source: 'erm',
            lastUpdated: new Date().toISOString()
          });
        }
      }
      
      console.log(`✅ Справочники сохранены: ${users.length} users, ${projects.length} projects`);
      
    } catch (error) {
      console.error('❌ Ошибка сохранения справочников:', error);
      throw error;
    }
  }

  /**
   * Сохраняет рабочие данные ТОЛЬКО для выбранных пользователей/проектов
   * Time entries обновляются по ключу ERM ID
   */
  public async saveSelectedDataToDB(
    timeEntries: ERMTimeEntry[],
    selectedUserIds: number[],
    selectedProjectIds: number[]
  ): Promise<void> {
    try {
      console.log('🎯 Сохранение данных для выбранных пользователей/проектов...');
      
      let savedCount = 0;
      
      for (const entry of timeEntries) {
        // Проверяем, что запись относится к выбранным пользователям ИЛИ проектам
        const isSelectedUser = selectedUserIds.includes(entry.user.id);
        const isSelectedProject = selectedProjectIds.includes(entry.project.id);
        
        if (isSelectedUser || isSelectedProject) {
          await this.pouchDBService.upsertDocument('time_entries', `erm_${entry.id}`, {
            ermId: entry.id,
            project: entry.project,
            user: entry.user,
            issue: entry.issue,
            activity: entry.activity,
            hours: entry.hours,
            paid_hours: entry.paid_hours,
            comments: entry.comments,
            spent_on: entry.spent_on,
            created_on: entry.created_on,
            source: 'erm',
            lastUpdated: new Date().toISOString()
          });
          savedCount++;
        }
      }
      
      console.log(`✅ Сохранено ${savedCount} временных записей из ${timeEntries.length} доступных`);
      
    } catch (error) {
      console.error('❌ Ошибка сохранения выбранных данных:', error);
      throw error;
    }
  }

  /**
   * Комплексная загрузка и сохранение по выбранной стратегии
   */
  public async executeLoadingStrategy(
    strategy: 'projects' | 'users' | 'full',
    options: {
      selectedUserIds?: number[];
      selectedProjectIds?: number[];
      dateFrom?: string;
      dateTo?: string;
      saveToDb?: boolean;
    }
  ): Promise<{
    users: ERMUser[];
    projects: ERMProject[];
    timeEntries: ERMTimeEntry[];
    stats: {
      totalUsers: number;
      totalProjects: number;
      totalTimeEntries: number;
      savedTimeEntries: number;
    }
  }> {
    console.log(`🚀 Выполнение стратегии загрузки: ${strategy}`);
    
    let users: ERMUser[] = [];
    let projects: ERMProject[] = [];
    let timeEntries: ERMTimeEntry[] = [];
    
    try {
      switch (strategy) {
        case 'projects':
          const projectData = await this.getDataByProjects(options.dateFrom, options.dateTo);
          users = projectData.users;
          projects = projectData.projects;
          timeEntries = projectData.timeEntries;
          break;
          
        case 'users':
          // Сначала получаем пользователей
          if (options.selectedUserIds && options.selectedUserIds.length > 0) {
            timeEntries = await this.getQuickTimeEntriesForUsers(
              options.selectedUserIds, 
              options.dateFrom, 
              options.dateTo
            );
            users = await this.getQuickUsers();
          } else {
            users = await this.getFullUsersDiscovery();
          }
          
          // Получаем проекты отдельно
          projects = await this.getProjects(1000, 0).toPromise() || [];
          break;
          
        case 'full':
          // Полная загрузка всего
          users = await this.getFullUsersDiscovery();
          projects = await this.getProjects(1000, 0).toPromise() || [];
          
          if (options.selectedUserIds && options.selectedUserIds.length > 0) {
            timeEntries = await this.getQuickTimeEntriesForUsers(
              options.selectedUserIds,
              options.dateFrom,
              options.dateTo
            );
          }
          break;
      }
      
      // Сохраняем данные в БД если требуется
      let savedTimeEntries = 0;
      if (options.saveToDb) {
        // Всегда сохраняем справочники
        await this.saveMasterDataToDB(users, projects);
        
        // Сохраняем данные только для выбранных
        if (timeEntries.length > 0 && (options.selectedUserIds?.length || options.selectedProjectIds?.length)) {
          await this.saveSelectedDataToDB(
            timeEntries,
            options.selectedUserIds || [],
            options.selectedProjectIds || []
          );
          
          savedTimeEntries = timeEntries.filter(entry => 
            (options.selectedUserIds || []).includes(entry.user.id) ||
            (options.selectedProjectIds || []).includes(entry.project.id)
          ).length;
        }
      }
      
      const stats = {
        totalUsers: users.length,
        totalProjects: projects.length,
        totalTimeEntries: timeEntries.length,
        savedTimeEntries
      };
      
      console.log('✅ Стратегия выполнена:', stats);
      
      return { users, projects, timeEntries, stats };
      
    } catch (error) {
      console.error(`❌ Ошибка выполнения стратегии ${strategy}:`, error);
      throw error;
    }
  }

  // === УТИЛИТЫ ===

  /**
   * Получает ID пользователя по имени (из кэша)
   */
  getUserId(userName: string): number | undefined {
    return this.usersCache.get(userName);
  }

  /**
   * Получает ID проекта по имени (из кэша)  
   */
  getProjectId(projectName: string): number | undefined {
    return this.projectsCache.get(projectName);
  }

  /**
   * Получает ID активности по имени (из кэша)
   */
  getActivityId(activityName: string): number | undefined {
    return this.activitiesCache.get(activityName);
  }

  /**
   * Проверяет доступность ERM API
   * Использует запрос проектов с лимитом 1 для быстрой проверки
   */
  async testConnection(): Promise<boolean> {
    const config = this.configService.getERMConfig();
    console.log('🔍 Тестирование ERM подключения:', {
      baseUrl: config.baseUrl,
      hasApiKey: !!config.apiKey
    });
    
    if (!config?.baseUrl || !config?.apiKey) {
      console.error('❌ ERM конфигурация неполная');
      return false;
    }

    try {
      console.log('📡 Отправляем тестовый запрос к ERM...');
      const projects = await this.getProjects(1, 0).toPromise();
      
      if (projects && projects.length >= 0) {
        console.log('✅ ERM подключение успешно! Получено проектов:', projects.length);
        return true;
      } else {
        console.warn('⚠️ ERM ответил, но нет данных о проектах');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Ошибка подключения к ERM:', {
        message: error.message,
        status: error.status,
        url: error.url,
        error
      });
      return false;
    }
  }

  // === ОБРАБОТКА ОШИБОК ===
  private handleError = (error: any) => {
    console.error('ERM API Error:', error);
    
    if (error.status === 401) {
      return throwError('Неверный API ключ');
    } else if (error.status === 404) {
      return throwError('ERM сервер недоступен');
    } else if (error.status === 0) {
      return throwError('CORS ошибка или сервер недоступен');
    }
    
    return throwError(error.message || 'Неизвестная ошибка ERM API');
  };
}
