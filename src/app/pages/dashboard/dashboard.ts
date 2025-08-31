import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsWidget } from './components/notificationswidget';
// import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';

// Импорт ваших сервисов
import { McpPouchDBService } from '../../core/services/mcp-pouchdb.service';
import { AnalyticsWidgetsComponent } from './components/analytics-widgets.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RecentSalesWidget, BestSellingWidget, RevenueStreamWidget, NotificationsWidget, AnalyticsWidgetsComponent],
    template: `
        <div class="dashboard-container">
            <!-- Аналитические виджеты -->
            <app-analytics-widgets></app-analytics-widgets>

            <!-- Sakai виджеты с интеграцией ваших данных -->
            <div class="sakai-widgets">
                <div class="widgets-row">
                    <div class="widget-column">
                        <app-recent-sales-widget />
                        <app-best-selling-widget />
                    </div>
                    <div class="widget-column">
                        <app-revenue-stream-widget />
                        <app-notifications-widget />
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .dashboard-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .sakai-widgets {
            margin-top: 1rem;
        }

        .widgets-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .widget-column {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        @media (max-width: 1024px) {
            .widgets-row {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class Dashboard implements OnInit {
    // Сигналы для данных
    private totalUsersData = signal<number>(0);
    private totalProjectsData = signal<number>(0);
    private totalHoursData = signal<number>(0);
    private totalInvoicesData = signal<number>(0);
    
    // Вычисляемые свойства
    public readonly totalUsers = computed(() => this.totalUsersData());
    public readonly totalProjects = computed(() => this.totalProjectsData());
    public readonly totalHours = computed(() => this.totalHoursData());
    public readonly totalInvoices = computed(() => this.totalInvoicesData());
    
    // Рост (заглушки, можно заменить на реальные данные)
    public readonly userGrowth = computed(() => 12);
    public readonly projectGrowth = computed(() => 8);
    public readonly hoursGrowth = computed(() => 15);
    public readonly invoiceGrowth = computed(() => 6);

    constructor(
        private pouchDBService: McpPouchDBService
    ) {}

    async ngOnInit(): Promise<void> {
        await this.loadDashboardData();
    }

    private async loadDashboardData(): Promise<void> {
        try {
            // Загружаем данные из PouchDB
            const userCount = await this.pouchDBService.getUserCount();
            const projectCount = await this.pouchDBService.getProjectCount();
            const timeEntriesCount = await this.pouchDBService.getTimeEntriesCount();
            const invoiceCount = await this.pouchDBService.getInvoiceCount();

            // Обновляем сигналы
            this.totalUsersData.set(userCount);
            this.totalProjectsData.set(projectCount);
            this.totalHoursData.set(timeEntriesCount);
            this.totalInvoicesData.set(invoiceCount);

            // Можно также загрузить данные из EasyRedmine
            // const redmineStats = await this.easyRedmineService.getDatabaseStats();
            
        } catch (error) {
            console.error('Ошибка загрузки данных дашборда:', error);
        }
    }
}
