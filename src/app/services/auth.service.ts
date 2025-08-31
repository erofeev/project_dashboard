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

  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  
  public authState$ = this.authStateSubject.asObservable();
  public isInitialized$ = this.isInitializedSubject.asObservable();

  constructor(private databaseService: DatabaseService) {
    // Немедленно проверяем сохраненную авторизацию при создании сервиса
    this.checkStoredAuth();
  }

  private checkStoredAuth(): void {
    console.log('AuthService: checking stored authentication...');
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    
    console.log('AuthService: storedUser =', storedUser ? 'exists' : 'not found');
    console.log('AuthService: storedToken =', storedToken ? 'exists' : 'not found');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        console.log('AuthService: parsed user =', user);
        
        // Проверяем валидность токена
        if (this.isTokenValid(storedToken)) {
          this.authStateSubject.next({
            isAuthenticated: true,
            currentUser: user,
            token: storedToken
          });
          console.log('AuthService: user authenticated from stored data (valid token)');
        } else {
          console.log('AuthService: stored token is expired or invalid, clearing auth');
          this.clearStoredAuth();
        }
      } catch (error) {
        console.error('AuthService: error parsing stored user:', error);
        this.clearStoredAuth();
      }
    } else {
      console.log('AuthService: no stored authentication data found');
    }
    
    // Отмечаем, что инициализация завершена
    this.isInitializedSubject.next(true);
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
            name: 'Суперадминистратор',
            email: 'admin@admin.ru',
            phone: '+7 (999) 123-45-67',
            role: UserRole.SUPERADMIN,
            direction: 'system',
            salary: 150000,
            hourlyRate: 1000,
            workingDaysPerMonth: 22,
            dailyRate: 6818,
            monthlyCost: 150000,
            isActive: true
          };
          
          await this.databaseService.createUser(demoUser);
          // Получаем полный объект пользователя из базы
          user = await this.databaseService.getUserByEmail(email);
        }
        
        // Убеждаемся, что у пользователя правильная роль
        if (user && user.role !== 'superadmin') {
          // Обновляем роль пользователя на superadmin
          const updatedUser = {
            ...user,
            name: 'Суперадминистратор',
            role: 'superadmin',
            direction: 'system'
          };
          await this.databaseService.updateUser(updatedUser);
          user = await this.databaseService.getUserByEmail(email);
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
    
    // НЕ сбрасываем состояние инициализации при выходе - оставляем true
    // чтобы не показывать "Загрузка..." после логаута
  }

  // Метод для принудительной очистки аутентификации (для тестирования)
  forceClearAuth(): void {
    console.log('AuthService: force clearing authentication');
    this.clearStoredAuth();
    this.authStateSubject.next({
      isAuthenticated: false,
      currentUser: null,
      token: null
    });
    
    // НЕ сбрасываем состояние инициализации при принудительной очистке
    // чтобы не показывать "Загрузка..." после очистки
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

  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token));
      const now = Date.now();
      const tokenAge = now - payload.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 часа
      
      console.log('AuthService: token age =', tokenAge, 'ms, max age =', maxAge, 'ms');
      return tokenAge < maxAge;
    } catch (error) {
      console.error('AuthService: error parsing token:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.authStateSubject.value.currentUser;
  }

  isAuthenticated(): boolean {
    const authState = this.authStateSubject.value;
    const isAuth = authState.isAuthenticated && authState.token && this.isTokenValid(authState.token);
    
    console.log('AuthService: isAuthenticated() called, returning:', isAuth);
    
    // Если токен невалиден, но состояние показывает авторизацию, очищаем его
    if (authState.isAuthenticated && (!authState.token || !this.isTokenValid(authState.token))) {
      console.log('AuthService: invalid token detected, clearing auth state');
      this.clearStoredAuth();
      return false;
    }
    
    return Boolean(isAuth);
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
