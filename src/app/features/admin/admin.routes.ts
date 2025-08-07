// src/app/features/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { LayoutComponent } from '../layout/layout/layout';


export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', loadComponent: () => import('./users/users').then(m => m.Users) },
      { path: 'assets', loadComponent: () => import('./admin-assets/admin-assets').then(m => m.AdminAssets) },
      { path: 'tickets', loadComponent: () => import('./admin-tickets/admin-tickets').then(m => m.AdminTickets) }

      //   // add more admin pages here
      //   // { path: 'assets', loadComponent: () => import('./assets/assets.component').then(m => m.AssetsComponent) },
    ]
  },
];
