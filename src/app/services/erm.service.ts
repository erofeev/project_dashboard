import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, firstValueFrom } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { DatabaseService } from './database.service';
import { ProgressService } from './progress.service';

// Интерфейсы для данных ЕРМ
export interface ERMUser {
  id: string;
  name: string;
  email: string;
  role: string;
  direction?: string;
  isAdmin?: boolean;
  salary?: number;
  hourlyRate?: number;
  workingDaysPerMonth?: number;
  status?: string;
  firstname?: string;
  lastname?: string;
  admin?: boolean;
  salary_field?: number;
  hourly_rate?: number;
  working_days_per_month?: number;
}

export interface ERMProject {
  id: string;
  name: string;
  description?: string;
  direction: string;
  status: string;
  plannedCost?: number;
  plannedHours?: number;
  startDate?: string;
  endDate?: string;
  managerId?: string;
  identifier?: string;
  created_on?: string;
  updated_on?: string;
}

export interface ERMTimeEntry {
  id: string;
  projectId: string;
  userId: string;
  date: string;
  hours: number;
  activity: string;
  comments?: string;
  project?: { id: number; name: string };
  user?: { id: number; name: string };
  activity_obj?: { id: number; name: string };
  spent_on?: string;
  created_on?: string;
}

export interface ERMActivity {
  id: string;
  name: string;
  isDefault?: boolean;
  is_default?: boolean;
  position?: number;
}

export interface ERMResponse<T> {
  total_count?: number;
  offset?: number;
  limit?: number;
  [key: string]: any;
}

export interface ERMSettings {
  id?: string;
  userId: string;
  baseUrl: string;
  apiKey: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ERMService {
  private baseUrl: string;
  private apiKey: string;
  private httpOptions: { headers: HttpHeaders };

  constructor(
    private http: HttpClient,
    private databaseService: DatabaseService,
    private progressService: ProgressService
  ) {
    // Инициализируем с пустыми значениями, они будут установлены при вызове методов
    this.baseUrl = '';
    this.apiKey = '';
    
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  /**
   * Обновляет данные о пользователях из ЕРМ
   */
  async updateUsers(): Promise<void> {
    await this.loadERMSettings();
    
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Не настроены URL и API ключ для ЕРМ системы. Перейдите в "Настройки → Аккаунт" для настройки подключения.');
    }
    try {
      this.progressService.updateProgress(25, 'Загрузка списка пользователей...');
      
      const response = await firstValueFrom(this.fetchUsersFromERM());
      
      if (response && response['users']) {
        this.progressService.updateProgress(30, 'Обработка данных пользователей...');
        
        const users: ERMUser[] = response['users'].map((user: any) => this.mapERMUserToUser(user));
        
        // Сохраняем пользователей в базу данных
        for (const user of users) {
          await this.databaseService.createOrUpdateUser(user);
        }
        
        this.progressService.updateProgress(35, `Загружено ${users.length} пользователей`);
      }
    } catch (error: any) {
      console.error('Error updating users:', error);
      throw new Error(`Ошибка при обновлении пользователей: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Обновляет данные о проектах из ЕРМ
   */
  async updateProjects(): Promise<void> {
    await this.loadERMSettings();
    
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Не настроены URL и API ключ для ЕРМ системы. Перейдите в "Настройки → Аккаунт" для настройки подключения.');
    }
    try {
      this.progressService.updateProgress(45, 'Загрузка списка проектов...');
      
      const response = await firstValueFrom(this.fetchProjectsFromERM());
      
      if (response && response['projects']) {
        this.progressService.updateProgress(50, 'Обработка данных проектов...');
        
        const projects: ERMProject[] = response['projects'].map((project: any) => this.mapERMProjectToProject(project));
        
        // Сохраняем проекты в базу данных
        for (const project of projects) {
          await this.databaseService.createOrUpdateProject(project);
        }
        
        this.progressService.updateProgress(55, `Загружено ${projects.length} проектов`);
      }
    } catch (error: any) {
      console.error('Error updating projects:', error);
      throw new Error(`Ошибка при обновлении проектов: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Обновляет временные записи из ЕРМ за указанный период
   */
  async updateTimeEntries(startDate: string, endDate: string): Promise<void> {
    await this.loadERMSettings();
    
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Не настроены URL и API ключ для ЕРМ системы. Перейдите в "Настройки → Аккаунт" для настройки подключения.');
    }
    try {
      this.progressService.updateProgress(65, 'Загрузка временных записей...');
      
      const response = await firstValueFrom(this.fetchTimeEntriesFromERM(startDate, endDate));
      
      if (response && response['time_entries']) {
        this.progressService.updateProgress(70, 'Обработка временных записей...');
        
        const timeEntries: ERMTimeEntry[] = response['time_entries'].map((entry: any) => this.mapERMTimeEntryToTimeEntry(entry));
        
        // Сохраняем временные записи в базу данных
        for (const entry of timeEntries) {
          await this.databaseService.createOrUpdateTimeEntry(entry);
        }
        
        this.progressService.updateProgress(75, `Загружено ${timeEntries.length} временных записей`);
      }
    } catch (error: any) {
      console.error('Error updating time entries:', error);
      throw new Error(`Ошибка при обновлении временных записей: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Обновляет данные об активностях из ЕРМ
   */
  async updateActivities(): Promise<void> {
    await this.loadERMSettings();
    
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Не настроены URL и API ключ для ЕРМ системы. Перейдите в "Настройки → Аккаунт" для настройки подключения.');
    }
    try {
      this.progressService.updateProgress(85, 'Загрузка списка активностей...');
      
      const response = await firstValueFrom(this.fetchActivitiesFromERM());
      
      if (response && response['time_entry_activities']) {
        this.progressService.updateProgress(90, 'Обработка данных активностей...');
        
        const activities: ERMActivity[] = response['time_entry_activities'].map((activity: any) => this.mapERMActivityToActivity(activity));
        
        // Сохраняем активности в базу данных
        for (const activity of activities) {
          await this.databaseService.createOrUpdateActivity(activity);
        }
        
        this.progressService.updateProgress(95, `Загружено ${activities.length} активностей`);
      }
    } catch (error: any) {
      console.error('Error updating activities:', error);
      throw new Error(`Ошибка при обновлении активностей: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  // Приватные методы для работы с API

  private fetchUsersFromERM(): Observable<ERMResponse<ERMUser>> {
    const url = `${this.baseUrl}/users.json?limit=100&status=1`;
    return this.http.get<ERMResponse<ERMUser>>(url, this.httpOptions)
      .pipe(
        tap(() => console.log('Fetching users from ERM...')),
        catchError(this.handleError)
      );
  }

  private fetchProjectsFromERM(): Observable<ERMResponse<ERMProject>> {
    const url = `${this.baseUrl}/projects.json?limit=100`;
    return this.http.get<ERMResponse<ERMProject>>(url, this.httpOptions)
      .pipe(
        tap(() => console.log('Fetching projects from ERM...')),
        catchError(this.handleError)
      );
  }

  private fetchTimeEntriesFromERM(startDate: string, endDate: string): Observable<ERMResponse<ERMTimeEntry>> {
    let url = `${this.baseUrl}/easy_time_entries.json?limit=1000`;
    
    if (startDate) {
      url += `&from=${startDate}`;
    }
    if (endDate) {
      url += `&to=${endDate}`;
    }
    
    return this.http.get<ERMResponse<ERMTimeEntry>>(url, this.httpOptions)
      .pipe(
        tap(() => console.log('Fetching time entries from ERM...')),
        catchError(this.handleError)
      );
  }

  private fetchActivitiesFromERM(): Observable<ERMResponse<ERMActivity>> {
    const url = `${this.baseUrl}/enumerations/time_entry_activities.json`;
    return this.http.get<ERMResponse<ERMActivity>>(url, this.httpOptions)
      .pipe(
        tap(() => console.log('Fetching activities from ERM...')),
        catchError(this.handleError)
      );
  }

  // Методы маппинга данных

  private mapERMUserToUser(ermUser: any): ERMUser {
    return {
      id: ermUser.id.toString(),
      name: `${ermUser.firstname || ''} ${ermUser.lastname || ''}`.trim(),
      email: ermUser.mail || '',
      role: ermUser.role || 'employee',
      direction: ermUser.direction,
      isAdmin: ermUser.admin === true,
      salary: ermUser.salary_field || ermUser.salary,
      hourlyRate: ermUser.hourly_rate,
      workingDaysPerMonth: ermUser.working_days_per_month || 22,
      status: ermUser.status
    };
  }

  private mapERMProjectToProject(ermProject: any): ERMProject {
    return {
      id: ermProject.id.toString(),
      name: ermProject.name,
      description: ermProject.description,
      direction: ermProject.direction || 'general',
      status: ermProject.status || 'active',
      plannedCost: ermProject.planned_cost,
      plannedHours: ermProject.planned_hours,
      startDate: ermProject.start_date,
      endDate: ermProject.due_date,
      managerId: ermProject.manager_id?.toString(),
      identifier: ermProject.identifier,
      created_on: ermProject.created_on,
      updated_on: ermProject.updated_on
    };
  }

  private mapERMTimeEntryToTimeEntry(ermTimeEntry: any): ERMTimeEntry {
    return {
      id: ermTimeEntry.id.toString(),
      projectId: ermTimeEntry.project?.id?.toString() || '',
      userId: ermTimeEntry.user?.id?.toString() || '',
      date: ermTimeEntry.spent_on || ermTimeEntry.date,
      hours: ermTimeEntry.hours,
      activity: ermTimeEntry.activity_obj?.name || ermTimeEntry.activity || '',
      comments: ermTimeEntry.comments,
      created_on: ermTimeEntry.created_on
    };
  }

  private mapERMActivityToActivity(ermActivity: any): ERMActivity {
    return {
      id: ermActivity.id.toString(),
      name: ermActivity.name,
      isDefault: ermActivity.is_default || ermActivity.isDefault || false,
      position: ermActivity.position
    };
  }

  // Обработка ошибок
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Произошла ошибка при обращении к ЕРМ системе';
    
    if (error.error instanceof ErrorEvent) {
      // Ошибка на стороне клиента
      errorMessage = `Ошибка клиента: ${error.error.message}`;
    } else {
      // Ошибка на стороне сервера
      errorMessage = `Ошибка сервера: ${error.status} ${error.statusText}`;
      
      // Специальная обработка для SSL/TLS ошибок
      if (error.status === 0) {
        errorMessage = 'Ошибка SSL/TLS соединения. Проверьте настройки сервера и попробуйте снова.';
      }
      
      if (error.error && error.error.errors) {
        errorMessage += ` - ${JSON.stringify(error.error.errors)}`;
      }
    }
    
    console.error('ERM API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Метод для проверки доступности ЕРМ системы
  checkERMConnection(): Observable<boolean> {
    if (!this.baseUrl || !this.apiKey) {
      return of(false);
    }
    
    const url = `${this.baseUrl}/users.json?limit=1`;
    return this.http.get(url, this.httpOptions)
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  /**
   * Получает настройки ЕРМ для текущего пользователя
   */
  async getERMSettings(): Promise<ERMSettings | null> {
    try {
      // Получаем текущего пользователя (в реальном приложении это должно быть из AuthService)
      const currentUser = await this.databaseService.getCurrentUser();
      if (!currentUser) {
        return null;
      }

      // Ищем настройки в базе данных
      const settings = await this.databaseService.getERMSettings(currentUser.id);
      return settings;
    } catch (error) {
      console.error('Ошибка получения настроек ЕРМ:', error);
      return null;
    }
  }

  /**
   * Сохраняет настройки ЕРМ для текущего пользователя
   */
  async saveERMSettings(settings: { baseUrl: string; apiKey: string }): Promise<void> {
    try {
      // Получаем текущего пользователя
      const currentUser = await this.databaseService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }

      const ermSettings: ERMSettings = {
        userId: currentUser.id,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Сохраняем или обновляем настройки
      await this.databaseService.saveERMSettings(ermSettings);
    } catch (error) {
      console.error('Ошибка сохранения настроек ЕРМ:', error);
      throw error;
    }
  }

  /**
   * Загружает настройки ERM из базы данных
   */
  private async loadERMSettings(): Promise<void> {
    try {
      // Получаем текущего пользователя
      const currentUser = await this.databaseService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Пользователь не авторизован');
      }

      // Проверяем, есть ли настройки ERM в документе пользователя
      if (currentUser.ermSettings) {
        this.baseUrl = currentUser.ermSettings.baseUrl;
        this.apiKey = currentUser.ermSettings.apiKey;
      } else if (currentUser.baseUrl && currentUser.apiKey) {
        // Fallback для старого формата
        this.baseUrl = currentUser.baseUrl;
        this.apiKey = currentUser.apiKey;
      } else {
        throw new Error('Настройки ERM не найдены');
      }

      this.updateHttpOptions();
    } catch (error) {
      console.error('Ошибка загрузки настроек ERM:', error);
      throw new Error('Не удалось загрузить настройки ERM');
    }
  }

  /**
   * Обновляет HTTP опции с новыми настройками
   */
  private updateHttpOptions(): void {
    this.httpOptions = {
      headers: new HttpHeaders({
        'X-Redmine-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      })
    };
  }
}
