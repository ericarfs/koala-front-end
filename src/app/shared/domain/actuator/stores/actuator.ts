import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ActuatorService } from '../services/actuator';
import { Actuator } from '@shared/interfaces/actuator';


export type MutationError = 'NOT_FOUND';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MutationError };

@Injectable({ providedIn: 'root' })
export class ActuatorStore {
  private readonly service = inject(ActuatorService);

  private readonly _items = signal<Actuator[]>([]);
  readonly items = this._items.asReadonly();

  private readonly _loaded = signal(false);
  readonly loaded = this._loaded.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  load(): void {
    if (this._loaded() || this._loading()) return;

    this._loading.set(true);
    this.service.findAll().subscribe({
      next: (items) => {
        this._items.set(items);
        this._loaded.set(true);
        this._loading.set(false);
      },
      error: (err) => {
        console.error('[ActuatorStore] load failed', err);
        this._loading.set(false);
      },
    });
  }

  add(draft: Omit<Actuator, 'id'>): Observable<MutationResult<Actuator>> {
    return this.service.save(draft).pipe(
      tap((created) => this._items.update((l) => [...l, created])),
      map((created) => ({ ok: true, data: created } as MutationResult<Actuator>)),
      catchError(() =>
        of<MutationResult<Actuator>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  update(id: number, patch: Partial<Actuator>): Observable<MutationResult<Actuator>> {
    return this.service.update(id, patch).pipe(
      tap((updated) =>
        this._items.update((l) => l.map((a) => (a.id === id ? updated : a))),
      ),
      map((updated) => ({ ok: true, data: updated } as MutationResult<Actuator>)),
      catchError(() =>
        of<MutationResult<Actuator>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }
}
