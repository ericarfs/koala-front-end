import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { delay, of } from 'rxjs';
import { FormDialogService } from '../../../shared/components/form-dialog/form-dialog.service';
import { Location } from '../../../shared/interfaces/location';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';

@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [RouterLink, ActionButtonsComponent],
  host: { class: 'contents' },
  template: `
    <a [routerLink]="['/location', location().id]"
      class="group flex flex-col justify-between gap-2 w-full max-w-full md:min-h-45 p-4 bg-container rounded-sm cursor-pointer outline outline-outline shadow-primary-background/80 hover:outline-primary hover:shadow-lg hover:transition-all">

      <div class="flex flex-wrap justify-between items-center gap-2 text-sm text-neutral min-h-6">
        <div class="flex items-center justify-center min-h-6 w-6 bg-secondary rounded-sm text-primary-foreground">
          <i class="fa-solid fa-location-dot"></i>
        </div>
        <app-action-buttons
          [deleteMessageKey]="'LOCATIONS.DELETE.CONFIRM'"
          [deleteMessageParams]="{ name: location().name }"
          (edit)="onEdit()"
          (delete)="onDelete()"
        ></app-action-buttons>
      </div>

      <div class="min-h-6 break-all">
        <p class="font-bold text-default">{{ location().name }}</p>
      </div>

      <div class="flex-1 break-words">
        @if (location().description) {
          <p class="text-sm leading-tight">{{ location().description }}</p>
        }
      </div>

      <div class="flex flex-wrap justify-end items-center text-sm text-secondary min-h-4 break-all group-hover:text-secondary-details group-hover:gap-2 transition-all">
        <p class="text-xs">{{ actionLabel() }}</p>
        <i class="fa-solid fa-angle-right"></i>
      </div>
    </a>
  `,
})
export class LocationCardComponent {
  private readonly formDialog = inject(FormDialogService);

  location = input.required<Location>();
  actionLabel = input('Ver dispositivos');

  edit = output<Location>();
  delete = output<Location>();

  onEdit(): void {
    this.edit.emit(this.location());
  }

  onDelete(): void {
    this.delete.emit(this.location());
  }
}
