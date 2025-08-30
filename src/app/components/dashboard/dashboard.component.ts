import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface MetricData {
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
  history: number[];
  color: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="dashboard-container">
      <!-- Заголовок дашборда -->
      <div class="dashboard-header">
        <h1 class="dashboard-title">{{ 'DASHBOARD.TITLE' | translate }}</h1>
        <p class="dashboard-subtitle">{{ 'DASHBOARD.SUBTITLE' | translate }}</p>
      </div>

      <!-- Основные метрики -->
      <div class="metrics-grid">
        <div class="metric-card" [class]="'trend-' + metrics['projects'].trend">
          <div class="metric-header">
            <div class="metric-icon">{{ metrics['projects'].icon }}</div>
            <div class="metric-trend-indicator">
              <div class="trend-line" [class]="'trend-' + metrics['projects'].trend"></div>
              <span class="trend-arrow" [class]="'arrow-' + metrics['projects'].trend">
                {{ getTrendArrow(metrics['projects'].trend) }}
              </span>
            </div>
          </div>
          
          <div class="metric-content">
            <h3 class="metric-title">{{ 'DASHBOARD.PROJECTS' | translate }}</h3>
            <div class="metric-value">{{ metrics['projects'].value }}</div>
            <div class="metric-change" [class]="'change-' + metrics['projects'].trend">
              {{ getChangeText(metrics['projects'].change, metrics['projects'].changePercent) }}
            </div>
          </div>
          
          <!-- Мини-график тренда -->
          <div class="metric-chart">
            <svg class="trend-chart" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path 
                class="trend-path" 
                [class]="'path-' + metrics['projects'].trend"
                [attr.d]="generateTrendPath(metrics['projects'].history)"
                fill="none"
                stroke-width="2">
              </path>
            </svg>
          </div>
        </div>
        
        <div class="metric-card" [class]="'trend-' + metrics['employees'].trend">
          <div class="metric-header">
            <div class="metric-icon">{{ metrics['employees'].icon }}</div>
            <div class="metric-trend-indicator">
              <div class="trend-line" [class]="'trend-' + metrics['employees'].trend"></div>
              <span class="trend-arrow" [class]="'arrow-' + metrics['employees'].trend">
                {{ getTrendArrow(metrics['employees'].trend) }}
              </span>
            </div>
          </div>
          
          <div class="metric-content">
            <h3 class="metric-title">{{ 'DASHBOARD.EMPLOYEES' | translate }}</h3>
            <div class="metric-value">{{ metrics['employees'].value }}</div>
            <div class="metric-change" [class]="'change-' + metrics['employees'].trend">
              {{ getChangeText(metrics['employees'].change, metrics['employees'].changePercent) }}
            </div>
          </div>
          
          <div class="metric-chart">
            <svg class="trend-chart" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path 
                class="trend-path" 
                [class]="'path-' + metrics['employees'].trend"
                [attr.d]="generateTrendPath(metrics['employees'].history)"
                fill="none"
                stroke-width="2">
              </path>
            </svg>
          </div>
        </div>
        
        <div class="metric-card" [class]="'trend-' + metrics['revenue'].trend">
          <div class="metric-header">
            <div class="metric-icon">{{ metrics['revenue'].icon }}</div>
            <div class="metric-trend-indicator">
              <div class="trend-line" [class]="'trend-' + metrics['revenue'].trend"></div>
              <span class="trend-arrow" [class]="'arrow-' + metrics['revenue'].trend">
                {{ getTrendArrow(metrics['revenue'].trend) }}
              </span>
            </div>
          </div>
          
          <div class="metric-content">
            <h3 class="metric-title">{{ 'DASHBOARD.REVENUE' | translate }}</h3>
            <div class="metric-value">{{ formatCurrency(metrics['revenue'].value) }}</div>
            <div class="metric-change" [class]="'change-' + metrics['revenue'].trend">
              {{ getChangeText(metrics['revenue'].change, metrics['revenue'].changePercent) }}
            </div>
          </div>
          
          <div class="metric-chart">
            <svg class="trend-chart" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path 
                class="trend-path" 
                [class]="'path-' + metrics['revenue'].trend"
                [attr.d]="generateTrendPath(metrics['revenue'].history)"
                fill="none"
                stroke-width="2">
              </path>
            </svg>
          </div>
        </div>
        
        <div class="metric-card" [class]="'trend-' + metrics['margin'].trend">
          <div class="metric-header">
            <div class="metric-icon">{{ metrics['margin'].icon }}</div>
            <div class="metric-trend-indicator">
              <div class="trend-line" [class]="'trend-' + metrics['margin'].trend"></div>
              <span class="trend-arrow" [class]="'arrow-' + metrics['margin'].trend">
                {{ getTrendArrow(metrics['margin'].trend) }}
              </span>
            </div>
          </div>
          
          <div class="metric-content">
            <h3 class="metric-title">{{ 'DASHBOARD.MARGIN' | translate }}</h3>
            <div class="metric-value">{{ formatCurrency(metrics['margin'].value) }}</div>
            <div class="metric-change" [class]="'change-' + metrics['margin'].trend">
              {{ getChangeText(metrics['margin'].change, metrics['margin'].changePercent) }}
            </div>
          </div>
          
          <div class="metric-chart">
            <svg class="trend-chart" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path 
                class="trend-path" 
                [class]="'path-' + metrics['margin'].trend"
                [attr.d]="generateTrendPath(metrics['margin'].history)"
                fill="none"
                stroke-width="2">
              </path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Дополнительные метрики -->
      <div class="secondary-metrics">
        <div class="secondary-metric">
          <div class="secondary-icon">📊</div>
          <div class="secondary-content">
            <div class="secondary-value">{{ 'DASHBOARD.PROJECTS_COMPLETED' | translate }}</div>
                         <div class="secondary-label">{{ secondaryMetrics.projectsCompleted }}</div>
          </div>
        </div>
        
        <div class="secondary-metric">
          <div class="secondary-icon">⏱️</div>
          <div class="secondary-content">
            <div class="secondary-value">{{ 'DASHBOARD.AVG_PROJECT_TIME' | translate }}</div>
                         <div class="secondary-label">{{ secondaryMetrics.avgProjectTime }} дн.</div>
          </div>
        </div>
        
        <div class="secondary-metric">
          <div class="secondary-icon">🎯</div>
          <div class="secondary-content">
            <div class="secondary-value">{{ 'DASHBOARD.SUCCESS_RATE' | translate }}</div>
                         <div class="secondary-label">{{ secondaryMetrics.successRate }}%</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .dashboard-header {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .dashboard-title {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    
    .dashboard-subtitle {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0;
      font-weight: 500;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .metric-card {
      background: linear-gradient(135deg, rgba(255,255,255,var(--widgets-transparency, 0.88)) 0%, rgba(248,250,252,var(--widgets-transparency, 0.88)) 100%);
      backdrop-filter: blur(var(--widgets-blur, 4px));
      border-radius: 16px; /* Уменьшили с 24px */
      border: 2px solid rgba(59,130,246,0.2);
      padding: 9px; /* Уменьшили в 1.5 раза с 14px */
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                  background 0.3s ease,
                  backdrop-filter 0.3s ease;
      box-shadow: 0 5px 21px rgba(59,130,246,0.12); /* Уменьшили shadow */
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }
    
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #10b981, #3b82f6, #10b981);
      background-size: 200% 100%;
      animation: shimmer 3s infinite;
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    .metric-card:hover {
      transform: translateY(-12px) scale(1.02);
      box-shadow: 0 20px 48px rgba(59,130,246,0.25);
      border-color: rgba(59,130,246,0.3);
    }
    
    .metric-card:active {
      transform: translateY(-6px) scale(1.01);
    }
    
    /* Тренд-стили */
    .metric-card.trend-up::before {
      background: linear-gradient(90deg, #10b981, #059669, #10b981);
    }
    
    .metric-card.trend-down::before {
      background: linear-gradient(90deg, #ef4444, #dc2626, #ef4444);
    }
    
    .metric-card.trend-stable::before {
      background: linear-gradient(90deg, #f59e0b, #d97706, #f59e0b);
    }
    
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .metric-icon {
      font-size: 1.3rem; /* Уменьшили в 1.5 раза с 2rem */
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    
    .metric-trend-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .trend-line {
      width: 20px;
      height: 2px;
      border-radius: 1px;
      transition: all 0.3s ease;
    }
    
    .trend-line.trend-up {
      background: linear-gradient(90deg, #10b981, #059669);
    }
    
    .trend-line.trend-down {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }
    
    .trend-line.trend-stable {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }
    
    .trend-arrow {
      font-size: 14px;
      font-weight: bold;
      transition: all 0.3s ease;
    }
    
    .arrow-up {
      color: #10b981;
      transform: translateY(0);
    }
    
    .arrow-down {
      color: #ef4444;
      transform: translateY(0);
    }
    
    .arrow-stable {
      color: #f59e0b;
      transform: translateY(0);
    }
    
    .metric-content {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .metric-title {
      margin: 0 0 16px 0;
      color: #374151;
      font-size: 1.1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-value {
      font-size: 3.5rem;
      font-weight: 900;
      margin: 16px 0;
      color: #1e293b;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1;
    }
    
    .metric-change {
      font-size: 0.95rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .change-up {
      color: #10b981;
    }
    
    .change-down {
      color: #ef4444;
    }
    
    .change-stable {
      color: #f59e0b;
    }
    
    .metric-chart {
      height: 40px;
      margin-top: 16px;
    }
    
    .trend-chart {
      width: 100%;
      height: 100%;
    }
    
    .trend-path {
      transition: all 0.5s ease;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    
    .path-up {
      stroke: #10b981;
      stroke-width: 3;
    }
    
    .path-down {
      stroke: #ef4444;
      stroke-width: 3;
    }
    
    .path-stable {
      stroke: #f59e0b;
      stroke-width: 3;
    }
    
    .secondary-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    
    .secondary-metric {
      background: linear-gradient(135deg, rgba(255,255,255,var(--widgets-transparency, 0.9)) 0%, rgba(248,250,252,var(--widgets-transparency, 0.9)) 100%);
      backdrop-filter: blur(var(--widgets-blur, 15px));
      border-radius: 16px;
      border: 1px solid rgba(59,130,246,0.1);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.3s ease, background 0.3s ease, backdrop-filter 0.3s ease;
      box-shadow: 0 4px 16px rgba(59,130,246,0.08);
    }
    
    .secondary-metric:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(59,130,246,0.15);
      border-color: rgba(59,130,246,0.2);
    }
    
    .secondary-icon {
      font-size: 1.5rem;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
    }
    
    .secondary-content {
      flex: 1;
    }
    
    .secondary-value {
      font-size: 0.9rem;
      color: #6b7280;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .secondary-label {
      font-size: 1.2rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    /* Темная тема */
    :host-context(.theme-dark) .metric-card {
      background: linear-gradient(135deg, rgba(15,23,42,var(--widgets-transparency, 0.85)) 0%, rgba(30,41,59,var(--widgets-transparency, 0.85)) 100%);
      border-color: rgba(59,130,246,0.25);
      box-shadow: 0 8px 32px rgba(59,130,246,0.15);
      transition: background 0.3s ease, backdrop-filter 0.3s ease;
    }
    
    :host-context(.theme-dark) .metric-card:hover {
      box-shadow: 0 20px 48px rgba(59,130,246,0.35);
      border-color: rgba(59,130,246,0.4);
    }
    
    :host-context(.theme-dark) .dashboard-title {
      background: linear-gradient(135deg, #f8fafc 0%, #60a5fa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    :host-context(.theme-dark) .dashboard-subtitle {
      color: #94a3b8;
    }
    
    :host-context(.theme-dark) .metric-title {
      color: #e5e7eb;
    }
    
    :host-context(.theme-dark) .metric-value {
      color: #f8fafc;
    }
    
    :host-context(.theme-dark) .secondary-metric {
      background: linear-gradient(135deg, rgba(15,23,42,var(--widgets-transparency, 0.8)) 0%, rgba(30,41,59,var(--widgets-transparency, 0.8)) 100%);
      border-color: rgba(59,130,246,0.2);
      transition: background 0.3s ease;
    }
    
    :host-context(.theme-dark) .secondary-label {
      color: #f8fafc;
    }
    
    /* Анимации появления */
    .metric-card {
      animation: cardSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      opacity: 0;
      transform: translateY(30px);
    }
    
    .metric-card:nth-child(1) { animation-delay: 0.1s; }
    .metric-card:nth-child(2) { animation-delay: 0.2s; }
    .metric-card:nth-child(3) { animation-delay: 0.3s; }
    .metric-card:nth-child(4) { animation-delay: 0.4s; }
    
    @keyframes cardSlideIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Адаптивность */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }
      
      .dashboard-title {
        font-size: 2rem;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .metric-card {
        padding: 20px;
      }
      
      .metric-value {
        font-size: 2.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  metrics: { [key: string]: MetricData } = {
    projects: {
      value: 12,
      trend: 'up' as const,
      change: 3,
      changePercent: 25,
      history: [8, 9, 10, 11, 12],
      color: '#10b981',
      icon: '🚀'
    },
    employees: {
      value: 24,
      trend: 'up' as const,
      change: 2,
      changePercent: 9,
      history: [20, 21, 22, 23, 24],
      color: '#3b82f6',
      icon: '👥'
    },
    revenue: {
      value: 2850000,
      trend: 'up' as const,
      change: 450000,
      changePercent: 19,
      history: [2000000, 2200000, 2400000, 2650000, 2850000],
      color: '#10b981',
      icon: '💰'
    },
    margin: {
      value: 855000,
      trend: 'stable' as const,
      change: 0,
      changePercent: 0,
      history: [800000, 820000, 840000, 850000, 855000],
      color: '#f59e0b',
      icon: '📈'
    }
  };

  secondaryMetrics = {
    projectsCompleted: 8,
    avgProjectTime: 45,
    successRate: 94
  };

  constructor(private translate: TranslateService) {}
  
  ngOnInit(): void {
    // Добавляем fallback переводы для дашборда
    this.translate.setTranslation('ru', {
      DASHBOARD: {
        TITLE: 'Панель управления проектами',
        SUBTITLE: 'Мониторинг ключевых показателей и трендов',
        PROJECTS: 'Проекты',
        TOTAL_PROJECTS: 'Всего проектов',
        EMPLOYEES: 'Сотрудники',
        TOTAL_EMPLOYEES: 'Всего сотрудников',
        REVENUE: 'Выручка',
        TOTAL_REVENUE: 'Общая выручка',
        MARGIN: 'Маржа',
        TOTAL_MARGIN: 'Общая маржа',
        PROJECTS_COMPLETED: 'Завершено проектов',
        AVG_PROJECT_TIME: 'Среднее время проекта',
        SUCCESS_RATE: 'Процент успеха'
      }
    }, true);
    
    this.translate.setTranslation('en', {
      DASHBOARD: {
        TITLE: 'Project Management Dashboard',
        SUBTITLE: 'Key metrics monitoring and trends analysis',
        PROJECTS: 'Projects',
        TOTAL_PROJECTS: 'Total Projects',
        EMPLOYEES: 'Employees',
        TOTAL_EMPLOYEES: 'Total Employees',
        REVENUE: 'Revenue',
        TOTAL_REVENUE: 'Total Revenue',
        MARGIN: 'Margin',
        TOTAL_MARGIN: 'Total Margin',
        PROJECTS_COMPLETED: 'Completed Projects',
        AVG_PROJECT_TIME: 'Average Project Time',
        SUCCESS_RATE: 'Success Rate'
      }
    }, true);
  }

  getTrendArrow(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '→';
    }
  }

  getChangeText(change: number, percent: number): string {
    if (change === 0) return 'Без изменений';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change} (${sign}${percent}%)`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  generateTrendPath(history: number[]): string {
    if (history.length < 2) return '';
    
    const width = 100;
    const height = 30;
    const maxValue = Math.max(...history);
    const minValue = Math.min(...history);
    const range = maxValue - minValue || 1;
    
    const points = history.map((value, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }
}
