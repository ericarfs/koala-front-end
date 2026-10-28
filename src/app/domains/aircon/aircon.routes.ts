import { Routes } from '@angular/router';

export const AIRCON_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'device-control',
        loadComponent: () =>
          import('./pages/device-control/device-control').then(
            (m) => m.DeviceControl
          ),
      },
    ],
  },
];
