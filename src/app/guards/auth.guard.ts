import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, combineLatest } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('AuthGuard: checking authentication...');
    
    // Дожидаемся инициализации AuthService и проверяем состояние
    return combineLatest([
      this.authService.isInitialized$,
      this.authService.authState$
    ]).pipe(
      filter(([isInitialized]) => isInitialized), // Ждем инициализации
      take(1), // Берем только первое значение после инициализации
      map(([isInitialized, authState]) => {
        const isAuth = authState.isAuthenticated && authState.token && 
                      this.authService.isTokenValid(authState.token);
        
        console.log('AuthGuard: authService initialized =', isInitialized);
        console.log('AuthGuard: authState =', authState);
        console.log('AuthGuard: isAuthenticated =', isAuth);
        
        if (isAuth) {
          console.log('AuthGuard: user is authenticated, allowing access');
          return true;
        } else {
          console.log('AuthGuard: user is not authenticated, blocking access');
          // НЕ перенаправляем на /login, так как логин теперь встроен в основное приложение
          return false;
        }
      })
    );
  }
}
