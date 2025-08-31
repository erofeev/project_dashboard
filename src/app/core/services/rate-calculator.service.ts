import { Injectable } from '@angular/core';

export interface UserRateEntry {
  userName: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  grossPerMonth?: number;
  hourlyRate?: number;
  currency?: string;
  isActive?: boolean;
}

export interface RateCalculationResult {
  userName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalCost: number;
  totalHours: number;
  currency: string;
  breakdown: Array<{
    fromDate: Date;
    toDate: Date;
    rateType: 'monthly' | 'hourly';
    rate: number;
    workingHours: number;
    cost: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class RateCalculatorService {

  constructor() {}

  /**
   * Получить актуальную ставку пользователя на конкретную дату
   */
  getUserRateForDate(
    userRates: UserRateEntry[], 
    userName: string, 
    targetDate: Date | string
  ): UserRateEntry | null {
    
    const date = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    
    // Находим все ставки пользователя
    const userRateHistory = userRates.filter(rate => 
      rate.userName.toLowerCase() === userName.toLowerCase()
    );
    
    if (userRateHistory.length === 0) {
      console.warn(`Ставки для пользователя ${userName} не найдены`);
      return null;
    }
    
    // Ищем подходящую ставку по дате
    const applicableRate = userRateHistory.find(rate => {
      const startDate = new Date(rate.startDate);
      const endDate = rate.endDate ? new Date(rate.endDate) : null;
      
      const isAfterStart = date >= startDate;
      const isBeforeEnd = !endDate || date <= endDate;
      
      return isAfterStart && isBeforeEnd;
    });
    
    if (!applicableRate) {
      console.warn(`Активная ставка для ${userName} на дату ${date.toISOString().split('T')[0]} не найдена`);
      return null;
    }
    
    return applicableRate;
  }

  /**
   * Рассчитать стоимость работы пользователя за период
   * с учетом изменений ставок и рабочего календаря
   */
  calculateUserCostForPeriod(
    userRates: UserRateEntry[],
    userName: string,
    startDate: Date | string,
    endDate: Date | string,
    workingCalendar: { [monthKey: string]: number }
  ): RateCalculationResult | null {
    
    const periodStart = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const periodEnd = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // Получаем все ставки пользователя в хронологическом порядке
    const userRateHistory = userRates
      .filter(rate => rate.userName.toLowerCase() === userName.toLowerCase())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    if (userRateHistory.length === 0) {
      console.warn(`История ставок для ${userName} не найдена`);
      return null;
    }
    
    const breakdown: RateCalculationResult['breakdown'] = [];
    let totalCost = 0;
    let totalHours = 0;
    let currentDate = new Date(periodStart);
    
    while (currentDate <= periodEnd) {
      // Находим актуальную ставку для текущего периода
      const currentRate = this.getUserRateForDate(userRates, userName, currentDate);
      
      if (!currentRate) {
        // Пропускаем период без ставки
        currentDate = this.getNextMonth(currentDate);
        continue;
      }
      
      // Определяем границы применения текущей ставки
      const rateStartDate = new Date(Math.max(
        new Date(currentRate.startDate).getTime(),
        periodStart.getTime()
      ));
      
      const rateEndDate = new Date(Math.min(
        currentRate.endDate ? new Date(currentRate.endDate).getTime() : periodEnd.getTime(),
        periodEnd.getTime()
      ));
      
      // Рассчитываем стоимость для этого периода
      const periodCost = this.calculateCostForDateRange(
        rateStartDate, 
        rateEndDate, 
        currentRate, 
        workingCalendar
      );
      
      if (periodCost) {
        breakdown.push({
          fromDate: rateStartDate,
          toDate: rateEndDate,
          rateType: currentRate.grossPerMonth ? 'monthly' : 'hourly',
          rate: currentRate.grossPerMonth || currentRate.hourlyRate || 0,
          workingHours: periodCost.hours,
          cost: periodCost.cost
        });
        
        totalCost += periodCost.cost;
        totalHours += periodCost.hours;
      }
      
      // Переходим к следующему периоду
      currentDate = new Date(rateEndDate.getTime() + 24 * 60 * 60 * 1000); // +1 день
    }
    
    return {
      userName,
      period: {
        startDate: periodStart,
        endDate: periodEnd
      },
      totalCost: Math.round(totalCost * 100) / 100, // Округляем до копеек
      totalHours: Math.round(totalHours * 100) / 100,
      currency: userRateHistory[0].currency || 'RUB',
      breakdown
    };
  }

  /**
   * Получить список всех уникальных пользователей с их текущими ставками
   */
  getCurrentUserRates(userRates: UserRateEntry[]): Array<UserRateEntry & { isHistorical: boolean }> {
    const userMap = new Map<string, UserRateEntry>();
    
    // Группируем по пользователям и находим текущие ставки
    userRates.forEach(rate => {
      const userName = rate.userName.toLowerCase();
      
      if (rate.isActive || (!rate.endDate && !userMap.has(userName))) {
        userMap.set(userName, rate);
      }
    });
    
    // Конвертируем в массив с дополнительной информацией
    return Array.from(userMap.values()).map(rate => {
      const hasHistory = userRates.filter(r => 
        r.userName.toLowerCase() === rate.userName.toLowerCase()
      ).length > 1;
      
      return {
        ...rate,
        isHistorical: hasHistory
      };
    });
  }

  /**
   * Приватные вспомогательные методы
   */
  private calculateCostForDateRange(
    startDate: Date,
    endDate: Date,
    rate: UserRateEntry,
    workingCalendar: { [monthKey: string]: number }
  ): { cost: number; hours: number } | null {
    
    if (rate.grossPerMonth) {
      // Месячный оклад - пропорционально рабочим дням
      return this.calculateMonthlyCost(startDate, endDate, rate.grossPerMonth, workingCalendar);
    } else if (rate.hourlyRate) {
      // Почасовая ставка
      return this.calculateHourlyCost(startDate, endDate, rate.hourlyRate, workingCalendar);
    }
    
    console.warn('Не указана ни месячная, ни почасовая ставка для:', rate.userName);
    return null;
  }

  private calculateMonthlyCost(
    startDate: Date,
    endDate: Date,
    monthlyGross: number,
    workingCalendar: { [monthKey: string]: number }
  ): { cost: number; hours: number } {
    
    let totalCost = 0;
    let totalHours = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthlyHours = workingCalendar[monthKey] || 168; // Дефолт 168 часов
      
      // Определяем рабочие дни в месяце для пропорции
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const periodStartInMonth = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
      const periodEndInMonth = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
      
      // Пропорциональная часть месяца
      const totalDaysInMonth = monthEnd.getDate();
      const workedDays = this.getWorkingDaysBetweenDates(periodStartInMonth, periodEndInMonth);
      const proportion = workedDays / totalDaysInMonth;
      
      const monthCost = monthlyGross * proportion;
      const monthHours = monthlyHours * proportion;
      
      totalCost += monthCost;
      totalHours += monthHours;
      
      // Переход к следующему месяцу
      currentDate = this.getNextMonth(currentDate);
    }
    
    return { cost: totalCost, hours: totalHours };
  }

  private calculateHourlyCost(
    startDate: Date,
    endDate: Date,
    hourlyRate: number,
    workingCalendar: { [monthKey: string]: number }
  ): { cost: number; hours: number } {
    
    let totalHours = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthlyHours = workingCalendar[monthKey] || 168;
      
      // Рассчитываем пропорцию как для месячного оклада
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const periodStartInMonth = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
      const periodEndInMonth = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
      
      const totalDaysInMonth = monthEnd.getDate();
      const workedDays = this.getWorkingDaysBetweenDates(periodStartInMonth, periodEndInMonth);
      const proportion = workedDays / totalDaysInMonth;
      
      totalHours += monthlyHours * proportion;
      
      currentDate = this.getNextMonth(currentDate);
    }
    
    const totalCost = totalHours * hourlyRate;
    return { cost: totalCost, hours: totalHours };
  }

  private getWorkingDaysBetweenDates(startDate: Date, endDate: Date): number {
    let count = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Простой подсчет дней (можно улучшить с учетом выходных)
      count++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }

  private getNextMonth(date: Date): Date {
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    return nextMonth;
  }

  /**
   * Форматирование валюты для отображения
   */
  formatCurrency(amount: number, currency: string = 'RUB'): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Получить сводку по всем пользователям на определенную дату
   */
  getUserRatesSummaryForDate(
    userRates: UserRateEntry[],
    targetDate: Date | string = new Date()
  ): Array<{
    userName: string;
    rateType: 'monthly' | 'hourly';
    rate: number;
    currency: string;
    hasHistory: boolean;
  }> {
    
    const uniqueUsers = [...new Set(userRates.map(r => r.userName))];
    
    return uniqueUsers.map(userName => {
      const currentRate = this.getUserRateForDate(userRates, userName, targetDate);
      const hasHistory = userRates.filter(r => r.userName === userName).length > 1;
      
      if (!currentRate) {
        return {
          userName,
          rateType: 'monthly' as const,
          rate: 0,
          currency: 'RUB',
          hasHistory
        };
      }
      
      return {
        userName,
        rateType: currentRate.grossPerMonth ? 'monthly' as const : 'hourly' as const,
        rate: currentRate.grossPerMonth || currentRate.hourlyRate || 0,
        currency: currentRate.currency || 'RUB',
        hasHistory
      };
    }).sort((a, b) => b.rate - a.rate); // Сортируем по убыванию ставки
  }
}
