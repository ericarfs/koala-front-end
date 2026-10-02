import { InjectionToken, Signal } from '@angular/core';

export interface PermissionsProvider {
  isAdmin: Signal<boolean>;
}

export const PERMISSIONS = new InjectionToken<PermissionsProvider>('PERMISSIONS');
