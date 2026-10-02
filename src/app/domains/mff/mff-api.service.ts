import { Injectable, signal } from '@angular/core';

export interface MffResource {
  name: string;
  kind: string;
}

/**
 * Serviço isolado do domínio MFF. Consumiria os contratos
 * disponibilizados pelo projeto do Museu da Fauna e Flora (mock ou
 * real, conforme disponibilidade — item 10 do escopo do TCC).
 */
@Injectable({ providedIn: 'root' })
export class MffApiService {
  readonly resourcesSignal = signal<MffResource[]>([
    { name: 'Trilha 1 — sensor de umidade', kind: 'telemetria' },
    { name: 'Exibição interativa — Click', kind: 'evento' },
  ]);
}
