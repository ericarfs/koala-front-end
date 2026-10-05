import { Component, inject, input, output } from '@angular/core';
import { PERMISSIONS } from '../../tokens/permissions';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-action-buttons',
  template: `
    @if (permissions.isAdmin()) {
      <div class="flex flex-wrap justify-end items-center gap-2 text-sm text-neutral min-h-4 [&>button]:cursor-pointer [&>button]:transition-colors ">
        <button
          type="button"
          class="hover:text-primary"
          (click)="$event.stopPropagation(); $event.preventDefault(); onEdit()"
          [attr.aria-label]="'COMMON.ACTIONS.EDIT' | translate"
        >
          <i class="fa-solid fa-edit"></i>
        </button>

        <button
          type="button"
          class="hover:text-destructive"
          (click)="$event.stopPropagation(); $event.preventDefault(); onDelete()"
          [attr.aria-label]="'COMMON.ACTIONS.DELETE' | translate"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    }
  `,
})
export class ActionButtons {
  protected readonly permissions = inject(PERMISSIONS);
  protected readonly translate = inject(TranslateService);

  edit = output<void>();
  delete = output<void>();

  deleteMessageKey = input('COMMON.ACTIONS.CONFIRM_DELETE');
  deleteMessageParams = input<Record<string, unknown>>({});

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    const msg = this.translate.instant(this.deleteMessageKey(), this.deleteMessageParams());
    if (!confirm(msg)) return;
    this.delete.emit();
  }
}
