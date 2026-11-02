import { Injectable, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { FormDialogData } from './entity-form-dialog/entity-form-dialog.types';
import { FormDialog } from './entity-form-dialog/entity-form-dialog';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog/confirm-dialog';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<T = unknown>(data: FormDialogData<T>): DialogRef<FormDialog> {
    return this.openWithDefaults(FormDialog, data);
  }

  openConfirm(data: ConfirmDialogData): DialogRef<ConfirmDialog> {
    return this.openWithDefaults(ConfirmDialog, data);
  }

  private openWithDefaults<TComp, TData>(
    component: new (...args: unknown[]) => TComp,
    data: TData,
  ): DialogRef<TComp> {
    return this.dialog.open<TComp, TData>(component, {
      width: '480px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data,
      backdropClass: 'cdk-overlay-dark-backdrop',
    });
  }
}
