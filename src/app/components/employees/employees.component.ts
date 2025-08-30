import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="employees-container">
      <h1>Сотрудники</h1>
      <p>Список сотрудников будет здесь</p>
    </div>
  `,
  styles: [`
    .employees-container {
      padding: 20px;
      text-align: center;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  `]
})
export class EmployeesComponent {}
