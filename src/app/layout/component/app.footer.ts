import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <!-- Основная информация -->
        <div class="footer-section">
          <div class="footer-brand">
            <div class="brand-logo">
              <svg viewBox="0 0 54 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M17.1637 19.2467C17.1566 19.4033 17.1529 19.561 17.1529 19.7194C17.1529 25.3503 21.7203 29.915 27.3546 29.915C32.9887 29.915 37.5561 25.3503 37.5561 19.7194C37.5561 19.5572 37.5524 19.3959 37.5449 19.2355C38.5617 19.0801 39.5759 18.9013 40.5867 18.6994L40.6926 18.6782C40.7191 19.0218 40.7326 19.369 40.7326 19.7194C40.7326 27.1036 34.743 33.0896 27.3546 33.0896C19.966 33.0896 13.9765 27.1036 13.9765 19.7194C13.9765 19.374 13.9896 19.0316 14.0154 18.6927L14.0486 18.6994C15.0837 18.9062 16.1223 19.0886 17.1637 19.2467Z"
                  fill="var(--primary-color)"
                />
              </svg>
              <span class="brand-name">Analytics Portal</span>
            </div>
            <p class="brand-description">
              Профессиональная система аналитики и управления проектами с поддержкой 
              мультипользовательской работы и интеграцией с внешними системами.
            </p>
            <div class="social-links">
              <a href="#" class="social-link" title="GitHub">
                <i class="pi pi-github"></i>
              </a>
              <a href="#" class="social-link" title="LinkedIn">
                <i class="pi pi-linkedin"></i>
              </a>
              <a href="#" class="social-link" title="Twitter">
                <i class="pi pi-twitter"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Навигация -->
        <div class="footer-section">
          <h4 class="footer-title">Навигация</h4>
          <ul class="footer-links">
            <li><a routerLink="/" class="footer-link">Дашборд</a></li>
            <li><a routerLink="/analytics" class="footer-link">Аналитика</a></li>
            <li><a routerLink="/projects" class="footer-link">Проекты</a></li>
            <li><a routerLink="/reports" class="footer-link">Отчеты</a></li>
            <li><a routerLink="/users" class="footer-link">Пользователи</a></li>
          </ul>
        </div>

        <!-- Ресурсы -->
        <div class="footer-section">
          <h4 class="footer-title">Ресурсы</h4>
          <ul class="footer-links">
            <li><a routerLink="/documentation" class="footer-link">Документация</a></li>
            <li><a routerLink="/help" class="footer-link">Помощь</a></li>
            <li><a routerLink="/api" class="footer-link">API</a></li>
            <li><a routerLink="/integrations" class="footer-link">Интеграции</a></li>
            <li><a routerLink="/changelog" class="footer-link">Обновления</a></li>
          </ul>
        </div>

        <!-- Поддержка -->
        <div class="footer-section">
          <h4 class="footer-title">Поддержка</h4>
          <ul class="footer-links">
            <li><a routerLink="/contact" class="footer-link">Контакты</a></li>
            <li><a routerLink="/support" class="footer-link">Техподдержка</a></li>
            <li><a routerLink="/feedback" class="footer-link">Обратная связь</a></li>
            <li><a routerLink="/status" class="footer-link">Статус системы</a></li>
          </ul>
        </div>

        <!-- Статистика -->
        <div class="footer-section">
          <h4 class="footer-title">Статистика</h4>
          <div class="footer-stats">
            <div class="stat-item">
              <span class="stat-value">{{ totalUsers() }}</span>
              <span class="stat-label">Пользователей</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalProjects() }}</span>
              <span class="stat-label">Проектов</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalHours() }}</span>
              <span class="stat-label">Часов</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Нижняя часть футера -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <div class="copyright">
            <span>&copy; {{ currentYear() }} Analytics Portal. Все права защищены.</span>
          </div>
          <div class="footer-bottom-links">
            <a routerLink="/privacy" class="footer-bottom-link">Конфиденциальность</a>
            <a routerLink="/terms" class="footer-bottom-link">Условия использования</a>
            <a routerLink="/cookies" class="footer-bottom-link">Cookies</a>
          </div>
          <div class="version-info">
            <span class="version">v2.0.0</span>
            <span class="build">Build {{ buildNumber() }}</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: var(--surface-primary);
      backdrop-filter: var(--blur-light);
      -webkit-backdrop-filter: var(--blur-light);
      border-top: 1px solid var(--glass-border);
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 1.5rem 2rem;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 2rem;
    }

    .footer-section {
      display: flex;
      flex-direction: column;
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 2rem;
      height: 2rem;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .brand-description {
      color: var(--text-secondary);
      line-height: 1.6;
      font-size: 0.875rem;
    }

    .social-links {
      display: flex;
      gap: 0.75rem;
    }

    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      background: var(--surface-elevated);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      color: var(--text-secondary);
      transition: var(--transition-smooth);
      text-decoration: none;
    }

    .social-link:hover {
      background: var(--surface-primary);
      border-color: var(--glass-border-hover);
      color: var(--text-primary);
      transform: translateY(-2px);
    }

    .footer-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      transition: var(--transition-smooth);
    }

    .footer-link:hover {
      color: var(--text-primary);
    }

    .footer-stats {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      font-family: var(--font-family-mono);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-bottom {
      border-top: 1px solid var(--glass-border);
      background: var(--surface-elevated);
    }

    .footer-bottom-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .copyright {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .footer-bottom-links {
      display: flex;
      gap: 1.5rem;
    }

    .footer-bottom-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      transition: var(--transition-smooth);
    }

    .footer-bottom-link:hover {
      color: var(--text-primary);
    }

    .version-info {
      display: flex;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .version {
      font-weight: 500;
    }

    .build {
      font-family: var(--font-family-mono);
    }

    @media (max-width: 1024px) {
      .footer-content {
        grid-template-columns: 1fr 1fr 1fr;
        gap: 2rem;
      }
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 2rem 1rem 1.5rem;
      }

      .footer-bottom-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .footer-bottom-links {
        justify-content: center;
      }
    }
  `]
})
export class AppFooter {
  // Сигналы для статистики
  private totalUsersData = signal<number>(25);
  private totalProjectsData = signal<number>(15);
  private totalHoursData = signal<number>(150);
  private buildNumberData = signal<string>('2024.08.31');

  // Вычисляемые свойства
  public readonly totalUsers = computed(() => this.totalUsersData());
  public readonly totalProjects = computed(() => this.totalProjectsData());
  public readonly totalHours = computed(() => this.totalHoursData());
  public readonly buildNumber = computed(() => this.buildNumberData());
  public readonly currentYear = computed(() => new Date().getFullYear());
}