import { Component, inject, output } from '@angular/core';
import { PERMISSIONS } from '../../tokens/permissions';

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

  edit = output<void>();
  delete = output<void>();

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }
}
