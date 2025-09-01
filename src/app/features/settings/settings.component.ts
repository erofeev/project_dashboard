import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

// Временно используем базовые HTML элементы вместо PrimeNG
// TODO: Добавить PrimeNG компоненты когда исправим импорты

import { ConfigService, ERMConfig, UserRate } from '../../core/services/config.service';
import { NotificationService } from '../../core/services/notification.service';
import { ERMService } from '../../core/services/erm.service';
import { ERMWorkerService } from '../../core/services/erm-worker.service';
import { PouchDBService } from '../../core/services/pouchdb.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  
  // === SERVICES ===
  private configService = inject(ConfigService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private ermService = inject(ERMService);
  private ermWorkerService = inject(ERMWorkerService);
  private pouchDBService = inject(PouchDBService);

  // === FORMS ===
  public ermConfigForm!: FormGroup;
  public ratesForm!: FormGroup;

  // === STATE ===
  public currentConfig = signal<ERMConfig | null>(null);
  public userRates = signal<UserRate[]>([]);
  public isLoading = signal(false);
  
  // === ERM STATE ===
  public isTestingConnection = signal(false);
  public connectionStatus = signal<'unknown' | 'success' | 'error'>('unknown');
  public isSyncing = signal(false);
  public syncStatus = signal<string>('');
  public syncStats = signal<any>(null);
  
  // === СТРАТЕГИИ ЗАГРУЗКИ ===
  public loadingStrategy = signal<'quick' | 'full' | 'projects' | 'users' | null>(null);
  public discoveredUsers = signal<any[]>([]);
  public selectedUsers = signal<number[]>([]);
  public strategyResults = signal<any>(null);

  ngOnInit() {
    this.initializeForms();
    this.loadConfiguration();
  }

  // === ИНИЦИАЛИЗАЦИЯ ФОРМ ===
  
  private initializeForms() {
    // Форма ERM конфигурации (аналог Config листа B2-B6)
    this.ermConfigForm = this.fb.group({
      baseUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      apiKey: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      projectId: [''],
      userFilter: [''] // Строка через запятую
    });

    // Форма для добавления новых ставок (аналог Rates листа)
    this.ratesForm = this.fb.group({
      userName: ['', Validators.required],
      dateFrom: [new Date(), Validators.required],
      grossPerMonth: [0, Validators.min(0)],
      hourlyRate: [0, Validators.min(0)]
    });
  }

  private loadConfiguration() {
    // Загружаем текущую конфигурацию
    const config = this.configService.getERMConfig();
    this.currentConfig.set(config);
    
    // Заполняем форму
    this.ermConfigForm.patchValue({
      ...config,
      userFilter: config.userFilter.join(', ') // Преобразуем массив в строку
    });

    // Загружаем ставки пользователей
    const rates = this.configService.getUserRates();
    this.userRates.set(rates);
  }

  // === СОХРАНЕНИЕ КОНФИГУРАЦИИ ===
  
  public saveERMConfig() {
    if (this.ermConfigForm.valid) {
      this.isLoading.set(true);
      
      const formValue = this.ermConfigForm.value;
      const config: ERMConfig = {
        ...formValue,
        userFilter: formValue.userFilter 
          ? formValue.userFilter.split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : []
      };

      // Валидация
      const errors = this.configService.validateERMConfig(config);
      if (errors.length > 0) {
        this.notificationService.error(
          'Ошибки конфигурации',
          errors.join('\n')
        );
        this.isLoading.set(false);
        return;
      }

      // Сохранение
      this.configService.updateERMConfig(config);
      this.currentConfig.set(config);
      
      this.notificationService.configSaved();
      
      this.isLoading.set(false);
    } else {
      this.notificationService.warning(
        'Форма не заполнена',
        'Проверьте обязательные поля'
      );
    }
  }

  // === УПРАВЛЕНИЕ СТАВКАМИ ===
  
  public addUserRate() {
    if (this.ratesForm.valid) {
      const newRate: UserRate = this.ratesForm.value;
      this.configService.addUserRate(newRate);
      
      // Обновляем локальный сигнал
      const updatedRates = this.configService.getUserRates();
      this.userRates.set(updatedRates);
      
      // Очищаем форму
      this.ratesForm.reset({
        dateFrom: new Date(),
        grossPerMonth: 0,
        hourlyRate: 0
      });
      
      this.notificationService.success(
        'Ставка добавлена',
        `Ставка для ${newRate.userName} успешно добавлена`
      );
    }
  }

  public removeUserRate(index: number) {
    this.configService.removeUserRate(index);
    
    // Обновляем локальный сигнал
    const updatedRates = this.configService.getUserRates();
    this.userRates.set(updatedRates);
    
    this.notificationService.info(
      'Ставка удалена', 
      'Ставка пользователя удалена из системы'
    );
  }

  // === ТЕСТИРОВАНИЕ ПОДКЛЮЧЕНИЯ ===
  // (Метод перенесен в секцию ERM INTEGRATION METHODS)

  // === ЭКСПОРТ/ИМПОРТ ===
  
  public exportConfiguration() {
    const data = this.configService.exportConfiguration();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const filename = `project-analytics-config-${new Date().toISOString().split('T')[0]}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    window.URL.revokeObjectURL(url);
    
    this.notificationService.fileExported(filename);
  }

  public onImportFile(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = this.configService.importConfiguration(data);
        
        if (success) {
          this.loadConfiguration(); // Перезагружаем формы
          this.notificationService.fileImported(file.name);
        }
      } catch (error) {
        this.notificationService.error(
          'Ошибка импорта',
          'Некорректный файл конфигурации'
        );
      }
    };
    
    reader.readAsText(file);
  }

  // === ERM INTEGRATION METHODS ===

  /**
   * Тестирует подключение к EasyRedmine
   */
  public async testERMConnection() {
    if (this.isTestingConnection()) return;

    this.isTestingConnection.set(true);
    this.connectionStatus.set('unknown');
    
    console.log('🚀 Начинаем тест ERM соединения...');

    try {
      // Сначала сохраняем текущую конфигурацию
      console.log('💾 Сохраняем конфигурацию ERM...');
      this.saveERMConfig();
      
      // Проверяем, что конфигурация корректна
      const currentConfig = this.configService.getERMConfig();
      console.log('🔧 Текущая конфигурация ERM:', {
        baseUrl: currentConfig.baseUrl,
        hasApiKey: !!currentConfig.apiKey
      });

      // Тестируем подключение через ERMService
      console.log('🔍 Вызываем ERMService.testConnection()...');
      const isConnected = await this.ermService.testConnection();
      
      if (isConnected) {
        console.log('✅ Тест подключения успешен!');
        this.connectionStatus.set('success');
        this.notificationService.success(
          'Подключение успешно!', 
          'ERM API отвечает. Можно загружать данные.'
        );
      } else {
        throw new Error('Не удалось подключиться к серверу');
      }
    } catch (error: any) {
      console.error('❌ Ошибка теста подключения:', error);
      this.connectionStatus.set('error');
      
      let errorMessage = 'Неизвестная ошибка';
      if (error.status === 0) {
        errorMessage = 'Нет соединения с сервером (CORS/прокси ошибка)';
      } else if (error.status === 401) {
        errorMessage = 'Неверный API ключ';
      } else if (error.status === 404) {
        errorMessage = 'Неверный URL сервера';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.notificationService.error(
        'Ошибка подключения к ERM',
        `${errorMessage}. Проверьте консоль браузера для деталей.`
      );
    } finally {
      this.isTestingConnection.set(false);
    }
  }

  /**
   * Быстрая синхронизация служебных данных (справочники)
   */
  public async syncServiceData() {
    if (this.isSyncing()) return;

    this.isSyncing.set(true);
    this.syncStatus.set('Загружаем справочники...');

    try {
      // Используем ERMService для быстрой загрузки справочников
      const serviceData = await this.ermService.refreshServiceData();

      this.syncStatus.set('Справочники загружены!');
      this.notificationService.success(
        'Справочники обновлены!',
        `Загружено: ${serviceData.users.length} пользователей, ${serviceData.projects.length} проектов, ${serviceData.activities.length} активностей`
      );

      // Также обновляем статистику
      this.syncStats.set({
        users: serviceData.users.length,
        projects: serviceData.projects.length,
        activities: serviceData.activities.length,
        timeEntries: 0, // Не загружали записи времени
        lastSync: new Date()
      });

    } catch (error) {
      this.syncStatus.set('Ошибка загрузки справочников');
      this.notificationService.error(
        'Ошибка загрузки',
        error instanceof Error ? error.message : 'Неизвестная ошибка'
      );
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Синхронизирует данные из EasyRedmine в PouchDB
   */
  public async syncERMData() {
    if (this.isSyncing()) return;

    this.isSyncing.set(true);
    this.syncStatus.set('Инициализация синхронизации...');

    try {
      // Обновляем конфигурацию ERMWorkerService
      const config = this.configService.getERMConfig();
      this.ermWorkerService.updateConfig({
        apiUrl: config.baseUrl,
        apiKey: config.apiKey,
        syncInterval: 30,
        enabled: true
      });

      this.syncStatus.set('Подключение к EasyRedmine...');
      
      // Запускаем синхронизацию
      await this.ermWorkerService.startSync();

      // Получаем статистику
      const stats = await this.ermWorkerService.getSyncStats();
      this.syncStats.set(stats);

      this.syncStatus.set('Синхронизация завершена!');
      this.notificationService.success(
        'Данные синхронизированы!',
        `Загружено: ${stats.users} пользователей, ${stats.projects} проектов, ${stats.timeEntries} записей времени`
      );
    } catch (error) {
      this.syncStatus.set('Ошибка синхронизации');
      this.notificationService.error(
        'Ошибка синхронизации',
        error instanceof Error ? error.message : 'Неизвестная ошибка'
      );
    } finally {
      this.isSyncing.set(false);
    }
  }

  // === НОВЫЕ СТРАТЕГИИ ЗАГРУЗКИ ===

  /**
   * Выполняет быструю загрузку справочников
   */
  public async quickLoadMasterData() {
    if (this.loadingStrategy()) return;

    this.loadingStrategy.set('quick');
    this.syncStatus.set('🚀 Быстрая загрузка справочников...');

    try {
      const result = await this.ermService.executeLoadingStrategy('full', {
        saveToDb: true // Сохраняем справочники
      });

      this.discoveredUsers.set(result.users);
      this.strategyResults.set(result);
      
      this.syncStatus.set(`✅ Загружено: ${result.stats.totalUsers} пользователей, ${result.stats.totalProjects} проектов`);
      this.notificationService.success(
        'Справочники загружены', 
        `${result.stats.totalUsers} пользователей, ${result.stats.totalProjects} проектов`
      );

    } catch (error) {
      this.syncStatus.set('❌ Ошибка загрузки: ' + String(error));
      this.notificationService.error('Ошибка', 'Не удалось загрузить справочники');
      
    } finally {
      this.loadingStrategy.set(null);
    }
  }

  /**
   * Выполняет загрузку по проектам (ваша идея)
   */
  public async loadByProjects() {
    if (this.loadingStrategy()) return;

    this.loadingStrategy.set('projects');
    this.syncStatus.set('📁 Загрузка по всем проектам...');

    try {
      const config = this.configService.getERMConfig();
      
      const result = await this.ermService.executeLoadingStrategy('projects', {
        dateFrom: config.startDate,
        dateTo: config.endDate,
        selectedProjectIds: [], // Пока загружаем все, потом пользователь выберет
        saveToDb: true
      });

      this.discoveredUsers.set(result.users);
      this.strategyResults.set(result);
      
      this.syncStatus.set(
        `✅ По проектам: ${result.stats.totalUsers} пользователей, ` +
        `${result.stats.totalProjects} проектов, ${result.stats.totalTimeEntries} записей`
      );
      
      this.notificationService.success(
        'Загрузка по проектам завершена', 
        `${result.stats.totalTimeEntries} временных записей получено`
      );

    } catch (error) {
      this.syncStatus.set('❌ Ошибка загрузки по проектам: ' + String(error));
      this.notificationService.error('Ошибка', 'Не удалось загрузить данные по проектам');
      
    } finally {
      this.loadingStrategy.set(null);
    }
  }

  /**
   * Сохраняет данные только для выбранных пользователей
   */
  public async saveSelectedUsersData() {
    if (!this.selectedUsers().length) {
      this.notificationService.error('Не выбраны пользователи', 'Выберите пользователей для сохранения');
      return;
    }

    if (this.loadingStrategy()) return;

    this.loadingStrategy.set('users');
    this.syncStatus.set(`🎯 Загрузка данных для ${this.selectedUsers().length} выбранных пользователей...`);

    try {
      const config = this.configService.getERMConfig();
      
      const result = await this.ermService.executeLoadingStrategy('users', {
        selectedUserIds: this.selectedUsers(),
        dateFrom: config.startDate,
        dateTo: config.endDate,
        saveToDb: true
      });

      this.strategyResults.set(result);
      
      this.syncStatus.set(
        `✅ Сохранено данных для выбранных пользователей: ${result.stats.savedTimeEntries} записей`
      );
      
      this.notificationService.success(
        'Данные пользователей сохранены', 
        `${result.stats.savedTimeEntries} временных записей в БД`
      );

    } catch (error) {
      this.syncStatus.set('❌ Ошибка сохранения данных пользователей: ' + String(error));
      this.notificationService.error('Ошибка', 'Не удалось сохранить данные пользователей');
      
    } finally {
      this.loadingStrategy.set(null);
    }
  }

  /**
   * Переключает выбор пользователя
   */
  public toggleUserSelection(userId: number) {
    const current = this.selectedUsers();
    const index = current.indexOf(userId);
    
    if (index === -1) {
      this.selectedUsers.set([...current, userId]);
    } else {
      this.selectedUsers.set(current.filter(id => id !== userId));
    }
  }

  /**
   * Выбирает всех пользователей
   */
  public selectAllUsers() {
    const allUserIds = this.discoveredUsers().map(user => user.id);
    this.selectedUsers.set(allUserIds);
  }

  /**
   * Очищает выбор пользователей
   */
  public clearUserSelection() {
    this.selectedUsers.set([]);
  }
}
