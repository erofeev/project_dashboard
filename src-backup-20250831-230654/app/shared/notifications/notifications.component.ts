import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  NotificationService, 
  type Notification 
} from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- УВЕДОМЛЕНИЯ В ПРАВОМ НИЖНЕМ УГЛУ -->
    <div class="notifications-container">
      @for (notification of notifications(); track notification.id) {
        <div 
          class="notification" 
          [class]="'notification-' + notification.type"
        >
          
          <!-- ИКОНКА И ОСНОВНОЙ КОНТЕНТ -->
          <div class="notification-content">
            <div class="notification-icon">
              {{ getIconForType(notification.type) }}
            </div>
            
            <div class="notification-text">
              <div class="notification-title">{{ notification.title }}</div>
              @if (notification.message) {
                <div class="notification-message">{{ notification.message }}</div>
              }
            </div>
          </div>

          <!-- КНОПКИ ДЕЙСТВИЙ -->
          <div class="notification-actions">
            @if (notification.action) {
              <button 
                class="notification-action-btn"
                (click)="executeAction(notification)"
              >
                {{ notification.action.label }}
              </button>
            }
            
            <button 
              class="notification-close-btn"
              (click)="removeNotification(notification.id)"
              title="Закрыть"
            >
              ✕
            </button>
          </div>

          <!-- ПРОГРЕСС-БАР АВТОМАТИЧЕСКОГО ИСЧЕЗНОВЕНИЯ -->
          @if (notification.duration && notification.duration > 0) {
            <div class="notification-progress">
              <div 
                class="notification-progress-bar"
                [style.animation-duration.ms]="notification.duration"
              ></div>
            </div>
          }
          
        </div>
      }
    </div>
  `,
  styles: [`
    // === КОНТЕЙНЕР УВЕДОМЛЕНИЙ ===
    .notifications-container {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
      pointer-events: none; // Контейнер не блокирует клики
    }

    // === ОТДЕЛЬНОЕ УВЕДОМЛЕНИЕ ===
    .notification {
      pointer-events: auto; // Само уведомление кликабельно
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(0);
      
      // Анимация появления
      animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover {
        transform: translateX(-5px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      }
    }

    // === ТИПЫ УВЕДОМЛЕНИЙ ===
    .notification-success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
      border-left: 4px solid #10b981;
    }

    .notification-error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
      border-left: 4px solid #ef4444;
    }

    .notification-warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
      border-left: 4px solid #f59e0b;
    }

    .notification-info {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05));
      border-left: 4px solid #6366f1;
    }

    // === КОНТЕНТ УВЕДОМЛЕНИЯ ===
    .notification-content {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .notification-icon {
      font-size: 1.2rem;
      line-height: 1;
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    .notification-text {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.9);
      margin-bottom: 0.2rem;
    }

    .notification-message {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.4;
      word-wrap: break-word;
    }

    // === ДЕЙСТВИЯ ===
    .notification-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .notification-action-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }
    }

    .notification-close-btn {
      background: rgba(0, 0, 0, 0.1);
      border: none;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      color: rgba(0, 0, 0, 0.6);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.2);
        color: rgba(0, 0, 0, 0.8);
      }
    }

    // === ПРОГРЕСС-БАР ===
    .notification-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 0 0 12px 12px;
      overflow: hidden;
    }

    .notification-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0.6), 
        rgba(255, 255, 255, 0.8)
      );
      width: 100%;
      animation: progressDecrease linear;
      transform-origin: left center;
    }

    // === АНИМАЦИИ ===
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes progressDecrease {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    // === RESPONSIVE ===
    @media (max-width: 640px) {
      .notifications-container {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        max-width: none;
      }
      
      .notification {
        padding: 0.75rem;
      }
      
      .notification-title {
        font-size: 0.85rem;
      }
      
      .notification-message {
        font-size: 0.75rem;
      }
    }

    // === ТЕМНАЯ ТЕМА ===
    :host-context([data-theme="dark"]) {
      .notification-title {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .notification-message {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .notification-close-btn {
        color: rgba(255, 255, 255, 0.6);
        
        &:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.1);
        }
      }
      
      .notification-action-btn {
        color: rgba(255, 255, 255, 0.8);
        
        &:hover {
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }
  `]
})
export class NotificationsComponent {
  
  // === SERVICES ===
  private notificationService = inject(NotificationService);
  
  // === STATE ===
  public notifications = this.notificationService.notifications;

  // === МЕТОДЫ ===
  
  removeNotification(id: string): void {
    this.notificationService.remove(id);
  }

  executeAction(notification: Notification): void {
    if (notification.action) {
      notification.action.callback();
      // Удаляем уведомление после выполнения действия
      this.removeNotification(notification.id);
    }
  }

  getIconForType(type: Notification['type']): string {
    return this.notificationService.getIconForType(type);
  }
}
