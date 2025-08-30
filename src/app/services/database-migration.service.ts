import { Injectable } from '@angular/core';

export interface Migration {
  version: number;
  name: string;
  description: string;
  execute: () => Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseMigrationService {
  private readonly MIGRATION_VERSION_KEY = 'db_migration_version';
  private currentVersion = 0;

  constructor() {
    this.loadCurrentVersion();
  }

  private async loadCurrentVersion(): Promise<void> {
    try {
      // В реальном приложении здесь будет чтение версии из localStorage или из БД
      const storedVersion = localStorage.getItem(this.MIGRATION_VERSION_KEY);
      this.currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
      console.log(`Текущая версия базы данных: ${this.currentVersion}`);
    } catch (error) {
      console.error('Ошибка загрузки версии миграции:', error);
      this.currentVersion = 0;
    }
  }

  private async saveCurrentVersion(version: number): Promise<void> {
    try {
      localStorage.setItem(this.MIGRATION_VERSION_KEY, version.toString());
      this.currentVersion = version;
      console.log(`Версия базы данных обновлена до: ${version}`);
    } catch (error) {
      console.error('Ошибка сохранения версии миграции:', error);
    }
  }

  // Получение списка всех миграций
  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: 'Initial Schema',
        description: 'Создание базовой структуры базы данных',
        execute: async () => {
          console.log('Выполнение миграции: Initial Schema');
          // Базовая структура создается автоматически при инициализации DatabaseService
          console.log('Миграция Initial Schema выполнена');
        }
      },
      {
        version: 2,
        name: 'Add Financial Calculations',
        description: 'Добавление финансовых расчетов и индексов',
        execute: async () => {
          console.log('Выполнение миграции: Add Financial Calculations');
          // Здесь можно добавить дополнительные индексы для финансовых расчетов
          // Например, индексы для быстрого поиска по датам, суммам и т.д.
        }
      },
      {
        version: 3,
        name: 'Add Integration Fields',
        description: 'Добавление полей для интеграции с внешними системами',
        execute: async () => {
          console.log('Выполнение миграции: Add Integration Fields');
          // Добавление полей для OpenProject, ERM и других интеграций
        }
      }
    ];
  }

  // Проверка необходимости миграции
  async checkMigrations(): Promise<boolean> {
    const migrations = this.getMigrations();
    const latestVersion = Math.max(...migrations.map(m => m.version));
    
    if (this.currentVersion < latestVersion) {
      console.log(`Требуется миграция: текущая версия ${this.currentVersion}, доступна версия ${latestVersion}`);
      return true;
    }
    
    console.log('Миграция не требуется');
    return false;
  }

  // Выполнение всех необходимых миграций
  async runMigrations(): Promise<void> {
    try {
      console.log('Начало выполнения миграций базы данных...');
      
      const migrations = this.getMigrations()
        .filter(m => m.version > this.currentVersion)
        .sort((a, b) => a.version - b.version);

      if (migrations.length === 0) {
        console.log('Нет новых миграций для выполнения');
        return;
      }

      for (const migration of migrations) {
        try {
          console.log(`Выполнение миграции ${migration.version}: ${migration.name}`);
          await migration.execute();
          await this.saveCurrentVersion(migration.version);
          console.log(`Миграция ${migration.version} выполнена успешно`);
        } catch (error) {
          console.error(`Ошибка выполнения миграции ${migration.version}:`, error);
          throw new Error(`Миграция ${migration.version} не удалась: ${error}`);
        }
      }

      console.log('Все миграции выполнены успешно');
    } catch (error) {
      console.error('Ошибка выполнения миграций:', error);
      throw error;
    }
  }

  // Принудительное выполнение миграции до определенной версии
  async migrateToVersion(targetVersion: number): Promise<void> {
    try {
      console.log(`Принудительная миграция до версии ${targetVersion}...`);
      
      const migrations = this.getMigrations()
        .filter(m => m.version <= targetVersion && m.version > this.currentVersion)
        .sort((a, b) => a.version - b.version);

      for (const migration of migrations) {
        await migration.execute();
        await this.saveCurrentVersion(migration.version);
      }

      console.log(`Миграция до версии ${targetVersion} завершена`);
    } catch (error) {
      console.error(`Ошибка миграции до версии ${targetVersion}:`, error);
      throw error;
    }
  }

  // Получение информации о миграциях
  getMigrationInfo(): { currentVersion: number; availableMigrations: Migration[] } {
    const migrations = this.getMigrations();
    const availableMigrations = migrations.filter(m => m.version > this.currentVersion);
    
    return {
      currentVersion: this.currentVersion,
      availableMigrations
    };
  }

  // Сброс версии миграции (для тестирования)
  async resetMigrationVersion(): Promise<void> {
    try {
      localStorage.removeItem(this.MIGRATION_VERSION_KEY);
      this.currentVersion = 0;
      console.log('Версия миграции сброшена');
    } catch (error) {
      console.error('Ошибка сброса версии миграции:', error);
    }
  }
}
