import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';
import { PouchDBService } from './pouchdb.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  direction: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived' | 'paused';
  startDate: Date;
  endDate?: Date;
  budget?: number;
  client?: string;
  team: string[];
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  hours: number;
  date: Date;
  description: string;
  taskType: string;
  billable: boolean;
  rate?: number;
}

export interface Invoice {
  id: string;
  projectId: string;
  clientId: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  reference?: string;
}

@Injectable({
  providedIn: 'root'
})
export class McpPouchDBService {
  private http = inject(HttpClient);
  private pouchDBService = inject(PouchDBService);
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
  
  // Активные проекты
  public readonly activeProjects = computed(() => 
    this.projects().filter(p => p.status === 'active')
  );
  
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

  // Доходы по месяцам
  public readonly monthlyRevenue = computed(() => {
    const monthly = new Map<string, number>();
    this.payments()
      .filter(p => p.status === 'completed')
      .forEach(payment => {
        const month = payment.date.toISOString().substring(0, 7);
        monthly.set(month, (monthly.get(month) || 0) + payment.amount);
      });
    return Array.from(monthly.entries()).map(([month, amount]) => ({ month, amount }));
  });

  constructor(private httpClient: HttpClient) {}

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
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Администратор',
          role: 'admin',
          direction: 'development',
          createdAt: new Date('2024-01-01'),
          lastLogin: new Date(),
          isActive: true
        },
        {
          id: '2',
          email: 'user@example.com',
          name: 'Пользователь',
          role: 'user',
          direction: 'design',
          createdAt: new Date('2024-01-15'),
          lastLogin: new Date(),
          isActive: true
        },
        {
          id: '3',
          email: 'manager@example.com',
          name: 'Менеджер',
          role: 'manager',
          direction: 'management',
          createdAt: new Date('2024-02-01'),
          lastLogin: new Date(),
          isActive: true
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
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
          budget: 100000,
          client: 'Клиент А',
          team: ['1', '2'],
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Проект Б',
          description: 'Описание проекта Б',
          status: 'completed',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-12-31'),
          budget: 75000,
          client: 'Клиент Б',
          team: ['1', '3'],
          createdAt: new Date('2023-06-01')
        },
        {
          id: '3',
          name: 'Проект В',
          description: 'Описание проекта В',
          status: 'active',
          startDate: new Date('2024-03-01'),
          budget: 50000,
          client: 'Клиент В',
          team: ['2', '3'],
          createdAt: new Date('2024-03-01')
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
          description: 'Разработка функционала',
          taskType: 'development',
          billable: true,
          rate: 50
        },
        {
          id: '2',
          userId: '2',
          projectId: '2',
          hours: 6,
          date: new Date(),
          description: 'Дизайн интерфейса',
          taskType: 'design',
          billable: true,
          rate: 40
        },
        {
          id: '3',
          userId: '3',
          projectId: '1',
          hours: 4,
          date: new Date(),
          description: 'Планирование проекта',
          taskType: 'management',
          billable: true,
          rate: 60
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
          clientId: 'client1',
          amount: 10000,
          status: 'paid',
          issueDate: new Date('2024-01-01'),
          dueDate: new Date('2024-01-31'),
          paidDate: new Date('2024-01-25'),
          items: [
            { description: 'Разработка', quantity: 100, rate: 50, amount: 5000 },
            { description: 'Дизайн', quantity: 50, rate: 40, amount: 2000 },
            { description: 'Тестирование', quantity: 75, rate: 40, amount: 3000 }
          ]
        },
        {
          id: '2',
          projectId: '2',
          clientId: 'client2',
          amount: 15000,
          status: 'sent',
          issueDate: new Date('2024-02-01'),
          dueDate: new Date('2024-02-28'),
          items: [
            { description: 'Разработка', quantity: 200, rate: 50, amount: 10000 },
            { description: 'Консультации', quantity: 25, rate: 60, amount: 1500 },
            { description: 'Поддержка', quantity: 70, rate: 50, amount: 3500 }
          ]
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
          date: new Date('2024-01-25'),
          status: 'completed',
          method: 'bank_transfer',
          reference: 'TXN-001'
        },
        {
          id: '2',
          invoiceId: '2',
          amount: 7500,
          date: new Date('2024-02-15'),
          status: 'completed',
          method: 'card',
          reference: 'TXN-002'
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
        payments: await this.getPaymentCount(),
        totalHours: this.totalHours(),
        totalRevenue: this.totalPaymentAmount(),
        activeProjects: this.activeProjects().length
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

  // === ПОИСК И ФИЛЬТРАЦИЯ ===
  searchUsers(query: string): User[] {
    return this.users().filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  }

  searchProjects(query: string): Project[] {
    return this.projects().filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.description.toLowerCase().includes(query.toLowerCase()) ||
      project.client?.toLowerCase().includes(query.toLowerCase())
    );
  }

  getTimeEntriesByProject(projectId: string): TimeEntry[] {
    return this.timeEntries().filter(entry => entry.projectId === projectId);
  }

  getTimeEntriesByUser(userId: string): TimeEntry[] {
    return this.timeEntries().filter(entry => entry.userId === userId);
  }

  getTimeEntriesByDateRange(startDate: Date, endDate: Date): TimeEntry[] {
    return this.timeEntries().filter(entry => 
      entry.date >= startDate && entry.date <= endDate
    );
  }
}
