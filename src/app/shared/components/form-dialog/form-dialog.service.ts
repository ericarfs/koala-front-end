import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { FormDialogData } from './entity-form-dialog/entity-form-dialog.types';
import { FormDialog } from './entity-form-dialog/entity-form-dialog';

@Injectable({ providedIn: 'root' })
export class FormDialogService {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);

  open<T = unknown>(data: FormDialogData<T>) {
  return this.dialog.open<FormDialog, FormDialogData<T>>(
    FormDialog,
      {
        width: '480px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data,
        backdropClass: 'bg-black/50',
        positionStrategy: this.overlay
          .position()
          .global()
          .centerHorizontally()
          .centerVertically(),
      },
    );
  }
}
