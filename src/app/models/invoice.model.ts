export enum InvoiceStatus {
  DRAFT = 'draft',           // Черновик
  SENT = 'sent',             // Отправлен клиенту
  PAID = 'paid',             // Оплачен
  PARTIALLY_PAID = 'partially_paid', // Частично оплачен
  OVERDUE = 'overdue',       // Просрочен
  CANCELLED = 'cancelled'    // Отменен
}

export enum PaymentStatus {
  PENDING = 'pending',       // Ожидает оплаты
  RECEIVED = 'received',     // Получен
  PARTIAL = 'partial',       // Частичный платеж
  OVERDUE = 'overdue'        // Просрочен
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;     // Номер счета
  issueDate: Date;           // Дата выставления
  dueDate: Date;             // Срок оплаты
  amount: number;            // Сумма счета
  currency: string;          // Валюта (RUB, USD, EUR)
  status: InvoiceStatus;
  description?: string;      // Описание работ
  items: InvoiceItem[];      // Позиции счета
  totalPaid: number;         // Общая сумма оплаченных платежей
  remainingAmount: number;   // Оставшаяся к оплате сумма
  notes?: string;            // Примечания
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;       // Описание работы/услуги
  quantity: number;          // Количество (часы, дни, штуки)
  unit: string;              // Единица измерения (часы, дни, шт.)
  unitPrice: number;         // Цена за единицу
  totalPrice: number;        // Общая стоимость позиции
}

export interface Payment {
  id: string;
  invoiceId: string;         // Связанный счет
  projectId: string;         // Проект (для быстрого поиска)
  paymentNumber: string;     // Номер платежа
  paymentDate: Date;         // Дата получения платежа
  amount: number;            // Сумма платежа
  currency: string;          // Валюта
  status: PaymentStatus;
  paymentMethod: string;     // Способ оплаты (банковский перевод, наличные, карта)
  reference?: string;        // Референс/номер документа
  notes?: string;            // Примечания
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceWithDetails extends Invoice {
  projectName: string;
  projectDirection: string;
  clientName?: string;
  payments: Payment[];
}

export interface PaymentWithDetails extends Payment {
  invoiceNumber: string;
  projectName: string;
  projectDirection: string;
}
