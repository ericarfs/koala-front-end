import { InjectionToken, Signal } from '@angular/core';

export interface CurrentUserProvider {
  readonly displayName: Signal<string | null>;
}

export const CURRENT_USER = new InjectionToken<CurrentUserProvider>('CURRENT_USER');
