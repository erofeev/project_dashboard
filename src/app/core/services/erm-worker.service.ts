import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, switchMap, catchError, of, tap, finalize } from 'rxjs';
import { PouchDBService } from './pouchdb.service';

export interface ERMConfig {
  apiUrl: string;
  apiKey: string;
  syncInterval: number; // в минутах
  enabled: boolean;
}

export interface ERMUser {
  id: number;
  login: string;
  firstname: string;
  lastname: string;
  mail: string;
  status: number;
  created_on: string;
  last_login_on?: string;
}

export interface ERMProject {
  id: number;
  name: string;
  description?: string;
  status: number;
  created_on: string;
  updated_on: string;
  identifier: string;
  is_public: boolean;
}

export interface ERMTimeEntry {
  id: number;
  project: { id: number; name: string };
  user: { id: number; name: string };
  issue?: { id: number; subject: string };
  activity: { id: number; name: string };
  spent_on: string;
  hours: number;
  comments?: string;
  created_on: string;
  updated_on: string;
}

export interface ERMActivity {
  id: number;
  name: string;
  is_default: boolean;
  is_closed: boolean;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync?: Date;
  nextSync?: Date;
  error?: string;
  progress: {
    users: number;
    projects: number;
    timeEntries: number;
    activities: number;
  };
  stats: {
    totalUsers: number;
    totalProjects: number;
    totalTimeEntries: number;
    totalActivities: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ERMWorkerService {
  private http = inject(HttpClient);
  private pouchDBService = inject(PouchDBService);

  // Конфигурация
  private configSubject = new BehaviorSubject<ERMConfig>({
    apiUrl: '',
    apiKey: '',
    syncInterval: 30,
    enabled: false
  });

  // Статус синхронизации
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isRunning: false,
    progress: { users: 0, projects: 0, timeEntries: 0, activities: 0 },
    stats: { totalUsers: 0, totalProjects: 0, totalTimeEntries: 0, totalActivities: 0 }
  });

  // Сигналы для реактивности
  private configSignal = signal<ERMConfig>(this.configSubject.value);
  private syncStatusSignal = signal<SyncStatus>(this.syncStatusSubject.value);

  // Вычисляемые свойства
  public readonly config = computed(() => this.configSignal());
  public readonly syncStatus = computed(() => this.syncStatusSignal());
  public readonly isConfigured = computed(() => 
    this.config().apiUrl && this.config().apiKey
  );
  public readonly isEnabled = computed(() => 
    this.config().enabled && this.isConfigured()
  );

  // Подписки
  private syncIntervalSubscription?: any;

  constructor() {
    // Подписываемся на изменения конфигурации
    this.configSubject.subscribe(config => {
      this.configSignal.set(config);
      this.updateSyncSchedule();
    });

    // Подписываемся на изменения статуса
    this.syncStatusSubject.subscribe(status => {
      this.syncStatusSignal.set(status);
    });

    // Загружаем конфигурацию при инициализации
    this.loadConfig();
  }

  // === КОНФИГУРАЦИЯ ===
  updateConfig(config: Partial<ERMConfig>): void {
    const newConfig = { ...this.config(), ...config };
    this.configSubject.next(newConfig);
    this.saveConfig(newConfig);
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('erm-config');
      if (saved) {
        const config = JSON.parse(saved);
        this.configSubject.next(config);
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации ERM:', error);
    }
  }

  private saveConfig(config: ERMConfig): void {
    try {
      localStorage.setItem('erm-config', JSON.stringify(config));
    } catch (error) {
      console.error('Ошибка сохранения конфигурации ERM:', error);
    }
  }

  // === СИНХРОНИЗАЦИЯ ===
  async startSync(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('ERM не настроен. Проверьте API URL и ключ.');
    }

    this.updateSyncStatus({ isRunning: true, error: undefined });

    try {
      // Проверяем подключение
      await this.testConnection();

      // Синхронизируем данные
      await this.syncAllData();

      this.updateSyncStatus({
        isRunning: false,
        lastSync: new Date(),
        error: undefined
      });

    } catch (error) {
      this.updateSyncStatus({
        isRunning: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
      throw error;
    }
  }

  async stopSync(): Promise<void> {
    if (this.syncIntervalSubscription) {
      this.syncIntervalSubscription.unsubscribe();
      this.syncIntervalSubscription = undefined;
    }
    this.updateSyncStatus({ isRunning: false });
  }

  private async syncAllData(): Promise<void> {
    const progress = { users: 0, projects: 0, timeEntries: 0, activities: 0 };
    const stats = { totalUsers: 0, totalProjects: 0, totalTimeEntries: 0, totalActivities: 0 };

    try {
      // Синхронизируем пользователей
      progress.users = 0;
      const users = await this.syncUsers();
      stats.totalUsers = users.length;
      progress.users = 100;

      // Синхронизируем проекты
      progress.projects = 0;
      const projects = await this.syncProjects();
      stats.totalProjects = projects.length;
      progress.projects = 100;

      // Синхронизируем активности
      progress.activities = 0;
      const activities = await this.syncActivities();
      stats.totalActivities = activities.length;
      progress.activities = 100;

      // Синхронизируем временные записи
      progress.timeEntries = 0;
      const timeEntries = await this.syncTimeEntries();
      stats.totalTimeEntries = timeEntries.length;
      progress.timeEntries = 100;

      this.updateSyncStatus({ progress, stats });

    } catch (error) {
      console.error('Ошибка синхронизации данных:', error);
      throw error;
    }
  }

  // === СИНХРОНИЗАЦИЯ ПОЛЬЗОВАТЕЛЕЙ ===
  private async syncUsers(): Promise<ERMUser[]> {
    const users = await this.fetchUsers();
    
    for (const user of users) {
      await this.pouchDBService.upsertDocument('users', `erm_user_${user.id}`, {
        _id: `erm_user_${user.id}`,
        ermId: user.id,
        login: user.login,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.mail,
        status: user.status,
        createdOn: user.created_on,
        lastLoginOn: user.last_login_on,
        syncedAt: new Date().toISOString()
      });
    }

    return users;
  }

  private async fetchUsers(): Promise<ERMUser[]> {
    const url = `${this.config().apiUrl}/users.json`;
    const headers = this.getHeaders();
    
    const response = await this.http.get<{ users: ERMUser[] }>(url, { headers }).toPromise();
    return response?.users || [];
  }

  // === СИНХРОНИЗАЦИЯ ПРОЕКТОВ ===
  private async syncProjects(): Promise<ERMProject[]> {
    const projects = await this.fetchProjects();
    
    for (const project of projects) {
      await this.pouchDBService.upsertDocument('projects', `erm_project_${project.id}`, {
        _id: `erm_project_${project.id}`,
        ermId: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        identifier: project.identifier,
        isPublic: project.is_public,
        createdOn: project.created_on,
        updatedOn: project.updated_on,
        syncedAt: new Date().toISOString()
      });
    }

    return projects;
  }

  private async fetchProjects(): Promise<ERMProject[]> {
    const url = `${this.config().apiUrl}/projects.json`;
    const headers = this.getHeaders();
    
    const response = await this.http.get<{ projects: ERMProject[] }>(url, { headers }).toPromise();
    return response?.projects || [];
  }

  // === СИНХРОНИЗАЦИЯ АКТИВНОСТЕЙ ===
  private async syncActivities(): Promise<ERMActivity[]> {
    const activities = await this.fetchActivities();
    
    for (const activity of activities) {
      await this.pouchDBService.upsertDocument('activities', `erm_activity_${activity.id}`, {
        _id: `erm_activity_${activity.id}`,
        ermId: activity.id,
        name: activity.name,
        isDefault: activity.is_default,
        isClosed: activity.is_closed,
        syncedAt: new Date().toISOString()
      });
    }

    return activities;
  }

  private async fetchActivities(): Promise<ERMActivity[]> {
    const url = `${this.config().apiUrl}/enumerations/time_entry_activities.json`;
    const headers = this.getHeaders();
    
    const response = await this.http.get<ERMActivity[]>(url, { headers }).toPromise();
    return response || [];
  }

  // === СИНХРОНИЗАЦИЯ ВРЕМЕННЫХ ЗАПИСЕЙ ===
  private async syncTimeEntries(): Promise<ERMTimeEntry[]> {
    const timeEntries = await this.fetchTimeEntries();
    
    for (const entry of timeEntries) {
      await this.pouchDBService.upsertDocument('time_entries', `erm_timeentry_${entry.id}`, {
        _id: `erm_timeentry_${entry.id}`,
        ermId: entry.id,
        projectId: entry.project.id,
        projectName: entry.project.name,
        userId: entry.user.id,
        userName: entry.user.name,
        issueId: entry.issue?.id,
        issueSubject: entry.issue?.subject,
        activityId: entry.activity.id,
        activityName: entry.activity.name,
        spentOn: entry.spent_on,
        hours: entry.hours,
        comments: entry.comments,
        createdOn: entry.created_on,
        updatedOn: entry.updated_on,
        syncedAt: new Date().toISOString()
      });
    }

    return timeEntries;
  }

  private async fetchTimeEntries(): Promise<ERMTimeEntry[]> {
    const url = `${this.config().apiUrl}/time_entries.json`;
    const headers = this.getHeaders();
    
    const response = await this.http.get<{ time_entries: ERMTimeEntry[] }>(url, { headers }).toPromise();
    return response?.time_entries || [];
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Redmine-API-Key': this.config().apiKey,
      'Content-Type': 'application/json'
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config().apiUrl}/users.json?limit=1`;
      const headers = this.getHeaders();
      
      await this.http.get(url, { headers }).toPromise();
      return true;
    } catch (error) {
      console.error('Ошибка подключения к ERM:', error);
      return false;
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    const current = this.syncStatusSubject.value;
    this.syncStatusSubject.next({ ...current, ...updates });
  }

  private updateSyncSchedule(): void {
    if (this.syncIntervalSubscription) {
      this.syncIntervalSubscription.unsubscribe();
    }

    if (this.isEnabled()) {
      const intervalMs = this.config().syncInterval * 60 * 1000;
      this.syncIntervalSubscription = interval(intervalMs).subscribe(() => {
        this.startSync().catch(error => {
          console.error('Ошибка автоматической синхронизации:', error);
        });
      });

      // Устанавливаем время следующей синхронизации
      const nextSync = new Date(Date.now() + intervalMs);
      this.updateSyncStatus({ nextSync });
    }
  }

  // === ПУБЛИЧНЫЕ МЕТОДЫ ===
  getConfig(): ERMConfig {
    return this.config();
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus();
  }

  async forceSync(): Promise<void> {
    await this.startSync();
  }

  async clearData(): Promise<void> {
    await Promise.all([
      this.pouchDBService.clearDatabase('users'),
      this.pouchDBService.clearDatabase('projects'),
      this.pouchDBService.clearDatabase('time_entries'),
      this.pouchDBService.clearDatabase('activities')
    ]);
  }

  // === СТАТИСТИКА ===
  async getSyncStats(): Promise<any> {
    const [usersCount, projectsCount, timeEntriesCount, activitiesCount] = await Promise.all([
      this.pouchDBService.getDocumentCount('users'),
      this.pouchDBService.getDocumentCount('projects'),
      this.pouchDBService.getDocumentCount('time_entries'),
      this.pouchDBService.getDocumentCount('activities')
    ]);

    return {
      users: usersCount,
      projects: projectsCount,
      timeEntries: timeEntriesCount,
      activities: activitiesCount,
      lastSync: this.syncStatus().lastSync,
      nextSync: this.syncStatus().nextSync
    };
  }
}