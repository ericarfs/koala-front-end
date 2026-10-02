import { Route } from '@angular/router';

export const DEVICES_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./pages/devices-list/devices-list').then((m) => m.DevicesList) },
  { path: ':id', loadComponent: () => import('./pages/device-details/device-details').then((m) => m.DeviceDetails) },
];
