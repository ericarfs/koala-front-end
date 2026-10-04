import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { delay, of } from 'rxjs';
import { FormDialogService } from '../../../shared/components/form-dialog/form-dialog.service';
import { Location } from '../../../shared/interfaces/location';
import { ActionButtonsComponent } from '../../../shared/components/action-buttons/action-buttons';
import { LocationStats } from '@shared/domain/location/location-stats';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-location-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ActionButtonsComponent, TranslatePipe],
  host: { class: 'contents' },
  template: `
    <a [routerLink]="['/location', location().id]"
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

              @if (s.avgTemperature != null) {
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

          <!-- 2. Sensores por tipo (sem ícones) -->
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
export class LocationCardComponent {
  readonly stats = input<LocationStats | null >(null);

  readonly location = input.required<Location>();
  readonly actionLabel = input('Ver dispositivos');

  readonly edit = output<Location>();
  readonly delete = output<Location>();

  onEdit(): void {
    this.edit.emit(this.location());
  }

  onDelete(): void {
    this.delete.emit(this.location());
  }
}
