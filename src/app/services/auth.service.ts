import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatabaseService } from './database.service';
import { User, UserRole } from '../models/user.model';

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    token: null
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor(private databaseService: DatabaseService) {
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        this.authStateSubject.next({
          isAuthenticated: true,
          currentUser: user,
          token: storedToken
        });
      } catch (error) {
        this.clearStoredAuth();
      }
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Для демо-версии используем простую проверку
      if (email === 'admin@admin.ru' && password === 'admin') {
        let user = await this.databaseService.getUserByEmail(email);
        
        if (!user) {
          // Создаем демо-пользователя если его нет
          const demoUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
            name: 'Администратор',
            email: 'admin@admin.ru',
            phone: '+7 (999) 123-45-67',
            role: UserRole.GENERAL_DIRECTOR,
            direction: 'Все направления',
            salary: 150000,
            hourlyRate: 1000,
            workingDaysPerMonth: 22,
            dailyRate: 6818,
            monthlyCost: 150000,
            isActive: true
          };
          
          const createdUser = await this.databaseService.createUser(demoUser);
          user = createdUser;
        }

        const token = this.generateToken(user);
        
        // Сохраняем в localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', token);
        
        // Обновляем состояние
        this.authStateSubject.next({
          isAuthenticated: true,
          currentUser: user,
          token: token
        });

        return { success: true, message: 'Успешный вход в систему' };
      } else {
        // Проверяем существующих пользователей
        const user = await this.databaseService.getUserByEmail(email);
        
        if (user && this.verifyPassword(password, user)) {
          const token = this.generateToken(user);
          
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('authToken', token);
          
          this.authStateSubject.next({
            isAuthenticated: true,
            currentUser: user,
            token: token
          });

          return { success: true, message: 'Успешный вход в систему' };
        }
      }

      return { success: false, message: 'Неверный email или пароль' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Ошибка при входе в систему' };
    }
  }

  async logout(): Promise<void> {
    this.clearStoredAuth();
    this.authStateSubject.next({
      isAuthenticated: false,
      currentUser: null,
      token: null
    });
  }

  private generateToken(user: User): string {
    // Простая генерация токена для демо-версии
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    };
    
    return btoa(JSON.stringify(payload));
  }

  private verifyPassword(password: string, user: any): boolean {
    // В демо-версии используем простую проверку
    // В реальном приложении здесь должна быть проверка хеша пароля
    return user.password === password || password === 'demo123';
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.currentUser;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  hasRole(role: UserRole): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // Проверяем иерархию ролей
    switch (role) {
      case UserRole.EMPLOYEE:
        return true; // Все роли имеют доступ к функциям сотрудника
      case UserRole.PROJECT_MANAGER:
        return [UserRole.PROJECT_MANAGER, UserRole.DIRECTOR, UserRole.GENERAL_DIRECTOR].includes(currentUser.role);
      case UserRole.DIRECTOR:
        return [UserRole.DIRECTOR, UserRole.GENERAL_DIRECTOR].includes(currentUser.role);
      case UserRole.GENERAL_DIRECTOR:
        return currentUser.role === UserRole.GENERAL_DIRECTOR;
      default:
        return false;
    }
  }

  canAccessProject(projectDirection: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // Генеральный директор имеет доступ ко всем проектам
    if (currentUser.role === UserRole.GENERAL_DIRECTOR) return true;
    
    // Директор направления имеет доступ к проектам своего направления
    if (currentUser.role === UserRole.DIRECTOR && currentUser.direction === projectDirection) return true;
    
    // Руководитель проекта и сотрудники имеют доступ только к назначенным проектам
    // (это будет проверяться в компонентах проектов)
    return true;
  }

  canManageUsers(): boolean {
    return this.hasRole(UserRole.GENERAL_DIRECTOR);
  }

  canManageProjects(): boolean {
    return this.hasRole(UserRole.PROJECT_MANAGER);
  }

  canViewAnalytics(): boolean {
    return this.hasRole(UserRole.DIRECTOR);
  }

  canManageInvoices(): boolean {
    return this.hasRole(UserRole.PROJECT_MANAGER);
  }

  // Методы для работы с пользователями (только для администраторов)
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.canManageUsers()) {
      throw new Error('Недостаточно прав для создания пользователей');
    }
    
    return await this.databaseService.createUser(userData);
  }

  async updateUser(userData: Partial<User> & { id: string }): Promise<User> {
    if (!this.canManageUsers()) {
      throw new Error('Недостаточно прав для изменения пользователей');
    }
    
    return await this.databaseService.updateUser(userData);
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.canManageUsers()) {
      throw new Error('Недостаточно прав для удаления пользователей');
    }
    
    await this.databaseService.deleteUser(userId);
  }

  // Обновление профиля текущего пользователя
  async updateProfile(profileData: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Пользователь не авторизован');
    }
    
    const updatedUser = await this.databaseService.updateUser({
      ...profileData,
      id: currentUser.id
    });
    
    // Обновляем состояние
    this.authStateSubject.next({
      ...this.authStateSubject.value,
      currentUser: updatedUser
    });
    
    // Обновляем localStorage
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    return updatedUser;
  }

  // Проверка токена
  isTokenValid(): boolean {
    const token = this.authStateSubject.value.token;
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token));
      const now = Date.now();
      const tokenAge = now - payload.timestamp;
      
      // Токен действителен 24 часа
      return tokenAge < 24 * 60 * 60 * 1000;
    } catch (error) {
      return false;
    }
  }

  // Обновление токена
  refreshToken(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const newToken = this.generateToken(currentUser);
      localStorage.setItem('authToken', newToken);
      
      this.authStateSubject.next({
        ...this.authStateSubject.value,
        token: newToken
      });
    }
  }
}
