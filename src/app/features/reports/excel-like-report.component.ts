import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { McpPouchDBService, TimeEntry, Project, User } from '../../core/services/mcp-pouchdb.service';
import { ExportService } from '../../core/services/export.service';

export interface ReportData {
  id: string;
  date: Date;
  user: string;
  project: string;
  hours: number;
  rate: number;
  amount: number;
  activity: string;
  description: string;
  billable: boolean;
}

export interface GroupedData {
  key: string;
  label: string;
  totalHours: number;
  totalAmount: number;
  averageRate: number;
  count: number;
  children?: GroupedData[];
  expanded?: boolean;
}

@Component({
  selector: 'app-excel-like-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="excel-report-container">
      <!-- Заголовок -->
      <div class="report-header">
        <div class="header-content">
          <h1 class="report-title">Отчет по времени и затратам</h1>
          <p class="report-description">Excel-подобный анализ данных с группировкой и агрегацией</p>
        </div>
        <div class="header-actions">
          <button class="action-btn action-btn--primary" (click)="exportToExcel()">
            <i class="pi pi-file-excel"></i>
            <span>Экспорт в Excel</span>
          </button>
          <button class="action-btn action-btn--secondary" (click)="exportToCSV()">
            <i class="pi pi-download"></i>
            <span>Экспорт в CSV</span>
          </button>
        </div>
      </div>

      <!-- Фильтры и настройки -->
      <div class="filters-section">
        <div class="filters-card">
          <div class="filters-grid">
            <div class="filter-group">
              <label class="filter-label">Период</label>
              <select class="filter-select" [(ngModel)]="selectedPeriod" (change)="onPeriodChange()">
                <option value="all">Все время</option>
                <option value="today">Сегодня</option>
                <option value="week">Эта неделя</option>
                <option value="month">Этот месяц</option>
                <option value="quarter">Этот квартал</option>
                <option value="year">Этот год</option>
                <option value="custom">Произвольный</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Группировка</label>
              <select class="filter-select" [(ngModel)]="groupBy" (change)="onGroupByChange()">
                <option value="user">По пользователям</option>
                <option value="project">По проектам</option>
                <option value="activity">По активностям</option>
                <option value="date">По датам</option>
                <option value="month">По месяцам</option>
                <option value="week">По неделям</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Сортировка</label>
              <select class="filter-select" [(ngModel)]="sortBy" (change)="onSortByChange()">
                <option value="hours">По часам</option>
                <option value="amount">По сумме</option>
                <option value="date">По дате</option>
                <option value="user">По пользователю</option>
                <option value="project">По проекту</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Показать только</label>
              <select class="filter-select" [(ngModel)]="filterBy" (change)="onFilterByChange()">
                <option value="all">Все записи</option>
                <option value="billable">К оплате</option>
                <option value="non-billable">Не к оплате</option>
              </select>
            </div>
          </div>

          <div class="filters-actions">
            <button class="btn btn-secondary" (click)="applyFilters()">
              <i class="pi pi-filter"></i>
              <span>Применить фильтры</span>
            </button>
            <button class="btn btn-secondary" (click)="clearFilters()">
              <i class="pi pi-times"></i>
              <span>Очистить</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Сводная статистика -->
      <div class="summary-section">
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon summary-icon--total">
              <i class="pi pi-clock"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ totalHours() | number:'1.0-1' }}</div>
              <div class="summary-label">Всего часов</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon summary-icon--amount">
              <i class="pi pi-dollar"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ totalAmount() | currency:'RUB':'symbol':'1.0-0' }}</div>
              <div class="summary-label">Общая сумма</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon summary-icon--average">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ averageRate() | currency:'RUB':'symbol':'1.0-0' }}</div>
              <div class="summary-label">Средняя ставка</div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon summary-icon--records">
              <i class="pi pi-list"></i>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ totalRecords() }}</div>
              <div class="summary-label">Записей</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Группированные данные -->
      <div class="grouped-section">
        <div class="grouped-card">
          <div class="grouped-header">
            <h3 class="grouped-title">Группированные данные: {{ getGroupByLabel() }}</h3>
            <div class="grouped-actions">
              <button class="btn btn-small" (click)="expandAll()">
                <i class="pi pi-plus"></i>
                <span>Развернуть все</span>
              </button>
              <button class="btn btn-small" (click)="collapseAll()">
                <i class="pi pi-minus"></i>
                <span>Свернуть все</span>
              </button>
            </div>
          </div>

          <div class="grouped-content">
            <div class="grouped-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ getGroupByLabel() }}</th>
                    <th>Часы</th>
                    <th>Сумма</th>
                    <th>Средняя ставка</th>
                    <th>Записей</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let group of groupedData()" class="group-row" [ngClass]="'group-level-' + getGroupLevel(group)">
                    <td class="group-cell">
                      <div class="group-content">
                        <button 
                          class="expand-btn" 
                          (click)="toggleGroup(group)"
                          [class.expanded]="group.expanded"
                          *ngIf="group.children && group.children.length > 0">
                          <i [class]="group.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                        </button>
                        <span class="group-label">{{ group.label }}</span>
                        <span class="group-count" *ngIf="group.children">({{ group.children.length }})</span>
                      </div>
                    </td>
                    <td class="hours-cell">{{ group.totalHours | number:'1.0-1' }}</td>
                    <td class="amount-cell">{{ group.totalAmount | currency:'RUB':'symbol':'1.0-0' }}</td>
                    <td class="rate-cell">{{ group.averageRate | currency:'RUB':'symbol':'1.0-0' }}</td>
                    <td class="count-cell">{{ group.count }}</td>
                    <td class="actions-cell">
                      <div class="action-buttons">
                        <button class="action-btn action-btn--small" (click)="drillDown(group)" title="Детализация">
                          <i class="pi pi-search"></i>
                        </button>
                        <button class="action-btn action-btn--small" (click)="exportGroup(group)" title="Экспорт группы">
                          <i class="pi pi-download"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Детальная таблица -->
      <div class="detail-section" *ngIf="showDetailTable()">
        <div class="detail-card">
          <div class="detail-header">
            <h3 class="detail-title">Детальные данные</h3>
            <div class="detail-actions">
              <button class="btn btn-small" (click)="hideDetailTable()">
                <i class="pi pi-times"></i>
                <span>Скрыть</span>
              </button>
            </div>
          </div>

          <div class="detail-content">
            <div class="detail-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Пользователь</th>
                    <th>Проект</th>
                    <th>Активность</th>
                    <th>Часы</th>
                    <th>Ставка</th>
                    <th>Сумма</th>
                    <th>Описание</th>
                    <th>К оплате</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let record of detailData()" class="detail-row">
                    <td class="date-cell">{{ record.date | date:'dd.MM.yyyy' }}</td>
                    <td class="user-cell">{{ record.user }}</td>
                    <td class="project-cell">{{ record.project }}</td>
                    <td class="activity-cell">{{ record.activity }}</td>
                    <td class="hours-cell">{{ record.hours | number:'1.0-1' }}</td>
                    <td class="rate-cell">{{ record.rate | currency:'RUB':'symbol':'1.0-0' }}</td>
                    <td class="amount-cell">{{ record.amount | currency:'RUB':'symbol':'1.0-0' }}</td>
                    <td class="description-cell">{{ record.description }}</td>
                    <td class="billable-cell">
                      <span class="billable-badge" [ngClass]="'billable-badge--' + (record.billable ? 'yes' : 'no')">
                        {{ record.billable ? 'Да' : 'Нет' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .excel-report-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .report-title {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .report-description {
      color: var(--text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .action-btn {
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

    .action-btn--primary {
      background: var(--color-neutral);
      color: white;
    }

    .action-btn--primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .action-btn--secondary {
      background: var(--surface-primary);
      color: var(--text-primary);
      border: 1px solid var(--glass-border);
    }

    .action-btn--secondary:hover {
      background: var(--surface-elevated);
      border-color: var(--glass-border-hover);
    }

    .action-btn--small {
      padding: 0.5rem;
      width: 2rem;
      height: 2rem;
      justify-content: center;
    }

    .filters-section {
      margin-bottom: 2rem;
    }

    .filters-card {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      padding: 1.5rem;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .filter-select {
      padding: 0.75rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      background: var(--surface-elevated);
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .filters-actions {
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
    }

    .btn-secondary {
      background: var(--surface-elevated);
      color: var(--text-primary);
      border: 1px solid var(--glass-border);
    }

    .btn-secondary:hover {
      background: var(--surface-primary);
      border-color: var(--glass-border-hover);
    }

    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .summary-section {
      margin-bottom: 2rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-card {
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
    }

    .summary-icon {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .summary-icon--total { background: var(--color-neutral); }
    .summary-icon--amount { background: #10b981; }
    .summary-icon--average { background: #f59e0b; }
    .summary-icon--records { background: #8b5cf6; }

    .summary-content {
      flex: 1;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1;
    }

    .summary-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .grouped-section {
      margin-bottom: 2rem;
    }

    .grouped-card {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      overflow: hidden;
    }

    .grouped-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .grouped-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .grouped-actions {
      display: flex;
      gap: 0.5rem;
    }

    .grouped-content {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      background: var(--surface-elevated);
      color: var(--text-primary);
      font-weight: 600;
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--glass-border);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .data-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .group-row {
      transition: var(--transition-smooth);
    }

    .group-row:hover {
      background: var(--surface-elevated);
    }

    .group-level-0 { background: var(--surface-primary); }
    .group-level-1 { background: var(--surface-elevated); padding-left: 2rem; }
    .group-level-2 { background: var(--surface-primary); padding-left: 4rem; }

    .group-cell {
      display: flex;
      align-items: center;
    }

    .group-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .expand-btn {
      width: 1.5rem;
      height: 1.5rem;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-smooth);
    }

    .expand-btn:hover {
      color: var(--text-primary);
    }

    .expand-btn.expanded {
      transform: rotate(90deg);
    }

    .group-label {
      font-weight: 500;
      color: var(--text-primary);
    }

    .group-count {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .hours-cell, .amount-cell, .rate-cell, .count-cell {
      font-family: var(--font-family-mono);
      font-weight: 500;
    }

    .actions-cell {
      width: 100px;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .detail-section {
      margin-top: 2rem;
    }

    .detail-card {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      overflow: hidden;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--glass-border);
    }

    .detail-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .detail-content {
      overflow-x: auto;
    }

    .detail-row:hover {
      background: var(--surface-elevated);
    }

    .billable-badge {
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .billable-badge--yes {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .billable-badge--no {
      background: rgba(107, 114, 128, 0.1);
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .excel-report-container {
        padding: 1rem;
      }

      .report-header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: stretch;
      }

      .action-btn {
        flex: 1;
        justify-content: center;
      }

      .filters-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .grouped-actions {
        flex-direction: column;
      }

      .data-table {
        font-size: 0.875rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.75rem 0.5rem;
      }
    }
  `]
})
export class ExcelLikeReportComponent implements OnInit {
  private pouchDBService = inject(McpPouchDBService);
  private exportService = inject(ExportService);

  // Настройки отчета
  selectedPeriod = 'month';
  groupBy = 'user';
  sortBy = 'hours';
  filterBy = 'all';

  // Данные
  private reportDataSignal = signal<ReportData[]>([]);
  private groupedDataSignal = signal<GroupedData[]>([]);
  private detailDataSignal = signal<ReportData[]>([]);
  private showDetailSignal = signal<boolean>(false);

  // Вычисляемые свойства
  public readonly reportData = computed(() => this.reportDataSignal());
  public readonly groupedData = computed(() => this.groupedDataSignal());
  public readonly detailData = computed(() => this.detailDataSignal());
  public readonly showDetailTable = computed(() => this.showDetailSignal());

  // Статистика
  public readonly totalHours = computed(() => 
    this.reportData().reduce((sum, record) => sum + record.hours, 0)
  );

  public readonly totalAmount = computed(() => 
    this.reportData().reduce((sum, record) => sum + record.amount, 0)
  );

  public readonly averageRate = computed(() => {
    const records = this.reportData();
    if (records.length === 0) return 0;
    const totalRate = records.reduce((sum, record) => sum + record.rate, 0);
    return totalRate / records.length;
  });

  public readonly totalRecords = computed(() => this.reportData().length);

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.processData();
  }

  private async loadData(): Promise<void> {
    try {
      const [timeEntries, projects, users] = await Promise.all([
        this.pouchDBService.getAllTimeEntries(),
        this.pouchDBService.getAllProjects(),
        this.pouchDBService.getAllUsers()
      ]);

      // Преобразуем данные в формат отчета
      const reportData: ReportData[] = timeEntries.map(entry => {
        const project = projects.find(p => p.id === entry.projectId);
        const user = users.find(u => u.id === entry.userId);
        
        return {
          id: entry.id,
          date: new Date(entry.date),
          user: user?.name || 'Неизвестный',
          project: project?.name || 'Неизвестный проект',
          hours: entry.hours,
          rate: entry.rate || 0,
          amount: entry.hours * (entry.rate || 0),
          activity: entry.taskType,
          description: entry.description,
          billable: entry.billable
        };
      });

      this.reportDataSignal.set(reportData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  }

  private processData(): void {
    let filteredData = this.reportData();

    // Применяем фильтры
    filteredData = this.filterData(filteredData);

    // Группируем данные
    const grouped = this.groupData(filteredData);

    // Сортируем
    const sorted = this.sortData(grouped);

    this.groupedDataSignal.set(sorted);
  }

  private filterData(data: ReportData[]): ReportData[] {
    let filtered = data;

    // Фильтр по периоду
    if (this.selectedPeriod !== 'all') {
      const now = new Date();
      const startDate = this.getStartDate(now, this.selectedPeriod);
      filtered = filtered.filter(record => record.date >= startDate);
    }

    // Фильтр по типу
    if (this.filterBy === 'billable') {
      filtered = filtered.filter(record => record.billable);
    } else if (this.filterBy === 'non-billable') {
      filtered = filtered.filter(record => !record.billable);
    }

    return filtered;
  }

  private getStartDate(now: Date, period: string): Date {
    const start = new Date(now);
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return start;
  }

  private groupData(data: ReportData[]): GroupedData[] {
    const groups = new Map<string, GroupedData>();

    data.forEach(record => {
      let key: string;
      let label: string;

      switch (this.groupBy) {
        case 'user':
          key = record.user;
          label = record.user;
          break;
        case 'project':
          key = record.project;
          label = record.project;
          break;
        case 'activity':
          key = record.activity;
          label = record.activity;
          break;
        case 'date':
          key = record.date.toISOString().split('T')[0];
          label = record.date.toLocaleDateString('ru-RU');
          break;
        case 'month':
          key = `${record.date.getFullYear()}-${record.date.getMonth() + 1}`;
          label = record.date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });
          break;
        case 'week':
          const weekStart = new Date(record.date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          label = `Неделя ${weekStart.toLocaleDateString('ru-RU')}`;
          break;
        default:
          key = record.user;
          label = record.user;
      }

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label,
          totalHours: 0,
          totalAmount: 0,
          averageRate: 0,
          count: 0,
          children: []
        });
      }

      const group = groups.get(key)!;
      group.totalHours += record.hours;
      group.totalAmount += record.amount;
      group.count++;
      group.averageRate = group.totalAmount / group.totalHours;
      group.children!.push({
        key: record.id,
        label: record.description,
        totalHours: record.hours,
        totalAmount: record.amount,
        averageRate: record.rate,
        count: 1
      });
    });

    return Array.from(groups.values());
  }

  private sortData(data: GroupedData[]): GroupedData[] {
    return data.sort((a, b) => {
      switch (this.sortBy) {
        case 'hours':
          return b.totalHours - a.totalHours;
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'date':
          return new Date(b.key).getTime() - new Date(a.key).getTime();
        case 'user':
        case 'project':
          return a.label.localeCompare(b.label);
        default:
          return b.totalHours - a.totalHours;
      }
    });
  }

  // === ОБРАБОТЧИКИ СОБЫТИЙ ===
  onPeriodChange(): void {
    this.processData();
  }

  onGroupByChange(): void {
    this.processData();
  }

  onSortByChange(): void {
    this.processData();
  }

  onFilterByChange(): void {
    this.processData();
  }

  public applyFilters(): void {
    this.processData();
  }

  clearFilters(): void {
    this.selectedPeriod = 'all';
    this.groupBy = 'user';
    this.sortBy = 'hours';
    this.filterBy = 'all';
    this.processData();
  }

  // === УПРАВЛЕНИЕ ГРУППАМИ ===
  toggleGroup(group: GroupedData): void {
    group.expanded = !group.expanded;
    this.groupedDataSignal.set([...this.groupedData()]);
  }

  expandAll(): void {
    this.groupedData().forEach(group => {
      if (group.children && group.children.length > 0) {
        group.expanded = true;
      }
    });
    this.groupedDataSignal.set([...this.groupedData()]);
  }

  collapseAll(): void {
    this.groupedData().forEach(group => {
      group.expanded = false;
    });
    this.groupedDataSignal.set([...this.groupedData()]);
  }

  drillDown(group: GroupedData): void {
    // Преобразуем GroupedData в ReportData для детальной таблицы
    const detailData: ReportData[] = group.children?.map(child => ({
      id: child.key,
      date: new Date(), // Временная дата, так как в GroupedData нет даты
      user: group.label,
      project: group.label,
      hours: child.totalHours,
      rate: child.averageRate,
      amount: child.totalAmount,
      activity: child.label,
      description: child.label,
      billable: true
    })) || [];
    
    this.detailDataSignal.set(detailData);
    this.showDetailSignal.set(true);
  }

  hideDetailTable(): void {
    this.showDetailSignal.set(false);
  }

  // === ЭКСПОРТ ===
  exportToExcel(): void {
    const stats = {
      totalHours: this.totalHours(),
      totalAmount: this.totalAmount(),
      averageRate: this.averageRate(),
      totalRecords: this.totalRecords()
    };
    
    this.exportService.exportStatisticsToCSV(stats, 'excel-report-statistics');
  }

  exportToCSV(): void {
    this.exportService.exportDetailedDataToCSV(this.reportData(), 'excel-report-detailed');
  }

  exportGroup(group: GroupedData): void {
    // Экспортируем данные группы
    const groupData = group.children?.map(child => ({
      id: child.key,
      label: child.label,
      hours: child.totalHours,
      amount: child.totalAmount,
      rate: child.averageRate,
      count: child.count
    })) || [];
    
    this.exportService.exportToCSV(groupData, `group-${group.label.replace(/[^a-zA-Z0-9]/g, '-')}`);
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===
  getGroupByLabel(): string {
    const labels: { [key: string]: string } = {
      'user': 'Пользователи',
      'project': 'Проекты',
      'activity': 'Активности',
      'date': 'Даты',
      'month': 'Месяцы',
      'week': 'Недели'
    };
    return labels[this.groupBy] || 'Группировка';
  }

  getGroupLevel(group: GroupedData): number {
    return group.children && group.children.length > 0 ? 0 : 1;
  }
}
