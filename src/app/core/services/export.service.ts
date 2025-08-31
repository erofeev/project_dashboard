import { Injectable } from '@angular/core';

export interface ReportData {
  id: string;
  date: Date;
  user: string;
  project: string;
  hours: number;
  rate: number;
  amount: number;
  activity: string;
  description: string;
  billable: boolean;
}

export interface GroupedData {
  key: string;
  label: string;
  totalHours: number;
  totalAmount: number;
  averageRate: number;
  count: number;
  children?: GroupedData[];
  expanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  // === ЭКСПОРТ В CSV ===
  exportToCSV(data: any[], filename: string = 'report'): void {
    if (data.length === 0) {
      console.warn('Нет данных для экспорта');
      return;
    }

    // Получаем заголовки из первого объекта
    const headers = Object.keys(data[0]);
    
    // Создаем CSV строку
    const csvContent = [
      headers.join(','), // Заголовки
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Экранируем запятые и кавычки
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  // === ЭКСПОРТ ГРУППИРОВАННЫХ ДАННЫХ ===
  exportGroupedDataToCSV(groupedData: GroupedData[], filename: string = 'grouped-report'): void {
    const csvData = groupedData.map(group => ({
      'Группа': group.label,
      'Часы': group.totalHours,
      'Сумма': group.totalAmount,
      'Средняя ставка': group.averageRate,
      'Количество записей': group.count
    }));

    this.exportToCSV(csvData, filename);
  }

  // === ЭКСПОРТ ДЕТАЛЬНЫХ ДАННЫХ ===
  exportDetailedDataToCSV(data: ReportData[], filename: string = 'detailed-report'): void {
    const csvData = data.map(record => ({
      'Дата': record.date.toLocaleDateString('ru-RU'),
      'Пользователь': record.user,
      'Проект': record.project,
      'Активность': record.activity,
      'Часы': record.hours,
      'Ставка': record.rate,
      'Сумма': record.amount,
      'Описание': record.description,
      'К оплате': record.billable ? 'Да' : 'Нет'
    }));

    this.exportToCSV(csvData, filename);
  }

  // === ЭКСПОРТ В EXCEL (XLSX) ===
  exportToExcel(data: any[], filename: string = 'report'): void {
    // Для простоты используем CSV формат, но с расширением .xlsx
    // В реальном проекте можно использовать библиотеку xlsx
    this.exportToCSV(data, filename.replace('.xlsx', ''));
  }

  // === ЭКСПОРТ СТАТИСТИКИ ===
  exportStatisticsToCSV(stats: any, filename: string = 'statistics'): void {
    const csvData = [
      {
        'Метрика': 'Всего часов',
        'Значение': stats.totalHours
      },
      {
        'Метрика': 'Общая сумма',
        'Значение': stats.totalAmount
      },
      {
        'Метрика': 'Средняя ставка',
        'Значение': stats.averageRate
      },
      {
        'Метрика': 'Количество записей',
        'Значение': stats.totalRecords
      }
    ];

    this.exportToCSV(csvData, filename);
  }

  // === ЭКСПОРТ ПО ПЕРИОДАМ ===
  exportByPeriod(data: ReportData[], period: string, filename?: string): void {
    const periodLabel = this.getPeriodLabel(period);
    const filteredData = this.filterByPeriod(data, period);
    
    this.exportDetailedDataToCSV(
      filteredData, 
      filename || `report-${periodLabel}`
    );
  }

  // === ЭКСПОРТ ПО ПРОЕКТАМ ===
  exportByProject(data: ReportData[], projectName: string): void {
    const filteredData = data.filter(record => record.project === projectName);
    
    this.exportDetailedDataToCSV(
      filteredData, 
      `report-project-${projectName.replace(/[^a-zA-Z0-9]/g, '-')}`
    );
  }

  // === ЭКСПОРТ ПО ПОЛЬЗОВАТЕЛЯМ ===
  exportByUser(data: ReportData[], userName: string): void {
    const filteredData = data.filter(record => record.user === userName);
    
    this.exportDetailedDataToCSV(
      filteredData, 
      `report-user-${userName.replace(/[^a-zA-Z0-9]/g, '-')}`
    );
  }

  // === ЭКСПОРТ СВОДНОГО ОТЧЕТА ===
  exportSummaryReport(data: ReportData[], filename: string = 'summary-report'): void {
    // Группируем данные по проектам
    const projectSummary = this.groupByProject(data);
    
    // Группируем данные по пользователям
    const userSummary = this.groupByUser(data);
    
    // Группируем данные по месяцам
    const monthlySummary = this.groupByMonth(data);

    // Создаем сводный отчет
    const summaryData = [
      { 'Раздел': '=== СВОДКА ПО ПРОЕКТАМ ===' },
      ...projectSummary.map(item => ({
        'Категория': item.project,
        'Часы': item.totalHours,
        'Сумма': item.totalAmount,
        'Записей': item.count
      })),
      { 'Раздел': '' },
      { 'Раздел': '=== СВОДКА ПО ПОЛЬЗОВАТЕЛЯМ ===' },
      ...userSummary.map(item => ({
        'Категория': item.user,
        'Часы': item.totalHours,
        'Сумма': item.totalAmount,
        'Записей': item.count
      })),
      { 'Раздел': '' },
      { 'Раздел': '=== СВОДКА ПО МЕСЯЦАМ ===' },
      ...monthlySummary.map(item => ({
        'Категория': item.month,
        'Часы': item.totalHours,
        'Сумма': item.totalAmount,
        'Записей': item.count
      }))
    ];

    this.exportToCSV(summaryData, filename);
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private getPeriodLabel(period: string): string {
    const labels: { [key: string]: string } = {
      'today': 'today',
      'week': 'this-week',
      'month': 'this-month',
      'quarter': 'this-quarter',
      'year': 'this-year',
      'all': 'all-time'
    };
    return labels[period] || period;
  }

  private filterByPeriod(data: ReportData[], period: string): ReportData[] {
    if (period === 'all') return data;

    const now = new Date();
    const startDate = this.getStartDate(now, period);
    
    return data.filter(record => record.date >= startDate);
  }

  private getStartDate(now: Date, period: string): Date {
    const start = new Date(now);
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return start;
  }

  private groupByProject(data: ReportData[]): any[] {
    const groups = new Map<string, any>();
    
    data.forEach(record => {
      if (!groups.has(record.project)) {
        groups.set(record.project, {
          project: record.project,
          totalHours: 0,
          totalAmount: 0,
          count: 0
        });
      }
      
      const group = groups.get(record.project)!;
      group.totalHours += record.hours;
      group.totalAmount += record.amount;
      group.count++;
    });
    
    return Array.from(groups.values());
  }

  private groupByUser(data: ReportData[]): any[] {
    const groups = new Map<string, any>();
    
    data.forEach(record => {
      if (!groups.has(record.user)) {
        groups.set(record.user, {
          user: record.user,
          totalHours: 0,
          totalAmount: 0,
          count: 0
        });
      }
      
      const group = groups.get(record.user)!;
      group.totalHours += record.hours;
      group.totalAmount += record.amount;
      group.count++;
    });
    
    return Array.from(groups.values());
  }

  private groupByMonth(data: ReportData[]): any[] {
    const groups = new Map<string, any>();
    
    data.forEach(record => {
      const monthKey = `${record.date.getFullYear()}-${record.date.getMonth() + 1}`;
      const monthLabel = record.date.toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          month: monthLabel,
          totalHours: 0,
          totalAmount: 0,
          count: 0
        });
      }
      
      const group = groups.get(monthKey)!;
      group.totalHours += record.hours;
      group.totalAmount += record.amount;
      group.count++;
    });
    
    return Array.from(groups.values());
  }
}
