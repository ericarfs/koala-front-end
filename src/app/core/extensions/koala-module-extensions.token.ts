import { InjectionToken } from '@angular/core';
import { KoalaModuleDefinition } from './koala-module-definition';


export const KOALA_MODULE_EXTENSIONS = new InjectionToken<KoalaModuleDefinition[]>(
  'KOALA_MODULE_EXTENSIONS'
);

export function provideKoalaModule(definition: KoalaModuleDefinition) {
  return { provide: KOALA_MODULE_EXTENSIONS, useValue: definition, multi: true };
}
