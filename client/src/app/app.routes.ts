import type { Routes } from '@angular/router'
import { authGuard, guestGuard } from './core/auth/auth.guard'

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Create an account',
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    title: 'Tasks',
    loadComponent: () =>
      import('./features/tasks/tasks-page.component').then((m) => m.TasksPageComponent),
  },
  { path: '**', redirectTo: 'tasks' },
]
