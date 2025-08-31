import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-time-entries',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- TIME ENTRIES REPORT - ВРЕМЕННАЯ ЗАГЛУШКА -->
    <div class="time-entries-container glass-card">
      <h2 class="section-title">
        {{ currentLang() === 'ru' ? '⏰ Временные записи' : '⏰ Time Entries' }}
      </h2>
      
      <div class="report-placeholder">
        <h3>{{ currentLang() === 'ru' ? '🚀 Здесь будет AG-Grid таблица' : '🚀 AG-Grid Table will be here' }}</h3>
        
        <div class="features-preview">
          <h4>{{ currentLang() === 'ru' ? 'Планируемые возможности:' : 'Planned features:' }}</h4>
          <ul>
            <li>{{ currentLang() === 'ru' ? '✅ AG-Grid таблица с данными из ERM' : '✅ AG-Grid table with ERM data' }}</li>
            <li>{{ currentLang() === 'ru' ? '✅ Гибридный расчет стоимости (оклад + почасовая)' : '✅ Hybrid cost calculation (salary + hourly)' }}</li>
            <li>{{ currentLang() === 'ru' ? '✅ Фильтры по пользователям, проектам, датам' : '✅ Filters by users, projects, dates' }}</li>
            <li>{{ currentLang() === 'ru' ? '✅ Экспорт в Excel/CSV' : '✅ Export to Excel/CSV' }}</li>
            <li>{{ currentLang() === 'ru' ? '✅ Slicers для интерактивной фильтрации' : '✅ Interactive slicers for filtering' }}</li>
          </ul>
        </div>
        
        <div class="next-steps">
          <p><strong>
            {{ currentLang() === 'ru' ? '👉 Следующий шаг: настройте ERM подключение в Настройках' : '👉 Next step: configure ERM connection in Settings' }}
          </strong></p>
          <a routerLink="/settings" class="setup-btn">
            {{ currentLang() === 'ru' ? '⚙️ Перейти к настройкам' : '⚙️ Go to Settings' }}
          </a>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    .time-entries-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .report-placeholder {
      text-align: center;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      margin: 1rem 0;
    }
    
    .features-preview {
      margin: 2rem 0;
      text-align: left;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .features-preview ul {
      list-style: none;
      padding: 0;
    }
    
    .features-preview li {
      margin: 0.5rem 0;
      padding: 0.3rem 0;
    }
    
    .next-steps {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 8px;
    }
    
    .setup-btn {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.8rem 1.5rem;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 8px;
      text-decoration: none;
      color: #6366f1;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(99, 102, 241, 0.2);
        transform: translateY(-2px);
      }
    }
  `]
})
export class TimeEntriesComponent {
  public currentLang = signal('ru');

  constructor() {
    // Синхронизируем с основным приложением
    const savedLang = localStorage.getItem('preferredLanguage') || 'ru';
    this.currentLang.set(savedLang);
    
    // Слушаем изменения языка
    window.addEventListener('storage', (e) => {
      if (e.key === 'preferredLanguage' && e.newValue) {
        this.currentLang.set(e.newValue);
      }
    });
  }
}
