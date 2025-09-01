import { Injectable, inject } from '@angular/core';
import { ConfigService } from './config.service';
import { CalendarService } from './calendar.service';
import { PouchDBService } from './pouchdb.service';

export interface AppInitializationData {
  user: any;
  ermConfig: any;
  userRates: any[];
  // workingCalendar убран - теперь в PouchDB как системные данные
}

@Injectable({
  providedIn: 'root'
})
export class InitializationService {
  
  private configService = inject(ConfigService);
  private calendarService = inject(CalendarService);
  private pouchDBService = inject(PouchDBService);
  
  /**
   * Симулирует загрузку данных из PouchDB
   * В реальности будет использовать MCP или прямое подключение
   */
  async initializeApp(): Promise<AppInitializationData | null> {
    try {
      console.log('🔄 Инициализация приложения...');
      
      // Сначала инициализируем PouchDB 
      console.log('💾 Инициализация PouchDB...');
      await this.pouchDBService.initializeDatabases();
      
      // Загружаем и сохраняем системный календарь в PouchDB
      console.log('📅 Загрузка и сохранение системного календаря РФ...');
      const realCalendar = await this.calendarService.loadAllCalendars();
      
      // Сохраняем календарь как системные данные в PouchDB
      if (Object.keys(realCalendar).length > 0) {
        const years = Object.keys(realCalendar).map(key => parseInt(key.split('-')[0]));
        const uniqueYears = [...new Set(years)];
        const totalHours = Object.values(realCalendar).reduce((sum, hours) => sum + hours, 0);
        
        await this.pouchDBService.saveSystemCalendar({
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          source: 'xmlcalendar.ru',
          workingCalendar: realCalendar,
          metadata: {
            totalYears: uniqueYears.length,
            yearRange: { 
              from: Math.min(...uniqueYears), 
              to: Math.max(...uniqueYears) 
            },
            totalMonths: Object.keys(realCalendar).length,
            averageHoursPerMonth: Math.round(totalHours / Object.keys(realCalendar).length)
          }
        });
        
        console.log('💾 Системный календарь сохранен в PouchDB:', {
          месяцев: Object.keys(realCalendar).length,
          лет: uniqueYears.length,
          период: `${Math.min(...uniqueYears)}-${Math.max(...uniqueYears)}`
        });
      }
      
      // Симулируем данные администратора (из вашего PouchDB)
      const adminUserData = {
        email: 'admin@admin.ru',
        name: 'Andrey Erofeev (xmraner)',
        role: 'superadmin',
        
        // ERM настройки из Excel Config листа
        ermSettings: {
          baseUrl: 'https://easyredmine.awara.pro',
          apiKey: '763c9fa14fcc0343773389494e8ba3004ef3cd65',
          startDate: '2025-08-01',
          endDate: '2025-08-31',
          projectId: '',
          userFilter: [
            'Andrey Erofeev', 'Boris Bartenev', 'Dmitry Barabin',
            'Aleksandr Dmitriev', 'Mikhail Matyasov', 'Oleg Rybikov', 'Sergey Lychagin',
            'Alexey Ponomarenko', 'Mikhail Pavlukhin', 'Mikhail Yurchenko', 'Timofey Kochetkov',
            'Nikita Avdonin', 'Alice Boyarkina', 'Alexandra Dementieva',
            'Amir Khalikov', 'Amirjon Holikov', 'Nur-Magomed Tasuev', 'Julia Shutova',
            'Vadim Bondar', 'Lev Totok'
          ]
        },
        
        // Ставки пользователей из Excel Rates листа
        userRates: [
          // === ИСТОРИЧЕСКИЕ СТАВКИ ИЗ EXCEL ТАБЛИЦЫ ===
          // Aleksandr Dmitriev - повышение с мая 2025
          {
            userName: 'Aleksandr Dmitriev',
            startDate: '2025-01-01',
            endDate: '2025-04-30',
            grossPerMonth: 252874,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: false
          },
          {
            userName: 'Aleksandr Dmitriev',
            startDate: '2025-05-01',
            endDate: null,
            grossPerMonth: 316092,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Alexandra Dementieva - стабильная ставка
          {
            userName: 'Alexandra Dementieva',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 63218,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Alexey Ponomarenko - стабильная ставка
          {
            userName: 'Alexey Ponomarenko',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 265517,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Alice Boyarkina - стабильная ставка
          {
            userName: 'Alice Boyarkina',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 126437,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Amir Khalikov - стабильная ставка
          {
            userName: 'Amir Khalikov',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 189655,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Amirjon Holikov - повышение с мая 2025
          {
            userName: 'Amirjon Holikov',
            startDate: '2025-01-01',
            endDate: '2025-04-30',
            grossPerMonth: 101149,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: false
          },
          {
            userName: 'Amirjon Holikov',
            startDate: '2025-05-01',
            endDate: null,
            grossPerMonth: 151724,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Andrey Erofeev - повышение с марта 2025
          {
            userName: 'Andrey Erofeev',
            startDate: '2025-01-01',
            endDate: '2025-02-28',
            grossPerMonth: 316092,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: false
          },
          {
            userName: 'Andrey Erofeev',
            startDate: '2025-03-01',
            endDate: null,
            grossPerMonth: 379310,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Boris Bartenev - стабильная ставка
          {
            userName: 'Boris Bartenev',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 227586,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Dmitry Barabin - стабильная ставка
          {
            userName: 'Dmitry Barabin',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 126437,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Julia Shutova - стабильная ставка
          {
            userName: 'Julia Shutova',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 189655,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Lev Totok - стабильная ставка
          {
            userName: 'Lev Totok',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 101149,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Mikhail Matyasov - стабильная ставка
          {
            userName: 'Mikhail Matyasov',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 252874,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Mikhail Pavlukhin - стабильная ставка
          {
            userName: 'Mikhail Pavlukhin',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 303448,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Mikhail Yurchenko - стабильная ставка
          {
            userName: 'Mikhail Yurchenko',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 164368,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Nikita Avdonin - повышение с марта 2025
          {
            userName: 'Nikita Avdonin',
            startDate: '2025-01-01',
            endDate: '2025-02-28',
            grossPerMonth: 50575,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: false
          },
          {
            userName: 'Nikita Avdonin',
            startDate: '2025-03-01',
            endDate: null,
            grossPerMonth: 75862,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Nur-Magomed Tasuev - только почасовая ставка
          {
            userName: 'Nur-Magomed Tasuev',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 0,
            hourlyRate: 1380,
            currency: 'RUB',
            isActive: true
          },
          
          // Oleg Rybikov - только почасовая ставка
          {
            userName: 'Oleg Rybikov',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 0,
            hourlyRate: 1418,
            currency: 'RUB',
            isActive: true
          },
          
          // Sergey Lychagin - стабильная ставка
          {
            userName: 'Sergey Lychagin',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 354023,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Timofey Kochetkov - стабильная ставка
          {
            userName: 'Timofey Kochetkov',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 189655,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          },
          
          // Vadim Bondar - стабильная ставка
          {
            userName: 'Vadim Bondar',
            startDate: '2025-01-01',
            endDate: null,
            grossPerMonth: 284483,
            hourlyRate: 0,
            currency: 'RUB',
            isActive: true
          }
        ]
        
        // КАЛЕНДАРЬ ТЕПЕРЬ ХРАНИТСЯ В PouchDB КАК СИСТЕМНЫЕ ДАННЫЕ
      };
      
      console.log('👤 Загрузка данных администратора:', adminUserData.name);
      
      // Применяем конфигурацию к ConfigService
      if (adminUserData.ermSettings) {
        console.log('⚙️ Применяем ERM конфигурацию...');
        this.configService.updateERMConfig(adminUserData.ermSettings);
      }
      
      // Загружаем ставки пользователей
      if (adminUserData.userRates && Array.isArray(adminUserData.userRates)) {
        console.log('💰 Загружаем исторические ставки пользователей:', adminUserData.userRates.length, 'записей');
        // Группируем по сотрудникам для статистики
        const uniqueUsers = [...new Set(adminUserData.userRates.map(r => r.userName))];
        console.log('👥 Уникальных сотрудников:', uniqueUsers.length);
        this.configService.updateUserRates(adminUserData.userRates);
      }
      
      // КАЛЕНДАРЬ УЖЕ СОХРАНЕН В PouchDB КАК СИСТЕМНЫЕ ДАННЫЕ
      
      console.log('✅ Инициализация завершена успешно');
      
      return {
        user: adminUserData,
        ermConfig: adminUserData.ermSettings,
        userRates: adminUserData.userRates
        // workingCalendar теперь в PouchDB
      };
      
    } catch (error) {
      console.error('❌ Ошибка инициализации приложения:', error);
      
      // Даже при ошибке попробуем сохранить базовые данные
      const fallbackData = {
        user: {
          email: 'admin@admin.ru',
          name: 'Andrey Erofeev (xmraner)', 
          role: 'superadmin'
        },
        ermConfig: {
          baseUrl: 'https://easyredmine.awara.pro',
          apiKey: '763c9fa14fcc0343773389494e8ba3004ef3cd65',
          startDate: '2025-08-01',
          endDate: '2025-08-31',
          projectId: '',
          userFilter: []
        },
        userRates: []
      };
      
      console.log('🔄 Используем резервные данные для продолжения работы');
      return fallbackData;
    }
  }
  
  /**
   * Сохраняет обновленную конфигурацию через MCP
   */
  async saveConfigurationToDatabase(): Promise<boolean> {
    try {
      console.log('💾 Сохранение конфигурации через MCP...');
      
      // Получаем текущие данные из ConfigService
      const ermConfig = this.configService.getERMConfig();
      const userRates = this.configService.getUserRates();
      // workingCalendar теперь в PouchDB, не в ConfigService
      
      // Создаем полный объект пользователя для сохранения
      const updatedUserData = {
        email: 'admin@admin.ru',
        password: 'admin',
        role: 'superadmin',
        name: 'Andrey Erofeev (xmraner)',
        direction: 'IT Development',
        isActive: true,
        createdAt: '2025-08-30T23:49:12.188Z',
        updatedAt: new Date().toISOString(),
        apiKey: '763c9fa14fcc0343773389494e8ba3004ef3cd65',
        baseUrl: 'https://easyredmine.awara.pro',
        userId: 'admin@admin.ru',
        ermSettings: ermConfig,
        userRates: userRates
        // workingCalendar убран - теперь в PouchDB
      };
      
      // TODO: Здесь будет реальное сохранение через MCP API
      // await mcp_pouchdb_update_document('users', 'admin@admin.ru', updatedUserData);
      
      console.log('✅ Конфигурация подготовлена для сохранения:', {
        ermConfig: !!ermConfig.baseUrl,
        userRatesCount: userRates.length
        // календарь теперь в PouchDB отдельно
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Ошибка сохранения конфигурации:', error);
      return false;
    }
  }
  
  /**
   * Проверяет статус инициализации
   */
  async getInitializationStatus(): Promise<{
    isInitialized: boolean;
    hasERMConfig: boolean;
    hasUserRates: boolean;
    hasWorkingCalendar: boolean;
  }> {
    try {
      const ermConfig = this.configService.getERMConfig();
      const userRates = this.configService.getUserRates();
      
      // Проверяем календарь в PouchDB
      const systemCalendar = await this.pouchDBService.getSystemCalendar();
      
      return {
        isInitialized: true,
        hasERMConfig: !!(ermConfig.baseUrl && ermConfig.apiKey),
        hasUserRates: userRates.length > 0,
        hasWorkingCalendar: !!(systemCalendar && Object.keys(systemCalendar.workingCalendar).length > 0)
      };
    } catch (error) {
      console.error('Ошибка проверки статуса:', error);
      return {
        isInitialized: false,
        hasERMConfig: false,
        hasUserRates: false,
        hasWorkingCalendar: false
      };
    }
  }
}