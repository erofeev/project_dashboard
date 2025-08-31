import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

// Подключаем плагин для поиска
PouchDB.plugin(PouchDBFind);

// === ИНТЕРФЕЙСЫ ДАННЫХ (из вашего VBA анализа) ===

// === СИСТЕМНЫЙ КАЛЕНДАРЬ (ОБЩИЙ ДЛЯ ВСЕХ) ===
export interface SystemCalendar {
  _id: 'system-calendar';
  _rev?: string;
  version: string;
  lastUpdated: Date | string;
  source: 'xmlcalendar.ru' | 'static' | 'manual';
  
  // Рабочий календарь РФ (общий для всей системы)
  workingCalendar: {
    [monthKey: string]: number; // "2025-01" -> 164 часов
  };
  
  // Метаданные для администрирования
  metadata: {
    totalYears: number;
    yearRange: { from: number; to: number };
    totalMonths: number;
    averageHoursPerMonth: number;
  };
}

export interface User {
  _id?: string;
  _rev?: string;
  email: string;
  name: string;
  role: 'admin' | 'director' | 'project_manager' | 'employee' | 'superadmin';
  direction: string;
  grossPerMonth?: number;
  hourlyRate?: number;
  workingHoursPerMonth?: number;
  created_at: Date;
  updated_at: Date;
  
  // === РАСШИРЕННЫЕ ПОЛЯ ДЛЯ КОНФИГУРАЦИИ ===
  ermSettings?: {
    baseUrl: string;
    apiKey: string;
    startDate: string;
    endDate: string;
    projectId?: string;
    userFilter: string[];
  };
  userRates?: Array<{
    userName: string;
    startDate: Date | string; // дата начала действия ставки  
    endDate?: Date | string;  // дата окончания (null = текущая)
    grossPerMonth?: number;   // месячная зарплата (приоритет)
    hourlyRate?: number;      // почасовая ставка (фоллбэк)
    currency?: string;        // валюта (по умолчанию RUB)
    isActive?: boolean;       // активная ли ставка
  }>;
  // КАЛЕНДАРЬ ПЕРЕНЕСЕН В SystemCalendar - ОБЩИЙ ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
  
  // === ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ===
  isActive?: boolean;
  apiKey?: string;
  baseUrl?: string;
  userId?: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  _id?: string;
  _rev?: string;
  name: string;
  description?: string;
  direction: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  plannedCost?: number;
  contractCost?: number;
  plannedHours?: number;
  actualCost?: number;
  actualHours?: number;
  participants: string[]; // User IDs
  created_at: Date;
  updated_at: Date;
}

export interface TimeEntry {
  _id?: string;
  _rev?: string;
  entryId: string;
  projectName: string;
  issueId?: string;
  userName: string;
  activity: string;
  date: Date;
  hours: number;
  paidHours: number;
  comments?: string;
  createdOn: Date;
  rate?: number;
  cost?: number;
}

export interface Invoice {
  _id?: string;
  _rev?: string;
  number: string;
  projectId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dateIssued: Date;
  dateDue: Date;
  datePaid?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  _id?: string;
  _rev?: string;
  invoiceId: string;
  amount: number;
  currency: string;
  dateReceived: Date;
  paymentMethod: string;
  notes?: string;
  created_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PouchDBService {
  private databases: { [key: string]: PouchDB.Database } = {};
  
  // Конфигурация (из вашей инфраструктуры)
  private readonly COUCHDB_URL = 'http://localhost:5984';
  private readonly COUCHDB_USER = 'admin';
  private readonly COUCHDB_PASS = 'admin123';
  
  constructor() {
    // Инициализация будет выполнена вручную
    // this.initializeDatabases();
  }

  // === ИНИЦИАЛИЗАЦИЯ БАЗ ДАННЫХ ===
  async initializeDatabases() {
    const dbNames = ['users', 'projects', 'time_entries', 'invoices', 'payments'];
    
    for (const dbName of dbNames) {
      try {
        // Только локальная база данных для разработки
        const localDb = new PouchDB(dbName);
        
        // TODO: Удаленная синхронизация отключена для разработки
        // const remoteUrl = `${this.COUCHDB_URL}/${dbName}`;
        // const remoteDb = new PouchDB(remoteUrl, {
        //   auth: {
        //     username: this.COUCHDB_USER,
        //     password: this.COUCHDB_PASS
        //   }
        // });
        
        // TODO: Синхронизация отключена для разработки
        // localDb.sync(remoteDb, {
        //   live: true,
        //   retry: true
        // }).on('change', (info) => {
        //   console.log(`Синхронизация ${dbName}:`, info);
        // }).on('error', (err) => {
        //   console.error(`Ошибка синхронизации ${dbName}:`, err);
        // });
        
        this.databases[dbName] = localDb;
        
        // Создание индексов для быстрого поиска
        await this.createIndexes(localDb, dbName);
        
      } catch (error) {
        console.error(`Не удалось инициализировать базу ${dbName}:`, error);
        // Fallback: только локальная база
        this.databases[dbName] = new PouchDB(dbName);
      }
    }
    
    console.log('💾 PouchDB инициализирована:', Object.keys(this.databases));
  }

  // === СОЗДАНИЕ ИНДЕКСОВ ===
  private async createIndexes(db: PouchDB.Database, dbName: string) {
    try {
      switch (dbName) {
        case 'users':
          await db.createIndex({ index: { fields: ['email'] } });
          await db.createIndex({ index: { fields: ['role'] } });
          break;
        case 'projects':
          await db.createIndex({ index: { fields: ['status'] } });
          await db.createIndex({ index: { fields: ['direction'] } });
          break;
        case 'time_entries':
          await db.createIndex({ index: { fields: ['userName', 'date'] } });
          await db.createIndex({ index: { fields: ['projectName'] } });
          break;
        case 'invoices':
          await db.createIndex({ index: { fields: ['status'] } });
          await db.createIndex({ index: { fields: ['projectId'] } });
          break;
        case 'payments':
          await db.createIndex({ index: { fields: ['invoiceId'] } });
          break;
      }
    } catch (error) {
      console.warn(`Не удалось создать индексы для ${dbName}:`, error);
    }
  }

  // === ПОЛЬЗОВАТЕЛИ ===
  async getUsers(limit?: number): Promise<User[]> {
    const db = this.databases['users'];
    if (!db) throw new Error('База пользователей не инициализирована');

    const result = await db.allDocs({
      include_docs: true,
      limit: limit
    });
    
    return result.rows.map(row => row.doc as User);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = this.databases['users'];
    if (!db) throw new Error('База пользователей не инициализирована');

    try {
      const result = await db.find({
        selector: { email: email }
      });
      
      return result.docs.length > 0 ? result.docs[0] as User : null;
    } catch (error) {
      console.error('Ошибка поиска пользователя:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, '_id' | '_rev' | 'created_at' | 'updated_at'>): Promise<User> {
    const db = this.databases['users'];
    if (!db) throw new Error('База пользователей не инициализирована');

    const user: User = {
      ...userData,
      _id: `user_${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.put(user);
    return { ...user, _rev: result.rev };
  }

  // === ПРОЕКТЫ ===
  async getProjects(limit?: number): Promise<Project[]> {
    const db = this.databases['projects'];
    if (!db) throw new Error('База проектов не инициализирована');

    const result = await db.allDocs({
      include_docs: true,
      limit: limit
    });
    
    return result.rows.map(row => row.doc as Project);
  }

  async createProject(projectData: Omit<Project, '_id' | '_rev' | 'created_at' | 'updated_at'>): Promise<Project> {
    const db = this.databases['projects'];
    if (!db) throw new Error('База проектов не инициализирована');

    const project: Project = {
      ...projectData,
      _id: `project_${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await db.put(project);
    return { ...project, _rev: result.rev };
  }

  // === ВРЕМЕННЫЕ ЗАПИСИ (Аналог вашего Excel отчета) ===
  async getTimeEntries(filters?: {
    userName?: string;
    projectName?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): Promise<TimeEntry[]> {
    const db = this.databases['time_entries'];
    if (!db) throw new Error('База временных записей не инициализирована');

    let selector: any = {};
    
    if (filters?.userName) {
      selector.userName = filters.userName;
    }
    
    if (filters?.projectName) {
      selector.projectName = filters.projectName;
    }
    
    if (filters?.dateFrom || filters?.dateTo) {
      selector.date = {};
      if (filters.dateFrom) selector.date.$gte = filters.dateFrom;
      if (filters.dateTo) selector.date.$lte = filters.dateTo;
    }

    try {
      const result = await db.find({
        selector: Object.keys(selector).length > 0 ? selector : undefined,
        limit: filters?.limit || 1000
      });
      
      return result.docs as TimeEntry[];
    } catch (error) {
      console.error('Ошибка получения временных записей:', error);
      return [];
    }
  }

  async createTimeEntry(entryData: Omit<TimeEntry, '_id' | '_rev'>): Promise<TimeEntry> {
    const db = this.databases['time_entries'];
    if (!db) throw new Error('База временных записей не инициализирована');

    const entry: TimeEntry = {
      ...entryData,
      _id: `time_entry_${entryData.entryId}_${Date.now()}`
    };

    const result = await db.put(entry);
    return { ...entry, _rev: result.rev };
  }

  // === СЧЕТА ===
  async getInvoices(projectId?: string): Promise<Invoice[]> {
    const db = this.databases['invoices'];
    if (!db) throw new Error('База счетов не инициализирована');

    if (projectId) {
      const result = await db.find({
        selector: { projectId: projectId }
      });
      return result.docs as Invoice[];
    }

    const result = await db.allDocs({ include_docs: true });
    return result.rows.map(row => row.doc as Invoice);
  }

  // === ПЛАТЕЖИ ===
  async getPayments(invoiceId?: string): Promise<Payment[]> {
    const db = this.databases['payments'];
    if (!db) throw new Error('База платежей не инициализирована');

    if (invoiceId) {
      const result = await db.find({
        selector: { invoiceId: invoiceId }
      });
      return result.docs as Payment[];
    }

    const result = await db.allDocs({ include_docs: true });
    return result.rows.map(row => row.doc as Payment);
  }

  // === СИСТЕМНЫЙ КАЛЕНДАРЬ ===
  async getSystemCalendar(): Promise<SystemCalendar | null> {
    const db = this.databases['users']; // Храним в той же БД, что и пользователи
    if (!db) throw new Error('База пользователей не инициализирована');

    try {
      const doc = await db.get('system-calendar');
      return doc as SystemCalendar;
    } catch (error: any) {
      if (error.status === 404) {
        console.log('Системный календарь не найден, создаем новый');
        return null;
      }
      throw error;
    }
  }

  async saveSystemCalendar(calendar: Omit<SystemCalendar, '_id'>): Promise<SystemCalendar> {
    const db = this.databases['users']; 
    if (!db) throw new Error('База пользователей не инициализирована');

    try {
      // Проверяем существующий календарь
      let existingCalendar: SystemCalendar | null = null;
      try {
        existingCalendar = await this.getSystemCalendar();
      } catch (error) {
        // Календарь не существует - создаем новый
      }

      const calendarDoc: SystemCalendar = {
        _id: 'system-calendar',
        _rev: existingCalendar?._rev,
        version: calendar.version,
        lastUpdated: new Date().toISOString(),
        source: calendar.source,
        workingCalendar: calendar.workingCalendar,
        metadata: calendar.metadata
      };

      const result = await db.put(calendarDoc);
      
      return {
        ...calendarDoc,
        _rev: result.rev
      };
    } catch (error) {
      console.error('Ошибка сохранения системного календаря:', error);
      throw error;
    }
  }

  async updateSystemCalendar(updates: Partial<Omit<SystemCalendar, '_id' | '_rev'>>): Promise<SystemCalendar> {
    const existingCalendar = await this.getSystemCalendar();
    if (!existingCalendar) {
      throw new Error('Системный календарь не найден. Сначала создайте календарь.');
    }

    const updatedCalendar = {
      ...existingCalendar,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    return await this.saveSystemCalendar(updatedCalendar);
  }

  async getWorkingHoursForMonth(year: number, month: number): Promise<number> {
    const calendar = await this.getSystemCalendar();
    if (!calendar) return 160; // Fallback значение

    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    return calendar.workingCalendar[monthKey] || 160;
  }

  async getAllWorkingHours(): Promise<{ [monthKey: string]: number }> {
    const calendar = await this.getSystemCalendar();
    if (!calendar) return {};

    return calendar.workingCalendar;
  }

  // === СТАТИСТИКА (Аналог ваших макросов) ===
  async getDatabaseStats() {
    const stats: any = {};
    
    for (const dbName of Object.keys(this.databases)) {
      try {
        const info = await this.databases[dbName].info();
        stats[dbName] = {
          doc_count: info.doc_count,
          update_seq: info.update_seq
        };
      } catch (error) {
        stats[dbName] = { error: error };
      }
    }
    
    return stats;
  }

  // === ОЧИСТКА РЕСУРСОВ ===
  async destroy() {
    for (const db of Object.values(this.databases)) {
      try {
        await db.close();
      } catch (error) {
        console.error('Ошибка закрытия базы данных:', error);
      }
    }
    this.databases = {};
  }
}
