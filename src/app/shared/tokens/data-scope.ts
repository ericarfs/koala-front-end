import { InjectionToken, Signal } from '@angular/core';

export const DATA_SCOPE = new InjectionToken<Signal<string | null>>('DATA_SCOPE');
