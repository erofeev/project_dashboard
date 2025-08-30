export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

export interface ProjectFinancials {
  totalRevenue: number;        // Общая выручка (сумма всех счетов)
  totalCost: number;           // Общая себестоимость
  currentMargin: number;       // Текущая маржа
  projectedMargin: number;     // Прогнозируемая маржа
  budgetUtilization: number;   // Использование бюджета
  profitabilityIndex: number;  // Индекс рентабельности
  
  // Дополнительные финансовые метрики
  totalInvoiced: number;       // Общая сумма выставленных счетов
  totalPaid: number;           // Общая сумма полученных платежей
  outstandingAmount: number;   // Сумма к оплате (выставлено - оплачено)
  paymentRate: number;         // Процент оплаты (оплачено / выставлено)
  averagePaymentTime: number;  // Среднее время оплаты в днях
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  direction: string;
  status: ProjectStatus;
  
  // Финансовые данные
  contractValue: number;           // Сумма по договору
  plannedValue: number;            // Планируемая стоимость (может отличаться от договора)
  actualRevenue: number;           // Фактическая выручка (сумма оплаченных счетов)
  plannedHours: number;            // Планируемые часы
  actualHours: number;             // Фактические часы
  costPrice: number;               // Себестоимость (рассчитывается)
  margin: number;                  // Маржа (рассчитывается)
  marginPercentage: number;        // Процент маржи
  
  // Временные рамки
  startDate: Date;
  endDate?: Date;
  plannedEndDate: Date;
  
  // Интеграции
  openProjectId?: string;          // ID в OpenProject
  ermId?: string;                  // ID в ERM системе
  
  // Дополнительная информация
  clientName?: string;             // Название клиента
  contractNumber?: string;         // Номер договора
  contractDate?: Date;             // Дата договора
  isVisible: boolean;              // Видимость для сотрудников
  
  createdAt: Date;
  updatedAt: Date;
}
