// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { Login } from './features/auth/login/login';
// import { RegisterComponent } from './features/auth/admin-register/admin-register';
import { LoginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login, canActivate: [LoginGuard] },
  // { path: 'register', component: RegisterComponent },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'employee',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'employee' },
    loadChildren: () =>
      import('./features/employee/employee.routes').then((m) => m.EMPLOYEE_ROUTES),
  },

  { path: '**', redirectTo: 'login' },
];
