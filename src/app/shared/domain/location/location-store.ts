import { computed, Injectable, signal } from '@angular/core';
import { canAddChild, canReparent, getAncestors, getChildren } from './location-tree';
import { Location } from '@shared/interfaces/location';
import { LOCATIONS_MOCK } from '../../../mocks/locations';
import { map, Observable, of, switchMap, timer } from 'rxjs';

export type MutationError =
  | 'MAX_DEPTH_EXCEEDED'
  | 'INVALID_PARENT';

const FAKE_LATENCY_MS = 3000;

/** Resultado de uma mutação assíncrona. */
export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MutationError };

@Injectable({ providedIn: 'root' })
export class LocationStore {
  private readonly _items = signal<Location[]>(LOCATIONS_MOCK);
  readonly items = this._items.asReadonly();

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

  // -------- mutações --------
   add(location: Location): Observable<MutationResult<Location>> {
    return timer(FAKE_LATENCY_MS).pipe(
      switchMap(() => {
        const list = this._items();

        if (location.parentId != null && !canAddChild(location.parentId, list)) {
          return of<MutationResult<Location>>({
            ok: false,
            reason: 'MAX_DEPTH_EXCEEDED',
          });
        }

        this._items.update((l) => [...l, location]);
        return of<MutationResult<Location>>({ ok: true, data: location });
      }),
    );
  }

  update(
    id: number,
    patch: Partial<Location>,
  ): Observable<MutationResult<Location>> {
    return timer(FAKE_LATENCY_MS).pipe(
      switchMap(() => {
        const list = this._items();
        const current = list.find((l) => l.id === id);
        if (!current) {
          return of<MutationResult<Location>>({
            ok: false,
            reason: 'INVALID_PARENT',
          });
        }

        if (
          patch.parentId !== undefined &&
          !canReparent(id, patch.parentId ?? null, list)
        ) {
          return of<MutationResult<Location>>({
            ok: false,
            reason: 'INVALID_PARENT',
          });
        }

        const updated: Location = { ...current, ...patch };
        this._items.update((l) =>
          l.map((item) => (item.id === id ? updated : item)),
        );
        return of<MutationResult<Location>>({ ok: true, data: updated });
      }),
    );
  }

  remove(id: number): Observable<MutationResult<void>> {
    return timer(FAKE_LATENCY_MS).pipe(
      map(() => {
        this._items.update((l) => l.filter((item) => item.id !== id));
        return { ok: true, data: undefined } as MutationResult<void>;
      }),
    );
  }

  nextId(): number {
    const ids = this._items().map((l) => l.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
