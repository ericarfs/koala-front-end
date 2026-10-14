import { computed, Injectable, signal } from '@angular/core';
import { ChartExportItem } from './pdf-export';

export interface SavedChart extends ChartExportItem {
  id: string;
  savedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class ChartExportBasket {
  private readonly _items = signal<SavedChart[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  add(item: ChartExportItem): void {
    this._items.update(list => [
      ...list,
      { ...item, id: crypto.randomUUID(), savedAt: new Date() },
    ]);
  }

  remove(id: string): void {
    this._items.update(list => list.filter(i => i.id !== id));
  }

  move(id: string, direction: -1 | 1): void {
    this._items.update(list => {
      const from = list.findIndex(i => i.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= list.length) return list;
      const copy = [...list];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    });
  }

  clear(): void {
    this._items.set([]);
  }
}
