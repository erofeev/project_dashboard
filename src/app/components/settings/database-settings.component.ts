import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatabaseConfigService, DatabaseConfig } from '../../services/database-config.service';
import { DatabaseService } from '../../services/database.service';
import { DatabaseMigrationService } from '../../services/database-migration.service';

@Component({
  selector: 'app-database-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="database-settings-container">
      <div class="settings-header">
        <h2 class="settings-title">{{ 'SETTINGS.DATABASE.TITLE' | translate }}</h2>
        <p class="settings-subtitle">{{ 'SETTINGS.DATABASE.SUBTITLE' | translate }}</p>
      </div>

      <!-- Основные настройки -->
      <div class="settings-section">
        <h3 class="section-title">{{ 'SETTINGS.DATABASE.BASIC_SETTINGS' | translate }}</h3>
        
        <div class="form-group">
          <label for="dbName">{{ 'SETTINGS.DATABASE.NAME' | translate }}</label>
          <input 
            id="dbName" 
            type="text" 
            [(ngModel)]="config.name" 
            class="form-input"
            [placeholder]="'SETTINGS.DATABASE.NAME_PLACEHOLDER' | translate">
        </div>

        <div class="form-group">
          <label for="dbAdapter">{{ 'SETTINGS.DATABASE.ADAPTER' | translate }}</label>
          <select id="dbAdapter" [(ngModel)]="config.adapter" class="form-select">
            <option value="idb">IndexedDB (Браузер)</option>
            <option value="http">HTTP (Удаленный сервер)</option>
            <option value="memory">Memory (Память)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="config.autoCompaction">
            {{ 'SETTINGS.DATABASE.AUTO_COMPACTION' | translate }}
          </label>
        </div>
      </div>

      <!-- Настройки синхронизации -->
      <div class="settings-section">
        <h3 class="section-title">{{ 'SETTINGS.DATABASE.SYNC_SETTINGS' | translate }}</h3>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="config.syncEnabled">
            {{ 'SETTINGS.DATABASE.SYNC_ENABLED' | translate }}
          </label>
        </div>

        <div class="form-group" *ngIf="config.syncEnabled">
          <label for="remoteUrl">{{ 'SETTINGS.DATABASE.REMOTE_URL' | translate }}</label>
          <input 
            id="remoteUrl" 
            type="url" 
            [(ngModel)]="config.remoteUrl" 
            class="form-input"
            [placeholder]="'SETTINGS.DATABASE.REMOTE_URL_PLACEHOLDER' | translate">
          
          <button 
            type="button" 
            class="btn btn-secondary"
            (click)="testRemoteConnection()"
            [disabled]="!config.remoteUrl">
            {{ 'SETTINGS.DATABASE.TEST_CONNECTION' | translate }}
          </button>
        </div>

        <div class="form-group" *ngIf="config.syncEnabled">
          <label for="syncInterval">{{ 'SETTINGS.DATABASE.SYNC_INTERVAL' | translate }}</label>
          <select id="syncInterval" [(ngModel)]="config.syncInterval" class="form-select">
            <option [value]="60000">1 {{ 'SETTINGS.DATABASE.MINUTE' | translate }}</option>
            <option [value]="300000">5 {{ 'SETTINGS.DATABASE.MINUTES' | translate }}</option>
            <option [value]="900000">15 {{ 'SETTINGS.DATABASE.MINUTES' | translate }}</option>
            <option [value]="1800000">30 {{ 'SETTINGS.DATABASE.MINUTES' | translate }}</option>
            <option [value]="3600000">1 {{ 'SETTINGS.DATABASE.HOUR' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Настройки производительности -->
      <div class="settings-section">
        <h3 class="section-title">{{ 'SETTINGS.DATABASE.PERFORMANCE_SETTINGS' | translate }}</h3>
        
        <div class="form-group">
          <label for="batchSize">{{ 'SETTINGS.DATABASE.BATCH_SIZE' | translate }}</label>
          <input 
            id="batchSize" 
            type="number" 
            [(ngModel)]="config.batchSize" 
            class="form-input"
            min="1" 
            max="1000">
        </div>

        <div class="form-group">
          <label for="maxRetries">{{ 'SETTINGS.DATABASE.MAX_RETRIES' | translate }}</label>
          <input 
            id="maxRetries" 
            type="number" 
            [(ngModel)]="config.maxRetries" 
            class="form-input"
            min="0" 
            max="10">
        </div>

        <div class="form-group">
          <label for="timeout">{{ 'SETTINGS.DATABASE.TIMEOUT' | translate }}</label>
          <input 
            id="timeout" 
            type="number" 
            [(ngModel)]="config.timeout" 
            class="form-input"
            min="1000" 
            max="300000"
            step="1000">
          <span class="input-hint">{{ 'SETTINGS.DATABASE.TIMEOUT_HINT' | translate }}</span>
        </div>
      </div>

      <!-- Настройки логирования -->
      <div class="settings-section">
        <h3 class="section-title">{{ 'SETTINGS.DATABASE.LOGGING_SETTINGS' | translate }}</h3>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="config.loggingEnabled">
            {{ 'SETTINGS.DATABASE.LOGGING_ENABLED' | translate }}
          </label>
        </div>

        <div class="form-group" *ngIf="config.loggingEnabled">
          <label for="logLevel">{{ 'SETTINGS.DATABASE.LOG_LEVEL' | translate }}</label>
          <select id="logLevel" [(ngModel)]="config.logLevel" class="form-select">
            <option value="error">{{ 'SETTINGS.DATABASE.LOG_LEVEL_ERROR' | translate }}</option>
            <option value="warn">{{ 'SETTINGS.DATABASE.LOG_LEVEL_WARN' | translate }}</option>
            <option value="info">{{ 'SETTINGS.DATABASE.LOG_LEVEL_INFO' | translate }}</option>
            <option value="debug">{{ 'SETTINGS.DATABASE.LOG_LEVEL_DEBUG' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Действия -->
      <div class="settings-actions">
        <button type="button" class="btn btn-primary" (click)="saveConfig()">
          {{ 'SETTINGS.DATABASE.SAVE' | translate }}
        </button>
        
        <button type="button" class="btn btn-secondary" (click)="resetConfig()">
          {{ 'SETTINGS.DATABASE.RESET' | translate }}
        </button>
        
        <button type="button" class="btn btn-outline" (click)="exportConfig()">
          {{ 'SETTINGS.DATABASE.EXPORT' | translate }}
        </button>
        
        <button type="button" class="btn btn-outline" (click)="importConfig()">
          {{ 'SETTINGS.DATABASE.IMPORT' | translate }}
        </button>
      </div>

      <!-- Статистика базы данных -->
      <div class="settings-section">
        <h3 class="section-title">{{ 'SETTINGS.DATABASE.STATISTICS' | translate }}</h3>
        
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">{{ 'SETTINGS.DATABASE.TOTAL_USERS' | translate }}</span>
            <span class="stat-value">{{ dbStats.users || 0 }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">{{ 'SETTINGS.DATABASE.TOTAL_PROJECTS' | translate }}</span>
            <span class="stat-value">{{ dbStats.projects || 0 }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">{{ 'SETTINGS.DATABASE.TOTAL_TIME_ENTRIES' | translate }}</span>
            <span class="stat-value">{{ dbStats.timeEntries || 0 }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">{{ 'SETTINGS.DATABASE.TOTAL_INVOICES' | translate }}</span>
            <span class="stat-value">{{ dbStats.invoices || 0 }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">{{ 'SETTINGS.DATABASE.TOTAL_PAYMENTS' | translate }}</span>
            <span class="stat-value">{{ dbStats.payments || 0 }}</span>
          </div>
          
          <div class="stat-item">
            <span class="stat-label">{{ 'SETTINGS.DATABASE.TOTAL_SIZE' | translate }}</span>
            <span class="stat-value">{{ formatBytes(dbStats.totalSize || 0) }}</span>
          </div>
        </div>

        <div class="stats-actions">
          <button type="button" class="btn btn-outline" (click)="refreshStats()">
            {{ 'SETTINGS.DATABASE.REFRESH_STATS' | translate }}
          </button>
          
          <button type="button" class="btn btn-outline" (click)="clearAllData()">
            {{ 'SETTINGS.DATABASE.CLEAR_ALL_DATA' | translate }}
          </button>
        </div>
      </div>

      <!-- Информация о миграциях -->
      <div class="settings-section">
        <h3 class="section-title">{{ 'SETTINGS.DATABASE.MIGRATIONS' | translate }}</h3>
        
        <div class="migration-info">
          <p><strong>{{ 'SETTINGS.DATABASE.CURRENT_VERSION' | translate }}:</strong> {{ migrationInfo.currentVersion }}</p>
          
          <div *ngIf="migrationInfo.availableMigrations.length > 0">
            <p><strong>{{ 'SETTINGS.DATABASE.AVAILABLE_MIGRATIONS' | translate }}:</strong></p>
            <ul class="migration-list">
              <li *ngFor="let migration of migrationInfo.availableMigrations">
                <strong>v{{ migration.version }}</strong> - {{ migration.name }}: {{ migration.description }}
              </li>
            </ul>
            
            <button type="button" class="btn btn-primary" (click)="runMigrations()">
              {{ 'SETTINGS.DATABASE.RUN_MIGRATIONS' | translate }}
            </button>
          </div>
          
          <div *ngIf="migrationInfo.availableMigrations.length === 0">
            <p>{{ 'SETTINGS.DATABASE.NO_MIGRATIONS_AVAILABLE' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .database-settings-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .settings-title {
      font-size: 2rem;
      color: var(--glass-text-primary);
      margin-bottom: 0.5rem;
    }

    .settings-subtitle {
      color: var(--glass-text-secondary);
      font-size: 1.1rem;
    }

    .settings-section {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--glass-border-radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--glass-shadow-light);
    }

    .section-title {
      font-size: 1.3rem;
      color: var(--glass-text-primary);
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 0.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--glass-text-primary);
      font-weight: 500;
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--glass-text-primary);
      font-size: 1rem;
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--glass-accent);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .input-hint {
      font-size: 0.875rem;
      color: var(--glass-text-secondary);
      margin-top: 0.25rem;
      display: block;
    }

    .settings-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: var(--glass-accent);
      color: white;
    }

    .btn-secondary {
      background: var(--glass-secondary);
      color: white;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--glass-border);
      color: var(--glass-text-primary);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--glass-shadow-medium);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      color: var(--glass-text-secondary);
      margin-bottom: 0.5rem;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--glass-text-primary);
    }

    .stats-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .migration-info {
      background: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 8px;
    }

    .migration-list {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    .migration-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--glass-border);
    }

    .migration-list li:last-child {
      border-bottom: none;
    }
  `]
})
export class DatabaseSettingsComponent implements OnInit {
  config: DatabaseConfig;
  dbStats: any = {};
  migrationInfo: any = {};

  constructor(
    private configService: DatabaseConfigService,
    private databaseService: DatabaseService,
    private migrationService: DatabaseMigrationService,
    private translate: TranslateService
  ) {
    this.config = this.configService.getConfig();
  }

  async ngOnInit(): Promise<void> {
    await this.loadDatabaseStats();
    this.loadMigrationInfo();
  }

  async loadDatabaseStats(): Promise<void> {
    try {
      this.dbStats = await this.databaseService.getDatabaseStats();
    } catch (error) {
      console.error('Ошибка загрузки статистики БД:', error);
    }
  }

  loadMigrationInfo(): void {
    this.migrationInfo = this.migrationService.getMigrationInfo();
  }

  async saveConfig(): Promise<void> {
    try {
      const validation = this.configService.validateConfig(this.config);
      if (validation.isValid) {
        this.configService.updateConfig(this.config);
        this.translate.get('SETTINGS.DATABASE.SAVE_SUCCESS').subscribe(msg => {
          alert(msg);
        });
      } else {
        const errorMessage = validation.errors.join('\n');
        alert(`Ошибки валидации:\n${errorMessage}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения конфигурации:', error);
      alert('Ошибка сохранения конфигурации');
    }
  }

  resetConfig(): void {
    if (confirm('Вы уверены, что хотите сбросить настройки к значениям по умолчанию?')) {
      this.configService.resetConfig();
      this.config = this.configService.getConfig();
      alert('Настройки сброшены к значениям по умолчанию');
    }
  }

  exportConfig(): void {
    const configJson = this.configService.exportConfig();
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pouchdb-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importConfig(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const result = this.configService.importConfig(e.target.result);
          if (result.success) {
            this.config = this.configService.getConfig();
            alert('Конфигурация успешно импортирована');
          } else {
            const errorMessage = result.errors?.join('\n') || 'Неизвестная ошибка';
            alert(`Ошибка импорта:\n${errorMessage}`);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  async testRemoteConnection(): Promise<void> {
    if (!this.config.remoteUrl) return;
    
    try {
      const isAvailable = await this.configService.checkRemoteServer(this.config.remoteUrl);
      if (isAvailable) {
        alert('Соединение с удаленным сервером успешно установлено');
      } else {
        alert('Не удалось установить соединение с удаленным сервером');
      }
    } catch (error) {
      console.error('Ошибка проверки соединения:', error);
      alert('Ошибка проверки соединения с удаленным сервером');
    }
  }

  async refreshStats(): Promise<void> {
    await this.loadDatabaseStats();
  }

  async clearAllData(): Promise<void> {
    if (confirm('ВНИМАНИЕ! Это действие удалит ВСЕ данные из базы. Вы уверены?')) {
      try {
        await this.databaseService.clearAllData();
        await this.loadDatabaseStats();
        alert('Все данные успешно удалены');
      } catch (error) {
        console.error('Ошибка очистки данных:', error);
        alert('Ошибка очистки данных');
      }
    }
  }

  async runMigrations(): Promise<void> {
    try {
      await this.migrationService.runMigrations();
      this.loadMigrationInfo();
      alert('Миграции выполнены успешно');
    } catch (error) {
      console.error('Ошибка выполнения миграций:', error);
      alert('Ошибка выполнения миграций');
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

