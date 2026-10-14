import { Route } from '@angular/router';

export const DEVICES_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./pages/devices-list/devices-list').then((m) => m.DevicesList) },
  { path: 'add', loadComponent: () => import('./components/device-forms/device-forms').then((m) => m.DeviceForms) },
  { path: 'edit/:id', loadComponent: () => import('./components/device-forms/device-forms').then((m) => m.DeviceForms) },
  { path: ':id', loadComponent: () => import('./pages/device-details/device-details').then((m) => m.DeviceDetails) },
];
