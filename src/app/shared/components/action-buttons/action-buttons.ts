import { Component, inject, input, output } from '@angular/core';
import { PERMISSIONS } from '../../tokens/permissions';
import { TranslateService } from '@ngx-translate/core';

@Component({
  imports: [],
  selector: 'app-action-buttons',
  template: `
    @if (permissions.isAdmin()) {
      <div class="flex flex-wrap justify-end items-center gap-2 text-sm text-neutral min-h-4 [&>i]:cursor-pointer [&>i]:transition-colors ">
        <i class="fa-solid fa-edit hover:text-primary"
            (click)="$event.stopPropagation(); $event.preventDefault(); onEdit()"></i>
        <i class="fa-solid fa-trash hover:text-destructive"
            (click)="$event.stopPropagation(); $event.preventDefault(); onDelete()"></i>
      </div>
    }
  `,
})
export class ActionButtonsComponent {
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
