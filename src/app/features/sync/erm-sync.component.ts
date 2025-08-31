import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ERMWorkerService, ERMConfig, SyncStatus } from '../../core/services/erm-worker.service';
import { PouchDBService } from '../../core/services/pouchdb.service';

@Component({
  selector: 'app-erm-sync',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="erm-sync-container">
      <!-- Заголовок -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Синхронизация с EasyRedmine</h1>
          <p class="page-description">Управление подключением и синхронизацией данных с системой EasyRedmine</p>
        </div>
      </div>

      <!-- Конфигурация -->
      <div class="config-section">
        <div class="config-card">
          <div class="config-header">
            <h3 class="config-title">Конфигурация подключения</h3>
            <div class="config-status" [ngClass]="'status--' + (isConfigured() ? 'success' : 'error')">
              <i [class]="isConfigured() ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
              <span>{{ isConfigured() ? 'Настроено' : 'Не настроено' }}</span>
            </div>
          </div>

          <form class="config-form" (ngSubmit)="saveConfig()">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">API URL</label>
                <input 
                  type="url" 
                  class="form-input" 
                  [(ngModel)]="configForm.apiUrl" 
                  name="apiUrl"
                  placeholder="https://your-redmine.com"
                  required>
              </div>

              <div class="form-group">
                <label class="form-label">API Ключ</label>
                <input 
                  type="password" 
                  class="form-input" 
                  [(ngModel)]="configForm.apiKey" 
                  name="apiKey"
                  placeholder="Ваш API ключ"
                  required>
              </div>

              <div class="form-group">
                <label class="form-label">Интервал синхронизации (минуты)</label>
                <select class="form-select" [(ngModel)]="configForm.syncInterval" name="syncInterval">
                  <option value="15">15 минут</option>
                  <option value="30">30 минут</option>
                  <option value="60">1 час</option>
                  <option value="120">2 часа</option>
                  <option value="240">4 часа</option>
                  <option value="480">8 часов</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Автосинхронизация</label>
                <div class="form-checkbox">
                  <input 
                    type="checkbox" 
                    id="enabled" 
                    [(ngModel)]="configForm.enabled" 
                    name="enabled">
                  <label for="enabled">Включить автоматическую синхронизацию</label>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="testConnection()" [disabled]="!isConfigured()">
                <i class="pi pi-wifi"></i>
                <span>Тест подключения</span>
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="pi pi-save"></i>
                <span>Сохранить конфигурацию</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Статус синхронизации -->
      <div class="status-section">
        <div class="status-card">
          <div class="status-header">
            <h3 class="status-title">Статус синхронизации</h3>
            <div class="status-indicator" [ngClass]="'indicator--' + getStatusClass()">
              <i [class]="getStatusIcon()"></i>
              <span>{{ getStatusText() }}</span>
            </div>
          </div>

          <div class="status-content">
            <div class="status-grid">
              <div class="status-item">
                <div class="status-label">Последняя синхронизация</div>
                <div class="status-value">
                  {{ syncStatus().lastSync ? (syncStatus().lastSync | date:'dd.MM.yyyy HH:mm') : 'Никогда' }}
                </div>
              </div>

              <div class="status-item">
                <div class="status-label">Следующая синхронизация</div>
                <div class="status-value">
                  {{ syncStatus().nextSync ? (syncStatus().nextSync | date:'dd.MM.yyyy HH:mm') : 'Не запланирована' }}
                </div>
              </div>

              <div class="status-item">
                <div class="status-label">Ошибка</div>
                <div class="status-value status-value--error" *ngIf="syncStatus().error">
                  {{ syncStatus().error }}
                </div>
                <div class="status-value status-value--success" *ngIf="!syncStatus().error">
                  Нет ошибок
                </div>
              </div>
            </div>

            <!-- Прогресс синхронизации -->
            <div class="progress-section" *ngIf="syncStatus().isRunning">
              <h4 class="progress-title">Прогресс синхронизации</h4>
              <div class="progress-grid">
                <div class="progress-item">
                  <div class="progress-label">Пользователи</div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="syncStatus().progress.users"></div>
                  </div>
                  <div class="progress-value">{{ syncStatus().progress.users }}%</div>
                </div>

                <div class="progress-item">
                  <div class="progress-label">Проекты</div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="syncStatus().progress.projects"></div>
                  </div>
                  <div class="progress-value">{{ syncStatus().progress.projects }}%</div>
                </div>

                <div class="progress-item">
                  <div class="progress-label">Активности</div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="syncStatus().progress.activities"></div>
                  </div>
                  <div class="progress-value">{{ syncStatus().progress.activities }}%</div>
                </div>

                <div class="progress-item">
                  <div class="progress-label">Временные записи</div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="syncStatus().progress.timeEntries"></div>
                  </div>
                  <div class="progress-value">{{ syncStatus().progress.timeEntries }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Управление синхронизацией -->
      <div class="control-section">
        <div class="control-card">
          <div class="control-header">
            <h3 class="control-title">Управление синхронизацией</h3>
          </div>

          <div class="control-actions">
            <button 
              class="btn btn-primary" 
              (click)="startSync()" 
              [disabled]="!isConfigured() || syncStatus().isRunning">
              <i class="pi pi-play"></i>
              <span>Запустить синхронизацию</span>
            </button>

            <button 
              class="btn btn-warning" 
              (click)="stopSync()" 
              [disabled]="!syncStatus().isRunning">
              <i class="pi pi-pause"></i>
              <span>Остановить синхронизацию</span>
            </button>

            <button 
              class="btn btn-secondary" 
              (click)="forceSync()" 
              [disabled]="!isConfigured() || syncStatus().isRunning">
              <i class="pi pi-refresh"></i>
              <span>Принудительная синхронизация</span>
            </button>

            <button 
              class="btn btn-danger" 
              (click)="clearData()" 
              [disabled]="syncStatus().isRunning">
              <i class="pi pi-trash"></i>
              <span>Очистить данные</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Статистика -->
      <div class="stats-section">
        <div class="stats-card">
          <div class="stats-header">
            <h3 class="stats-title">Статистика данных</h3>
            <button class="btn btn-small" (click)="refreshStats()">
              <i class="pi pi-refresh"></i>
            </button>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon stat-icon--users">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().users }}</div>
                <div class="stat-label">Пользователи</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon stat-icon--projects">
                <i class="pi pi-briefcase"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().projects }}</div>
                <div class="stat-label">Проекты</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon stat-icon--time">
                <i class="pi pi-clock"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().timeEntries }}</div>
                <div class="stat-label">Временные записи</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon stat-icon--activities">
                <i class="pi pi-list"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats().activities }}</div>
                <div class="stat-label">Активности</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .erm-sync-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .page-description {
      color: var(--text-secondary);
      margin: 0;
    }

    .config-section, .status-section, .control-section, .stats-section {
      margin-bottom: 2rem;
    }

    .config-card, .status-card, .control-card, .stats-card {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      overflow: hidden;
    }

    .config-header, .status-header, .control-header, .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .config-title, .status-title, .control-title, .stats-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .config-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status--success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .status--error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .config-form {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-input, .form-select {
      padding: 0.75rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      background: var(--surface-elevated);
      color: var(--text-primary);
      font-size: 0.875rem;
      transition: var(--transition-smooth);
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--color-neutral);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .form-checkbox input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      accent-color: var(--color-neutral);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius-lg);
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition-smooth);
      text-decoration: none;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--color-neutral);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--surface-elevated);
      color: var(--text-primary);
      border: 1px solid var(--glass-border);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--surface-primary);
      border-color: var(--glass-border-hover);
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-small {
      padding: 0.5rem;
      width: 2rem;
      height: 2rem;
      justify-content: center;
    }

    .status-content {
      padding: 1.5rem;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .status-value {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .status-value--error {
      color: #ef4444;
    }

    .status-value--success {
      color: #10b981;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .indicator--running {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .indicator--success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .indicator--error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .indicator--idle {
      background: rgba(107, 114, 128, 0.1);
      color: #6b7280;
    }

    .progress-section {
      margin-top: 2rem;
    }

    .progress-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    .progress-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-label {
      min-width: 120px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .progress-bar {
      flex: 1;
      height: 0.5rem;
      background: var(--surface-elevated);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-neutral);
      transition: width 0.3s ease;
    }

    .progress-value {
      min-width: 3rem;
      text-align: right;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .control-actions {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      flex-wrap: wrap;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 1.5rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-elevated);
      border-radius: var(--radius-lg);
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .stat-icon--users { background: var(--color-neutral); }
    .stat-icon--projects { background: #10b981; }
    .stat-icon--time { background: #f59e0b; }
    .stat-icon--activities { background: #8b5cf6; }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    @media (max-width: 768px) {
      .erm-sync-container {
        padding: 1rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions, .control-actions {
        flex-direction: column;
      }

      .btn {
        justify-content: center;
      }

      .status-grid, .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ERMSyncComponent implements OnInit, OnDestroy {
  private ermWorkerService = inject(ERMWorkerService);
  private pouchDBService = inject(PouchDBService);

  // Форма конфигурации
  configForm: ERMConfig = {
    apiUrl: '',
    apiKey: '',
    syncInterval: 30,
    enabled: false
  };

  // Сигналы
  private statsData = signal<any>({
    users: 0,
    projects: 0,
    timeEntries: 0,
    activities: 0
  });

  // Вычисляемые свойства
  public readonly config = computed(() => this.ermWorkerService.config());
  public readonly syncStatus = computed(() => this.ermWorkerService.syncStatus());
  public readonly isConfigured = computed(() => this.ermWorkerService.isConfigured());
  public readonly stats = computed(() => this.statsData());

  async ngOnInit(): Promise<void> {
    // Загружаем текущую конфигурацию
    this.configForm = { ...this.config() };
    
    // Загружаем статистику
    await this.refreshStats();
  }

  ngOnDestroy(): void {
    // Компонент уничтожается, но сервис остается активным
  }

  // === КОНФИГУРАЦИЯ ===
  saveConfig(): void {
    this.ermWorkerService.updateConfig(this.configForm);
  }

  async testConnection(): Promise<void> {
    try {
      const isConnected = await this.ermWorkerService.testConnection();
      if (isConnected) {
        alert('Подключение успешно!');
      } else {
        alert('Ошибка подключения. Проверьте настройки.');
      }
    } catch (error) {
      alert('Ошибка подключения: ' + (error as Error).message);
    }
  }

  // === СИНХРОНИЗАЦИЯ ===
  async startSync(): Promise<void> {
    try {
      await this.ermWorkerService.startSync();
    } catch (error) {
      alert('Ошибка запуска синхронизации: ' + (error as Error).message);
    }
  }

  async stopSync(): Promise<void> {
    try {
      await this.ermWorkerService.stopSync();
    } catch (error) {
      alert('Ошибка остановки синхронизации: ' + (error as Error).message);
    }
  }

  async forceSync(): Promise<void> {
    try {
      await this.ermWorkerService.forceSync();
    } catch (error) {
      alert('Ошибка принудительной синхронизации: ' + (error as Error).message);
    }
  }

  async clearData(): Promise<void> {
    if (confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
      try {
        await this.ermWorkerService.clearData();
        await this.refreshStats();
        alert('Данные успешно очищены');
      } catch (error) {
        alert('Ошибка очистки данных: ' + (error as Error).message);
      }
    }
  }

  // === СТАТИСТИКА ===
  async refreshStats(): Promise<void> {
    try {
      const stats = await this.ermWorkerService.getSyncStats();
      this.statsData.set(stats);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===
  getStatusClass(): string {
    const status = this.syncStatus();
    if (status.isRunning) return 'running';
    if (status.error) return 'error';
    if (status.lastSync) return 'success';
    return 'idle';
  }

  getStatusIcon(): string {
    const status = this.syncStatus();
    if (status.isRunning) return 'pi pi-spin pi-spinner';
    if (status.error) return 'pi pi-times-circle';
    if (status.lastSync) return 'pi pi-check-circle';
    return 'pi pi-pause-circle';
  }

  getStatusText(): string {
    const status = this.syncStatus();
    if (status.isRunning) return 'Синхронизация...';
    if (status.error) return 'Ошибка';
    if (status.lastSync) return 'Готово';
    return 'Остановлено';
  }
}
