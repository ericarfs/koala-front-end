import { DestroyRef, inject, signal, Signal } from '@angular/core';

export function mediaQuery(query: string): Signal<boolean> {
  const destroyRef = inject(DestroyRef);

  if (typeof window === 'undefined' || !window.matchMedia) {
    return signal(false).asReadonly();
  }

  const mq = window.matchMedia(query);
  const matches = signal(mq.matches);

  const handler = (e: MediaQueryListEvent) => matches.set(e.matches);
  mq.addEventListener('change', handler);
  destroyRef.onDestroy(() => mq.removeEventListener('change', handler));

  return matches.asReadonly();
}
