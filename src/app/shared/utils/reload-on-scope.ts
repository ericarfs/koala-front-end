import { effect, Signal, untracked } from '@angular/core';

export function reloadOnScope(
  scope: Signal<string | null>,
  hooks: { load: () => void; reset: () => void },
): void {
  let previous: string | null | undefined;

  effect(() => {
    const current = scope();
    untracked(() => {
      // Primeira execução não limpa: evita cancelar um load() já iniciado.
      if (previous !== undefined && previous !== current) hooks.reset();
      previous = current;
      if (current) hooks.load();
    });
  });
}
