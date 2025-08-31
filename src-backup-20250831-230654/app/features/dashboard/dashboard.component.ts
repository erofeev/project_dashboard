import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../../core/services/config.service';
import { PouchDBService } from '../../core/services/pouchdb.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- DASHBOARD - С РЕАЛЬНОЙ КОНФИГУРАЦИЕЙ -->
    <div class="dashboard-container glass-card">
      <h2 class="section-title">
        {{ currentLang() === 'ru' ? 'Добро пожаловать в Project Analytics V2!' : 'Welcome to Project Analytics V2!' }}
      </h2>
      
      <div class="dashboard-grid">
        
        <div class="stats-widget stats-widget--success executive-card">
          <div class="widget-icon success-icon">🟢</div>
          <div class="stats-value premium-number">{{ ermConfigured() ? (currentLang() === 'ru' ? 'ГОТОВ' : 'READY') : (currentLang() === 'ru' ? 'НЕТ' : 'NO') }}</div>
          <div class="stats-label executive-label">{{ currentLang() === 'ru' ? 'ERM Подключение' : 'ERM Connection' }}</div>
          <div class="stats-change stats-change--positive executive-badge" *ngIf="ermConfigured()">
            <span class="badge-icon">✦</span> Система активна
          </div>
        </div>
        
        <div class="stats-widget stats-widget--primary executive-card">
          <div class="widget-icon primary-icon">👥</div>
          <div class="stats-value premium-number animated-counter">{{ userRatesCount() }}</div>
          <div class="stats-label executive-label">{{ currentLang() === 'ru' ? 'Ставки сотрудников' : 'Employee Rates' }}</div>
          <div class="stats-change stats-change--positive executive-badge">
            <span class="badge-icon">⚡</span> 20 профилей настроено
          </div>
        </div>
        
        <div class="stats-widget stats-widget--primary executive-card elevated-widget">
          <div class="widget-icon calendar-icon">📊</div>
          <div class="stats-value premium-number animated-counter">{{ calendarMonthsCount() }}</div>
          <div class="stats-label executive-label">{{ currentLang() === 'ru' ? 'Данных календаря' : 'Calendar Data' }}</div>
          <div class="stats-change stats-change--positive executive-badge">
            <span class="badge-icon">🗓️</span> 6 лет истории
          </div>
        </div>
        
        <div class="stats-widget stats-widget--upcoming executive-card future-feature">
          <div class="widget-icon upcoming-icon">🚀</div>
          <div class="stats-value premium-number upcoming-text">{{ currentLang() === 'ru' ? 'СКОРО' : 'SOON' }}</div>
          <div class="stats-label executive-label">{{ currentLang() === 'ru' ? 'AG-Grid Отчеты' : 'AG-Grid Reports' }}</div>
          <div class="stats-change stats-change--neutral executive-badge">
            <span class="badge-icon">⏳</span> В разработке
          </div>
        </div>
        
      </div>

      <div class="quick-actions">
        <h3>{{ currentLang() === 'ru' ? 'Быстрые действия:' : 'Quick Actions:' }}</h3>
        <div class="action-buttons">
          <a routerLink="/settings" class="action-btn glass-card--interactive">
            <span class="action-icon">⚙️</span>
            <span>{{ currentLang() === 'ru' ? 'Настроить ERM подключение' : 'Configure ERM Connection' }}</span>
          </a>
          <a routerLink="/reports/time-entries" class="action-btn glass-card--interactive">
            <span class="action-icon">📊</span>
            <span>{{ currentLang() === 'ru' ? 'Просмотреть отчеты' : 'View Reports' }}</span>
          </a>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 3rem;
      border-radius: 24px;
    }
    
    .section-title {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 2.25rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
      text-shadow: 0 0 40px rgba(79, 70, 229, 0.3);
      letter-spacing: -0.02em;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin: 3rem 0;
    }
    
    .quick-actions {
      margin-top: 3rem;
      text-align: center;
      
      h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 2rem;
        text-shadow: 0 0 20px rgba(79, 70, 229, 0.2);
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 2rem;
    }
    
    .action-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 2rem;
      text-decoration: none;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
      border-radius: 16px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      min-width: 280px;
      justify-content: center;
      
      &:hover {
        transform: translateY(-4px) scale(1.02);
        color: rgba(255, 255, 255, 1);
      }
    }
    
    .action-icon {
      font-size: 1.25rem;
      filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.4));
      transition: all 0.3s ease;
    }
    
    .action-btn:hover .action-icon {
      transform: scale(1.2);
      filter: drop-shadow(0 0 16px rgba(79, 70, 229, 0.6));
    }
    
    // === ПРЕМИАЛЬНЫЕ EXECUTIVE СТИЛИ ===
    .executive-card {
      position: relative;
      overflow: visible;
      
      &::before {
        animation: shimmer 4s ease-in-out infinite;
        animation-delay: var(--shimmer-delay, 0s);
      }
      
      &.elevated-widget {
        transform: translateY(-8px);
        z-index: 2;
      }
      
      &.future-feature {
        filter: sepia(0.1) hue-rotate(240deg);
        
        .upcoming-text {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
    }
    
    .widget-icon {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      font-size: 1.8rem;
      filter: drop-shadow(0 0 12px rgba(79, 70, 229, 0.4));
      animation: iconFloat 3s ease-in-out infinite;
      
      &.success-icon { filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.5)); }
      &.primary-icon { filter: drop-shadow(0 0 12px rgba(79, 70, 229, 0.5)); }
      &.calendar-icon { filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.5)); }
      &.upcoming-icon { filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.5)); }
    }
    
    .premium-number {
      font-family: 'SF Pro Display', -apple-system, sans-serif;
      font-weight: 800;
      letter-spacing: -0.05em;
      line-height: 0.9;
      
      &.animated-counter {
        animation: countUp 0.8s ease-out;
      }
    }
    
    .executive-label {
      font-weight: 500;
      font-size: 0.82rem;
      opacity: 0.85;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-top: 0.75rem;
    }
    
    .executive-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      margin-top: 1rem;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      
      .badge-icon {
        font-size: 0.9rem;
        filter: drop-shadow(0 0 4px currentColor);
      }
      
      &.stats-change--neutral {
        background: rgba(139, 92, 246, 0.12);
        color: #a78bfa;
        border-color: rgba(139, 92, 246, 0.25);
      }
    }
    
    // === АНИМАЦИИ ===
    @keyframes iconFloat {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-6px) rotate(2deg); }
    }
    
    @keyframes countUp {
      from { 
        opacity: 0; 
        transform: translateY(20px) scale(0.8); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }
    
    // Уникальные задержки анимации для каждого виджета
    .executive-card:nth-child(1) { --shimmer-delay: 0s; }
    .executive-card:nth-child(2) { --shimmer-delay: 1s; }
    .executive-card:nth-child(3) { --shimmer-delay: 2s; }
    .executive-card:nth-child(4) { --shimmer-delay: 3s; }
    
    // === АДАПТИВНОСТЬ ДЛЯ МОБИЛЬНЫХ ===
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 2rem 1.5rem;
      }
      
      .section-title {
        font-size: 1.75rem;
        margin-bottom: 2rem;
      }
      
      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin: 2rem 0;
      }
      
      .widget-icon {
        top: 1rem;
        right: 1rem;
        font-size: 1.4rem;
      }
      
      .executive-card.elevated-widget {
        transform: none;
      }
      
      .action-btn {
        min-width: 240px;
        padding: 1rem 1.5rem;
      }
      
      .action-buttons {
        flex-direction: column;
        align-items: center;
      }
    }
    
    // === ВЫСОКОКОНТРАСТНЫЙ РЕЖИМ ===
    @media (prefers-contrast: high) {
      .executive-badge {
        border-width: 2px;
        background: rgba(255, 255, 255, 0.95);
        color: #1f2937;
      }
      
      .widget-icon {
        filter: contrast(1.5) drop-shadow(0 0 8px currentColor);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  public currentLang = signal('ru');
  public ermConfigured = signal(false);
  public userRatesCount = signal(0);
  public calendarMonthsCount = signal(0);

  // === SERVICES ===
  private configService = inject(ConfigService);
  private pouchDBService = inject(PouchDBService);

  ngOnInit() {
    this.loadLanguage();
    this.loadConfigurationStatus();
  }

  private loadLanguage() {
    // Синхронизируем с основным приложением
    const savedLang = localStorage.getItem('preferredLanguage') || 'ru';
    this.currentLang.set(savedLang);
    
    // Слушаем изменения языка
    window.addEventListener('language-changed', (e: any) => {
      this.currentLang.set(e.detail.language);
    });
  }

  private async loadConfigurationStatus() {
    // Загружаем статус конфигурации
    const ermConfig = this.configService.getERMConfig();
    const userRates = this.configService.getUserRates();
    
    // Получаем системный календарь из PouchDB
    const systemCalendar = await this.pouchDBService.getSystemCalendar();
    const calendarMonthsCount = systemCalendar ? Object.keys(systemCalendar.workingCalendar).length : 0;

    // Обновляем статистику
    this.ermConfigured.set(!!(ermConfig.baseUrl && ermConfig.apiKey));
    this.userRatesCount.set(userRates.length);
    this.calendarMonthsCount.set(calendarMonthsCount);

    console.log('📊 Dashboard статус:', {
      ermConfigured: this.ermConfigured(),
      userRates: this.userRatesCount(),
      calendarMonths: this.calendarMonthsCount()
    });
  }
}
