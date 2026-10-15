import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActionButtons } from '@shared/components/action-buttons/action-buttons';
import { Device } from '@shared/interfaces/device';
import { DeviceMappingService } from '../services/device-mapping';
import { rxResource} from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { DeviceType } from '@shared/interfaces/device-type';
import { DeviceTypesSkeleton } from './device-types-skeleton';

@Component({
  selector: 'app-device-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ActionButtons, DeviceTypesSkeleton],
  template: `
    <a [routerLink]="['/devices', device().id]"
      class="flex flex-col gap-3 p-4 bg-container border border-outline rounded-sm cursor-pointer hover:border-primary transition-colors">

      <div class="flex items-start justify-between gap-1">
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            [class.bg-success]="device().available"
            [class.bg-destructive]="!device().available"
          ></span>
          <p class="font-semibold text-default truncate">{{ device().name }}</p>
        </div>

        <div
          class="text-xs w-25 max-w-full shrink-0 text-center font-medium py-1 px-3 rounded-full"
          [class]="{'bg-success': device().available, 'bg-destructive': !device().available}"
          [class.text-success-foreground]="device().available"
          [class.text-destructive-foreground]="!device().available"
        >
          {{ device().available ? 'Online' : 'Offline' }}
        </div>
      </div>

      @if (typesResource.isLoading()) {
        <app-device-types-skeleton/>
      } @else if (typesResource.value()?.length) {
        <div class="flex flex-wrap gap-1">
          @for (type of typesResource.value()!; track type.id) {
            <span class="inline-flex items-center px-2 py-0.5 rounded-sm text-xs bg-neutral/10 text-neutral">
              {{ type.name }}
            </span>
          }
        </div>
      }

      @if (locationName()) {
        <p class="text-xs text-neutral flex items-center gap-1 text-primary-details">
          <i class="fa-solid fa-location-dot"></i>
          {{ locationName() }}
        </p>
      }

      @if (device().description) {
        <p class="text-sm text-neutral leading-tight flex-1">{{ device().description }}</p>
      }

      <div class="border-t border-outline pt-2">
        <app-action-buttons
        (edit)="onEdit()"
        ></app-action-buttons>
      </div>

    </a>
  `,
  host: { class: 'contents' },
})
export class DeviceCard {
  private router = inject(Router);
  private readonly mappingService = inject(DeviceMappingService);

  device = input.required<Device>();
  locationName = input<string>();

  readonly typesResource = rxResource({
    params: () => this.device().id,
    stream: ({ params }) =>
      params != null
        ? this.mappingService.getTypesForDevice(params)
        : of([] as DeviceType[]),
  });

  onEdit(){
    this.router.navigate(['devices/edit', this.device().id]);
  }
}
