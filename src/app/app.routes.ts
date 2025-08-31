import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'time-entries', 
    loadComponent: () => import('./components/simple-data-table/simple-data-table.component').then(m => m.SimpleDataTableComponent),
    canActivate: [AuthGuard]
  },

  { 
    path: 'projects', 
    loadComponent: () => import('./components/projects/projects.component').then(m => m.ProjectsComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'employees', 
    loadComponent: () => import('./components/employees/employees.component').then(m => m.EmployeesComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'invoices', 
    loadComponent: () => import('./components/invoices/invoices.component').then(m => m.InvoicesComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'analytics', 
    loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
