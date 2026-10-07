import { Routes } from '@angular/router';

export const AIRCON_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'ota',
        loadComponent: () =>
          import('./pages/ota/ota').then(
            (m) => m.Ota
          ),
      },
    ],
  },
];
