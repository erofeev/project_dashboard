import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProgressInfo {
  value: number;
  step: string;
  log?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private progressSubject = new BehaviorSubject<ProgressInfo>({
    value: 0,
    step: 'Готово'
  });

  public progress$: Observable<ProgressInfo> = this.progressSubject.asObservable();

  constructor() {}

  /**
   * Обновляет прогресс выполнения операции
   * @param value - значение прогресса (0-100)
   * @param step - описание текущего шага
   * @param log - дополнительное сообщение для лога
   */
  updateProgress(value: number, step: string, log?: string): void {
    const progressInfo: ProgressInfo = {
      value: Math.max(0, Math.min(100, value)), // Ограничиваем значения 0-100
      step: step,
      log: log
    };
    
    this.progressSubject.next(progressInfo);
  }

  /**
   * Сбрасывает прогресс
   */
  resetProgress(): void {
    this.updateProgress(0, 'Готово');
  }

  /**
   * Устанавливает прогресс в 100% с сообщением о завершении
   */
  completeProgress(message: string = 'Операция завершена'): void {
    this.updateProgress(100, message);
  }

  /**
   * Устанавливает прогресс в 0% с сообщением о начале
   */
  startProgress(message: string = 'Начинаем операцию...'): void {
    this.updateProgress(0, message);
  }

  /**
   * Получает текущее значение прогресса
   */
  getCurrentProgress(): ProgressInfo {
    return this.progressSubject.value;
  }

  /**
   * Устанавливает ошибку в прогресс
   */
  setError(message: string): void {
    this.updateProgress(0, `Ошибка: ${message}`);
  }
}
