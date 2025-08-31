import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // в миллисекундах, 0 = не исчезает автоматически
  timestamp: Date;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  // === REACTIVE STATE ===
  public notifications = signal<Notification[]>([]);
  
  // === НАСТРОЙКИ ПО УМОЛЧАНИЮ ===
  private defaultDurations = {
    success: 4000,  // 4 секунды
    info: 5000,     // 5 секунд
    warning: 6000,  // 6 секунд
    error: 8000     // 8 секунд (дольше для ошибок)
  };

  private maxNotifications = 5; // Максимум уведомлений на экране
  
  // === ПУБЛИЧНЫЕ МЕТОДЫ ===
  
  /**
   * Показывает уведомление об успехе
   */
  success(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'success',
      title,
      message,
      duration: duration || this.defaultDurations.success
    });
  }

  /**
   * Показывает уведомление об ошибке
   */
  error(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'error',
      title,
      message,
      duration: duration || this.defaultDurations.error
    });
  }

  /**
   * Показывает предупреждение
   */
  warning(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'warning',
      title,
      message,
      duration: duration || this.defaultDurations.warning
    });
  }

  /**
   * Показывает информационное уведомление
   */
  info(title: string, message?: string, duration?: number): string {
    return this.show({
      type: 'info',
      title,
      message,
      duration: duration || this.defaultDurations.info
    });
  }

  /**
   * Показывает уведомление с действием
   */
  showWithAction(
    type: Notification['type'],
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void
  ): string {
    return this.show({
      type,
      title,
      message,
      duration: 0, // Не исчезает автоматически
      action: {
        label: actionLabel,
        callback: actionCallback
      }
    });
  }

  /**
   * Основной метод для добавления уведомления
   */
  private show(options: {
    type: Notification['type'];
    title: string;
    message?: string;
    duration?: number;
    action?: Notification['action'];
  }): string {
    
    const notification: Notification = {
      id: this.generateId(),
      type: options.type,
      title: options.title,
      message: options.message,
      duration: options.duration || this.defaultDurations[options.type],
      timestamp: new Date(),
      action: options.action
    };

    // Добавляем уведомление
    const currentNotifications = this.notifications();
    
    // Ограничиваем количество уведомлений
    const updatedNotifications = [notification, ...currentNotifications].slice(0, this.maxNotifications);
    this.notifications.set(updatedNotifications);

    // Автоматическое удаление (если duration > 0)
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    console.log(`📢 ${notification.type.toUpperCase()}: ${notification.title}`, notification.message || '');
    
    return notification.id;
  }

  /**
   * Удаляет уведомление по ID
   */
  remove(id: string): void {
    const currentNotifications = this.notifications();
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notifications.set(updatedNotifications);
  }

  /**
   * Очищает все уведомления
   */
  clear(): void {
    this.notifications.set([]);
  }

  /**
   * Удаляет все уведомления определенного типа
   */
  clearByType(type: Notification['type']): void {
    const currentNotifications = this.notifications();
    const updatedNotifications = currentNotifications.filter(n => n.type !== type);
    this.notifications.set(updatedNotifications);
  }

  // === УТИЛИТЫ ===
  
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получает иконку для типа уведомления
   */
  getIconForType(type: Notification['type']): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  /**
   * Получает CSS класс для типа уведомления
   */
  getStyleClassForType(type: Notification['type']): string {
    return `notification-${type}`;
  }

  // === ПРЕДУСТАНОВЛЕННЫЕ УВЕДОМЛЕНИЯ ===

  /**
   * Уведомления для операций с конфигурацией
   */
  configSaved(): void {
    this.success(
      'Конфигурация сохранена', 
      'Настройки успешно применены к системе'
    );
  }

  configError(error: string): void {
    this.error(
      'Ошибка конфигурации',
      `Не удалось сохранить настройки: ${error}`
    );
  }

  /**
   * Уведомления для ERM операций
   */
  ermConnectionSuccess(): void {
    this.success(
      'ERM соединение установлено',
      'API доступен и готов к работе'
    );
  }

  ermConnectionError(error: string): void {
    this.error(
      'Ошибка подключения к ERM',
      error
    );
  }

  /**
   * Уведомления для операций с данными
   */
  dataLoaded(count: number, type: string): void {
    this.success(
      'Данные загружены',
      `Получено ${count} записей (${type})`
    );
  }

  dataLoadError(type: string, error: string): void {
    this.error(
      `Ошибка загрузки ${type}`,
      error
    );
  }

  /**
   * Уведомления для файловых операций
   */
  fileExported(filename: string): void {
    this.success(
      'Файл экспортирован',
      `Сохранено как ${filename}`
    );
  }

  fileImported(filename: string): void {
    this.success(
      'Файл импортирован',
      `Данные загружены из ${filename}`
    );
  }
}
