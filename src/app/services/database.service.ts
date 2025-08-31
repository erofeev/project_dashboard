import { Injectable } from '@angular/core';
import { DatabaseConfigService } from './database-config.service';
import { DatabaseMigrationService } from './database-migration.service';

// Реальная PouchDB активирована! Последняя версия
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
// import PouchDBReplication from 'pouchdb-replication'; // Временно отключаем

// Инициализация PouchDB с плагином Find
try {
  PouchDB.plugin(PouchDBFind);
  console.log('PouchDB-Find плагин загружен успешно');
} catch (error) {
  console.warn('Ошибка загрузки PouchDB-Find:', error);
}

// TODO: Добавить PouchDB-Replication позже после исправления конфликта

// MockPouchDB больше не нужен - используем реальную PouchDB!

// Интерфейс для базы данных PouchDB
interface Database extends PouchDB.Database {
  // PouchDB уже имеет все необходимые методы
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private usersDb!: Database;
  private projectsDb!: Database;
  private timeEntriesDb!: Database;
  private activitiesDb!: Database;
  private ermSettingsDb!: Database;
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
      
      // Создание реальных PouchDB баз данных с конфигурацией
      const dbOptions = { 
        adapter: config.adapter === 'idb' ? 'idb' : config.adapter,
        auto_compaction: config.autoCompaction
      };
      
      this.usersDb = new PouchDB('users', dbOptions);
      this.projectsDb = new PouchDB('projects', dbOptions);
      this.timeEntriesDb = new PouchDB('time_entries', dbOptions);
      this.activitiesDb = new PouchDB('activities', dbOptions);
      this.ermSettingsDb = new PouchDB('erm_settings', dbOptions);
      this.invoicesDb = new PouchDB('invoices', dbOptions);
      this.paymentsDb = new PouchDB('payments', dbOptions);

      // Создание индексов для поиска
      await this.createIndexes();
      
      // Проверка и выполнение миграций
      await this.checkAndRunMigrations();
      
      // Инициализация синхронизации
      this.initializeSync();
      
      console.log('Базы данных PouchDB успешно инициализированы');
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

      // Индексы для активностей
      await this.activitiesDb.createIndex({
        index: { fields: ['name', 'isDefault'] }
      });

      // Индексы для настроек ЕРМ
      await this.ermSettingsDb.createIndex({
        index: { fields: ['userId'] }
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

  /**
   * Получает текущего авторизованного пользователя
   * В реальном приложении это должно быть из AuthService
   */
  async getCurrentUser(): Promise<any> {
    try {
      // Временная реализация - получаем первого пользователя
      // В реальном приложении здесь должна быть интеграция с AuthService
      const users = await this.getAllUsers();
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
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

  // Методы для работы с активностями
  async createActivity(activity: any): Promise<any> {
    const doc = {
      _id: activity.id || `activity_${Date.now()}`,
      ...activity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await this.activitiesDb.put(doc);
  }

  async getActivity(id: string): Promise<any> {
    try {
      return await this.activitiesDb.get(id);
    } catch (error) {
      return null;
    }
  }

  async getAllActivities(): Promise<any[]> {
    try {
      const result = await this.activitiesDb.find({
        selector: {}
      });
      return result.docs;
    } catch (error) {
      return [];
    }
  }

  async updateActivity(activity: any): Promise<any> {
    const doc = await this.activitiesDb.get(activity._id || activity.id);
    const updatedDoc = {
      ...doc,
      ...activity,
      updatedAt: new Date().toISOString()
    };
    return await this.activitiesDb.put(updatedDoc);
  }

  async deleteActivity(id: string): Promise<void> {
    const doc = await this.activitiesDb.get(id);
    await this.activitiesDb.remove(doc);
  }

  // Методы для создания или обновления (upsert)
  async createOrUpdateUser(user: any): Promise<any> {
    try {
      const existingUser = await this.getUserByEmail(user.email);
      if (existingUser) {
        return await this.updateUser({ ...existingUser, ...user });
      } else {
        return await this.createUser(user);
      }
    } catch (error) {
      console.error('Error in createOrUpdateUser:', error);
      throw error;
    }
  }

  async createOrUpdateProject(project: any): Promise<any> {
    try {
      const existingProject = await this.getProject(project.id);
      if (existingProject) {
        return await this.updateProject({ ...existingProject, ...project });
      } else {
        return await this.createProject(project);
      }
    } catch (error) {
      console.error('Error in createOrUpdateProject:', error);
      throw error;
    }
  }

  async createOrUpdateTimeEntry(timeEntry: any): Promise<any> {
    try {
      const existingEntry = await this.getTimeEntry(timeEntry.id);
      if (existingEntry) {
        return await this.updateTimeEntry({ ...existingEntry, ...timeEntry });
      } else {
        return await this.createTimeEntry(timeEntry);
      }
    } catch (error) {
      console.error('Error in createOrUpdateTimeEntry:', error);
      throw error;
    }
  }

  async createOrUpdateActivity(activity: any): Promise<any> {
    try {
      const existingActivity = await this.getActivity(activity.id);
      if (existingActivity) {
        return await this.updateActivity({ ...existingActivity, ...activity });
      } else {
        return await this.createActivity(activity);
      }
    } catch (error) {
      console.error('Error in createOrUpdateActivity:', error);
      throw error;
    }
  }

  // Методы для работы с настройками ЕРМ
  async saveERMSettings(settings: any): Promise<any> {
    try {
      // Ищем существующие настройки для пользователя
      const existingSettings = await this.getERMSettings(settings.userId);
      
      if (existingSettings) {
        // Обновляем существующие настройки
        const updatedSettings = {
          ...existingSettings,
          ...settings,
          updatedAt: new Date().toISOString()
        };
        return await this.ermSettingsDb.put(updatedSettings);
      } else {
        // Создаем новые настройки
        const newSettings = {
          _id: `erm_settings_${settings.userId}`,
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return await this.ermSettingsDb.put(newSettings);
      }
    } catch (error) {
      console.error('Error saving ERM settings:', error);
      throw error;
    }
  }

  async getERMSettings(userId: string): Promise<any> {
    try {
      const result = await this.ermSettingsDb.find({
        selector: { userId: userId }
      });
      return result.docs.length > 0 ? result.docs[0] : null;
    } catch (error) {
      console.error('Error getting ERM settings:', error);
      return null;
    }
  }

  async deleteERMSettings(userId: string): Promise<void> {
    try {
      const settings = await this.getERMSettings(userId);
      if (settings) {
        await this.ermSettingsDb.remove(settings);
      }
    } catch (error) {
      console.error('Error deleting ERM settings:', error);
      throw error;
    }
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

  // Методы для синхронизации с удаленными базами (временно отключены)
  async syncWithRemote(remoteUrl: string): Promise<void> {
    try {
      console.log(`Попытка синхронизации с удаленным сервером: ${remoteUrl}`);
      console.warn('Синхронизация временно недоступна - плагин PouchDB-Replication отключен');
      
      // TODO: Восстановить когда исправим конфликт с плагином репликации
      // Пока что имитируем успешную синхронизацию
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Имитация синхронизации завершена');
    } catch (error) {
      console.error('Ошибка синхронизации с удаленным сервером:', error);
      throw error;
    }
  }

  // Метод для настройки непрерывной синхронизации (временно отключен)
  setupContinuousSync(remoteUrl: string): void {
    try {
      console.log(`Настройка непрерывной синхронизации с: ${remoteUrl}`);
      console.warn('Непрерывная синхронизация временно недоступна - плагин PouchDB-Replication отключен');
      
      // TODO: Восстановить когда исправим конфликт с плагином репликации
      
      console.log('Имитация настройки непрерывной синхронизации');
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
