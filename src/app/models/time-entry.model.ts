export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  hours: number;
  date: Date;
  comments?: string;
  description?: string;        // Описание работы
  
  // Рассчитываемые поля
  calculatedCost: number;      // Стоимость = часы * почасовая ставка
  userHourlyRate: number;     // Почасовая ставка пользователя на момент записи
  
  // Интеграции
  openProjectId?: string;     // ID в OpenProject
  ermId?: string;             // ID в ERM системе
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryWithDetails extends TimeEntry {
  user?: {
    name: string;
    role: string;
  };
  project?: {
    name: string;
    status: string;
  };
}
