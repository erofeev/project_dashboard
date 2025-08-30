import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { FinancialCalculatorService } from './financial-calculator.service';
import { User, UserRole } from '../models/user.model';
import { Project, ProjectStatus } from '../models/project.model';
import { TimeEntry } from '../models/time-entry.model';
import { Invoice, InvoiceStatus } from '../models/invoice.model';
import { Payment, PaymentStatus } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class DemoDataService {

  constructor(
    private databaseService: DatabaseService,
    private financialCalculator: FinancialCalculatorService
  ) { }

  async createDemoData(): Promise<void> {
    try {
      console.log('Создание демо-данных...');
      
      // Создаем пользователей
      const users = await this.createDemoUsers();
      
      // Создаем проекты
      const projects = await this.createDemoProjects();
      
      // Создаем временные записи
      await this.createDemoTimeEntries(users, projects);
      
      // Создаем счета и платежи
      await this.createDemoInvoicesAndPayments(projects);
      
      console.log('Демо-данные успешно созданы!');
    } catch (error) {
      console.error('Ошибка при создании демо-данных:', error);
    }
  }

  private async createDemoUsers(): Promise<User[]> {
    const users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Иван Петров',
        email: 'ivan.petrov@company.ru',
        phone: '+7 (999) 111-11-11',
        role: UserRole.GENERAL_DIRECTOR,
        direction: 'Все направления',
        salary: 200000,
        hourlyRate: 1200,
        workingDaysPerMonth: 22,
        dailyRate: 9091,
        monthlyCost: 200000,
        isActive: true
      },
      {
        name: 'Мария Сидорова',
        email: 'maria.sidorova@company.ru',
        phone: '+7 (999) 222-22-22',
        role: UserRole.DIRECTOR,
        direction: 'Разработка ПО',
        salary: 150000,
        hourlyRate: 900,
        workingDaysPerMonth: 22,
        dailyRate: 6818,
        monthlyCost: 150000,
        isActive: true
      },
      {
        name: 'Алексей Козлов',
        email: 'alexey.kozlov@company.ru',
        phone: '+7 (999) 333-33-33',
        role: UserRole.DIRECTOR,
        direction: 'Консалтинг',
        salary: 140000,
        hourlyRate: 850,
        workingDaysPerMonth: 22,
        dailyRate: 6364,
        monthlyCost: 140000,
        isActive: true
      },
      {
        name: 'Елена Волкова',
        email: 'elena.volkova@company.ru',
        phone: '+7 (999) 444-44-44',
        role: UserRole.PROJECT_MANAGER,
        direction: 'Разработка ПО',
        salary: 120000,
        hourlyRate: 750,
        workingDaysPerMonth: 22,
        dailyRate: 5455,
        monthlyCost: 120000,
        isActive: true
      },
      {
        name: 'Дмитрий Новиков',
        email: 'dmitry.novikov@company.ru',
        phone: '+7 (999) 555-55-55',
        role: UserRole.PROJECT_MANAGER,
        direction: 'Консалтинг',
        salary: 110000,
        hourlyRate: 700,
        workingDaysPerMonth: 22,
        dailyRate: 5000,
        monthlyCost: 110000,
        isActive: true
      },
      {
        name: 'Анна Морозова',
        email: 'anna.morozova@company.ru',
        phone: '+7 (999) 666-66-66',
        role: UserRole.EMPLOYEE,
        direction: 'Разработка ПО',
        salary: 80000,
        hourlyRate: 500,
        workingDaysPerMonth: 22,
        dailyRate: 3636,
        monthlyCost: 80000,
        isActive: true
      },
      {
        name: 'Сергей Лебедев',
        email: 'sergey.lebedev@company.ru',
        phone: '+7 (999) 777-77-77',
        role: UserRole.EMPLOYEE,
        direction: 'Разработка ПО',
        salary: 85000,
        hourlyRate: 550,
        workingDaysPerMonth: 22,
        dailyRate: 3864,
        monthlyCost: 85000,
        isActive: true
      },
      {
        name: 'Ольга Соколова',
        email: 'olga.sokolova@company.ru',
        phone: '+7 (999) 888-88-88',
        role: UserRole.EMPLOYEE,
        direction: 'Консалтинг',
        salary: 70000,
        hourlyRate: 450,
        workingDaysPerMonth: 22,
        dailyRate: 3182,
        monthlyCost: 70000,
        isActive: true
      }
    ];

    const createdUsers: User[] = [];
    for (const userData of users) {
      const user = await this.databaseService.createUser(userData);
      createdUsers.push(user);
    }

    return createdUsers;
  }

  private async createDemoProjects(): Promise<Project[]> {
    const projects: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Система управления проектами',
        description: 'Разработка веб-приложения для управления проектами с финансовой аналитикой',
        direction: 'Разработка ПО',
        status: ProjectStatus.ACTIVE,
        contractValue: 2500000,
        plannedValue: 2000000,
        actualRevenue: 1500000,
        plannedHours: 1200,
        actualHours: 800,
        costPrice: 0, // Будет рассчитано автоматически
        margin: 0, // Будет рассчитано автоматически
        marginPercentage: 0, // Будет рассчитано автоматически
        startDate: new Date('2024-01-15'),
        endDate: undefined,
        plannedEndDate: new Date('2024-07-15'),
        clientName: 'ООО "ТехноСофт"',
        contractNumber: 'К-001/2024',
        contractDate: new Date('2024-01-10'),
        isVisible: true
      },
      {
        name: 'Автоматизация бизнес-процессов',
        description: 'Внедрение системы автоматизации для оптимизации рабочих процессов',
        direction: 'Консалтинг',
        status: ProjectStatus.ACTIVE,
        contractValue: 1800000,
        plannedValue: 1500000,
        actualRevenue: 900000,
        plannedHours: 900,
        actualHours: 600,
        costPrice: 0,
        margin: 0,
        marginPercentage: 0,
        startDate: new Date('2024-02-01'),
        endDate: undefined,
        plannedEndDate: new Date('2024-08-01'),
        clientName: 'АО "БизнесПартнер"',
        contractNumber: 'К-002/2024',
        contractDate: new Date('2024-01-25'),
        isVisible: true
      },
      {
        name: 'Мобильное приложение для клиентов',
        description: 'Создание мобильного приложения для улучшения взаимодействия с клиентами',
        direction: 'Разработка ПО',
        status: ProjectStatus.PLANNING,
        contractValue: 1200000,
        plannedValue: 1000000,
        actualRevenue: 0,
        plannedHours: 600,
        actualHours: 0,
        costPrice: 0,
        margin: 0,
        marginPercentage: 0,
        startDate: new Date('2024-04-01'),
        endDate: undefined,
        plannedEndDate: new Date('2024-09-01'),
        clientName: 'ООО "МобиСервис"',
        contractNumber: 'К-003/2024',
        contractDate: new Date('2024-03-15'),
        isVisible: true
      },
      {
        name: 'Аудит IT-инфраструктуры',
        description: 'Проведение комплексного аудита IT-инфраструктуры предприятия',
        direction: 'Консалтинг',
        status: ProjectStatus.COMPLETED,
        contractValue: 800000,
        plannedValue: 700000,
        actualRevenue: 800000,
        plannedHours: 400,
        actualHours: 380,
        costPrice: 0,
        margin: 0,
        marginPercentage: 0,
        startDate: new Date('2023-11-01'),
        endDate: new Date('2024-01-31'),
        plannedEndDate: new Date('2024-01-31'),
        clientName: 'ООО "ИнфоТех"',
        contractNumber: 'К-004/2023',
        contractDate: new Date('2023-10-15'),
        isVisible: true
      },
      {
        name: 'Обновление корпоративного портала',
        description: 'Модернизация и обновление корпоративного веб-портала',
        direction: 'Разработка ПО',
        status: ProjectStatus.ON_HOLD,
        contractValue: 900000,
        plannedValue: 800000,
        actualRevenue: 300000,
        plannedHours: 500,
        actualHours: 200,
        costPrice: 0,
        margin: 0,
        marginPercentage: 0,
        startDate: new Date('2024-01-01'),
        endDate: undefined,
        plannedEndDate: new Date('2024-06-01'),
        clientName: 'ООО "КорпПортал"',
        contractNumber: 'К-005/2024',
        contractDate: new Date('2023-12-20'),
        isVisible: true
      }
    ];

    const createdProjects: Project[] = [];
    for (const projectData of projects) {
      const project = await this.databaseService.createProject(projectData);
      createdProjects.push(project);
    }

    return createdProjects;
  }

  private async createDemoTimeEntries(users: User[], projects: Project[]): Promise<void> {
    const timeEntries: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    // Генерируем временные записи для активных проектов
    const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE);
    
    for (const project of activeProjects) {
      const projectUsers = users.filter(u => 
        u.direction === project.direction || u.role === UserRole.GENERAL_DIRECTOR
      );
      
      // Генерируем записи за последние 3 месяца
      const startDate = new Date(project.startDate);
      const endDate = new Date();
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Пропускаем выходные
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        // Случайно выбираем пользователей для работы в этот день
        const workingUsers = projectUsers.filter(() => Math.random() > 0.3);
        
        for (const user of workingUsers) {
          const hours = Math.floor(Math.random() * 4) + 4; // 4-8 часов в день
          const userFinancials = this.financialCalculator.getUserFinancials(user);
          const calculatedCost = hours * userFinancials.hourlyRate;
          
          timeEntries.push({
            userId: user.id,
            projectId: project.id,
            hours,
            date: new Date(d),
            comments: `Работа над проектом "${project.name}"`,
            description: `Разработка функционала`,
            calculatedCost,
            userHourlyRate: userFinancials.hourlyRate
          });
        }
      }
    }
    
    // Создаем временные записи в базе
    for (const timeEntryData of timeEntries) {
      await this.databaseService.createTimeEntry(timeEntryData);
    }
  }

  private async createDemoInvoicesAndPayments(projects: Project[]): Promise<void> {
    const invoices: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const payments: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    for (const project of projects) {
      if (project.status === ProjectStatus.COMPLETED) {
        // Для завершенных проектов создаем полные счета и платежи
        const invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
          projectId: project.id,
          invoiceNumber: `СЧ-${project.contractNumber}-001`,
          issueDate: new Date(project.startDate),
          dueDate: new Date(project.startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 дней
          amount: project.contractValue,
          currency: 'RUB',
          status: InvoiceStatus.PAID,
          description: `Оплата по проекту "${project.name}"`,
                      items: [{
              id: `item_${Date.now()}`,
              description: `Выполнение работ по проекту "${project.name}"`,
              quantity: 1,
              unit: 'шт',
              unitPrice: project.contractValue,
              totalPrice: project.contractValue
            }],
          totalPaid: project.contractValue,
          remainingAmount: 0,
          notes: 'Проект выполнен в полном объеме',
          isVisible: true
        };
        
        const createdInvoice = await this.databaseService.createInvoice(invoice);
        
        // Создаем платеж
        const payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
          invoiceId: createdInvoice.id,
          projectId: project.id,
          amount: project.contractValue,
          paymentDate: new Date(project.endDate!.getTime() + 15 * 24 * 60 * 60 * 1000), // +15 дней после завершения
          currency: 'RUB',
          status: PaymentStatus.RECEIVED,
          paymentMethod: 'Банковский перевод',
          paymentNumber: `ПЛ-${project.contractNumber}-001`,
          reference: `ПЛ-${project.contractNumber}-001`,
          notes: 'Оплата по счету',
          isVisible: true
        };
        
        await this.databaseService.createPayment(payment);
        
      } else if (project.status === ProjectStatus.ACTIVE) {
        // Для активных проектов создаем частичные счета и платежи
        const progressPercentage = (project.actualHours || 0) / (project.plannedHours || 1);
        const invoicedAmount = Math.round(project.contractValue * progressPercentage * 0.8); // 80% от прогресса
        
        if (invoicedAmount > 0) {
          const invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
            projectId: project.id,
            invoiceNumber: `СЧ-${project.contractNumber}-001`,
            issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 дней назад
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
            amount: invoicedAmount,
            currency: 'RUB',
            status: InvoiceStatus.SENT,
            description: `Авансовый счет по проекту "${project.name}"`,
            items: [{
              id: `item_${Date.now()}_advance`,
              description: `Авансовый платеж по проекту "${project.name}"`,
              quantity: 1,
              unit: 'шт',
              unitPrice: invoicedAmount,
              totalPrice: invoicedAmount
            }],
            totalPaid: 0,
            remainingAmount: invoicedAmount,
            notes: 'Авансовый платеж за выполненные работы',
            isVisible: true
          };
          
          const createdInvoice = await this.databaseService.createInvoice(invoice);
          
          // Создаем частичный платеж (если есть)
          if (project.actualRevenue > 0) {
            const paymentAmount = Math.min(project.actualRevenue, invoicedAmount);
            const payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
              invoiceId: createdInvoice.id,
              projectId: project.id,
              amount: paymentAmount,
              paymentDate: new Date(Date.now() - 15 * 60 * 60 * 1000), // 15 дней назад
              currency: 'RUB',
              status: PaymentStatus.RECEIVED,
              paymentMethod: 'Банковский перевод',
              paymentNumber: `ПЛ-${project.contractNumber}-002`,
              reference: `ПЛ-${project.contractNumber}-002`,
              notes: 'Частичная оплата по счету',
              isVisible: true
            };
            
            await this.databaseService.createPayment(payment);
          }
        }
      }
    }
  }

  async clearDemoData(): Promise<void> {
    try {
      await this.databaseService.clearAllData();
      console.log('Демо-данные очищены');
    } catch (error) {
      console.error('Ошибка при очистке демо-данных:', error);
    }
  }

  async getDemoDataStats(): Promise<any> {
    try {
      const stats = await this.databaseService.getDatabaseStats();
      return {
        ...stats,
        message: 'Статистика демо-данных получена успешно'
      };
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
      return { message: 'Ошибка при получении статистики' };
    }
  }
}
