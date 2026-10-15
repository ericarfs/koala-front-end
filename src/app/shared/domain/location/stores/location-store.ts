import { computed, inject, Injectable, signal } from '@angular/core';
import { canAddChild, canReparent, getAncestors, getChildren } from '../location-tree';
import { Location } from '@shared/interfaces/location';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { LocationService } from '../services/location';

export type MutationError =
  | 'MAX_DEPTH_EXCEEDED'
  | 'INVALID_PARENT';


export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MutationError };

@Injectable({ providedIn: 'root' })
export class LocationStore {
  private readonly service = inject(LocationService);

  private readonly _items = signal<Location[]>([]);
  readonly items = this._items.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  // -------- consultas reativas (sempre derivam do items) --------
  readonly roots = computed(() => getChildren(null, this._items()));

  childrenOf(parentId: number | null) {
    return computed(() => getChildren(parentId, this._items()));
  }

  ancestorsOf(id: number) {
    return computed(() => getAncestors(id, this._items()));
  }

  findById(id: number) {
    return computed(() => this._items().find((l) => l.id === id) ?? null);
  }

  constructor() {
    this.load();
  }

  load(): void {
    this._loading.set(true);
    this.service.findAll().subscribe({
      next: (items) => {
        this._items.set(items);
        this._loading.set(false);
      },
      error: (err) => {
        console.error('[LocationStore] load failed', err);
        this._loading.set(false);
      },
    });
  }

  // -------- mutações --------
  add(draft: Omit<Location, 'id'>): Observable<MutationResult<Location>> {
    const list = this._items();

    if (draft.parentId != null && !canAddChild(draft.parentId, list)) {
      return of<MutationResult<Location>>({
        ok: false,
        reason: 'MAX_DEPTH_EXCEEDED',
      });
    }

    return this.service.save(draft).pipe(
      tap((created) => this._items.update((l) => [...l, created])),
      map((created) => ({ ok: true, data: created }) as MutationResult<Location>),
      catchError(() =>
        of<MutationResult<Location>>({ ok: false, reason: 'INVALID_PARENT' }),
      ),
    );
  }

  update(
    id: number,
    patch: Partial<Location>,
  ): Observable<MutationResult<Location>> {
    const list = this._items();
    const current = list.find((l) => l.id === id);
    if (!current) {
      return of<MutationResult<Location>>({ ok: false, reason: 'INVALID_PARENT' });
    }

    if (
      patch.parentId !== undefined &&
      !canReparent(id, patch.parentId ?? null, list)
    ) {
      return of<MutationResult<Location>>({ ok: false, reason: 'INVALID_PARENT' });
    }

    return this.service.update(id, patch).pipe(
      tap((updated) =>
        this._items.update((l) => l.map((item) => (item.id === id ? updated : item))),
      ),
      map((updated) => ({ ok: true, data: updated }) as MutationResult<Location>),
      catchError(() =>
        of<MutationResult<Location>>({ ok: false, reason: 'INVALID_PARENT' }),
      ),
    );
  }

  remove(id: number): Observable<MutationResult<void>> {
    return this.service.remove(id).pipe(
      tap(() => this._items.update((l) => l.filter((item) => item.id !== id))),
      map(() => ({ ok: true, data: undefined }) as MutationResult<void>),
      catchError(() =>
        of<MutationResult<void>>({ ok: false, reason: 'INVALID_PARENT' }),
      ),
    );
  }
}
