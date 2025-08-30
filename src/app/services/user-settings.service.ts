import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserSettings {
  // UI настройки
  ui: {
    theme: 'light' | 'dark';
    language: 'ru' | 'en';
    sidebarCollapsed: boolean;
    animationsEnabled: boolean;
    transparency: {
      forms: number; // 0-100
      widgets: number; // 0-100
      sidebars: number; // 0-100
    };
    blur: {
      forms: number; // 0-50
      widgets: number; // 0-50
      sidebars: number; // 0-50
    };
  };
  
  // Настройки 3D ландшафта
  landscape: {
    waveAmplitude: number;
    animationSpeed: number;
    pointSize: number;
    gridSize: number;
    colorScheme: 'wone-it' | 'sunset' | 'ocean' | 'forest' | 'custom';
    enabled: boolean;
  };
  
  // Настройки фильтров
  filters: {
    projects: {
      status: string[];
      priority: string[];
      dateRange: {
        start: string | null;
        end: string | null;
      };
    };
    employees: {
      department: string[];
      role: string[];
      availability: string[];
    };
    invoices: {
      status: string[];
      dateRange: {
        start: string | null;
        end: string | null;
      };
      amountRange: {
        min: number | null;
        max: number | null;
      };
    };
    analytics: {
      timeRange: 'week' | 'month' | 'quarter' | 'year';
      chartType: 'line' | 'bar' | 'pie' | 'area';
      showTrends: boolean;
    };
  };
  
  // Настройки уведомлений
  notifications: {
    email: boolean;
    push: boolean;
    projectUpdates: boolean;
    invoiceReminders: boolean;
    systemAlerts: boolean;
  };
  
  // Настройки отображения
  display: {
    dashboardLayout: 'grid' | 'list' | 'compact';
    tablePageSize: number;
    showAvatars: boolean;
    showStatusIcons: boolean;
    compactMode: boolean;
  };
  
  // Настройки производительности
  performance: {
    enableVirtualScrolling: boolean;
    enableLazyLoading: boolean;
    cacheTimeout: number;
    maxConcurrentRequests: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private readonly STORAGE_KEY = 'wone_it_user_settings';
  private settingsSubject: BehaviorSubject<UserSettings>;
  public settings$: Observable<UserSettings>;

  constructor() {
    // Загружаем настройки из localStorage или используем значения по умолчанию
    const savedSettings = this.loadFromStorage();
    this.settingsSubject = new BehaviorSubject<UserSettings>(savedSettings);
    this.settings$ = this.settingsSubject.asObservable();
    
    // Подписываемся на изменения и сохраняем в localStorage
    this.settings$.subscribe(settings => {
      this.saveToStorage(settings);
    });
  }

  // Получить текущие настройки
  getSettings(): UserSettings {
    return this.settingsSubject.value;
  }

  // Обновить настройки
  updateSettings(updates: Partial<UserSettings>): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings = this.deepMerge(currentSettings, updates);
    this.settingsSubject.next(newSettings);
  }

  // Обновить конкретную секцию настроек
  updateSection<K extends keyof UserSettings>(
    section: K, 
    updates: Partial<UserSettings[K]>
  ): void {
    const currentSettings = this.settingsSubject.value;
    const sectionSettings = currentSettings[section];
    const updatedSection = { ...sectionSettings, ...updates };
    const newSettings = { ...currentSettings, [section]: updatedSection };
    this.settingsSubject.next(newSettings);
  }

  // Сбросить настройки к значениям по умолчанию
  resetToDefaults(): void {
    const defaultSettings = this.getDefaultSettings();
    this.settingsSubject.next(defaultSettings);
  }

  // Экспорт настроек
  exportSettings(): string {
    const settings = this.settingsSubject.value;
    return JSON.stringify(settings, null, 2);
  }

  // Импорт настроек
  importSettings(jsonString: string): boolean {
    try {
      const settings = JSON.parse(jsonString);
      if (this.validateSettings(settings)) {
        this.settingsSubject.next(settings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка импорта настроек:', error);
      return false;
    }
  }

  // Загрузить настройки из localStorage
  private loadFromStorage(): UserSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.validateSettings(parsed)) {
          return this.mergeWithDefaults(parsed);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек из localStorage:', error);
    }
    return this.getDefaultSettings();
  }

  // Сохранить настройки в localStorage
  private saveToStorage(settings: UserSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Ошибка сохранения настроек в localStorage:', error);
    }
  }

  // Получить настройки по умолчанию
  private getDefaultSettings(): UserSettings {
    return {
      ui: {
        theme: 'light',
        language: 'ru',
        sidebarCollapsed: false,
        animationsEnabled: true,
        transparency: {
          forms: 75, // 75% прозрачность для форм
          widgets: 88, // 88% прозрачность для виджетов
          sidebars: 85 // 85% прозрачность для сайдбаров
        },
        blur: {
          forms: 4, // Минимальный блюр для форм
          widgets: 4, // Минимальный блюр для виджетов
          sidebars: 25 // Стандартный блюр для сайдбаров
        }
      },
      landscape: {
        waveAmplitude: 15,
        animationSpeed: 0.3, // Сделали медленнее по умолчанию
        pointSize: 2,
        gridSize: 100,
        colorScheme: 'wone-it',
        enabled: true
      },
      filters: {
        projects: {
          status: [],
          priority: [],
          dateRange: { start: null, end: null }
        },
        employees: {
          department: [],
          role: [],
          availability: []
        },
        invoices: {
          status: [],
          dateRange: { start: null, end: null },
          amountRange: { min: null, max: null }
        },
        analytics: {
          timeRange: 'month',
          chartType: 'line',
          showTrends: true
        }
      },
      notifications: {
        email: true,
        push: true,
        projectUpdates: true,
        invoiceReminders: true,
        systemAlerts: false
      },
      display: {
        dashboardLayout: 'grid',
        tablePageSize: 20,
        showAvatars: true,
        showStatusIcons: true,
        compactMode: false
      },
      performance: {
        enableVirtualScrolling: true,
        enableLazyLoading: true,
        cacheTimeout: 300000, // 5 минут
        maxConcurrentRequests: 5
      }
    };
  }

  // Валидация настроек
  private validateSettings(settings: any): settings is UserSettings {
    // Простая валидация структуры
    return settings && 
           typeof settings === 'object' &&
           'ui' in settings &&
           'landscape' in settings &&
           'filters' in settings;
  }

  // Слияние с настройками по умолчанию
  private mergeWithDefaults(settings: Partial<UserSettings>): UserSettings {
    const defaults = this.getDefaultSettings();
    return this.deepMerge(defaults, settings);
  }

  // Глубокое слияние объектов
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // Утилитарные методы для быстрого доступа к часто используемым настройкам
  getTheme(): 'light' | 'dark' {
    return this.settingsSubject.value.ui.theme;
  }

  getLanguage(): 'ru' | 'en' {
    return this.settingsSubject.value.ui.language;
  }

  getTransparency(): { forms: number; widgets: number; sidebars: number } {
    return this.settingsSubject.value.ui.transparency;
  }

  getBlur(): { forms: number; widgets: number; sidebars: number } {
    return this.settingsSubject.value.ui.blur;
  }

  isLandscapeEnabled(): boolean {
    return this.settingsSubject.value.landscape.enabled;
  }

  getLandscapeSettings() {
    return this.settingsSubject.value.landscape;
  }

  // Методы для работы с фильтрами
  getProjectFilters() {
    return this.settingsSubject.value.filters.projects;
  }

  getEmployeeFilters() {
    return this.settingsSubject.value.filters.employees;
  }

  getInvoiceFilters() {
    return this.settingsSubject.value.filters.invoices;
  }

  getAnalyticsFilters() {
    return this.settingsSubject.value.filters.analytics;
  }

  // Очистка всех фильтров
  clearAllFilters(): void {
    const currentSettings = this.settingsSubject.value;
    const newSettings: UserSettings = {
      ...currentSettings,
      filters: {
        projects: { status: [], priority: [], dateRange: { start: null, end: null } },
        employees: { department: [], role: [], availability: [] },
        invoices: { status: [], dateRange: { start: null, end: null }, amountRange: { min: null, max: null } },
        analytics: { timeRange: 'month' as const, chartType: 'line' as const, showTrends: true }
      }
    };
    this.settingsSubject.next(newSettings);
  }
}
