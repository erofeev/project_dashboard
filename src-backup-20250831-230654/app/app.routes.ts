import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent)
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./features/settings/settings.component').then(c => c.SettingsComponent)
  },
  { 
    path: 'reports/time-entries', 
    loadComponent: () => import('./features/reports/time-entries/time-entries.component').then(c => c.TimeEntriesComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
