import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { InitializationService } from './core/services/initialization.service';
import { ConfigService } from './core/services/config.service';
import { NotificationService } from './core/services/notification.service';
import { NotificationsComponent } from './shared/notifications/notifications.component';
import { AnimatedLandscapeComponent } from './shared/components/animated-landscape/animated-landscape.component';
import { PerformanceMetrics } from './core/services/three3d.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, NotificationsComponent, AnimatedLandscapeComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('project-analytics-v2');
  public currentLang = signal('ru');
  public isInitialized = signal(false);
  public initializationStatus = signal('');

  // === SERVICES ===
  private initService = inject(InitializationService);
  private configService = inject(ConfigService);
  private notificationService = inject(NotificationService);

  async ngOnInit() {
    // 1. Загружаем язык из localStorage
    const savedLang = localStorage.getItem('preferredLanguage') || 'ru';
    this.currentLang.set(savedLang);
    
    // 2. Инициализируем приложение данными из PouchDB
    await this.initializeApplication();
  }

  private async initializeApplication() {
    try {
      this.initializationStatus.set('Загрузка данных из базы...');
      
      // Инициализируем приложение
      const initData = await this.initService.initializeApp();
      
      if (initData) {
        this.initializationStatus.set('✅ Данные загружены успешно!');
        
        console.log('📊 Инициализация завершена:', {
          user: initData.user.name,
          ermConfigured: !!initData.ermConfig,
          ratesCount: initData.userRates.length
          // календарь теперь в PouchDB
        });
        
        // Показываем уведомление об успешной инициализации
        this.notificationService.success(
          'Система инициализирована',
          `Загружено: ${initData.userRates.length} ставок, календарь в PouchDB`
        );
        
      } else {
        this.initializationStatus.set('⚠️ Инициализация с настройками по умолчанию');
        
        this.notificationService.warning(
          'Конфигурация по умолчанию',
          'Данные не найдены в базе, используются настройки по умолчанию'
        );
      }
      
      this.isInitialized.set(true);
      
      // Показываем статус только на секунду, потом скрываем
      setTimeout(() => {
        this.initializationStatus.set('');
      }, 2000);
      
    } catch (error) {
      console.error('Ошибка инициализации:', error);
      this.initializationStatus.set('❌ Ошибка загрузки данных');
      this.isInitialized.set(true); // Все равно показываем приложение
      
      this.notificationService.error(
        'Ошибка инициализации',
        'Не удалось загрузить данные из базы. Проверьте подключение.'
      );
    }
  }

  toggleLanguage() {
    const newLang = this.currentLang() === 'ru' ? 'en' : 'ru';
    this.currentLang.set(newLang);
    localStorage.setItem('preferredLanguage', newLang);
    
    // Обновляем все компоненты через событие
    window.dispatchEvent(new CustomEvent('language-changed', { 
      detail: { language: newLang } 
    }));
  }

  // === ДЕБАГ МЕТОДЫ ===
  async debugSaveConfig() {
    const success = await this.initService.saveConfigurationToDatabase();
    if (success) {
      this.notificationService.configSaved();
    } else {
      this.notificationService.configError('Неизвестная ошибка сохранения');
    }
  }

  async debugShowConfig() {
    const config = this.configService.getERMConfig();
    const rates = this.configService.getUserRates();
    const calendar = this.configService.getWorkingCalendar();
    
    console.log('🔧 Текущая конфигурация:', {
      ermConfig: config,
      userRates: rates,
      workingCalendar: calendar
    });
    
    this.notificationService.info(
      'Конфигурация системы',
      `ERM: ${config.baseUrl}\nСтавок: ${rates.length}\nМесяцев: ${Object.keys(calendar).length}`
    );
  }

  // === ОБРАБОТЧИКИ 3D ЛАНДШАФТА ===
  onLandscapeInitialized(success: boolean) {
    if (success) {
      console.log('🌄 3D ландшафт успешно инициализирован');
    } else {
      console.warn('⚠️ 3D ландшафт недоступен, используется fallback');
    }
  }

  onPerformanceUpdate(metrics: PerformanceMetrics) {
    // Логируем метрики только в development режиме
    if (metrics.fps < 15) {
      console.warn('🐌 Низкая производительность 3D:', metrics);
    }
  }
}
