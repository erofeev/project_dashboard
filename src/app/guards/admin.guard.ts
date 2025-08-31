import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, combineLatest } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('AdminGuard: checking admin privileges...');
    
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
        
        if (!isAuth) {
          console.log('AdminGuard: user is not authenticated, redirecting to login');
          this.router.navigate(['/login']);
          return false;
        }
        
        // Проверяем права администратора
        const currentUser = this.authService.getCurrentUser();
        const isAdmin = currentUser?.role === 'superadmin' || 
                       currentUser?.role === 'admin';
        
        console.log('AdminGuard: currentUser =', currentUser);
        console.log('AdminGuard: isAdmin =', isAdmin);
        
        if (isAdmin) {
          console.log('AdminGuard: user has admin privileges, allowing access');
          return true;
        } else {
          console.log('AdminGuard: user does not have admin privileges, redirecting to dashboard');
          this.router.navigate(['/dashboard']);
          return false;
        }
      })
    );
  }
}
