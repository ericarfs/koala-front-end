import { computed, signal, Signal } from '@angular/core';
import { catchError, map, Observable, of, Subscription, tap } from 'rxjs';
import { CrudService, MutationError, MutationResult } from './crud.types';

export abstract class CrudStore<T extends { id: number }> {
  protected abstract readonly service: CrudService<T>;
  protected abstract readonly logTag: string;

  protected readonly notFoundReason: MutationError = 'NOT_FOUND';

  private readonly _items = signal<T[]>([]);
  readonly items: Signal<T[]> = this._items.asReadonly();

  private readonly _loaded = signal(false);
  readonly loaded: Signal<boolean> = this._loaded.asReadonly();

  private readonly _loading = signal(false);
  readonly loading: Signal<boolean> = this._loading.asReadonly();

  protected loadSub?: Subscription;

  /** expõe para subclasses que precisam validar antes de mutar (Location) */
  protected get currentItems(): T[] {
    return this._items();
  }

  load(): void {
    if (this._loaded() || this._loading()) return;
    this._loading.set(true);
    this.loadSub = this.service.findAll().subscribe({
      next: (items) => {
        this._items.set(items);
        this._loaded.set(true);
        this._loading.set(false);
      },
      error: (err) => {
        console.error(`[${this.logTag}] load failed`, err);
        this._loading.set(false);
      },
    });
  }

  protected reset(): void {
    this.loadSub?.unsubscribe();
    this._items.set([]);
    this._loaded.set(false);
    this._loading.set(false);
  }

  add(draft: Omit<T, 'id'>): Observable<MutationResult<T>> {
    return this.service.save(draft).pipe(
      tap((created) => this._items.update((l) => [...l, created])),
      map((created) => ({ ok: true, data: created }) as MutationResult<T>),
      catchError(() => of<MutationResult<T>>({ ok: false, reason: this.notFoundReason })),
    );
  }

  findById(id: number): Signal<T | null> {
    return computed(() => this.items().find((item) => item.id === id) ?? null);
  }

  update(id: number, patch: Partial<T>): Observable<MutationResult<T>> {
    return this.service.update(id, patch).pipe(
      tap((updated) =>
        this._items.update((l) => l.map((item) => (item.id === id ? updated : item))),
      ),
      map((updated) => ({ ok: true, data: updated }) as MutationResult<T>),
      catchError(() => of<MutationResult<T>>({ ok: false, reason: this.notFoundReason })),
    );
  }

  remove(id: number): Observable<MutationResult<void>> {
    return this.service.remove(id).pipe(
      tap(() => this._items.update((l) => l.filter((item) => item.id !== id))),
      map(() => ({ ok: true, data: undefined }) as MutationResult<void>),
      catchError(() => of<MutationResult<void>>({ ok: false, reason: this.notFoundReason })),
    );
  }

  protected mergeItem(id: number, patch: Partial<T>): void {
    this._items.update((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  protected patchItems(fn: (list: T[]) => T[]): void {
    this._items.update(fn);
  }
}
