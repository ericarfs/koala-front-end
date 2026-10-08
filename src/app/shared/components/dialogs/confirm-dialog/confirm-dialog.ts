import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslatePipe } from '@ngx-translate/core';

export interface ConfirmDialogData {
  title: string;
  message?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="bg-container border-2 border-outline rounded-md shadow-xl w-full max-w-md
                gap-4 flex flex-col overflow-hidden">

      <header class="p-6 pb-0">
        <h2 class="text-lg font-semibold text-default">{{ data.title | translate }}</h2>
        @if (data.message) {
          <p class="text-sm text-neutral mt-1">{{ data.message | translate }}</p>
        }
      </header>

      <div class="flex justify-end gap-2 p-6 pt-0">
        <button
          type="button"
          [disabled]="loading()"
          (click)="confirm()"
          class="btn bg-primary text-primary-foreground inline-flex items-center justify-center gap-2
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (loading()) {
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span class="animate-pulse">{{ 'COMMON.STATES.SENDING' | translate }}</span>
          } @else {
            <span>{{ 'COMMON.ACTIONS.DELETE' | translate }}</span>
          }
        </button>

        <button
          type="button"
          [disabled]="loading()"
          (click)="close()"
          class="btn border border-outline text-sm font-medium hover:bg-neutral/20
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{  'COMMON.ACTIONS.CANCEL' | translate }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);

  protected readonly loading = signal(false);

  confirm(): void {
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
