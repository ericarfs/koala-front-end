import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@shared/interfaces/location';
import { LocationStats } from '@shared/domain/location/location-stats';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ActionButtons } from '@shared/components/action-buttons/action-buttons';
import { DialogService } from '@shared/components/dialogs/dialogs.service';
import { LocationStore, MutationError } from '@shared/domain/location/location-store';
import { finalize, of, switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ActionButtons, TranslatePipe],
  host: { class: 'contents' },
  template: `
    <a
      [routerLink]="deleting() ? null : ['/location', location().id]"
      [class.pointer-events-none]="deleting()"
      [class.opacity-50]="deleting()"
      [attr.aria-disabled]="deleting()"
      [attr.tabindex]="deleting() ? -1 : null"
      class="group flex flex-col justify-start gap-2 w-full max-w-full  min-h-120 p-4 bg-container rounded-sm cursor-pointer outline outline-outline shadow-primary-background/80 hover:outline-primary hover:shadow-lg hover:transition-all">

      <div class="flex flex-wrap justify-between items-center gap-2 text-sm text-neutral min-h-6">
        <div class="flex items-center justify-center min-h-6 w-6 bg-secondary rounded-sm text-primary-foreground">
          <i class="fa-solid fa-location-dot"></i>
        </div>
        <app-action-buttons
          [deleteMessageKey]="'LOCATIONS.DELETE.CONFIRM'"
          [deleteMessageParams]="{ name: location().name }"
          (edit)="onEdit()"
          (delete)="onDelete()"
          [deleting]="deleting()"
        ></app-action-buttons>
      </div>

      <div class="min-h-6 break-all">
        <p class="font-bold text-default text-xl">{{ location().name }}</p>
      </div>

      <div class="break-words">
        @if (location().description) {
          <p class="text-sm leading-tight">{{ location().description }}</p>
        }
      </div>

      @if (stats(); as s) {
        <div class="flex-1 mt-4 space-y-4">

          <!-- 1. Resumo: total + status -->
          <div class="space-y-2 max-w-full">
            <div class="flex flex-wrap items-end justify-between ">
              <div class="flex flex-wrap items-baseline gap-2">
                <i class="fa-solid fa-microchip text-primary"></i>
                <span class="text-3xl font-bold leading-none">{{ s.devicesTotal }}</span>
                <span class="text-xs text-neutral">{{ 'LOCATIONS.STATS.DEVICES' | translate }}</span>
              </div>

              @if (s.avgTemperature !== null) {
                <div class="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <i class="fa-solid fa-temperature-half text-orange-400"></i>
                  {{ s.avgTemperature | number:'1.0-1' }} °C
                </div>
              }
            </div>

            <!-- Barra online/offline -->
            <div class="h-1.5 w-full rounded-full overflow-hidden bg-destructive">
              <div class="h-full bg-success transition-all"
                  [style.width.%]="s.devicesTotal ? (s.devicesOnline / s.devicesTotal) * 100 : 0">
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-xs text-neutral">
              <span class="inline-flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-success"></span>
                <b class="text-foreground">{{ s.devicesOnline }}</b>
                {{ 'LOCATIONS.STATS.ONLINE' | translate }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-destructive"></span>
                <b class="text-foreground">{{ s.devicesOffline }}</b>
                {{ 'LOCATIONS.STATS.OFFLINE' | translate }}
              </span>
            </div>
          </div>

          <!-- 2. Sensores por tipo -->
          @if (s.byType.length) {
            <div class="grid grid-cols-1 min-[340px]:grid-cols-2 gap-0.5 py-2">
              @for (t of s.byType; track t.type.id) {
                <div class="flex items-center justify-between gap-2 px-3 py-1 rounded-sm bg-container border border-outline">
                  <span class="text-xs text-neutral truncate" [title]="t.type.name">{{ t.type.name }}</span>
                  <span class="text-sm font-semibold">{{ t.count }}</span>
                </div>
              }
            </div>
          }
        </div>
      }

      <div class="flex flex-wrap justify-end items-center text-sm text-secondary min-h-4 break-all group-hover:text-secondary-details group-hover:gap-2 transition-all">
        <p class="text-xs">{{ actionLabel() }}</p>
        <i class="fa-solid fa-angle-right"></i>
      </div>
    </a>
  `,
})
export class LocationCard {
  private readonly formDialog = inject(DialogService);

  private readonly store = inject(LocationStore);

  readonly stats = input<LocationStats | null >(null);

  readonly location = input.required<Location>();
  readonly actionLabel = input('Ver dispositivos');

  readonly deleting = signal(false);

  onEdit(): void {
    const location = this.location();
    const editingId = location.id;

    this.formDialog
      .open<Location>({
        title: 'LOCATIONS.EDIT.TITLE',
        subtitle: 'LOCATIONS.EDIT.SUBTITLE',
        submitLabel: 'COMMON.ACTIONS.SAVE',
        fields: [
        {
          key: 'name',
          label: 'COMMON.FORM.NAME',
          placeholder: 'COMMON.FORM.NAME_PLACEHOLDER',
          required: true
        },
        {
          key: 'description',
          label: 'COMMON.FORM.DESCRIPTION',
          placeholder: 'COMMON.FORM.DESCRIPTION_PLACEHOLDER',
          type: 'textarea',
          rows: 4
        },
        ],
        initialValues: { name: location.name, description: location.description },
        onSubmit: (values) => {
          const v = values as { name: string; description?: string };

          const patch: Partial<Location> = {
            name: v.name,
            description: v.description ?? '',
          };

          return this.store.update(editingId, patch).pipe(
            switchMap((res) =>
              res.ok
              ? of(res.data)
              : throwError(() => this.toErrorMessage(res.reason)),
            ),
          );

        },
      })
    .closed.subscribe();
  }

   private toErrorMessage(reason: MutationError): string {
      switch (reason) {
        case 'MAX_DEPTH_EXCEEDED':
          return 'LOCATIONS.ERRORS.MAX_DEPTH';
        case 'INVALID_PARENT':
          return 'LOCATIONS.ERRORS.INVALID_PARENT';
      }
    }

  onDelete(): void {
    const id = this.location().id;
    if (id == null) return;

    this.deleting.set(true);
    this.store.remove(id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            // toast / snackbar de erro
            return;
          }
          // toast de sucesso, ou nada
        },
        error: (err) => {
          console.error(err);
          // toast de erro
        },
      });
  }
}
