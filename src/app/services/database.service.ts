import { Injectable } from '@angular/core';
import { DatabaseConfigService } from './database-config.service';
import { DatabaseMigrationService } from './database-migration.service';

// Временная заглушка для PouchDB с возможностью легкого переключения на реальную PouchDB
// Для активации реальной PouchDB раскомментируйте строки ниже и установите пакеты:
// npm install pouchdb@7.3.1 pouchdb-find@7.3.1 pouchdb-replication@7.3.1

/*
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import PouchDBReplication from 'pouchdb-replication';

// Инициализация PouchDB с плагинами
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBReplication);
*/

// Улучшенная заглушка для PouchDB
class MockPouchDB {
  private data: Map<string, any> = new Map();
  private indexes: Map<string, any[]> = new Map();
  
  constructor(name: string, options?: any) {
    console.log(`MockPouchDB created: ${name}`, options);
    this.indexes.set('default', []);
  }
  
  async put(doc: any): Promise<any> {
    const id = doc._id || doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docWithId = { ...doc, _id: id, _rev: `1-${Date.now()}` };
    this.data.set(id, docWithId);
    
    // Обновляем индексы
    this.updateIndexes(docWithId);
    
    return { id, ok: true, rev: docWithId._rev };
  }
  
  async get(id: string): Promise<any> {
    const doc = this.data.get(id);
    if (!doc) throw new Error('Document not found');
    return doc;
  }
  
  async remove(doc: any): Promise<any> {
    const existingDoc = await this.get(doc._id || doc.id);
    this.data.delete(existingDoc._id);
    
    // Удаляем из индексов
    this.removeFromIndexes(existingDoc);
    
    return { ok: true, id: existingDoc._id, rev: existingDoc._rev };
  }
  
  async allDocs(options: any = {}): Promise<any> {
    const docs = Array.from(this.data.values());
    let filteredDocs = docs;
    
    if (options.include_docs) {
      filteredDocs = docs.map(doc => ({ doc }));
    }
    
    return { 
      rows: filteredDocs,
      total_rows: docs.length,
      offset: 0
    };
  }
  
  async find(selector: any): Promise<any> {
    const docs = Array.from(this.data.values());
    const filteredDocs = docs.filter(doc => this.matchesSelector(doc, selector));
    
    return { docs: filteredDocs };
  }
  
  async destroy(): Promise<void> {
    this.data.clear();
    this.indexes.clear();
  }
  
  async sync(remote: string, options: any = {}): Promise<void> {
    console.log(`Mock sync with: ${remote}`, options);
    // Имитируем синхронизацию
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  async info(): Promise<any> {
    return { 
      doc_count: this.data.size,
      update_seq: this.data.size,
      db_name: 'mock_db'
    };
  }
  
  async createIndex(options: any): Promise<any> {
    console.log('Mock createIndex:', options);
    const indexName = options.name || `index_${Date.now()}`;
    this.indexes.set(indexName, []);
    return { result: 'ok', name: indexName };
  }
  
  private updateIndexes(doc: any): void {
    // Простая индексация по основным полям
    for (const [indexName, indexData] of this.indexes) {
      if (indexName === 'default') continue;
      
      // Добавляем документ в индекс
      indexData.push(doc);
    }
  }
  
  private removeFromIndexes(doc: any): void {
    // Удаляем документ из индексов
    for (const [indexName, indexData] of this.indexes) {
      if (indexName === 'default') continue;
      
      const docIndex = indexData.findIndex(d => d._id === doc._id);
      if (docIndex !== -1) {
        indexData.splice(docIndex, 1);
      }
    }
  }
  
  private matchesSelector(doc: any, selector: any): boolean {
    // Простая реализация селектора
    for (const [key, value] of Object.entries(selector)) {
      if (doc[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

const PouchDB = MockPouchDB as any;

// Интерфейс для базы данных
interface Database {
  put: (doc: any) => Promise<any>;
  get: (id: string) => Promise<any>;
  remove: (doc: any) => Promise<any>;
  allDocs: (options: any) => Promise<any>;
  find: (selector: any) => Promise<any>;
  destroy: () => Promise<void>;
  sync: (remote: string, options?: any) => Promise<void>;
  info: () => Promise<any>;
  createIndex: (options: any) => Promise<any>;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private usersDb!: Database;
  private projectsDb!: Database;
  private timeEntriesDb!: Database;
  private invoicesDb!: Database;
  private paymentsDb!: Database;

  constructor(
    private configService: DatabaseConfigService,
    private migrationService: DatabaseMigrationService
  ) {
    this.initializeDatabases();
  }

  private async initializeDatabases(): Promise<void> {
    try {
      const config = this.configService.getConfig();
      
      // Создание баз данных (пока заглушка, но с возможностью переключения на реальную PouchDB)
      this.usersDb = new PouchDB('users', { 
        adapter: config.adapter,
        auto_compaction: config.autoCompaction
      });
      
      this.projectsDb = new PouchDB('projects', { 
        adapter: config.adapter,
        auto_compaction: config.autoCompaction
      });
      
      this.timeEntriesDb = new PouchDB('time_entries', { 
        adapter: config.adapter,
        auto_compaction: config.autoCompaction
      });
      
      this.invoicesDb = new PouchDB('invoices', { 
        adapter: config.adapter,
        auto_compaction: config.autoCompaction
      });
      
      this.paymentsDb = new PouchDB('payments', { 
        adapter: config.adapter,
        auto_compaction: config.autoCompaction
      });

      // Создание индексов для поиска
      await this.createIndexes();
      
      // Проверка и выполнение миграций
      await this.checkAndRunMigrations();
      
      // Инициализация синхронизации
      this.initializeSync();
      
      console.log('Базы данных успешно инициализированы (MockPouchDB)');
    } catch (error) {
      console.error('Ошибка инициализации баз данных:', error);
      throw error;
    }
  }

  private async checkAndRunMigrations(): Promise<void> {
    try {
      const needsMigration = await this.migrationService.checkMigrations();
      if (needsMigration) {
        await this.migrationService.runMigrations();
      }
    } catch (error) {
      console.error('Ошибка выполнения миграций:', error);
      // Не прерываем инициализацию при ошибке миграций
    }
  }



  private async createIndexes(): Promise<void> {
    try {
      console.log('Создание индексов для PouchDB...');
      
      // Индексы для пользователей
      await this.usersDb.createIndex({
        index: { fields: ['email', 'role', 'direction'] }
      });

      // Индексы для проектов
      await this.projectsDb.createIndex({
        index: { fields: ['direction', 'status', 'clientName'] }
      });

      // Индексы для временных записей
      await this.timeEntriesDb.createIndex({
        index: { fields: ['userId', 'projectId', 'date'] }
      });

      // Индексы для счетов
      await this.invoicesDb.createIndex({
        index: { fields: ['projectId', 'status', 'dueDate'] }
      });

      // Индексы для платежей
      await this.paymentsDb.createIndex({
        index: { fields: ['invoiceId', 'projectId', 'paymentDate'] }
      });
      
      console.log('Индексы PouchDB успешно созданы');
    } catch (error) {
      console.error('Ошибка при создании индексов PouchDB:', error);
    }
  }

  private initializeSync(): void {
    try {
      const config = this.configService.getConfig();
      
      if (config.syncEnabled && config.remoteUrl) {
        console.log(`Настройка синхронизации с удаленным сервером: ${config.remoteUrl}`);
        
        if (config.syncInterval > 0) {
          // Настройка периодической синхронизации
          setInterval(() => {
            this.syncWithRemote(config.remoteUrl!);
          }, config.syncInterval);
        }
        
        // Настройка непрерывной синхронизации
        this.setupContinuousSync(config.remoteUrl);
      } else {
        console.log('Синхронизация PouchDB отключена (не настроена в конфигурации)');
      }
    } catch (error) {
      console.error('Ошибка инициализации синхронизации:', error);
    }
  }

  // Методы для работы с пользователями
  async createUser(user: any): Promise<any> {
    const doc = {
      _id: user.id || `user_${Date.now()}`,
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await this.usersDb.put(doc);
  }

  async getUser(id: string): Promise<any> {
    try {
      return await this.usersDb.get(id);
    } catch (error) {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      const result = await this.usersDb.find({
        selector: { email: email }
      });
      return result.docs.length > 0 ? result.docs[0] : null;
    } catch (error) {
      console.error(`Ошибка при поиске пользователя по email ${email}:`, error);
      return null;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const result = await this.usersDb.allDocs({
        include_docs: true
      });
      return result.rows.map((row: any) => row.doc);
    } catch (error) {
      return [];
    }
  }

  async updateUser(user: any): Promise<any> {
    const doc = await this.usersDb.get(user._id || user.id);
    const updatedDoc = {
      ...doc,
      ...user,
      updatedAt: new Date().toISOString()
    };
    return await this.usersDb.put(updatedDoc);
  }

  async deleteUser(id: string): Promise<void> {
    const doc = await this.usersDb.get(id);
    await this.usersDb.remove(doc);
  }

  // Методы для работы с проектами
  async createProject(project: any): Promise<any> {
    const doc = {
      _id: project.id || `project_${Date.now()}`,
      ...project,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await this.projectsDb.put(doc);
  }

  async getProject(id: string): Promise<any> {
    try {
      return await this.projectsDb.get(id);
    } catch (error) {
      return null;
    }
  }

  async getAllProjects(): Promise<any[]> {
    try {
      const result = await this.projectsDb.allDocs({
        include_docs: true
      });
      return result.rows.map((row: any) => row.doc);
    } catch (error) {
      return [];
    }
  }

  async getProjectsByDirection(direction: string): Promise<any[]> {
    try {
      const result = await this.projectsDb.find({
        selector: { direction: direction }
      });
      return result.docs;
    } catch (error) {
      return [];
    }
  }

  async updateProject(project: any): Promise<any> {
    const doc = await this.projectsDb.get(project._id || project.id);
    const updatedDoc = {
      ...doc,
      ...project,
      updatedAt: new Date().toISOString()
    };
    return await this.projectsDb.put(updatedDoc);
  }

  async deleteProject(id: string): Promise<void> {
    const doc = await this.projectsDb.get(id);
    await this.projectsDb.remove(doc);
  }

  // Методы для работы с временными записями
  async createTimeEntry(timeEntry: any): Promise<any> {
    const doc = {
      _id: timeEntry.id || `time_entry_${Date.now()}`,
      ...timeEntry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await this.timeEntriesDb.put(doc);
  }

  async getTimeEntry(id: string): Promise<any> {
    try {
      return await this.timeEntriesDb.get(id);
    } catch (error) {
      return null;
    }
  }

  async getTimeEntriesByProject(projectId: string): Promise<any[]> {
    try {
      const result = await this.timeEntriesDb.find({
        selector: { projectId: projectId }
      });
      return result.docs;
    } catch (error) {
      return [];
    }
  }

  async getTimeEntriesByUser(userId: string): Promise<any[]> {
    try {
      const result = await this.timeEntriesDb.find({
        selector: { userId: userId }
      });
      return result.docs;
    } catch (error) {
      return [];
    }
  }

  async updateTimeEntry(timeEntry: any): Promise<any> {
    const doc = await this.timeEntriesDb.get(timeEntry._id || timeEntry.id);
    const updatedDoc = {
      ...doc,
      ...timeEntry,
      updatedAt: new Date().toISOString()
    };
    return await this.timeEntriesDb.put(updatedDoc);
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const doc = await this.timeEntriesDb.get(id);
    await this.timeEntriesDb.remove(doc);
  }

  // Методы для работы со счетами
  async createInvoice(invoice: any): Promise<any> {
    const doc = {
      _id: invoice.id || `invoice_${Date.now()}`,
      ...invoice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await this.invoicesDb.put(doc);
  }

  async getInvoice(id: string): Promise<any> {
    try {
      return await this.invoicesDb.get(id);
    } catch (error) {
      return null;
    }
  }

  async getInvoicesByProject(projectId: string): Promise<any[]> {
    try {
      const result = await this.invoicesDb.find({
        selector: { projectId: projectId }
      });
      return result.docs;
    } catch (error) {
      return [];
    }
  }

  async getAllInvoices(): Promise<any[]> {
    try {
      const result = await this.invoicesDb.allDocs({
        include_docs: true
      });
      return result.rows.map((row: any) => row.doc);
    } catch (error) {
      return [];
    }
  }

  async updateInvoice(invoice: any): Promise<any> {
    const doc = await this.invoicesDb.get(invoice._id || invoice.id);
    const updatedDoc = {
      ...doc,
      ...invoice,
      updatedAt: new Date().toISOString()
    };
    return await this.invoicesDb.put(updatedDoc);
  }

  async deleteInvoice(id: string): Promise<void> {
    const doc = await this.invoicesDb.get(id);
    await this.invoicesDb.remove(doc);
  }

  // Методы для работы с платежами
  async createPayment(payment: any): Promise<any> {
    const doc = {
      _id: payment.id || `payment_${Date.now()}`,
      ...payment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await this.paymentsDb.put(doc);
  }

  async getPayment(id: string): Promise<any> {
    try {
      return await this.paymentsDb.get(id);
    } catch (error) {
      return null;
    }
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<any[]> {
    try {
      const result = await this.paymentsDb.find({
        selector: { invoiceId: invoiceId }
      });
      return result.docs;
    } catch (error) {
      return [];
    }
  }

  async getPaymentsByProject(projectId: string): Promise<any[]> {
    try {
      const result = await this.paymentsDb.find({
        selector: { projectId: projectId }
      });
      return result.docs;
    } catch (error) {
      return [];
    }
  }

  async getAllPayments(): Promise<any[]> {
    try {
      const result = await this.paymentsDb.allDocs({
        include_docs: true
      });
      return result.rows.map((row: any) => row.doc);
    } catch (error) {
      console.error('Ошибка получения всех платежей:', error);
      return [];
    }
  }

  // Метод для получения всех временных записей
  async getAllTimeEntries(): Promise<any[]> {
    try {
      const result = await this.timeEntriesDb.allDocs({
        include_docs: true
      });
      return result.rows.map((row: any) => row.doc);
    } catch (error) {
      console.error('Ошибка получения всех временных записей:', error);
      return [];
    }
  }

  async updatePayment(payment: any): Promise<any> {
    const doc = await this.paymentsDb.get(payment._id || payment.id);
    const updatedDoc = {
      ...doc,
      ...payment,
      updatedAt: new Date().toISOString()
    };
    return await this.paymentsDb.put(updatedDoc);
  }

  async deletePayment(id: string): Promise<void> {
    const doc = await this.paymentsDb.get(id);
    await this.paymentsDb.remove(doc);
  }

  // Методы для очистки данных
  async clearAllData(): Promise<void> {
    try {
      console.log('Очистка всех данных PouchDB...');
      
      await Promise.all([
        this.usersDb.destroy(),
        this.projectsDb.destroy(),
        this.timeEntriesDb.destroy(),
        this.invoicesDb.destroy(),
        this.paymentsDb.destroy()
      ]);

      // Пересоздаем базы с параметрами из конфигурации
      const config = this.configService.getConfig();
      this.usersDb = new PouchDB('users', { adapter: config.adapter, auto_compaction: config.autoCompaction });
      this.projectsDb = new PouchDB('projects', { adapter: config.adapter, auto_compaction: config.autoCompaction });
      this.timeEntriesDb = new PouchDB('time_entries', { adapter: config.adapter, auto_compaction: config.autoCompaction });
      this.invoicesDb = new PouchDB('invoices', { adapter: config.adapter, auto_compaction: config.autoCompaction });
      this.paymentsDb = new PouchDB('payments', { adapter: config.adapter, auto_compaction: config.autoCompaction });

      await this.createIndexes();
      console.log('Данные PouchDB успешно очищены и базы пересозданы');
    } catch (error) {
      console.error('Ошибка при очистке данных PouchDB:', error);
      throw error;
    }
  }

  // Методы для синхронизации с удаленными базами
  async syncWithRemote(remoteUrl: string): Promise<void> {
    try {
      console.log(`Начало синхронизации с удаленным сервером: ${remoteUrl}`);
      
      const syncOptions = {
        live: false, // Одноразовая синхронизация
        retry: true, // Повторные попытки при ошибках
        timeout: 30000 // Таймаут 30 секунд
      };

      await Promise.all([
        this.usersDb.sync(remoteUrl + '/users', syncOptions),
        this.projectsDb.sync(remoteUrl + '/projects', syncOptions),
        this.timeEntriesDb.sync(remoteUrl + '/time_entries', syncOptions),
        this.invoicesDb.sync(remoteUrl + '/invoices', syncOptions),
        this.paymentsDb.sync(remoteUrl + '/payments', syncOptions)
      ]);
      
      console.log('Синхронизация с удаленным сервером завершена успешно');
    } catch (error) {
      console.error('Ошибка синхронизации с удаленным сервером:', error);
      throw error;
    }
  }

  // Метод для настройки непрерывной синхронизации
  setupContinuousSync(remoteUrl: string): void {
    try {
      console.log(`Настройка непрерывной синхронизации с: ${remoteUrl}`);
      
      const syncOptions = {
        live: true, // Непрерывная синхронизация
        retry: true,
        timeout: 30000
      };

      // Настраиваем непрерывную синхронизацию для каждой базы
      this.usersDb.sync(remoteUrl + '/users', syncOptions);
      this.projectsDb.sync(remoteUrl + '/projects', syncOptions);
      this.timeEntriesDb.sync(remoteUrl + '/time_entries', syncOptions);
      this.invoicesDb.sync(remoteUrl + '/invoices', syncOptions);
      this.paymentsDb.sync(remoteUrl + '/payments', syncOptions);
      
      console.log('Непрерывная синхронизация настроена');
    } catch (error) {
      console.error('Ошибка настройки непрерывной синхронизации:', error);
    }
  }

  // Получение статистики по базам
  async getDatabaseStats(): Promise<any> {
    try {
      const [usersInfo, projectsInfo, timeEntriesInfo, invoicesInfo, paymentsInfo] = await Promise.all([
        this.usersDb.info(),
        this.projectsDb.info(),
        this.timeEntriesDb.info(),
        this.invoicesDb.info(),
        this.paymentsDb.info()
      ]);

      return {
        users: usersInfo.doc_count,
        projects: projectsInfo.doc_count,
        timeEntries: timeEntriesInfo.doc_count,
        invoices: invoicesInfo.doc_count,
        payments: paymentsInfo.doc_count,
        totalSize: 0, // TODO: Добавить расчет размера при необходимости
        lastSync: new Date().toISOString() // TODO: Добавить реальное время последней синхронизации
      };
    } catch (error) {
      console.error('Ошибка получения статистики базы данных:', error);
      return {};
    }
  }

  // Метод для экспорта данных
  async exportDatabase(): Promise<any> {
    try {
      const [users, projects, timeEntries, invoices, payments] = await Promise.all([
        this.getAllUsers(),
        this.getAllProjects(),
        this.getAllTimeEntries(),
        this.getAllInvoices(),
        this.getAllPayments()
      ]);

      return {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        data: {
          users,
          projects,
          timeEntries,
          invoices,
          payments
        }
      };
    } catch (error) {
      console.error('Ошибка экспорта базы данных:', error);
      throw error;
    }
  }

  // Метод для импорта данных
  async importDatabase(data: any): Promise<void> {
    try {
      console.log('Начало импорта данных в PouchDB...');
      
      if (data.users) {
        for (const user of data.users) {
          await this.createUser(user);
        }
      }
      
      if (data.projects) {
        for (const project of data.projects) {
          await this.createProject(project);
        }
      }
      
      if (data.timeEntries) {
        for (const timeEntry of data.timeEntries) {
          await this.createTimeEntry(timeEntry);
        }
      }
      
      if (data.invoices) {
        for (const invoice of data.invoices) {
          await this.createInvoice(invoice);
        }
      }
      
      if (data.payments) {
        for (const payment of data.payments) {
          await this.createPayment(payment);
        }
      }
      
      console.log('Импорт данных в PouchDB завершен успешно');
    } catch (error) {
      console.error('Ошибка импорта данных в PouchDB:', error);
      throw error;
    }
  }
}
