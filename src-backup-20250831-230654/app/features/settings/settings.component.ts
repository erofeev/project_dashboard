import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

// Временно используем базовые HTML элементы вместо PrimeNG
// TODO: Добавить PrimeNG компоненты когда исправим импорты

import { ConfigService, ERMConfig, UserRate } from '../../core/services/config.service';
import { NotificationService } from '../../core/services/notification.service';

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

  // === FORMS ===
  public ermConfigForm!: FormGroup;
  public ratesForm!: FormGroup;

  // === STATE ===
  public currentConfig = signal<ERMConfig | null>(null);
  public userRates = signal<UserRate[]>([]);
  public isLoading = signal(false);

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
  
  public async testERMConnection() {
    this.isLoading.set(true);
    
    try {
      // Простой тест через ConfigService
      const config = this.configService.getERMConfig();
      const response = await fetch(`${config.baseUrl}/projects.json?limit=1`, {
        headers: {
          'X-Redmine-API-Key': config.apiKey
        }
      });
      
      if (response.ok) {
        this.notificationService.ermConnectionSuccess();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.notificationService.ermConnectionError(String(error));
    } finally {
      this.isLoading.set(false);
    }
  }

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
}
