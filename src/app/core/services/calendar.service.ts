import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap, timeout } from 'rxjs/operators';

export interface RussianCalendarMonth {
  month: number;
  days: string; // "1,2,3,4,5,6,7,8,11,12,18,19,25,26"
}

export interface RussianCalendarData {
  year: number;
  months: RussianCalendarMonth[];
  statistic: {
    workdays: number;
    holidays: number;
    hours40: number;
    hours36?: number;
    hours24?: number;
  };
}

export interface WorkingCalendar {
  [yearMonth: string]: number; // "2025-01": 168 (рабочие часы)
}

export interface CalendarCache {
  [year: string]: RussianCalendarData;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  // === REACTIVE STATE ===
  public workingCalendar = signal<WorkingCalendar>({});
  public loadingStatus = signal<string>('');
  public isLoading = signal<boolean>(false);

  // === КЭШИРОВАНИЕ ===
  private calendarCache: CalendarCache = {};
  private readonly CACHE_KEY = 'russian-calendar-cache';
  private readonly CACHE_EXPIRY_DAYS = 30; // Кэш действует 30 дней

  // === КОНФИГУРАЦИЯ ===
  private readonly API_BASE_URL = '/api/calendar'; // Proxy URL для обхода CORS
  private readonly FALLBACK_URL = 'https://xmlcalendar.ru/data/ru'; // Fallback для Service Worker
  private readonly STATIC_CALENDAR_URL = '/assets/data/russian-calendars.json'; // Статические данные
  private readonly START_YEAR = 2020; // Соответствует доступным статическим данным
  private readonly CURRENT_YEAR = new Date().getFullYear();
  private readonly WORKING_HOURS_PER_DAY = 8;

  constructor(private http: HttpClient) {
    this.loadCachedData();
  }

  // === ПУБЛИЧНЫЕ МЕТОДЫ ===

  /**
   * Загружает календари за все годы (2020-текущий год)
   */
  async loadAllCalendars(): Promise<WorkingCalendar> {
    this.isLoading.set(true);
    this.loadingStatus.set('Инициализация загрузки календарей...');

    try {
      // Определяем года для загрузки
      const years = this.generateYearsRange();
      this.loadingStatus.set(`Загрузка календарей за ${years.length} лет (${this.START_YEAR}-${this.CURRENT_YEAR})...`);

      // Проверяем какие года нужно загрузить (не в кэше или устарели)
      const yearsToLoad = years.filter(year => !this.isCacheValid(year));
      
      if (yearsToLoad.length === 0) {
        this.loadingStatus.set('Использование кэшированных данных...');
        const calendar = this.buildWorkingCalendarFromCache();
        this.workingCalendar.set(calendar);
        this.isLoading.set(false);
        return calendar;
      }

      // Сначала пробуем загрузить статические данные
      this.loadingStatus.set(`Загрузка статических календарей...`);
      const staticCalendars = await this.loadStaticCalendars();
      let successCount = 0;

      if (staticCalendars) {
        console.log('📊 Проверка статических данных:', {
          доступно: Object.keys(staticCalendars),
          требуется: yearsToLoad
        });
        
        yearsToLoad.forEach(year => {
          if (staticCalendars[year.toString()]) {
            this.calendarCache[year.toString()] = staticCalendars[year.toString()];
            successCount++;
            console.log(`✅ Загружен статический календарь: ${year}`);
          } else {
            console.warn(`⚠️ Отсутствует статический календарь для ${year}`);
          }
        });
        console.log(`✅ Загружено ${successCount} календарей из статических данных`);
      }

      // Загружаем оставшиеся года через API если статические данные неполные
      const remainingYears = yearsToLoad.filter(year => !this.calendarCache[year.toString()]);
      
      if (remainingYears.length > 0) {
        this.loadingStatus.set(`Загрузка ${remainingYears.length} календарей из API...`);
        const calendarRequests = remainingYears.map(year => this.loadYearCalendar(year));

        const results = await Promise.allSettled(calendarRequests);
        let errorCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const year = remainingYears[index];
            this.calendarCache[year.toString()] = result.value;
            successCount++;
          } else {
            errorCount++;
            console.warn(`Не удалось загрузить календарь для ${remainingYears[index]} года:`, 
              result.status === 'rejected' ? result.reason : 'Неизвестная ошибка');
          }
        });
      }

      // Сохраняем обновленный кэш
      this.saveCacheToStorage();

      // Строим финальный календарь
      const workingCalendar = this.buildWorkingCalendarFromCache();
      this.workingCalendar.set(workingCalendar);

      const totalErrorCount = yearsToLoad.length - successCount;
      this.loadingStatus.set(
        `✅ Загружено: ${successCount} календарей, ошибок: ${totalErrorCount}`
      );

      console.log(`📅 Календари загружены:`, {
        успешно: successCount,
        ошибок: totalErrorCount,
        всего_месяцев: Object.keys(workingCalendar).length,
        период: `${this.START_YEAR}-${this.CURRENT_YEAR}`
      });

      this.isLoading.set(false);
      return workingCalendar;

    } catch (error) {
      console.error('Критическая ошибка загрузки календарей:', error);
      this.loadingStatus.set('❌ Ошибка загрузки календарей');
      this.isLoading.set(false);
      
      // В случае ошибки возвращаем кэш (если есть) или дефолтный календарь
      const fallbackCalendar = Object.keys(this.calendarCache).length > 0
        ? this.buildWorkingCalendarFromCache()
        : this.generateDefaultCalendar();
        
      this.workingCalendar.set(fallbackCalendar);
      return fallbackCalendar;
    }
  }

  /**
   * Загружает календарь конкретного года с fallback
   */
  private loadYearCalendar(year: number): Promise<RussianCalendarData | null> {
    return new Promise((resolve) => {
      // Сначала пробуем через proxy
      const proxyUrl = `${this.API_BASE_URL}/${year}/calendar.json`;
      
      this.tryLoadFromUrl(proxyUrl, year).then((data) => {
        if (data) {
          resolve(data);
        } else {
          // Fallback: пробуем прямой URL (для Service Worker в PWA)
          console.warn(`Proxy не работает для ${year}, пробуем прямой URL...`);
          const directUrl = `${this.FALLBACK_URL}/${year}/calendar.json`;
          
          this.tryLoadFromUrl(directUrl, year).then((fallbackData) => {
            resolve(fallbackData);
          });
        }
      });
    });
  }

  /**
   * Попытка загрузки с конкретного URL
   */
  private tryLoadFromUrl(url: string, year: number): Promise<RussianCalendarData | null> {
    return new Promise((resolve) => {
      this.http.get<RussianCalendarData>(url).pipe(
        timeout(10000), // 10 секунд таймаут
        catchError((error) => {
          console.warn(`Ошибка загрузки календаря ${year} с URL ${url}:`, error);
          return of(null);
        })
      ).subscribe({
        next: (data) => {
          if (data && data.year === year && data.months?.length === 12) {
            console.log(`✅ Календарь ${year} загружен с ${url}`);
            resolve(data);
          } else {
            console.warn(`Некорректные данные для ${year} года с URL ${url}`);
            resolve(null);
          }
        },
        error: () => resolve(null)
      });
    });
  }

  /**
   * Загружает статические календарные данные из assets
   */
  private loadStaticCalendars(): Promise<{ [year: string]: RussianCalendarData } | null> {
    return new Promise((resolve) => {
      this.http.get<{ [year: string]: RussianCalendarData }>(this.STATIC_CALENDAR_URL).pipe(
        timeout(5000),
        catchError((error) => {
          console.warn('Ошибка загрузки статических календарей:', error);
          return of(null);
        })
      ).subscribe({
        next: (data) => {
          if (data) {
            console.log(`✅ Статические календари загружены: ${Object.keys(data).length} лет`);
            resolve(data);
          } else {
            console.warn('Пустые статические данные календарей');
            resolve(null);
          }
        },
        error: () => {
          console.warn('Ошибка парсинга статических календарей');
          resolve(null);
        }
      });
    });
  }

  /**
   * Получить рабочие часы для конкретного месяца
   */
  getWorkingHoursForMonth(year: number, month: number): number {
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    return this.workingCalendar()[key] || this.getDefaultHoursForMonth(month);
  }

  /**
   * Получить рабочие часы для диапазона дат
   */
  getWorkingHoursForPeriod(startDate: Date, endDate: Date): number {
    let totalHours = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const hoursInMonth = this.getWorkingHoursForMonth(year, month);
      
      // Пропорционально считаем дни если период частичный
      const daysInMonth = new Date(year, month, 0).getDate();
      const workingDaysInMonth = Math.floor(hoursInMonth / this.WORKING_HOURS_PER_DAY);
      
      totalHours += hoursInMonth; // Упрощенно, можно доработать для точного подсчета
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return totalHours;
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===

  private generateYearsRange(): number[] {
    const years: number[] = [];
    for (let year = this.START_YEAR; year <= this.CURRENT_YEAR; year++) {
      years.push(year);
    }
    return years;
  }

  private buildWorkingCalendarFromCache(): WorkingCalendar {
    const calendar: WorkingCalendar = {};
    
    Object.entries(this.calendarCache).forEach(([year, data]) => {
      if (data && data.months) {
        data.months.forEach((monthData) => {
          const monthKey = `${year}-${monthData.month.toString().padStart(2, '0')}`;
          const workingHours = this.calculateWorkingHoursForMonth(data, monthData);
          calendar[monthKey] = workingHours;
        });
      }
    });

    return calendar;
  }

  private calculateWorkingHoursForMonth(yearData: RussianCalendarData, monthData: RussianCalendarMonth): number {
    // Получаем общее количество дней в месяце
    const year = yearData.year;
    const month = monthData.month;
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    
    // Парсим выходные дни из строки
    const holidays = monthData.days.split(',').map(day => {
      // Убираем специальные символы (* + и т.д.)
      return parseInt(day.replace(/[*+]/g, ''));
    }).filter(day => !isNaN(day));

    // Рабочие дни = всего дней - выходные
    const workingDays = totalDaysInMonth - holidays.length;
    
    // Рабочие часы = рабочие дни * 8 часов
    const workingHours = Math.max(0, workingDays * this.WORKING_HOURS_PER_DAY);
    
    return workingHours;
  }

  private generateDefaultCalendar(): WorkingCalendar {
    const calendar: WorkingCalendar = {};
    const currentYear = new Date().getFullYear();
    
    // Генерируем примерный календарь для текущего года
    for (let month = 1; month <= 12; month++) {
      const key = `${currentYear}-${month.toString().padStart(2, '0')}`;
      calendar[key] = this.getDefaultHoursForMonth(month);
    }
    
    return calendar;
  }

  private getDefaultHoursForMonth(month: number): number {
    // Примерное количество рабочих часов по месяцам (исходя из рабочих дней)
    const defaultHours: { [key: number]: number } = {
      1: 164,  // январь (много праздников)
      2: 160,  // февраль (короткий месяц)
      3: 168,  // март (8 марта выходной)
      4: 168,  // апрель
      5: 152,  // май (много праздников: 1, 9 мая)
      6: 168,  // июнь
      7: 176,  // июль
      8: 176,  // август
      9: 168,  // сентябрь
      10: 184, // октябрь (длинный рабочий месяц)
      11: 160, // ноябрь (4 ноября выходной)
      12: 168  // декабрь
    };
    
    return defaultHours[month] || 168;
  }

  // === КЭШИРОВАНИЕ ===

  private isCacheValid(year: number): boolean {
    const cached = this.calendarCache[year.toString()];
    if (!cached) return false;
    
    const cacheTimestamp = localStorage.getItem(`${this.CACHE_KEY}-timestamp-${year}`);
    if (!cacheTimestamp) return false;
    
    const daysSinceCache = (Date.now() - parseInt(cacheTimestamp)) / (1000 * 60 * 60 * 24);
    return daysSinceCache < this.CACHE_EXPIRY_DAYS;
  }

  private loadCachedData(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.calendarCache = JSON.parse(cached);
        
        // Загружаем существующий календарь из кэша
        if (Object.keys(this.calendarCache).length > 0) {
          const calendar = this.buildWorkingCalendarFromCache();
          this.workingCalendar.set(calendar);
        }
      }
    } catch (error) {
      console.warn('Ошибка загрузки кэша календарей:', error);
      this.calendarCache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.calendarCache));
      
      // Сохраняем временные метки для каждого года
      Object.keys(this.calendarCache).forEach(year => {
        localStorage.setItem(`${this.CACHE_KEY}-timestamp-${year}`, Date.now().toString());
      });
    } catch (error) {
      console.warn('Ошибка сохранения кэша календарей:', error);
    }
  }

  // === УТИЛИТЫ ===

  /**
   * Очистить кэш календарей
   */
  clearCache(): void {
    this.calendarCache = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Кэш календарей очищен');
  }

  /**
   * Получить статистику по календарю
   */
  getCalendarStatistics(): {
    yearsLoaded: number;
    monthsLoaded: number;
    totalWorkingHours: number;
    coveragePeriod: string;
  } {
    const calendar = this.workingCalendar();
    const months = Object.keys(calendar);
    const years = [...new Set(months.map(key => key.split('-')[0]))];
    const totalHours = Object.values(calendar).reduce((sum, hours) => sum + hours, 0);
    
    const sortedYears = years.sort();
    const period = sortedYears.length > 1 
      ? `${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}`
      : sortedYears[0] || 'Нет данных';

    return {
      yearsLoaded: years.length,
      monthsLoaded: months.length,
      totalWorkingHours: totalHours,
      coveragePeriod: period
    };
  }
}

// === УТИЛИТЫ ===
