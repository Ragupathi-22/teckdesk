// src/app/features/employee/employee.routes.ts
import { Routes } from '@angular/router';
import { EmployeeDashboard } from './employee-dashboard/employee-dashboard';
import { LayoutComponent } from '../layout/layout/layout';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    component : LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: EmployeeDashboard },
      {path :'ticket',loadComponent :()=> import('./employee-ticket/employee-ticket').then(m=>m.EmployeeTicket)}
      // add more employee pages here
      // { path: 'tickets', loadComponent: () => import('./tickets/tickets.component').then(m => m.TicketsComponent) },
    ],
  },
];
