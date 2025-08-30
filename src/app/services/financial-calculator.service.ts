import { Injectable } from '@angular/core';
import { User, UserRole } from '../models/user.model';
import { Project, ProjectStatus } from '../models/project.model';
import { TimeEntry } from '../models/time-entry.model';
import { Invoice, InvoiceStatus } from '../models/invoice.model';
import { Payment } from '../models/invoice.model';

export interface ProjectFinancials {
  totalRevenue: number;
  totalCost: number;
  currentMargin: number;
  projectedMargin: number;
  budgetUtilization: number;
  profitabilityIndex: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  paymentRate: number;
  averagePaymentTime: number;
}

export interface UserFinancials {
  dailyRate: number;
  hourlyRate: number;
  monthlyCost: number;
  workingDaysPerMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialCalculatorService {

  constructor() { }

  // Расчет дневной ставки на основе месячной зарплаты
  calculateDailyRate(salary: number, workingDaysPerMonth: number): number {
    if (workingDaysPerMonth <= 0) return 0;
    return Math.round(salary / workingDaysPerMonth);
  }

  // Расчет почасовой ставки на основе дневной ставки
  calculateHourlyRate(dailyRate: number, workingHoursPerDay: number = 8): number {
    if (workingHoursPerDay <= 0) return 0;
    return Math.round(dailyRate / workingHoursPerDay);
  }

  // Расчет месячной стоимости сотрудника
  calculateMonthlyCost(salary: number, hourlyRate: number, workingDaysPerMonth: number): number {
    // Если указана зарплата, используем её, иначе рассчитываем из почасовой ставки
    if (salary > 0) {
      return salary;
    } else if (hourlyRate > 0) {
      return hourlyRate * 8 * workingDaysPerMonth;
    }
    return 0;
  }

  // Получение финансовых параметров пользователя
  getUserFinancials(user: User): UserFinancials {
    const dailyRate = user.dailyRate || this.calculateDailyRate(user.salary, user.workingDaysPerMonth);
    const hourlyRate = user.hourlyRate || this.calculateHourlyRate(dailyRate);
    const monthlyCost = user.monthlyCost || this.calculateMonthlyCost(user.salary, hourlyRate, user.workingDaysPerMonth);

    return {
      dailyRate,
      hourlyRate,
      monthlyCost,
      workingDaysPerMonth: user.workingDaysPerMonth
    };
  }

  // Расчет себестоимости проекта на основе временных записей
  calculateProjectCost(projectId: string, timeEntries: TimeEntry[], users: User[]): number {
    let totalCost = 0;

    timeEntries.forEach(entry => {
      if (entry.projectId === projectId) {
        const user = users.find(u => u.id === entry.userId);
        if (user) {
          const userFinancials = this.getUserFinancials(user);
          totalCost += entry.hours * userFinancials.hourlyRate;
        }
      }
    });

    return totalCost;
  }

  // Расчет текущей маржи проекта
  calculateCurrentMargin(project: Project, currentCost: number): number {
    return project.contractValue - currentCost;
  }

  // Расчет процентной маржи
  calculateMarginPercentage(contractValue: number, cost: number): number {
    if (contractValue <= 0) return 0;
    return Math.round(((contractValue - cost) / contractValue) * 100);
  }

  // Расчет прогнозируемой маржи на основе текущих темпов
  calculateProjectedMargin(
    project: Project, 
    timeEntries: TimeEntry[], 
    users: User[]
  ): number {
    const currentCost = this.calculateProjectCost(project.id, timeEntries, users);
    const plannedHours = project.plannedHours || 0;
    const actualHours = project.actualHours || 0;

    if (plannedHours <= 0 || actualHours <= 0) {
      return this.calculateCurrentMargin(project, currentCost);
    }

    // Рассчитываем среднюю стоимость часа по проекту
    const averageHourlyCost = currentCost / actualHours;
    
    // Прогнозируем общую стоимость
    const projectedTotalCost = averageHourlyCost * plannedHours;
    
    // Прогнозируемая маржа
    return project.contractValue - projectedTotalCost;
  }

  // Расчет утилизации бюджета
  calculateBudgetUtilization(plannedValue: number, actualCost: number): number {
    if (plannedValue <= 0) return 0;
    return Math.round((actualCost / plannedValue) * 100);
  }

  // Расчет индекса прибыльности
  calculateProfitabilityIndex(contractValue: number, cost: number): number {
    if (cost <= 0) return 0;
    return Math.round((contractValue / cost) * 100);
  }

  // Расчет финансовых показателей проекта
  calculateProjectFinancials(
    project: Project,
    timeEntries: TimeEntry[],
    users: User[],
    invoices: Invoice[],
    payments: Payment[]
  ): ProjectFinancials {
    const currentCost = this.calculateProjectCost(project.id, timeEntries, users);
    const currentMargin = this.calculateCurrentMargin(project, currentCost);
    const projectedMargin = this.calculateProjectedMargin(project, timeEntries, users);
    const marginPercentage = this.calculateMarginPercentage(project.contractValue, currentCost);
    const budgetUtilization = this.calculateBudgetUtilization(project.plannedValue || 0, currentCost);
    const profitabilityIndex = this.calculateProfitabilityIndex(project.contractValue, currentCost);

    // Расчет показателей по счетам и платежам
    const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
    const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    const projectPayments = payments.filter(pay => pay.projectId === project.id);
    const totalPaid = projectPayments.reduce((sum, pay) => sum + pay.amount, 0);
    
    const outstandingAmount = totalInvoiced - totalPaid;
    const paymentRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
    
    // Расчет среднего времени оплаты
    const averagePaymentTime = this.calculateAveragePaymentTime(projectInvoices, projectPayments);

    return {
      totalRevenue: project.contractValue,
      totalCost: currentCost,
      currentMargin,
      projectedMargin,
      budgetUtilization,
      profitabilityIndex,
      totalInvoiced,
      totalPaid,
      outstandingAmount,
      paymentRate,
      averagePaymentTime
    };
  }

  // Расчет среднего времени оплаты
  private calculateAveragePaymentTime(invoices: Invoice[], payments: Payment[]): number {
    if (payments.length === 0) return 0;

    let totalDays = 0;
    let validPayments = 0;

    payments.forEach(payment => {
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (invoice && payment.paymentDate) {
        const paymentDate = new Date(payment.paymentDate);
        const invoiceDate = new Date(invoice.issueDate);
        const daysDiff = Math.ceil((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 0) {
          totalDays += daysDiff;
          validPayments++;
        }
      }
    });

    return validPayments > 0 ? Math.round(totalDays / validPayments) : 0;
  }

  // Расчет ROI проекта
  calculateROI(project: Project, timeEntries: TimeEntry[], users: User[]): number {
    const currentCost = this.calculateProjectCost(project.id, timeEntries, users);
    const profit = project.contractValue - currentCost;
    
    if (currentCost <= 0) return 0;
    return Math.round((profit / currentCost) * 100);
  }

  // Расчет эффективности сотрудника
  calculateEmployeeEfficiency(
    userId: string,
    timeEntries: TimeEntry[],
    projects: Project[]
  ): {
    totalHours: number;
    totalCost: number;
    averageHourlyRate: number;
    projectsCount: number;
    efficiency: number;
  } {
    const userTimeEntries = timeEntries.filter(te => te.userId === userId);
    const totalHours = userTimeEntries.reduce((sum, te) => sum + te.hours, 0);
    const totalCost = userTimeEntries.reduce((sum, te) => sum + te.calculatedCost, 0);
    const averageHourlyRate = totalHours > 0 ? totalCost / totalHours : 0;
    
    const uniqueProjects = new Set(userTimeEntries.map(te => te.projectId));
    const projectsCount = uniqueProjects.size;
    
    // Эффективность на основе количества проектов и часов
    const efficiency = Math.round((projectsCount * totalHours) / 100);

    return {
      totalHours,
      totalCost,
      averageHourlyRate,
      projectsCount,
      efficiency
    };
  }

  // Расчет cash flow по проекту
  calculateProjectCashFlow(
    project: Project,
    invoices: Invoice[],
    payments: Payment[]
  ): {
    plannedRevenue: number;
    actualRevenue: number;
    outstandingAmount: number;
    cashFlow: number;
  } {
    const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
    const projectPayments = payments.filter(pay => pay.projectId === project.id);
    
    const plannedRevenue = project.contractValue;
    const actualRevenue = projectPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const outstandingAmount = projectInvoices
      .filter(inv => inv.status !== InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + inv.amount, 0);
    
    const cashFlow = actualRevenue - outstandingAmount;

    return {
      plannedRevenue,
      actualRevenue,
      outstandingAmount,
      cashFlow
    };
  }

  // Прогнозирование завершения проекта
  forecastProjectCompletion(
    project: Project,
    timeEntries: TimeEntry[],
    users: User[]
  ): {
    estimatedCompletionDate: Date;
    estimatedTotalCost: number;
    estimatedMargin: number;
    confidence: number;
  } {
    const currentCost = this.calculateProjectCost(project.id, timeEntries, users);
    const actualHours = project.actualHours || 0;
    const plannedHours = project.plannedHours || 0;
    
    if (actualHours <= 0 || plannedHours <= 0) {
      return {
        estimatedCompletionDate: project.plannedEndDate,
        estimatedTotalCost: currentCost,
        estimatedMargin: project.contractValue - currentCost,
        confidence: 0
      };
    }

    // Рассчитываем среднюю стоимость часа
    const averageHourlyCost = currentCost / actualHours;
    
    // Прогнозируем общую стоимость
    const estimatedTotalCost = averageHourlyCost * plannedHours;
    
    // Прогнозируем дату завершения на основе темпов
    const progressPercentage = actualHours / plannedHours;
    const elapsedDays = this.calculateElapsedDays(project.startDate, new Date());
    const estimatedTotalDays = elapsedDays / progressPercentage;
    
    const estimatedCompletionDate = new Date(project.startDate);
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + estimatedTotalDays);
    
    const estimatedMargin = project.contractValue - estimatedTotalCost;
    
    // Уровень уверенности в прогнозе (0-100%)
    const confidence = Math.min(100, Math.max(0, Math.round(progressPercentage * 100)));

    return {
      estimatedCompletionDate,
      estimatedTotalCost,
      estimatedMargin,
      confidence
    };
  }

  private calculateElapsedDays(startDate: Date, currentDate: Date): number {
    const timeDiff = currentDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  // Валидация финансовых данных
  validateFinancialData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.salary && data.salary < 0) {
      errors.push('Зарплата не может быть отрицательной');
    }

    if (data.hourlyRate && data.hourlyRate < 0) {
      errors.push('Почасовая ставка не может быть отрицательной');
    }

    if (data.workingDaysPerMonth && (data.workingDaysPerMonth < 1 || data.workingDaysPerMonth > 31)) {
      errors.push('Количество рабочих дней должно быть от 1 до 31');
    }

    if (data.contractValue && data.contractValue < 0) {
      errors.push('Стоимость контракта не может быть отрицательной');
    }

    if (data.plannedHours && data.plannedHours < 0) {
      errors.push('Планируемые часы не могут быть отрицательными');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
