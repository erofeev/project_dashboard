import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <h1>Аналитика</h1>
      <p>Финансовая аналитика будет здесь</p>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 20px;
      text-align: center;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  `]
})
export class AnalyticsComponent {}
