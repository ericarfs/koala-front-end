import { Route } from '@angular/router';
import { adminGuard } from '@core/auth/guards/admin.guard';

export const DEVICES_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./pages/devices-list/devices-list').then((m) => m.DevicesList) },
  { path: 'add', loadComponent: () => import('./components/device-forms/device-forms').then((m) => m.DeviceForms),
    canActivate:[adminGuard]  },
  { path: 'edit/:id', loadComponent: () => import('./components/device-forms/device-forms').then((m) => m.DeviceForms),
    canActivate:[adminGuard]  },
  { path: ':id', loadComponent: () => import('./pages/device-details/device-details').then((m) => m.DeviceDetails) },
];
