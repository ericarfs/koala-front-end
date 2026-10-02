import { Routes } from '@angular/router';

export const MFF_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/mff-dashboard.component').then(
            (m) => m.MffDashboardComponent
          ),
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/resources/mff-resources.component').then(
            (m) => m.MffResourcesComponent
          ),
      },
    ],
  },
];
