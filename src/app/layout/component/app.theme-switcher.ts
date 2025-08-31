import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3">
      <!-- Переключатель темы -->
      <button 
        (click)="toggleTheme()"
        class="theme-switcher-btn"
        [title]="isDarkMode() ? 'Переключить на светлую тему' : 'Переключить на темную тему'"
      >
        <i [class]="isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
        <span class="theme-label">{{ isDarkMode() ? 'Светлая' : 'Темная' }}</span>
      </button>

      <!-- Переключатель языка -->
      <button 
        (click)="toggleLanguage()"
        class="language-switcher-btn"
        [title]="'Переключить язык: ' + (currentLanguage() === 'ru' ? 'English' : 'Русский')"
      >
        <i class="pi pi-globe text-lg"></i>
        <span class="language-label">{{ currentLanguage() === 'ru' ? 'EN' : 'RU' }}</span>
      </button>

      <!-- Уведомления -->
      <button class="notifications-btn" title="Уведомления">
        <i class="pi pi-bell text-lg"></i>
        <span class="notification-badge">3</span>
      </button>

      <!-- Профиль пользователя -->
      <div class="user-profile">
        <img src="https://via.placeholder.com/32x32/3b82f6/ffffff?text=U" 
             alt="User" 
             class="user-avatar">
        <span class="user-name">Администратор</span>
        <i class="pi pi-chevron-down text-xs"></i>
      </div>
    </div>
  `,
  styles: [`
    .theme-switcher-btn, .language-switcher-btn, .notifications-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      transition: var(--transition-smooth);
      cursor: pointer;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    
    .theme-switcher-btn:hover, .language-switcher-btn:hover, .notifications-btn:hover {
      background: var(--surface-elevated);
      border-color: var(--glass-border-hover);
      box-shadow: var(--shadow-elevated);
      transform: translateY(-1px);
    }

    .notifications-btn {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-subtle);
      transition: var(--transition-smooth);
      cursor: pointer;
    }

    .user-profile:hover {
      background: var(--surface-elevated);
      border-color: var(--glass-border-hover);
      box-shadow: var(--shadow-elevated);
      transform: translateY(-1px);
    }

    .user-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      border: 2px solid var(--glass-border);
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .theme-label, .language-label {
      font-size: 0.75rem;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .theme-label, .language-label, .user-name {
        display: none;
      }
    }
  `]
})
export class AppThemeSwitcher {
  private translate = inject(TranslateService);
  
  // Сигналы для управления состоянием
  private currentLanguageSignal = signal<string>('ru');
  private isDarkModeSignal = signal<boolean>(false);
  
  // Вычисляемые свойства
  public readonly currentLanguage = computed(() => this.currentLanguageSignal());
  public readonly isDarkMode = computed(() => this.isDarkModeSignal());

  constructor() {
    this.initializeTheme();
    this.initializeLanguage();
  }

  private initializeTheme(): void {
    // Проверяем сохраненную тему или системные настройки
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    this.setTheme(shouldUseDark);
  }

  private initializeLanguage(): void {
    // Проверяем сохраненный язык
    const savedLanguage = localStorage.getItem('language') || 'ru';
    this.setLanguage(savedLanguage);
  }

  public toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  public toggleLanguage(): void {
    const newLang = this.currentLanguage() === 'ru' ? 'en' : 'ru';
    this.setLanguage(newLang);
  }

  private setTheme(isDark: boolean): void {
    this.isDarkModeSignal.set(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('app-dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('app-dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  private setLanguage(lang: string): void {
    this.currentLanguageSignal.set(lang);
    this.translate.use(lang);
    localStorage.setItem('language', lang);
    
    // Обновляем атрибут языка для HTML
    document.documentElement.lang = lang;
  }
}
