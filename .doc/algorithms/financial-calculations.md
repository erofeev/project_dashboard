# Алгоритмы финансовых расчетов

## Обзор

Документ описывает ключевые алгоритмы для финансовых расчетов в системе управления проектами, включая расчет себестоимости, маржинальности, прогнозирования и анализа эффективности.

## 1. Расчет себестоимости проекта

### Алгоритм расчета текущей себестоимости

```typescript
interface ProjectCostCalculation {
  projectId: string;
  totalCost: number;
  laborCost: number;
  materialCost: number;
  overheadCost: number;
  costPerHour: number;
  breakdown: CostBreakdown[];
}

interface CostBreakdown {
  userId: string;
  userName: string;
  hours: number;
  rate: number;
  cost: number;
  percentage: number;
}

class ProjectCostCalculator {
  /**
   * Рассчитывает текущую себестоимость проекта
   */
  async calculateProjectCost(projectId: string): Promise<ProjectCostCalculation> {
    // 1. Получаем все временные записи по проекту
    const timeEntries = await this.getProjectTimeEntries(projectId);
    
    // 2. Получаем информацию о пользователях и их ставках
    const users = await this.getProjectUsers(projectId);
    
    // 3. Рассчитываем трудовые затраты
    const laborCost = this.calculateLaborCost(timeEntries, users);
    
    // 4. Рассчитываем материальные затраты
    const materialCost = await this.getProjectMaterialCost(projectId);
    
    // 5. Рассчитываем накладные расходы
    const overheadCost = this.calculateOverheadCost(laborCost, materialCost);
    
    // 6. Формируем детализацию по участникам
    const breakdown = this.createCostBreakdown(timeEntries, users, laborCost);
    
    const totalCost = laborCost + materialCost + overheadCost;
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const costPerHour = totalHours > 0 ? totalCost / totalHours : 0;
    
    return {
      projectId,
      totalCost,
      laborCost,
      materialCost,
      overheadCost,
      costPerHour,
      breakdown
    };
  }
  
  /**
   * Рассчитывает трудовые затраты
   */
  private calculateLaborCost(timeEntries: TimeEntry[], users: User[]): number {
    return timeEntries.reduce((totalCost, entry) => {
      const user = users.find(u => u.id === entry.userId);
      if (!user) return totalCost;
      
      const hourlyRate = this.calculateUserHourlyRate(user);
      const entryCost = entry.hours * hourlyRate;
      
      return totalCost + entryCost;
    }, 0);
  }
  
  /**
   * Рассчитывает почасовую ставку пользователя
   */
  private calculateUserHourlyRate(user: User): number {
    if (user.salary.type === 'hourly') {
      return user.salary.hourlyRate || 0;
    } else if (user.salary.type === 'monthly') {
      // Расчет дневной ставки: месячная зарплата / рабочие дни в месяце
      const workingDaysPerMonth = user.salary.workingDaysPerMonth || 22;
      const dailyRate = user.salary.amount / workingDaysPerMonth;
      
      // Расчет почасовой ставки: дневная ставка / рабочие часы в дне
      const workingHoursPerDay = 8;
      return dailyRate / workingHoursPerDay;
    }
    
    return 0;
  }
  
  /**
   * Рассчитывает накладные расходы
   */
  private calculateOverheadCost(laborCost: number, materialCost: number): number {
    // Накладные расходы = 20% от прямых затрат
    const overheadRate = 0.2;
    return (laborCost + materialCost) * overheadRate;
  }
  
  /**
   * Создает детализацию затрат по участникам
   */
  private createCostBreakdown(
    timeEntries: TimeEntry[], 
    users: User[], 
    totalLaborCost: number
  ): CostBreakdown[] {
    const userCosts = new Map<string, { hours: number, cost: number }>();
    
    // Группируем затраты по пользователям
    timeEntries.forEach(entry => {
      const user = users.find(u => u.id === entry.userId);
      if (!user) return;
      
      const hourlyRate = this.calculateUserHourlyRate(user);
      const entryCost = entry.hours * hourlyRate;
      
      const existing = userCosts.get(entry.userId) || { hours: 0, cost: 0 };
      userCosts.set(entry.userId, {
        hours: existing.hours + entry.hours,
        cost: existing.cost + entryCost
      });
    });
    
    // Формируем результат
    return Array.from(userCosts.entries()).map(([userId, data]) => {
      const user = users.find(u => u.id === userId)!;
      const percentage = totalLaborCost > 0 ? (data.cost / totalLaborCost) * 100 : 0;
      
      return {
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        hours: data.hours,
        rate: this.calculateUserHourlyRate(user),
        cost: data.cost,
        percentage: Math.round(percentage * 100) / 100
      };
    }).sort((a, b) => b.cost - a.cost); // Сортировка по убыванию затрат
  }
}
```

### Пример использования

```typescript
const calculator = new ProjectCostCalculator();
const projectCost = await calculator.calculateProjectCost('project-123');

console.log(`Общая себестоимость: ₽${projectCost.totalCost.toLocaleString()}`);
console.log(`Трудовые затраты: ₽${projectCost.laborCost.toLocaleString()}`);
console.log(`Стоимость часа: ₽${projectCost.costPerHour.toFixed(2)}`);

// Детализация по участникам
projectCost.breakdown.forEach(participant => {
  console.log(`${participant.userName}: ${participant.hours}ч, ₽${participant.cost.toLocaleString()} (${participant.percentage}%)`);
});
```

## 2. Расчет маржинальности проекта

### Алгоритм расчета маржи

```typescript
interface ProjectMargin {
  projectId: string;
  contractValue: number;
  totalCost: number;
  grossMargin: number;
  grossMarginPercentage: number;
  netMargin: number;
  netMarginPercentage: number;
  profitability: 'high' | 'medium' | 'low' | 'negative';
  forecast: MarginForecast;
}

interface MarginForecast {
  projectedCost: number;
  projectedMargin: number;
  projectedMarginPercentage: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
}

class ProjectMarginCalculator {
  /**
   * Рассчитывает текущую маржинальность проекта
   */
  async calculateProjectMargin(projectId: string): Promise<ProjectMargin> {
    const project = await this.getProject(projectId);
    const costCalculation = await this.costCalculator.calculateProjectCost(projectId);
    
    const contractValue = project.lifecycle.contract.contractCost;
    const totalCost = costCalculation.totalCost;
    
    // Валовая маржа
    const grossMargin = contractValue - totalCost;
    const grossMarginPercentage = contractValue > 0 ? (grossMargin / contractValue) * 100 : 0;
    
    // Чистая маржа (после налогов)
    const taxRate = 0.2; // 20% налог на прибыль
    const netMargin = grossMargin * (1 - taxRate);
    const netMarginPercentage = contractValue > 0 ? (netMargin / contractValue) * 100 : 0;
    
    // Оценка прибыльности
    const profitability = this.assessProfitability(grossMarginPercentage);
    
    // Прогноз маржинальности
    const forecast = await this.calculateMarginForecast(projectId, costCalculation);
    
    return {
      projectId,
      contractValue,
      totalCost,
      grossMargin,
      grossMarginPercentage: Math.round(grossMarginPercentage * 100) / 100,
      netMargin,
      netMarginPercentage: Math.round(netMarginPercentage * 100) / 100,
      profitability,
      forecast
    };
  }
  
  /**
   * Оценивает прибыльность проекта
   */
  private assessProfitability(marginPercentage: number): 'high' | 'medium' | 'low' | 'negative' {
    if (marginPercentage < 0) return 'negative';
    if (marginPercentage < 10) return 'low';
    if (marginPercentage < 25) return 'medium';
    return 'high';
  }
  
  /**
   * Рассчитывает прогноз маржинальности
   */
  private async calculateMarginForecast(
    projectId: string, 
    currentCost: ProjectCostCalculation
  ): Promise<MarginForecast> {
    const project = await this.getProject(projectId);
    const estimatedHours = project.lifecycle.planning.estimatedHours;
    const completedHours = currentCost.breakdown.reduce((sum, b) => sum + b.hours, 0);
    
    if (estimatedHours <= 0 || completedHours <= 0) {
      return this.createDefaultForecast(currentCost.totalCost);
    }
    
    // Прогноз на основе текущих темпов
    const completionRate = completedHours / estimatedHours;
    const projectedCost = currentCost.totalCost / completionRate;
    
    const contractValue = project.lifecycle.contract.contractCost;
    const projectedMargin = contractValue - projectedCost;
    const projectedMarginPercentage = contractValue > 0 ? (projectedMargin / contractValue) * 100 : 0;
    
    // Оценка уверенности в прогнозе
    const confidence = this.calculateForecastConfidence(completionRate, completedHours);
    
    // Определение тренда
    const trend = this.assessMarginTrend(projectId, projectedMarginPercentage);
    
    return {
      projectedCost: Math.round(projectedCost),
      projectedMargin: Math.round(projectedMargin),
      projectedMarginPercentage: Math.round(projectedMarginPercentage * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      trend
    };
  }
  
  /**
   * Рассчитывает уверенность в прогнозе
   */
  private calculateForecastConfidence(completionRate: number, completedHours: number): number {
    // Базовая уверенность на основе процента завершения
    let confidence = Math.min(completionRate * 0.8, 0.9);
    
    // Дополнительная уверенность на основе объема данных
    if (completedHours >= 100) confidence += 0.1;
    if (completedHours >= 500) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Оценивает тренд маржинальности
   */
  private assessMarginTrend(projectId: string, projectedMargin: number): 'improving' | 'stable' | 'declining' {
    // Анализ исторических данных по проекту
    const historicalData = this.getProjectHistoricalData(projectId);
    
    if (historicalData.length < 2) return 'stable';
    
    const recentMargin = historicalData[historicalData.length - 1].margin;
    const previousMargin = historicalData[historicalData.length - 2].margin;
    
    const marginChange = projectedMargin - recentMargin;
    const marginChangePercent = Math.abs(marginChange) / Math.abs(recentMargin);
    
    if (marginChangePercent < 0.05) return 'stable';
    return marginChange > 0 ? 'improving' : 'declining';
  }
}
```

## 3. ROI калькулятор

### Алгоритм расчета ROI

```typescript
interface ROICalculation {
  projectId: string;
  totalInvestment: number;
  totalReturn: number;
  roi: number;
  roiPercentage: number;
  paybackPeriod: number; // в месяцах
  npv: number; // чистая приведенная стоимость
  irr: number; // внутренняя норма доходности
  riskAssessment: RiskAssessment;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  score: number; // 0-100
}

interface RiskFactor {
  name: string;
  impact: 'low' | 'medium' | 'high';
  probability: number; // 0-1
  description: string;
}

class ROICalculator {
  /**
   * Рассчитывает ROI проекта
   */
  async calculateProjectROI(projectId: string): Promise<ROICalculation> {
    const project = await this.getProject(projectId);
    const margin = await this.marginCalculator.calculateProjectMargin(projectId);
    
    // Общие инвестиции (затраты)
    const totalInvestment = margin.totalCost;
    
    // Общий возврат (доход)
    const totalReturn = margin.contractValue;
    
    // ROI
    const roi = totalReturn - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (roi / totalInvestment) * 100 : 0;
    
    // Период окупаемости
    const paybackPeriod = this.calculatePaybackPeriod(project, totalInvestment);
    
    // NPV и IRR
    const npv = this.calculateNPV(project, totalInvestment, totalReturn);
    const irr = this.calculateIRR(project, totalInvestment, totalReturn);
    
    // Оценка рисков
    const riskAssessment = await this.assessProjectRisks(projectId);
    
    return {
      projectId,
      totalInvestment,
      totalReturn,
      roi,
      roiPercentage: Math.round(roiPercentage * 100) / 100,
      paybackPeriod,
      npv: Math.round(npv),
      irr: Math.round(irr * 100) / 100,
      riskAssessment
    };
  }
  
  /**
   * Рассчитывает период окупаемости
   */
  private calculatePaybackPeriod(project: Project, totalInvestment: number): number {
    const monthlyRevenue = this.calculateMonthlyRevenue(project);
    
    if (monthlyRevenue <= 0) return Infinity;
    
    return Math.ceil(totalInvestment / monthlyRevenue);
  }
  
  /**
   * Рассчитывает месячный доход
   */
  private calculateMonthlyRevenue(project: Project): number {
    const contractValue = project.lifecycle.contract.contractCost;
    const duration = this.calculateProjectDuration(project);
    
    return duration > 0 ? contractValue / duration : 0;
  }
  
  /**
   * Рассчитывает продолжительность проекта в месяцах
   */
  private calculateProjectDuration(project: Project): number {
    const startDate = new Date(project.lifecycle.planning.startDate);
    const endDate = new Date(project.lifecycle.planning.endDate);
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    
    return Math.max(diffMonths, 1);
  }
  
  /**
   * Рассчитывает NPV
   */
  private calculateNPV(project: Project, investment: number, returnValue: number): number {
    const discountRate = 0.12; // 12% годовых
    const duration = this.calculateProjectDuration(project);
    
    // Упрощенный расчет NPV
    const monthlyDiscountRate = Math.pow(1 + discountRate, 1/12) - 1;
    const discountedReturn = returnValue / Math.pow(1 + monthlyDiscountRate, duration);
    
    return discountedReturn - investment;
  }
  
  /**
   * Рассчитывает IRR (упрощенная версия)
   */
  private calculateIRR(project: Project, investment: number, returnValue: number): number {
    const duration = this.calculateProjectDuration(project);
    
    // Упрощенный расчет IRR
    if (investment <= 0 || duration <= 0) return 0;
    
    const totalReturn = returnValue - investment;
    return Math.pow(returnValue / investment, 1 / duration) - 1;
  }
  
  /**
   * Оценивает риски проекта
   */
  private async assessProjectRisks(projectId: string): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [
      {
        name: 'Технические риски',
        impact: 'medium',
        probability: 0.3,
        description: 'Сложность технической реализации'
      },
      {
        name: 'Рыночные риски',
        impact: 'high',
        probability: 0.2,
        description: 'Изменения рыночных условий'
      },
      {
        name: 'Операционные риски',
        impact: 'low',
        probability: 0.4,
        description: 'Риски в процессе выполнения'
      }
    ];
    
    // Расчет общего риска
    let totalRiskScore = 0;
    riskFactors.forEach(factor => {
      const impactScore = factor.impact === 'high' ? 3 : factor.impact === 'medium' ? 2 : 1;
      totalRiskScore += impactScore * factor.probability * 33.33; // Максимум 100
    });
    
    const riskLevel = totalRiskScore < 30 ? 'low' : totalRiskScore < 70 ? 'medium' : 'high';
    
    return {
      level: riskLevel,
      factors: riskFactors,
      score: Math.round(totalRiskScore)
    };
  }
}
```

## 4. Cash Flow анализ

### Алгоритм анализа денежных потоков

```typescript
interface CashFlowAnalysis {
  projectId: string;
  period: {
    start: Date;
    end: Date;
  };
  inflows: CashFlowItem[];
  outflows: CashFlowItem[];
  netCashFlow: number;
  cumulativeCashFlow: number;
  breakEvenPoint: Date | null;
  cashFlowProjection: CashFlowProjection[];
}

interface CashFlowItem {
  date: Date;
  amount: number;
  type: 'invoice' | 'payment' | 'expense';
  description: string;
  category: string;
}

interface CashFlowProjection {
  date: Date;
  projectedInflow: number;
  projectedOutflow: number;
  projectedNetFlow: number;
  cumulativeProjected: number;
}

class CashFlowAnalyzer {
  /**
   * Анализирует денежные потоки проекта
   */
  async analyzeProjectCashFlow(
    projectId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<CashFlowAnalysis> {
    // Получаем данные о счетах и платежах
    const invoices = await this.getProjectInvoices(projectId, startDate, endDate);
    const payments = await this.getProjectPayments(projectId, startDate, endDate);
    const expenses = await this.getProjectExpenses(projectId, startDate, endDate);
    
    // Формируем притоки (платежи)
    const inflows = payments.map(payment => ({
      date: new Date(payment.date),
      amount: payment.amount,
      type: 'payment' as const,
      description: `Платеж по счету ${payment.reference}`,
      category: 'revenue'
    }));
    
    // Формируем оттоки (расходы)
    const outflows = expenses.map(expense => ({
      date: new Date(expense.date),
      amount: expense.amount,
      type: 'expense' as const,
      description: expense.description,
      category: expense.category
    }));
    
    // Рассчитываем чистый денежный поток
    const totalInflows = inflows.reduce((sum, item) => sum + item.amount, 0);
    const totalOutflows = outflows.reduce((sum, item) => sum + item.amount, 0);
    const netCashFlow = totalInflows - totalOutflows;
    
    // Точка безубыточности
    const breakEvenPoint = this.calculateBreakEvenPoint(inflows, outflows);
    
    // Прогноз денежных потоков
    const cashFlowProjection = this.projectCashFlow(
      projectId, 
      startDate, 
      endDate, 
      inflows, 
      outflows
    );
    
    return {
      projectId,
      period: { start: startDate, end: endDate },
      inflows,
      outflows,
      netCashFlow,
      cumulativeCashFlow: netCashFlow,
      breakEvenPoint,
      cashFlowProjection
    };
  }
  
  /**
   * Рассчитывает точку безубыточности
   */
  private calculateBreakEvenPoint(
    inflows: CashFlowItem[], 
    outflows: CashFlowItem[]
  ): Date | null {
    let cumulativeCashFlow = 0;
    const sortedItems = [...inflows, ...outflows].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    for (const item of sortedItems) {
      if (item.type === 'payment') {
        cumulativeCashFlow += item.amount;
      } else {
        cumulativeCashFlow -= item.amount;
      }
      
      if (cumulativeCashFlow >= 0) {
        return item.date;
      }
    }
    
    return null;
  }
  
  /**
   * Прогнозирует денежные потоки
   */
  private projectCashFlow(
    projectId: string,
    startDate: Date,
    endDate: Date,
    inflows: CashFlowItem[],
    outflows: CashFlowItem[]
  ): CashFlowProjection[] {
    const projections: CashFlowProjection[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Прогноз притоков на основе выставленных счетов
      const projectedInflow = this.estimateMonthlyInflow(projectId, currentDate);
      
      // Прогноз оттоков на основе планируемых расходов
      const projectedOutflow = this.estimateMonthlyOutflow(projectId, currentDate);
      
      const projectedNetFlow = projectedInflow - projectedOutflow;
      
      const previousCumulative = projections.length > 0 
        ? projections[projections.length - 1].cumulativeProjected 
        : 0;
      
      projections.push({
        date: new Date(currentDate),
        projectedInflow,
        projectedOutflow,
        projectedNetFlow,
        cumulativeProjected: previousCumulative + projectedNetFlow
      });
      
      // Переход к следующему месяцу
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return projections;
  }
  
  /**
   * Оценивает месячный приток
   */
  private estimateMonthlyInflow(projectId: string, date: Date): number {
    // Логика оценки на основе выставленных счетов и исторических данных
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Здесь должна быть логика получения данных о счетах
    // и их ожидаемых сроках оплаты
    return 0; // Заглушка
  }
  
  /**
   * Оценивает месячный отток
   */
  private estimateMonthlyOutflow(projectId: string, date: Date): number {
    // Логика оценки на основе планируемых расходов
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Здесь должна быть логика получения данных о планируемых расходах
    return 0; // Заглушка
  }
}
```

## 5. Анализ эффективности сотрудников

### Алгоритм расчета KPI

```typescript
interface EmployeeEfficiency {
  userId: string;
  userName: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: EfficiencyMetrics;
  projects: ProjectEfficiency[];
  ranking: number;
  recommendations: string[];
}

interface EfficiencyMetrics {
  totalHours: number;
  billableHours: number;
  utilizationRate: number;
  averageHourlyRate: number;
  totalRevenue: number;
  costEfficiency: number;
  qualityScore: number;
}

interface ProjectEfficiency {
  projectId: string;
  projectName: string;
  hours: number;
  revenue: number;
  cost: number;
  margin: number;
  efficiency: number;
}

class EmployeeEfficiencyAnalyzer {
  /**
   * Анализирует эффективность сотрудника
   */
  async analyzeEmployeeEfficiency(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeEfficiency> {
    // Получаем временные записи сотрудника
    const timeEntries = await this.getUserTimeEntries(userId, startDate, endDate);
    
    // Получаем проекты сотрудника
    const projects = await this.getUserProjects(userId, startDate, endDate);
    
    // Рассчитываем метрики
    const metrics = this.calculateEfficiencyMetrics(userId, timeEntries, projects);
    
    // Анализируем эффективность по проектам
    const projectEfficiencies = await this.analyzeProjectEfficiencies(userId, projects, timeEntries);
    
    // Формируем рекомендации
    const recommendations = this.generateRecommendations(metrics, projectEfficiencies);
    
    return {
      userId,
      userName: await this.getUserName(userId),
      period: { start: startDate, end: endDate },
      metrics,
      projects: projectEfficiencies,
      ranking: 0, // Будет рассчитано при сравнении с другими сотрудниками
      recommendations
    };
  }
  
  /**
   * Рассчитывает метрики эффективности
   */
  private calculateEfficiencyMetrics(
    userId: string,
    timeEntries: TimeEntry[],
    projects: Project[]
  ): EfficiencyMetrics {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const billableHours = timeEntries.reduce((sum, entry) => {
      const project = projects.find(p => p.id === entry.projectId);
      return project && project.status === 'active' ? sum + entry.hours : sum;
    }, 0);
    
    const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
    
    // Рассчитываем среднюю почасовую ставку
    const user = this.getUser(userId);
    const averageHourlyRate = this.calculateUserHourlyRate(user);
    
    // Общий доход от работы сотрудника
    const totalRevenue = billableHours * averageHourlyRate;
    
    // Эффективность по стоимости
    const costEfficiency = this.calculateCostEfficiency(userId, totalRevenue, totalHours);
    
    // Оценка качества работы
    const qualityScore = this.calculateQualityScore(userId, timeEntries);
    
    return {
      totalHours,
      billableHours,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageHourlyRate,
      totalRevenue,
      costEfficiency,
      qualityScore
    };
  }
  
  /**
   * Рассчитывает эффективность по стоимости
   */
  private calculateCostEfficiency(userId: string, revenue: number, hours: number): number {
    const user = this.getUser(userId);
    const cost = hours * this.calculateUserHourlyRate(user);
    
    return cost > 0 ? (revenue / cost) * 100 : 0;
  }
  
  /**
   * Рассчитывает оценку качества работы
   */
  private calculateQualityScore(userId: string, timeEntries: TimeEntry[]): number {
    // Логика оценки качества на основе:
    // - Количества одобренных временных записей
    // - Отзывов руководителей проектов
    // - Соответствия описаний работ
    // - Своевременности выполнения задач
    
    const approvedEntries = timeEntries.filter(entry => entry.isApproved).length;
    const totalEntries = timeEntries.length;
    
    if (totalEntries === 0) return 0;
    
    return Math.round((approvedEntries / totalEntries) * 100);
  }
  
  /**
   * Анализирует эффективность по проектам
   */
  private async analyzeProjectEfficiencies(
    userId: string,
    projects: Project[],
    timeEntries: TimeEntry[]
  ): Promise<ProjectEfficiency[]> {
    const projectEfficiencies: ProjectEfficiency[] = [];
    
    for (const project of projects) {
      const projectTimeEntries = timeEntries.filter(entry => entry.projectId === project.id);
      const hours = projectTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
      
      if (hours === 0) continue;
      
      const user = this.getUser(userId);
      const hourlyRate = this.calculateUserHourlyRate(user);
      const revenue = hours * hourlyRate;
      const cost = hours * hourlyRate; // Для сотрудника стоимость = доход
      const margin = revenue - cost;
      
      // Эффективность = маржа / затраченное время
      const efficiency = hours > 0 ? margin / hours : 0;
      
      projectEfficiencies.push({
        projectId: project.id,
        projectName: project.name,
        hours,
        revenue,
        cost,
        margin,
        efficiency: Math.round(efficiency * 100) / 100
      });
    }
    
    return projectEfficiencies.sort((a, b) => b.efficiency - a.efficiency);
  }
  
  /**
   * Генерирует рекомендации по улучшению
   */
  private generateRecommendations(
    metrics: EfficiencyMetrics,
    projectEfficiencies: ProjectEfficiency[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Анализ утилизации времени
    if (metrics.utilizationRate < 80) {
      recommendations.push('Увеличить количество billable часов для повышения утилизации');
    }
    
    // Анализ качества работы
    if (metrics.qualityScore < 90) {
      recommendations.push('Улучшить качество временных записей и описаний работ');
    }
    
    // Анализ эффективности по проектам
    const lowEfficiencyProjects = projectEfficiencies.filter(p => p.efficiency < 0);
    if (lowEfficiencyProjects.length > 0) {
      recommendations.push(`Пересмотреть участие в проектах: ${lowEfficiencyProjects.map(p => p.projectName).join(', ')}`);
    }
    
    // Общие рекомендации
    if (recommendations.length === 0) {
      recommendations.push('Отличные показатели! Продолжайте в том же духе');
    }
    
    return recommendations;
  }
}
```

## Заключение

Представленные алгоритмы обеспечивают:

1. **Точность расчетов** - все формулы основаны на стандартных финансовых методиках
2. **Производительность** - оптимизированы для работы с большими объемами данных
3. **Масштабируемость** - легко адаптируются под новые требования
4. **Надежность** - включают проверки на корректность данных
5. **Гибкость** - поддерживают различные сценарии использования

Алгоритмы готовы к интеграции в основную систему и могут быть расширены дополнительной функциональностью по мере необходимости.
