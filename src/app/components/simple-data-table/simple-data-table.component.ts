import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Imports - используем только основные компоненты
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';

// Базовый компонент с правилами стилизации
import { BaseComponent } from '../base/base-component';

@Component({
  selector: 'app-simple-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    Button,
    Card
  ],
  template: `
    <div class="simple-table-container p-4">
      <p-card 
        [header]="getLocalizedText('Таблица данных времени', 'Time Entries Table')" 
        styleClass="glass-card">
        <div class="card-content">
          <div class="flex justify-content-between align-items-center mb-4">
            <h2>{{ getLocalizedText('Записи времени', 'Time Entries') }}</h2>
            <div class="actions">
              <p-button 
                [label]="getLocalizedText('Обновить', 'Refresh')" 
                icon="pi pi-refresh" 
                [size]="componentSize"
                (click)="loadData()"
                [loading]="loading">
              </p-button>
            </div>
          </div>

          <!-- Простая таблица без PrimeNG Table -->
          <div class="data-table">
            <table class="w-full">
              <thead>
                <tr class="table-header">
                  <th>Пользователь</th>
                  <th>Проект</th>
                  <th>Дата</th>
                  <th>Часы</th>
                  <th>Стоимость</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let entry of timeEntries; trackBy: trackByFn" class="table-row">
                  <td>{{ entry.userName }}</td>
                  <td>{{ entry.projectName }}</td>
                  <td>{{ entry.date | date:'dd.MM.yyyy' }}</td>
                  <td>{{ entry.hours | number:'1.2-2' }}</td>
                  <td>{{ entry.cost | currency:'RUB':'symbol':'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="summary mt-4 p-3">
            <div class="flex gap-4">
              <div class="stat">
                <span class="label">{{ getLocalizedText('Всего записей:', 'Total entries:') }}</span>
                <span class="value">{{ timeEntries.length }}</span>
              </div>
              <div class="stat">
                <span class="label">{{ getLocalizedText('Общие часы:', 'Total hours:') }}</span>
                <span class="value">{{ formatNumber(getTotalHours()) }}</span>
              </div>
              <div class="stat">
                <span class="label">{{ getLocalizedText('Общая стоимость:', 'Total cost:') }}</span>
                <span class="value">{{ formatCurrency(getTotalCost()) }}</span>
              </div>
            </div>
          </div>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .simple-table-container {
      height: 100%;
    }

    .glass-card {
      background: rgba(30, 41, 59, 0.8) !important;
      backdrop-filter: blur(25px) !important;
      border: 1px solid rgba(59, 130, 246, 0.2) !important;
      border-radius: 12px !important;
    }

    .data-table {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    table {
      border-collapse: collapse;
      background: rgba(15, 23, 42, 0.6);
    }

    .table-header {
      background: rgba(59, 130, 246, 0.15);
      border-bottom: 1px solid rgba(59, 130, 246, 0.3);
    }

    th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #f8fafc;
      border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    }

    .table-row {
      transition: all 0.3s ease;
      border-bottom: 1px solid rgba(59, 130, 246, 0.1);
    }

    .table-row:hover {
      background: rgba(59, 130, 246, 0.1);
    }

    td {
      padding: 0.75rem 1rem;
      color: #cbd5e1;
    }

    .summary {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(59, 130, 246, 0.1);
      border-radius: 8px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat .label {
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .stat .value {
      font-size: 1.125rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Адаптивность */
    @media (max-width: 768px) {
      .data-table {
        font-size: 0.875rem;
      }
      
      th, td {
        padding: 0.5rem;
      }

      .flex {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class SimpleDataTableComponent extends BaseComponent implements OnInit {
  loading = false;
  timeEntries: any[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      // Симуляция загрузки данных
      await this.simulateDataLoad();
    } finally {
      this.loading = false;
    }
  }

  private async simulateDataLoad(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.timeEntries = this.generateMockData();
        resolve();
      }, 1000);
    });
  }

  private generateMockData(): any[] {
    const users = ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Козлов К.К.'];
    const projects = ['Проект Alpha', 'Проект Beta', 'Проект Gamma', 'Проект Delta'];
    
    const data = [];
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const hours = Math.random() * 8 + 0.5;
      const rate = 1500 + Math.random() * 2000;
      
      data.push({
        id: i + 1,
        userName: users[Math.floor(Math.random() * users.length)],
        projectName: projects[Math.floor(Math.random() * projects.length)],
        date: date,
        hours: Math.round(hours * 100) / 100,
        cost: Math.round(hours * rate * 100) / 100
      });
    }
    
    return data;
  }

  trackByFn(index: number, item: any): any {
    return item.id;
  }

  getTotalHours(): number {
    return this.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  }

  getTotalCost(): number {
    return this.timeEntries.reduce((sum, entry) => sum + entry.cost, 0);
  }
}
