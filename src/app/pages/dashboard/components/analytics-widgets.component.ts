import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McpPouchDBService } from '../../../core/services/mcp-pouchdb.service';

@Component({
  selector: 'app-analytics-widgets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-widgets">
      <!-- Статистические карточки -->
      <div class="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalUsers() }}</div>
            <div class="stat-label">Пользователей</div>
            <div class="stat-change stat-change--positive">
              <i class="pi pi-arrow-up"></i>
              <span>+{{ userGrowth() }}%</span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-icon">
            <i class="pi pi-briefcase"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalProjects() }}</div>
            <div class="stat-label">Проектов</div>
            <div class="stat-change stat-change--positive">
              <i class="pi pi-arrow-up"></i>
              <span>+{{ projectGrowth() }}%</span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card--warning">
          <div class="stat-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalHours() }}</div>
            <div class="stat-label">Часов</div>
            <div class="stat-change stat-change--positive">
              <i class="pi pi-arrow-up"></i>
              <span>+{{ hoursGrowth() }}%</span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card--info">
          <div class="stat-icon">
            <i class="pi pi-dollar"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalRevenue() | currency:'RUB':'symbol':'1.0-0' }}</div>
            <div class="stat-label">Доходы</div>
            <div class="stat-change stat-change--positive">
              <i class="pi pi-arrow-up"></i>
              <span>+{{ revenueGrowth() }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Графики и диаграммы -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Активность по месяцам</h3>
            <div class="chart-actions">
              <button class="chart-action-btn" title="Обновить">
                <i class="pi pi-refresh"></i>
              </button>
              <button class="chart-action-btn" title="Настройки">
                <i class="pi pi-cog"></i>
              </button>
            </div>
          </div>
          <div class="chart-content">
            <div class="chart-placeholder">
              <i class="pi pi-chart-line chart-icon"></i>
              <p>График активности</p>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">Распределение проектов</h3>
            <div class="chart-actions">
              <button class="chart-action-btn" title="Обновить">
                <i class="pi pi-refresh"></i>
              </button>
              <button class="chart-action-btn" title="Настройки">
                <i class="pi pi-cog"></i>
              </button>
            </div>
          </div>
          <div class="chart-content">
            <div class="chart-placeholder">
              <i class="pi pi-chart-pie chart-icon"></i>
              <p>Круговая диаграмма</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Последние активности -->
      <div class="activity-section">
        <div class="activity-card">
          <div class="activity-header">
            <h3 class="activity-title">Последние активности</h3>
            <button class="activity-action-btn" title="Показать все">
              <i class="pi pi-external-link"></i>
            </button>
          </div>
          <div class="activity-list">
            <div class="activity-item" *ngFor="let activity of recentActivities()">
              <div class="activity-icon" [ngClass]="'activity-icon--' + activity.type">
                <i [class]="activity.icon"></i>
              </div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-widgets {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: var(--transition-smooth);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: var(--color-neutral);
    }

    .stat-card--primary::before { background: var(--color-neutral); }
    .stat-card--success::before { background: var(--color-profit); }
    .stat-card--warning::before { background: var(--color-warning); }
    .stat-card--info::before { background: #3b82f6; }

    .stat-card:hover {
      background: var(--surface-elevated);
      border-color: var(--glass-border-hover);
      box-shadow: var(--shadow-elevated);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
    }

    .stat-card--primary .stat-icon { background: var(--color-neutral); }
    .stat-card--success .stat-icon { background: var(--color-profit); }
    .stat-card--warning .stat-icon { background: var(--color-warning); }
    .stat-card--info .stat-icon { background: #3b82f6; }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.875rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .stat-change {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .stat-change--positive {
      color: var(--color-profit);
    }

    .stat-change--negative {
      color: var(--color-loss);
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .chart-card {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      overflow: hidden;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 0;
    }

    .chart-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .chart-actions {
      display: flex;
      gap: 0.5rem;
    }

    .chart-action-btn {
      width: 2rem;
      height: 2rem;
      border: none;
      background: var(--surface-elevated);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .chart-action-btn:hover {
      background: var(--surface-primary);
      color: var(--text-primary);
    }

    .chart-content {
      padding: 1.5rem;
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      border: 2px dashed var(--glass-border);
      border-radius: var(--radius-lg);
    }

    .chart-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .activity-section {
      margin-top: 1rem;
    }

    .activity-card {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      overflow: hidden;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 0;
    }

    .activity-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .activity-action-btn {
      width: 2rem;
      height: 2rem;
      border: none;
      background: var(--surface-elevated);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .activity-action-btn:hover {
      background: var(--surface-primary);
      color: var(--text-primary);
    }

    .activity-list {
      padding: 1.5rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--glass-border);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1rem;
    }

    .activity-icon--user { background: var(--color-neutral); }
    .activity-icon--project { background: var(--color-profit); }
    .activity-icon--time { background: var(--color-warning); }
    .activity-icon--invoice { background: #3b82f6; }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      font-size: 0.875rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 1rem;
      }

      .chart-content, .activity-list {
        padding: 1rem;
      }
    }
  `]
})
export class AnalyticsWidgetsComponent implements OnInit {
  private pouchDBService = inject(McpPouchDBService);

  // Сигналы для данных
  private totalUsersData = signal<number>(0);
  private totalProjectsData = signal<number>(0);
  private totalHoursData = signal<number>(0);
  private totalRevenueData = signal<number>(0);
  
  // Вычисляемые свойства
  public readonly totalUsers = computed(() => this.totalUsersData());
  public readonly totalProjects = computed(() => this.totalProjectsData());
  public readonly totalHours = computed(() => this.totalHoursData());
  public readonly totalRevenue = computed(() => this.totalRevenueData());
  
  // Рост (заглушки)
  public readonly userGrowth = computed(() => 12);
  public readonly projectGrowth = computed(() => 8);
  public readonly hoursGrowth = computed(() => 15);
  public readonly revenueGrowth = computed(() => 22);

  // Последние активности
  public readonly recentActivities = computed(() => [
    {
      type: 'user',
      icon: 'pi pi-user-plus',
      text: 'Новый пользователь зарегистрирован',
      time: '2 минуты назад'
    },
    {
      type: 'project',
      icon: 'pi pi-briefcase',
      text: 'Проект "Веб-сайт" обновлен',
      time: '15 минут назад'
    },
    {
      type: 'time',
      icon: 'pi pi-clock',
      text: 'Добавлена временная запись: 8 часов',
      time: '1 час назад'
    },
    {
      type: 'invoice',
      icon: 'pi pi-file-text',
      text: 'Счет #INV-001 оплачен',
      time: '2 часа назад'
    }
  ]);

  async ngOnInit(): Promise<void> {
    await this.loadAnalyticsData();
  }

  private async loadAnalyticsData(): Promise<void> {
    try {
      // Загружаем данные из MCP сервиса
      const stats = await this.pouchDBService.getDatabaseStats();
      
      this.totalUsersData.set(stats.users || 0);
      this.totalProjectsData.set(stats.projects || 0);
      this.totalHoursData.set(stats.totalHours || 0);
      this.totalRevenueData.set(stats.totalRevenue || 0);
      
    } catch (error) {
      console.error('Ошибка загрузки аналитических данных:', error);
    }
  }
}
