import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, switchMap, tap, throwError } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { NotificationService } from '@shared/services/notification';
import { MutationError, MutationResult } from './crud.types';

@Injectable()
export abstract class CrudActions<TEntity> {
  protected readonly notification = inject(NotificationService);
  protected readonly transloco = inject(TranslocoService);

  protected abstract readonly store: {
    remove(id: number): Observable<MutationResult<unknown>>;
  };

  protected errorMessage(reason: MutationError): string {
    return reason === 'NOT_FOUND'
      ? 'COMMON.ERRORS.NOT_FOUND'
      : 'COMMON.ERRORS.GENERIC';
  }

  private translate(key: string): string {
    return this.transloco.translate(key);
  }

  protected unwrap<T>(
    result$: Observable<MutationResult<T>>,
    successKey: string,
  ): Observable<T> {
    return result$.pipe(
      switchMap((res) =>
        res.ok ? of(res.data) : throwError(() => this.errorMessage(res.reason)),
      ),
      tap({
        next: () => this.notification.success(this.translate(successKey)),
        error: (err) => {
          const key = typeof err === 'string' ? err : 'COMMON.TOASTS.SAVE_FAILED';
          this.notification.error(this.translate(key));
        },
      }),
    );
  }

  remove(id: number, successKey = 'COMMON.TOASTS.DELETED'): Observable<void> {
    return this.store.remove(id).pipe(
      switchMap((res) => {
        if (!res.ok) return throwError(() => this.errorMessage(res.reason));
        this.notification.success(this.translate(successKey));
        return of(undefined);
      }),
      catchError((err) => {
        const key = typeof err === 'string' ? err : 'COMMON.TOASTS.DELETE_FAILED';
        this.notification.error(this.translate(key));
        return throwError(() => err);
      }),
    );
  }
}
