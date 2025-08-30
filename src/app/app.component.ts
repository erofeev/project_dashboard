import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, AuthState } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslateModule],
  template: `
    <div class="app-container" *ngIf="authState.isAuthenticated">
      <header class="glass-header">
        <h1 class="glass-title">Управление проектами</h1>
        <nav class="glass-nav">
          <a routerLink="/dashboard" class="glass-nav-link">Дашборд</a>
          <a routerLink="/projects" class="glass-nav-link">Проекты</a>
          <a routerLink="/employees" class="glass-nav-link">Сотрудники</a>
          <a routerLink="/invoices" class="glass-nav-link">Счета</a>
          <a routerLink="/analytics" class="glass-nav-link">Аналитика</a>
        </nav>
        <div class="glass-user-menu">
          <span class="user-info">
            {{ authState.currentUser?.name }} ({{ authState.currentUser?.role }})
          </span>
          <button class="glass-button glass-ripple" (click)="onLogout()">
            Выйти
          </button>
        </div>
      </header>

      <main class="glass-main">
        <router-outlet></router-outlet>
      </main>

      <footer class="glass-footer">
        <p>&copy; 2024 Project Management PWA. Система управления проектами</p>
      </footer>
    </div>

    <router-outlet *ngIf="!authState.isAuthenticated"></router-outlet>
  `,
  styles: [`
    .glass-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      margin-bottom: 30px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex-wrap: wrap;
      gap: 20px;
    }

    .glass-title {
      margin: 0;
      font-size: 2rem;
      font-weight: 300;
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .glass-nav {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .glass-nav-link {
      text-decoration: none;
      color: inherit;
      font-weight: 400;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }
    }

    .glass-user-menu {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .user-info {
      font-size: 0.9rem;
      opacity: 0.8;
      white-space: nowrap;
    }

    .glass-main {
      min-height: calc(100vh - 200px);
      margin-bottom: 30px;
    }

    .glass-footer {
      text-align: center;
      padding: 20px;
      margin-top: auto;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .glass-button {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
    }

    .glass-ripple {
      position: relative;
      overflow: hidden;
      
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }
      
      &:active::after {
        width: 300px;
        height: 300px;
      }
    }

    @media (max-width: 768px) {
      .glass-header {
        flex-direction: column;
        text-align: center;
      }
      
      .glass-nav {
        justify-content: center;
      }
      
      .glass-user-menu {
        justify-content: center;
        flex-direction: column;
        gap: 10px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  authState: AuthState = {
    isAuthenticated: false,
    currentUser: null,
    token: null
  };

  constructor(
    private translate: TranslateService,
    private router: Router,
    private authService: AuthService
  ) {
    // Настройка мультиязычности
    this.translate.setDefaultLang('ru');
    this.translate.use('ru');
  }

  ngOnInit(): void {
    // Подписываемся на изменения состояния аутентификации
    this.authService.authState$.subscribe(state => {
      this.authState = state;
    });
  }

  /**
   * Обработчик выхода из системы
   */
  async onLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
