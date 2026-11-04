import { Route } from '@angular/router';

export const LOCATION_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./pages/location-list/location-list').then((m) => m.LocationList) },
  { path: ':id', loadComponent: () => import('./pages/location-details/location-details').then((m) => m.LocationDetails) },
];
