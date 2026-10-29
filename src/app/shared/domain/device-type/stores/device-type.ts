import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { DeviceTypeService } from '../services/device-type';
import { DeviceType } from '@shared/interfaces/device-type';
import { AuthService } from '@core/auth/services/auth';

export type MutationError = 'NOT_FOUND';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MutationError };

@Injectable({ providedIn: 'root' })
export class DeviceTypeStore {
  private readonly service = inject(DeviceTypeService);

  private readonly _items = signal<DeviceType[]>([]);
  readonly items = this._items.asReadonly();

  private readonly _loaded = signal(false);
  readonly loaded = this._loaded.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  private readonly auth = inject(AuthService);

  constructor() {
    effect(() => {
      this.auth.user();
      untracked(() => {
        this._items.set([]);
        this._loaded.set(false);
      });
    });
  }

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
        console.error('[DeviceTypeStore] load failed', err);
        this._loading.set(false);
      },
    });
  }

  add(draft: Omit<DeviceType, 'id'>): Observable<MutationResult<DeviceType>> {
    return this.service.save(draft).pipe(
      tap((created) => this._items.update((l) => [...l, created])),
      map((created) => ({ ok: true, data: created } as MutationResult<DeviceType>)),
      catchError(() =>
        of<MutationResult<DeviceType>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  update(id: number, patch: Partial<DeviceType>): Observable<MutationResult<DeviceType>> {
    return this.service.update(id, patch).pipe(
      tap((updated) =>
        this._items.update((l) => l.map((t) => (t.id === id ? updated : t))),
      ),
      map((updated) => ({ ok: true, data: updated } as MutationResult<DeviceType>)),
      catchError(() =>
        of<MutationResult<DeviceType>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  remove(id: number): Observable<MutationResult<void>> {
    return this.service.remove(id).pipe(
      tap(() => this._items.update((l) => l.filter((t) => t.id !== id))),
      map(() => ({ ok: true, data: undefined } as MutationResult<void>)),
      catchError(() =>
        of<MutationResult<void>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }
}
