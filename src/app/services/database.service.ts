import { Injectable } from '@angular/core';
// import PouchDB from 'pouchdb-browser';
// import PouchDBFind from 'pouchdb-find';
// import PouchDBReplication from 'pouchdb-replication';

// Временная заглушка для PouchDB
class MockPouchDB {
  private data: Map<string, any> = new Map();
  
  constructor(name: string) {
    console.log(`MockPouchDB created: ${name}`);
  }
  
  async put(doc: any): Promise<any> {
    const id = doc._id || doc.id || `doc_${Date.now()}`;
    this.data.set(id, { ...doc, _id: id });
    return { id, ok: true };
  }
  
  async get(id: string): Promise<any> {
    const doc = this.data.get(id);
    if (!doc) throw new Error('Document not found');
    return doc;
  }
  
  async remove(doc: any): Promise<any> {
    this.data.delete(doc._id || doc.id);
    return { ok: true };
  }
  
  async allDocs(options: any): Promise<any> {
    const docs = Array.from(this.data.values());
    return { rows: docs.map(doc => ({ doc })) };
  }
  
  async find(selector: any): Promise<any> {
    const docs = Array.from(this.data.values());
    return { docs };
  }
  
  async destroy(): Promise<void> {
    this.data.clear();
  }
  
  async sync(remote: string): Promise<void> {
    console.log(`Mock sync with: ${remote}`);
  }
  
  async info(): Promise<any> {
    return { doc_count: this.data.size };
  }
  
  async createIndex(options: any): Promise<any> {
    console.log('Mock createIndex:', options);
    return { result: 'ok' };
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
  sync: (remote: string) => Promise<void>;
  info: () => Promise<any>;
  createIndex: (options: any) => Promise<any>;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private usersDb: Database;
  private projectsDb: Database;
  private timeEntriesDb: Database;
  private invoicesDb: Database;
  private paymentsDb: Database;

  constructor() {
    // Создание баз данных с заглушкой
    this.usersDb = new PouchDB('users');
    this.projectsDb = new PouchDB('projects');
    this.timeEntriesDb = new PouchDB('time_entries');
    this.invoicesDb = new PouchDB('invoices');
    this.paymentsDb = new PouchDB('payments');

    // Создание индексов для поиска
    this.createIndexes();
  }



  private async createIndexes(): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error creating indexes:', error);
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
    await Promise.all([
      this.usersDb.destroy(),
      this.projectsDb.destroy(),
      this.timeEntriesDb.destroy(),
      this.invoicesDb.destroy(),
      this.paymentsDb.destroy()
    ]);

    // Пересоздаем базы
    this.usersDb = new PouchDB('users');
    this.projectsDb = new PouchDB('projects');
    this.timeEntriesDb = new PouchDB('time_entries');
    this.invoicesDb = new PouchDB('invoices');
    this.paymentsDb = new PouchDB('payments');

    await this.createIndexes();
  }

  // Методы для синхронизации с удаленными базами
  async syncWithRemote(remoteUrl: string): Promise<void> {
    try {
      await Promise.all([
        this.usersDb.sync(remoteUrl + '/users'),
        this.projectsDb.sync(remoteUrl + '/projects'),
        this.timeEntriesDb.sync(remoteUrl + '/time_entries'),
        this.invoicesDb.sync(remoteUrl + '/invoices'),
        this.paymentsDb.sync(remoteUrl + '/payments')
      ]);
    } catch (error) {
      console.error('Sync error:', error);
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
        payments: paymentsInfo.doc_count
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }
}
