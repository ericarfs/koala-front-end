import { computed, Injectable, signal } from '@angular/core';
import { getAncestors, getChildren } from './location-tree';
import { Location } from '@shared/interfaces/location';
import { LOCATIONS_MOCK } from '../../../mocks/locations';

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
  add(location: Location): void {
    this._items.update((list) => [...list, location]);
  }

  update(id: number, patch: Partial<Location>): void {
    this._items.update((list) =>
      list.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  remove(id: number): void {
    this._items.update((list) => list.filter((l) => l.id !== id));
  }

  nextId(): number {
    const ids = this._items().map((l) => l.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
