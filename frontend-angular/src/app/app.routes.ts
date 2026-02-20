import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'soy-profesional',
    loadComponent: () => import('./features/soy-profesional/soy-profesional.component').then(m => m.SoyProfesionalComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/user-dashboard/user-dashboard.component').then(m => m.UserDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'USER' }
  },
  {
    path: 'psych',
    loadComponent: () => import('./features/psych-dashboard/psych-dashboard.component').then(m => m.PsychDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'PSYCHOLOGIST' }
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  { path: '**', redirectTo: '' }
];
