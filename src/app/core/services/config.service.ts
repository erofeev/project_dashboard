import { Injectable, signal, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// === ИНТЕРФЕЙСЫ КОНФИГУРАЦИИ (аналог Config листа в Excel) ===

export interface ERMConfig {
  baseUrl: string;        // B2 в Excel
  apiKey: string;         // B3 в Excel  
  startDate: string;      // B4 в Excel
  endDate: string;        // B5 в Excel
  projectId?: string;     // B6 в Excel
  userFilter: string[];   // A9+ в Excel
}

export interface UserRate {
  userName: string;         // A в Excel
  startDate: Date | string; // B в Excel - дата начала действия ставки  
  endDate?: Date | string | null;  // дата окончания (null = текущая)
  grossPerMonth?: number;   // Gross per month колонка (приоритет)
  hourlyRate?: number;      // Rate колонка (фоллбэк)
  currency?: string;        // валюта (по умолчанию RUB)
  isActive?: boolean;       // активная ли ставка
}

export interface WorkingCalendar {
  [monthKey: string]: number; // "2025-01" -> 160 часов
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  // ВНИМАНИЕ: Не импортируем PouchDBService здесь, чтобы избежать циклических зависимостей
  // Календарь теперь получается напрямую из PouchDB через отдельные методы
  
  // === REACTIVE CONFIGURATION ===
  private ermConfigSubject = new BehaviorSubject<ERMConfig>(this.getDefaultERMConfig());
  public ermConfig$ = this.ermConfigSubject.asObservable();
  public ermConfig = signal<ERMConfig>(this.getDefaultERMConfig());

  private userRatesSubject = new BehaviorSubject<UserRate[]>([]);
  public userRates$ = this.userRatesSubject.asObservable();
  public userRates = signal<UserRate[]>([]);

  // КАЛЕНДАРЬ ПЕРЕНЕСЕН В PouchDB - ЭТИ ПОЛЯ ОСТАВЛЕНЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
  private workingCalendarSubject = new BehaviorSubject<WorkingCalendar>({});
  public workingCalendar$ = this.workingCalendarSubject.asObservable();
  public workingCalendar = signal<WorkingCalendar>({});

  // === ЛОКАЛЬНОЕ ХРАНЕНИЕ КЛЮЧИ ===
  private readonly STORAGE_KEYS = {
    ERM_CONFIG: 'erm_config',
    USER_RATES: 'user_rates',
    WORKING_CALENDAR: 'working_calendar'
  };

  constructor() {
    this.loadFromLocalStorage();
  }

  // === ERM КОНФИГУРАЦИЯ ===
  
  private getDefaultERMConfig(): ERMConfig {
    return {
      baseUrl: 'https://easyredmine.awara.pro', // Пользовательский URL (внутри ERM сервис заменит на прокси)
      apiKey: '763c9fa14fcc0343773389494e8ba3004ef3cd65', // Реальный API key
      startDate: this.getDateDaysAgo(30), // 30 дней назад
      endDate: this.getTodayDate(),        // сегодня
      projectId: '',
      userFilter: [] // Пустый список пользователей
    };
  }

  public getERMConfig(): ERMConfig {
    return this.ermConfig();
  }

  public updateERMConfig(config: Partial<ERMConfig>): void {
    const currentConfig = this.ermConfig();
    const newConfig = { ...currentConfig, ...config };
    
    this.ermConfig.set(newConfig);
    this.ermConfigSubject.next(newConfig);
    this.saveToLocalStorage(this.STORAGE_KEYS.ERM_CONFIG, newConfig);
  }

  public addUserToFilter(userName: string): void {
    const currentConfig = this.ermConfig();
    if (!currentConfig.userFilter.includes(userName)) {
      const updatedFilter = [...currentConfig.userFilter, userName];
      this.updateERMConfig({ userFilter: updatedFilter });
    }
  }

  public removeUserFromFilter(userName: string): void {
    const currentConfig = this.ermConfig();
    const updatedFilter = currentConfig.userFilter.filter(user => user !== userName);
    this.updateERMConfig({ userFilter: updatedFilter });
  }

  // === ПОЛЬЗОВАТЕЛЬСКИЕ СТАВКИ ===
  
  public getUserRates(): UserRate[] {
    return this.userRates();
  }

  public updateUserRates(rates: UserRate[]): void {
    this.userRates.set(rates);
    this.userRatesSubject.next(rates);
    this.saveToLocalStorage(this.STORAGE_KEYS.USER_RATES, rates);
  }

  public addUserRate(rate: UserRate): void {
    const currentRates = this.userRates();
    const updatedRates = [...currentRates, rate];
    this.updateUserRates(updatedRates);
  }

  public removeUserRate(index: number): void {
    const currentRates = this.userRates();
    const updatedRates = currentRates.filter((_, i) => i !== index);
    this.updateUserRates(updatedRates);
  }

  /**
   * Получает актуальную ставку для пользователя на дату (аналог GetApplicableRatesForUserAndDate в VBA)
   */
  public getApplicableRatesForUserAndDate(userName: string, entryDate: Date): [number, number] {
    const rates = this.userRates();
    const userRates = rates.filter(rate => rate.userName === userName);
    
    if (userRates.length === 0) {
      return [0, 0]; // [grossPerMonth, hourlyRate]
    }

    // Находим последнюю дату начала действия ставки, которая <= entryDate
    let bestRate: UserRate | null = null;
    let bestDate = new Date('1900-01-01');

    for (const rate of userRates) {
      const rateStartDate = new Date(rate.startDate);
      const rateEndDate = rate.endDate ? new Date(rate.endDate) : null;
      
      // Проверяем что дата входит в диапазон действия ставки
      const isAfterStart = rateStartDate <= entryDate;
      const isBeforeEnd = !rateEndDate || entryDate <= rateEndDate;
      
      if (isAfterStart && isBeforeEnd && rateStartDate > bestDate) {
        bestDate = rateStartDate;
        bestRate = rate;
      }
    }

    return bestRate ? [bestRate.grossPerMonth || 0, bestRate.hourlyRate || 0] : [0, 0];
  }

  // === ПРОИЗВОДСТВЕННЫЙ КАЛЕНДАРЬ ===
  // ⚠️ DEPRECATED: Календарь теперь хранится в PouchDB как системные данные
  // Используйте PouchDBService.getSystemCalendar() вместо этих методов
  
  /**
   * @deprecated Используйте PouchDBService.getSystemCalendar().workingCalendar
   */
  public getWorkingCalendar(): WorkingCalendar {
    console.warn('⚠️ getWorkingCalendar() deprecated. Используйте PouchDBService.getSystemCalendar()');
    return this.workingCalendar();
  }

  /**
   * @deprecated Календарь теперь системный в PouchDB. Используйте PouchDBService.updateSystemCalendar()
   */
  public updateWorkingCalendar(calendar: WorkingCalendar): void {
    console.warn('⚠️ updateWorkingCalendar() deprecated. Используйте PouchDBService.updateSystemCalendar()');
    this.workingCalendar.set(calendar);
    this.workingCalendarSubject.next(calendar);
    // НЕ сохраняем в localStorage - данные теперь в PouchDB
  }

  /**
   * @deprecated Используйте PouchDBService.getWorkingHoursForMonth()
   */
  public getWorkingHoursForMonth(entryDate: Date): number {
    console.warn('⚠️ getWorkingHoursForMonth() deprecated. Используйте PouchDBService.getWorkingHoursForMonth()');
    const monthKey = this.formatDateToMonthKey(entryDate);
    const calendar = this.workingCalendar();
    
    return calendar[monthKey] || 164; // Значение по умолчанию из VBA
  }

  /**
   * @deprecated Календарь теперь системный в PouchDB
   */
  public setWorkingHoursForMonth(month: string, hours: number): void {
    console.warn('⚠️ setWorkingHoursForMonth() deprecated. Календарь теперь системный в PouchDB');
    const calendar = { ...this.workingCalendar() };
    calendar[month] = hours;
    this.updateWorkingCalendar(calendar);
  }

  // === РАСЧЕТЫ (аналог VBA логики) ===
  
  /**
   * Гибридный расчет стоимости записи времени (аналог Step 4 в VBA)
   */
  public calculateEntryCost(userName: string, entryDate: Date, hours: number): {
    actualHourlyRate: number;
    totalCost: number;
  } {
    const [monthlySalary, fixedHourlyRate] = this.getApplicableRatesForUserAndDate(userName, entryDate);
    
    let actualHourlyRate: number;
    
    if (monthlySalary > 0) {
      // ЛОГИКА 1: Расчет на основе МЕСЯЧНОГО ОКЛАДА (аналог VBA строки 377-385)
      const hoursInMonth = this.getWorkingHoursForMonth(entryDate);
      actualHourlyRate = hoursInMonth > 0 ? monthlySalary / hoursInMonth : 0;
    } else {
      // ЛОГИКА 2: Используем ФИКСИРОВАННЫЙ ПОЧАСОВОЙ РЕЙТ (аналог VBA строки 387-389)
      actualHourlyRate = fixedHourlyRate;
    }
    
    return {
      actualHourlyRate,
      totalCost: hours * actualHourlyRate
    };
  }

  // === ЛОКАЛЬНОЕ ХРАНЕНИЕ ===
  
  private loadFromLocalStorage(): void {
    try {
      // Загружаем ERM конфигурацию
      const savedErmConfig = localStorage.getItem(this.STORAGE_KEYS.ERM_CONFIG);
      if (savedErmConfig) {
        const config = JSON.parse(savedErmConfig);
        this.ermConfig.set(config);
        this.ermConfigSubject.next(config);
      }

      // Загружаем ставки пользователей
      const savedRates = localStorage.getItem(this.STORAGE_KEYS.USER_RATES);
      if (savedRates) {
        const rates = JSON.parse(savedRates).map((rate: any) => ({
          ...rate,
          startDate: typeof rate.startDate === 'string' ? rate.startDate : new Date(rate.startDate || rate.dateFrom).toISOString().split('T')[0],
          endDate: rate.endDate ? (typeof rate.endDate === 'string' ? rate.endDate : new Date(rate.endDate).toISOString().split('T')[0]) : null
        }));
        this.userRates.set(rates);
        this.userRatesSubject.next(rates);
      }

      // Загружаем календарь
      const savedCalendar = localStorage.getItem(this.STORAGE_KEYS.WORKING_CALENDAR);
      if (savedCalendar) {
        const calendar = JSON.parse(savedCalendar);
        this.workingCalendar.set(calendar);
        this.workingCalendarSubject.next(calendar);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error);
    }
  }

  private saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
    }
  }

  // === УТИЛИТЫ ===
  
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private formatDateToMonthKey(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // === ВАЛИДАЦИЯ ===
  
  public validateERMConfig(config: ERMConfig): string[] {
    const errors: string[] = [];
    
    if (!config.baseUrl) errors.push('Base URL обязателен');
    if (!config.apiKey) errors.push('API ключ обязателен');
    if (!config.startDate) errors.push('Дата начала обязательна');
    if (!config.endDate) errors.push('Дата окончания обязательна');
    
    // Проверка корректности URL
    try {
      new URL(config.baseUrl);
    } catch {
      errors.push('Некорректный URL');
    }
    
    // Проверка дат
    if (config.startDate && config.endDate) {
      if (new Date(config.startDate) > new Date(config.endDate)) {
        errors.push('Дата начала должна быть меньше даты окончания');
      }
    }
    
    return errors;
  }

  public isConfigurationValid(): boolean {
    const config = this.ermConfig();
    return this.validateERMConfig(config).length === 0;
  }

  // === ЭКСПОРТ/ИМПОРТ (для совместимости с Excel) ===
  
  public exportConfiguration(): any {
    return {
      ermConfig: this.ermConfig(),
      userRates: this.userRates(),
      workingCalendar: this.workingCalendar(),
      exportDate: new Date().toISOString()
    };
  }

  public importConfiguration(data: any): boolean {
    try {
      if (data.ermConfig) this.updateERMConfig(data.ermConfig);
      if (data.userRates) this.updateUserRates(data.userRates);
      if (data.workingCalendar) this.updateWorkingCalendar(data.workingCalendar);
      
      return true;
    } catch (error) {
      console.error('Ошибка импорта конфигурации:', error);
      return false;
    }
  }
}
