import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Панель управления проектами</h1>
      <p>Добро пожаловать в систему управления проектами!</p>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Проекты</h3>
          <p class="metric-value">0</p>
          <p class="metric-label">Всего проектов</p>
        </div>
        
        <div class="metric-card">
          <h3>Сотрудники</h3>
          <p class="metric-value">0</p>
          <p class="metric-label">Всего сотрудников</p>
        </div>
        
        <div class="metric-card">
          <h3>Выручка</h3>
          <p class="metric-value">0 ₽</p>
          <p class="metric-label">Общая выручка</p>
        </div>
        
        <div class="metric-card">
          <h3>Маржа</h3>
          <p class="metric-value">0 ₽</p>
          <p class="metric-label">Общая маржа</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    
    .metric-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 20px;
      text-align: center;
      transition: transform 0.3s ease;
    }
    
    .metric-card:hover {
      transform: translateY(-5px);
    }
    
    .metric-card h3 {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 1.1rem;
    }
    
    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 10px 0;
      color: #2196F3;
    }
    
    .metric-label {
      color: #888;
      margin: 0;
      font-size: 0.9rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  ngOnInit(): void {
    // Инициализация компонента
  }
}
