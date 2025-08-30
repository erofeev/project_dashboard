import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="projects-container">
      <h1>Проекты</h1>
      <p>Список проектов будет здесь</p>
    </div>
  `,
  styles: [`
    .projects-container {
      padding: 20px;
      text-align: center;
    }
    
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
  `]
})
export class ProjectsComponent {}
