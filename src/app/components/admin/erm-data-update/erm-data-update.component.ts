import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ERMService } from '../../../services/erm.service';
import { ProgressService } from '../../../services/progress.service';

@Component({
  selector: 'app-erm-data-update',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  templateUrl: './erm-data-update.component.html',
  styleUrls: ['./erm-data-update.component.scss']
})
export class ERMDataUpdateComponent implements OnInit, OnDestroy {
  updateForm: FormGroup;
  isUpdating = false;
  progress = 0;
  logs: string[] = [];
  currentStep = '';
  
  private progressSubscription: any;

  constructor(
    private fb: FormBuilder,
    private ermService: ERMService,
    private progressService: ProgressService,
    private snackBar: MatSnackBar
  ) {
    this.updateForm = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      updateUsers: [true],
      updateProjects: [true],
      updateTimeEntries: [true],
      updateActivities: [true]
    });
  }

  ngOnInit(): void {
    this.initializeDefaultDates();
    this.subscribeToProgress();
  }

  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }

  private initializeDefaultDates(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    this.updateForm.patchValue({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
  }

  private subscribeToProgress(): void {
    this.progressSubscription = this.progressService.progress$.subscribe(progress => {
      this.progress = progress.value;
      this.currentStep = progress.step;
      
      if (progress.log) {
        this.addLog(progress.log);
      }
    });
  }

  async handleUpdateData(): Promise<void> {
    if (this.isUpdating || !this.updateForm.valid) {
      return;
    }

    this.isUpdating = true;
    this.progress = 0;
    this.logs = [];
    this.currentStep = '';

    try {
      const formValue = this.updateForm.value;
      
      this.addLog('Начинаем обновление данных из ЕРМ...');
      
      // Обновляем пользователей
      if (formValue.updateUsers) {
        this.addLog('Загружаем данные о пользователях...');
        this.progressService.updateProgress(20, 'Загрузка пользователей');
        await this.ermService.updateUsers();
      }
      
      // Обновляем проекты
      if (formValue.updateProjects) {
        this.addLog('Загружаем данные о проектах...');
        this.progressService.updateProgress(40, 'Загрузка проектов');
        await this.ermService.updateProjects();
      }
      
      // Обновляем временные записи
      if (formValue.updateTimeEntries) {
        this.addLog('Загружаем временные записи...');
        this.progressService.updateProgress(60, 'Загрузка временных записей');
        await this.ermService.updateTimeEntries(formValue.startDate, formValue.endDate);
      }
      
      // Обновляем активности
      if (formValue.updateActivities) {
        this.addLog('Загружаем данные об активностях...');
        this.progressService.updateProgress(80, 'Загрузка активностей');
        await this.ermService.updateActivities();
      }
      
      this.progressService.updateProgress(100, 'Завершено');
      this.addLog('Обновление данных завершено успешно!');
      
      this.snackBar.open('Данные успешно обновлены из ЕРМ', 'Закрыть', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      
    } catch (error: any) {
      const errorMessage = error.message || 'Неизвестная ошибка';
      this.addLog(`Ошибка при обновлении данных: ${errorMessage}`);
      
      this.snackBar.open(`Ошибка обновления: ${errorMessage}`, 'Закрыть', {
        duration: 10000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isUpdating = false;
    }
  }

  private addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.unshift(`[${timestamp}] ${message}`);
    
    // Ограничиваем количество записей в логе
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
  }







  clearLogs(): void {
    this.logs = [];
  }

  get isFormValid(): boolean {
    return this.updateForm.valid && !this.isUpdating;
  }

  trackByLog(index: number, log: string): string {
    return log;
  }
}
