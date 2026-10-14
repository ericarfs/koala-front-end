import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Device } from '@shared/interfaces/device';
import { DeviceService, DeviceUpdate } from '../services/device';

export type DeviceMutationError = 'NOT_FOUND';
export type DeviceMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: DeviceMutationError };

@Injectable({ providedIn: 'root' })
export class DeviceStore {
  private readonly service = inject(DeviceService);

  private readonly _items = signal<Device[]>([]);
  readonly items = this._items.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.load();
    this.subscribeToUpdates();
  }

  load(): void {
    this._loading.set(true);
    this.service.findAll().subscribe({
      next: (items) => {
        this._items.set(items);
        this._loading.set(false);
      },
      error: (err) => {
        console.error('[DeviceStore] load failed', err);
        this._loading.set(false);
      },
    });
  }

  findById(id: number) {
    return computed(() => this._items().find((d) => d.id === id) ?? null);
  }

  // -------- mutações --------
  add(draft: Omit<Device, 'id'>): Observable<DeviceMutationResult<Device>> {
    return this.service.save(draft).pipe(
      tap((created) => this._items.update((l) => [...l, created])),
      map((created) => ({ ok: true, data: created }) as DeviceMutationResult<Device>),
      catchError(() =>
        of<DeviceMutationResult<Device>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  update(id: number, patch: Partial<Device>): Observable<DeviceMutationResult<Device>> {
    return this.service.update(id, patch).pipe(
      tap((updated) =>
        this._items.update((l) => l.map((d) => (d.id === id ? updated : d))),
      ),
      map((updated) => ({ ok: true, data: updated }) as DeviceMutationResult<Device>),
      catchError(() =>
        of<DeviceMutationResult<Device>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  remove(id: number): Observable<DeviceMutationResult<void>> {
    return this.service.remove(id).pipe(
      tap(() => this._items.update((l) => l.filter((d) => d.id !== id))),
      map(() => ({ ok: true, data: undefined }) as DeviceMutationResult<void>),
      catchError(() =>
        of<DeviceMutationResult<void>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  // -------- SSE --------
  private subscribeToUpdates(): void {
    this.service.getDeviceUpdates().subscribe({
      next: (update) => this.applyUpdate(update),
      error: (err) => console.error('[DeviceStore] SSE error', err),
    });
  }

  private applyUpdate(update: DeviceUpdate): void {
    this._items.update((list) =>
      list.map((d) => (d.id === update.id ? { ...d, ...update } : d)),
    );
  }
}
