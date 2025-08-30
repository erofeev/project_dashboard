import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [() => import('./guards/auth.guard').then(m => m.AuthGuard)]
  },
  { 
    path: 'projects', 
    loadComponent: () => import('./components/projects/projects.component').then(m => m.ProjectsComponent),
    canActivate: [() => import('./guards/auth.guard').then(m => m.AuthGuard)]
  },
  { 
    path: 'employees', 
    loadComponent: () => import('./components/employees/employees.component').then(m => m.EmployeesComponent),
    canActivate: [() => import('./guards/auth.guard').then(m => m.AuthGuard)]
  },
  { 
    path: 'invoices', 
    loadComponent: () => import('./components/invoices/invoices.component').then(m => m.InvoicesComponent),
    canActivate: [() => import('./guards/auth.guard').then(m => m.AuthGuard)]
  },
  { 
    path: 'analytics', 
    loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [() => import('./guards/auth.guard').then(m => m.AuthGuard)]
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [() => import('./guards/auth.guard').then(m => m.AuthGuard)]
  },
  { path: '**', redirectTo: '/dashboard' }
];
