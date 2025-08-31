import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  direction: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  hours: number;
  date: Date;
  description: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: Date;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PouchDBIntegrationService {
  private baseUrl = 'http://localhost:3000'; // MCP сервер
  
  // Сигналы для кэширования данных
  private usersData = signal<User[]>([]);
  private projectsData = signal<Project[]>([]);
  private timeEntriesData = signal<TimeEntry[]>([]);
  private invoicesData = signal<Invoice[]>([]);
  private paymentsData = signal<Payment[]>([]);
  
  // Вычисляемые свойства
  public readonly users = computed(() => this.usersData());
  public readonly projects = computed(() => this.projectsData());
  public readonly timeEntries = computed(() => this.timeEntriesData());
  public readonly invoices = computed(() => this.invoicesData());
  public readonly payments = computed(() => this.paymentsData());
  
  // Статистика
  public readonly totalUsers = computed(() => this.users().length);
  public readonly totalProjects = computed(() => this.projects().length);
  public readonly totalTimeEntries = computed(() => this.timeEntries().length);
  public readonly totalInvoices = computed(() => this.invoices().length);
  public readonly totalPayments = computed(() => this.payments().length);
  
  // Суммы
  public readonly totalHours = computed(() => 
    this.timeEntries().reduce((sum, entry) => sum + entry.hours, 0)
  );
  
  public readonly totalInvoiceAmount = computed(() => 
    this.invoices().reduce((sum, invoice) => sum + invoice.amount, 0)
  );
  
  public readonly totalPaymentAmount = computed(() => 
    this.payments().reduce((sum, payment) => sum + payment.amount, 0)
  );

  constructor(private http: HttpClient) {}

  // === ПОЛЬЗОВАТЕЛИ ===
  async getUserCount(): Promise<number> {
    try {
      // Здесь будет вызов MCP сервера
      // Пока возвращаем заглушку
      return 25;
    } catch (error) {
      console.error('Ошибка получения количества пользователей:', error);
      return 0;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      // Здесь будет вызов MCP сервера
      // Пока возвращаем заглушку
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Администратор',
          role: 'admin',
          direction: 'development',
          createdAt: new Date()
        },
        {
          id: '2',
          email: 'user@example.com',
          name: 'Пользователь',
          role: 'user',
          direction: 'design',
          createdAt: new Date()
        }
      ];
      
      this.usersData.set(mockUsers);
      return mockUsers;
    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      return [];
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.getAllUsers();
      return users.find(user => user.email === email) || null;
    } catch (error) {
      console.error('Ошибка получения пользователя по email:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      
      // Здесь будет вызов MCP сервера для создания пользователя
      const users = this.users();
      this.usersData.set([...users, newUser]);
      
      return newUser;
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
      throw error;
    }
  }

  // === ПРОЕКТЫ ===
  async getProjectCount(): Promise<number> {
    try {
      return 15;
    } catch (error) {
      console.error('Ошибка получения количества проектов:', error);
      return 0;
    }
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Проект А',
          description: 'Описание проекта А',
          status: 'active',
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Проект Б',
          description: 'Описание проекта Б',
          status: 'completed',
          createdAt: new Date()
        }
      ];
      
      this.projectsData.set(mockProjects);
      return mockProjects;
    } catch (error) {
      console.error('Ошибка получения проектов:', error);
      return [];
    }
  }

  // === ВРЕМЕННЫЕ ЗАПИСИ ===
  async getTimeEntriesCount(): Promise<number> {
    try {
      return 150;
    } catch (error) {
      console.error('Ошибка получения количества временных записей:', error);
      return 0;
    }
  }

  async getAllTimeEntries(): Promise<TimeEntry[]> {
    try {
      const mockTimeEntries: TimeEntry[] = [
        {
          id: '1',
          userId: '1',
          projectId: '1',
          hours: 8,
          date: new Date(),
          description: 'Разработка функционала'
        },
        {
          id: '2',
          userId: '2',
          projectId: '2',
          hours: 6,
          date: new Date(),
          description: 'Дизайн интерфейса'
        }
      ];
      
      this.timeEntriesData.set(mockTimeEntries);
      return mockTimeEntries;
    } catch (error) {
      console.error('Ошибка получения временных записей:', error);
      return [];
    }
  }

  // === СЧЕТА ===
  async getInvoiceCount(): Promise<number> {
    try {
      return 8;
    } catch (error) {
      console.error('Ошибка получения количества счетов:', error);
      return 0;
    }
  }

  async getAllInvoices(): Promise<Invoice[]> {
    try {
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          projectId: '1',
          amount: 10000,
          status: 'paid',
          createdAt: new Date()
        },
        {
          id: '2',
          projectId: '2',
          amount: 15000,
          status: 'pending',
          createdAt: new Date()
        }
      ];
      
      this.invoicesData.set(mockInvoices);
      return mockInvoices;
    } catch (error) {
      console.error('Ошибка получения счетов:', error);
      return [];
    }
  }

  // === ПЛАТЕЖИ ===
  async getPaymentCount(): Promise<number> {
    try {
      return 5;
    } catch (error) {
      console.error('Ошибка получения количества платежей:', error);
      return 0;
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    try {
      const mockPayments: Payment[] = [
        {
          id: '1',
          invoiceId: '1',
          amount: 10000,
          date: new Date(),
          status: 'completed'
        }
      ];
      
      this.paymentsData.set(mockPayments);
      return mockPayments;
    } catch (error) {
      console.error('Ошибка получения платежей:', error);
      return [];
    }
  }

  // === ОБЩАЯ СТАТИСТИКА ===
  async getDatabaseStats(): Promise<any> {
    try {
      return {
        users: await this.getUserCount(),
        projects: await this.getProjectCount(),
        timeEntries: await this.getTimeEntriesCount(),
        invoices: await this.getInvoiceCount(),
        payments: await this.getPaymentCount()
      };
    } catch (error) {
      console.error('Ошибка получения статистики базы данных:', error);
      return {};
    }
  }

  // === ОБНОВЛЕНИЕ ДАННЫХ ===
  async refreshAllData(): Promise<void> {
    try {
      await Promise.all([
        this.getAllUsers(),
        this.getAllProjects(),
        this.getAllTimeEntries(),
        this.getAllInvoices(),
        this.getAllPayments()
      ]);
    } catch (error) {
      console.error('Ошибка обновления данных:', error);
    }
  }
}
