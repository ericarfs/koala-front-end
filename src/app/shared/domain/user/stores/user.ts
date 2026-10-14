import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { UserBasic } from '@shared/interfaces/user';
import { UserService } from '../services/user';

export type UserMutationError = 'NOT_FOUND';

export type UserMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: UserMutationError };

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly service = inject(UserService);

  private readonly _items = signal<UserBasic[]>([]);
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
        console.error('[UserStore] load failed', err);
        this._loading.set(false);
      },
    });
  }

  add(draft: Omit<UserBasic, 'id'>): Observable<UserMutationResult<UserBasic>> {
    return this.service.save(draft).pipe(
      tap((created) => this._items.update((l) => [...l, created])),
      map((created) => ({ ok: true, data: created } as UserMutationResult<UserBasic>)),
      catchError(() =>
        of<UserMutationResult<UserBasic>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  update(id: number, patch: Partial<UserBasic>): Observable<UserMutationResult<UserBasic>> {
    return this.service.update(id, patch).pipe(
      tap((updated) =>
        this._items.update((l) => l.map((u) => (u.id === id ? updated : u))),
      ),
      map((updated) => ({ ok: true, data: updated } as UserMutationResult<UserBasic>)),
      catchError(() =>
        of<UserMutationResult<UserBasic>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }

  remove(id: number): Observable<UserMutationResult<void>> {
    return this.service.remove(id).pipe(
      tap(() => this._items.update((l) => l.filter((u) => u.id !== id))),
      map(() => ({ ok: true, data: undefined } as UserMutationResult<void>)),
      catchError(() =>
        of<UserMutationResult<void>>({ ok: false, reason: 'NOT_FOUND' }),
      ),
    );
  }
}
