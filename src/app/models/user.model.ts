export enum UserRole {
  GENERAL_DIRECTOR = 'general_director',
  DIRECTOR = 'director',
  PROJECT_MANAGER = 'project_manager',
  EMPLOYEE = 'employee'
}

export interface UserFinancials {
  salary: number;              // Месячный оклад
  hourlyRate: number;          // Почасовая ставка (если указана)
  workingDaysPerMonth: number; // Количество рабочих дней в месяц
  dailyRate: number;           // Дневная ставка (рассчитывается)
  monthlyCost: number;         // Месячная стоимость (рассчитывается)
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  direction: string;           // Направление работы
  
  // Финансовые данные (прямо в объекте для совместимости)
  salary: number;              // Месячный оклад
  hourlyRate: number;          // Почасовая ставка (если указана)
  workingDaysPerMonth: number; // Количество рабочих дней в месяц
  dailyRate: number;           // Дневная ставка (рассчитывается)
  monthlyCost: number;         // Месячная стоимость (рассчитывается)
  
  // Интеграции
  openProjectId?: string;      // ID в OpenProject
  ermId?: string;              // ID в ERM системе
  
  // Метаданные
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
