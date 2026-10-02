import { Injectable, signal } from '@angular/core';
import { MffResource, MffExhibition } from '../models/mff-resource';

@Injectable({ providedIn: 'root' })
export class MffService {
  private readonly _resources = signal<MffResource[]>([
    { id: 1, name: 'Trilha 1 — sensor de umidade', kind: 'telemetria', status: 'ativo' },
    { id: 2, name: 'Trilha 2 — sensor de temperatura', kind: 'telemetria', status: 'ativo' },
    { id: 3, name: 'Exibição interativa — Click', kind: 'evento', status: 'ativo' },
    { id: 4, name: 'Totem da Fauna', kind: 'exposição', status: 'inativo' },
  ]);

  private readonly _exhibitions = signal<MffExhibition[]>([
    {
      id: 1,
      name: 'Fauna Brasileira',
      description: 'Exposição sobre a fauna nativa.',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    },
    {
      id: 2,
      name: 'Flora Amazônica',
      description: 'Exposição sobre a flora da Amazônia.',
      startDate: '2026-03-15',
      endDate: '2026-09-15',
    },
  ]);

  readonly resources = this._resources.asReadonly();
  readonly exhibitions = this._exhibitions.asReadonly();

  get resourceCount(): number {
    return this.resources().length;
  }

  get activeResourceCount(): number {
    return this.resources().filter((r) => r.status === 'ativo').length;
  }

  get telemetryCount(): number {
    return this.resources().filter((r) => r.kind === 'telemetria').length;
  }
}