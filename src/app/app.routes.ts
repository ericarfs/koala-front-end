import { Route } from '@angular/router';
import { authGuard, noAuthGuard } from './core/auth/guards/auth.guards';
import { MainLayoutComponent } from './core/layout/main/main-layout';
import { adminGuard } from './core/auth/guards/admin.guard';

export const CORE_ROUTES: Route[] = [
  { path: '', redirectTo: '/location', pathMatch: 'full' },
  { path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    canActivate: [noAuthGuard] },
  { path: 'guest',
    loadComponent: () => import('./features/guest/guest').then((m) => m.Guest),
    canActivate: [noAuthGuard] },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard), },
      { path: 'location',
        loadChildren: () => import('./features/location/location.routes').then((m) => m.LOCATION_ROUTES) },
      { path: 'device-type',
        loadComponent: () => import('./features/device-types/device-types').then((m) => m.DeviceTypes), },
      { path: 'devices', loadChildren: () => import('./features/devices/devices.routes').then((m) => m.DEVICES_ROUTES) },
      { path: 'account',
        loadComponent: () => import('./features/account/account').then((m) => m.Account), },
      { path: 'users',
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
        canActivate:[adminGuard] },
    ],
  },
];
