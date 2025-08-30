import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="login-container">
      <div class="login-card glassmorphism">
        <div class="login-header">
          <h1 class="login-title">{{ 'AUTH.LOGIN_TITLE' | translate }}</h1>
          <p class="login-subtitle">{{ 'AUTH.LOGIN_SUBTITLE' | translate }}</p>
        </div>

        <form class="login-form" (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email" class="form-label">{{ 'AUTH.EMAIL' | translate }}</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              class="form-input glassmorphism-input"
              placeholder="{{ 'AUTH.EMAIL_PLACEHOLDER' | translate }}"
              [class.error]="showError && !email"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">{{ 'AUTH.PASSWORD' | translate }}</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              class="form-input glassmorphism-input"
              placeholder="{{ 'AUTH.PASSWORD_PLACEHOLDER' | translate }}"
              [class.error]="showError && !password"
            />
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary glassmorphism-btn"
              [disabled]="isLoading"
            >
              <span *ngIf="!isLoading">{{ 'AUTH.LOGIN_BUTTON' | translate }}</span>
              <span *ngIf="isLoading">{{ 'AUTH.LOGGING_IN' | translate }}</span>
            </button>
          </div>

          <div class="demo-credentials">
            <p class="demo-text">{{ 'AUTH.DEMO_CREDENTIALS' | translate }}</p>
            <p class="demo-email">admin@admin.ru / admin</p>
            <button 
              type="button" 
              class="btn btn-secondary glassmorphism-btn" 
              (click)="clearAuth()"
              style="margin-top: 10px; font-size: 12px; padding: 8px 16px;">
              Очистить аутентификацию (для тестирования)
            </button>
          </div>
        </form>

        <div *ngIf="errorMessage" class="error-message glassmorphism-error">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="success-message glassmorphism-success">
          {{ successMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 40px;
      border-radius: 20px;
      backdrop-filter: blur(20px);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .login-title {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin: 0 0 10px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .login-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1rem;
      margin: 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .form-input {
      padding: 15px 20px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.15);
      color: white;
      backdrop-filter: blur(10px);
    }

    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .form-input:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.25);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    .form-input.error {
      border: 2px solid #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
    }

    .form-actions {
      margin-top: 10px;
    }

    .btn {
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .demo-credentials {
      margin-top: 20px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      text-align: center;
    }

    .demo-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      margin: 0 0 8px 0;
    }

    .demo-email {
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
      margin: 0;
      font-family: 'Courier New', monospace;
    }

    .error-message {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      background: rgba(255, 107, 107, 0.2);
      border: 1px solid rgba(255, 107, 107, 0.3);
      color: #ff6b6b;
      text-align: center;
      font-weight: 500;
    }

    .success-message {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid rgba(76, 175, 80, 0.3);
      color: #4caf50;
      text-align: center;
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 30px 20px;
        margin: 10px;
      }

      .login-title {
        font-size: 1.5rem;
      }

      .form-input {
        padding: 12px 16px;
      }

      .btn {
        padding: 12px;
      }
    }
  `]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  showError: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onLogin(): Promise<void> {
    this.showError = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Пожалуйста, заполните все поля';
      return;
    }

    this.isLoading = true;

    try {
      const result = await this.authService.login(this.email, this.password);
      
      if (result.success) {
        this.successMessage = result.message;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      } else {
        this.errorMessage = result.message;
      }
    } catch (error) {
      this.errorMessage = 'Произошла ошибка при входе в систему';
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  clearAuth(): void {
    console.log('Starting clear auth process...');
    this.successMessage = 'Аутентификация очищена. Перезагрузите страницу.';
    
    // Добавляем небольшую задержку перед очисткой, чтобы сообщение успело отобразиться
    setTimeout(() => {
      this.authService.forceClearAuth();
      console.log('Authentication cleared via service');
      
      // Очищаем сообщение через 5 секунд
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    }, 100);
  }
}
