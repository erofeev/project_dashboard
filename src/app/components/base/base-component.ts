import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { getComponentSize } from '../../config/primeng-config';

/**
 * Базовый компонент для всех компонентов приложения
 * Содержит общую логику и правила стилизации
 */
@Component({
  template: '',
  standalone: true
})
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  // ПРАВИЛО: Везде используем компактные размеры
  protected readonly componentSize = getComponentSize();
  
  // Общие CSS классы для компактности
  protected readonly compactClasses = {
    button: 'p-button-sm',
    input: 'p-inputtext-sm', 
    table: 'p-datatable-sm p-datatable-striped',
    card: 'p-card-sm',
    panel: 'p-panel-sm'
  };

  // Стандартные конфигурации для компонентов
  protected readonly tableConfig = {
    paginator: true,
    rows: 25,
    rowsPerPageOptions: [10, 25, 50],
    sortMode: 'multiple' as const,
    scrollable: true,
    scrollHeight: 'calc(100vh - 300px)',
    styleClass: 'p-datatable-striped p-datatable-gridlines p-datatable-sm',
    resizableColumns: true,
    reorderableColumns: true,
    responsiveLayout: 'scroll' as const
  };

  protected readonly dialogConfig = {
    modal: true,
    closable: true,
    resizable: false,
    draggable: false,
    styleClass: 'compact-dialog'
  };

  protected readonly buttonConfig = {
    size: 'small' as const,
    styleClass: 'compact-button'
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Хелпер для получения локализованного текста
   */
  protected getLocalizedText(ruText: string, enText: string): string {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ru';
    return currentLang === 'ru' ? ruText : enText;
  }

  /**
   * Хелпер для форматирования валюты
   */
  protected formatCurrency(amount: number): string {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ru';
    return new Intl.NumberFormat(currentLang === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Хелпер для форматирования чисел
   */
  protected formatNumber(value: number, fractionDigits: number = 2): string {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ru';
    return new Intl.NumberFormat(currentLang === 'ru' ? 'ru-RU' : 'en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value);
  }

  /**
   * Хелпер для форматирования дат
   */
  protected formatDate(date: Date): string {
    const currentLang = localStorage.getItem('selectedLanguage') || 'ru';
    return new Intl.DateTimeFormat(currentLang === 'ru' ? 'ru-RU' : 'en-US').format(date);
  }
}
