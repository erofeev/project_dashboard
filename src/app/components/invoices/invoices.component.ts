import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invoices-container">
      <h1>Счета</h1>
      <p>Управление счетами будет здесь</p>
    </div>
  `,
  styles: [`
    .invoices-container {
      padding: 20px;
      text-align: center;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  `]
})
export class InvoicesComponent {}
