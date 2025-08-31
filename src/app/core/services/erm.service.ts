import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { ConfigService } from './config.service';

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

export interface ERMResponse<T> {
  total_count: number;
  offset: number;
  limit: number;
  projects?: T[];
  users?: T[];
  time_entry_activities?: T[];
  time_entries?: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ERMService {
  private configService = inject(ConfigService);

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
    return this.configService.getERMConfig().baseUrl;
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
   */
  async testConnection(): Promise<boolean> {
    const config = this.configService.getERMConfig();
    if (!config?.baseUrl || !config?.apiKey) {
      return false;
    }

    try {
      const projects = await this.getProjects(1).toPromise();
      return true;
    } catch (error) {
      console.error('Ошибка подключения к ERM:', error);
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
