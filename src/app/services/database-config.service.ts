import { Injectable } from '@angular/core';

export interface DatabaseConfig {
  // Основные настройки
  name: string;
  adapter: 'idb' | 'http' | 'memory';
  autoCompaction: boolean;
  
  // Настройки синхронизации
  syncEnabled: boolean;
  remoteUrl?: string;
  syncInterval: number; // в миллисекундах
  
  // Настройки производительности
  batchSize: number;
  maxRetries: number;
  timeout: number;
  
  // Настройки безопасности
  encryptionEnabled: boolean;
  
  // Настройки логирования
  loggingEnabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseConfigService {
  private readonly CONFIG_KEY = 'pouchdb_config';
  private config!: DatabaseConfig;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
      } else {
        this.config = this.getDefaultConfig();
        this.saveConfig();
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации БД:', error);
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): DatabaseConfig {
    return {
      name: 'project_management_db',
      adapter: 'idb', // IndexedDB для браузера
      autoCompaction: true,
      syncEnabled: false,
      remoteUrl: undefined,
      syncInterval: 300000, // 5 минут
      batchSize: 100,
      maxRetries: 3,
      timeout: 30000, // 30 секунд
      encryptionEnabled: false,
      loggingEnabled: true,
      logLevel: 'info'
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Ошибка сохранения конфигурации БД:', error);
    }
  }

  // Получение текущей конфигурации
  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  // Обновление конфигурации
  updateConfig(updates: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    console.log('Конфигурация базы данных обновлена:', this.config);
  }

  // Сброс к настройкам по умолчанию
  resetConfig(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    console.log('Конфигурация базы данных сброшена к настройкам по умолчанию');
  }

  // Получение настройки по ключу
  getSetting<K extends keyof DatabaseConfig>(key: K): DatabaseConfig[K] {
    return this.config[key];
  }

  // Установка настройки по ключу
  setSetting<K extends keyof DatabaseConfig>(key: K, value: DatabaseConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  // Проверка доступности удаленного сервера
  async checkRemoteServer(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/_up`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Ошибка проверки удаленного сервера:', error);
      return false;
    }
  }

  // Валидация конфигурации
  validateConfig(config: DatabaseConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Название базы данных не может быть пустым');
    }

    if (config.syncEnabled && !config.remoteUrl) {
      errors.push('URL удаленного сервера обязателен при включенной синхронизации');
    }

    if (config.syncInterval < 60000) { // минимум 1 минута
      errors.push('Интервал синхронизации не может быть меньше 1 минуты');
    }

    if (config.batchSize < 1 || config.batchSize > 1000) {
      errors.push('Размер пакета должен быть от 1 до 1000');
    }

    if (config.maxRetries < 0 || config.maxRetries > 10) {
      errors.push('Максимальное количество повторов должно быть от 0 до 10');
    }

    if (config.timeout < 1000 || config.timeout > 300000) {
      errors.push('Таймаут должен быть от 1 до 300 секунд');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Экспорт конфигурации
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Импорт конфигурации
  importConfig(configJson: string): { success: boolean; errors?: string[] } {
    try {
      const importedConfig = JSON.parse(configJson);
      const validation = this.validateConfig(importedConfig);
      
      if (validation.isValid) {
        this.config = importedConfig;
        this.saveConfig();
        return { success: true };
      } else {
        return { success: false, errors: validation.errors };
      }
    } catch (error) {
      return { 
        success: false, 
        errors: ['Ошибка парсинга JSON конфигурации'] 
      };
    }
  }

  // Получение информации о производительности
  getPerformanceInfo(): { memoryUsage: number; storageQuota: number; storageUsage: number } {
    // В реальном приложении здесь будет получение реальных данных
    return {
      memoryUsage: 0,
      storageQuota: 0,
      storageUsage: 0
    };
  }

  // Очистка старых логов и временных данных
  async cleanupOldData(): Promise<void> {
    try {
      // Здесь будет логика очистки старых данных
      console.log('Очистка старых данных выполнена');
    } catch (error) {
      console.error('Ошибка очистки старых данных:', error);
    }
  }
}
