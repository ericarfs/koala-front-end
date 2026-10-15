import { DeviceCard } from './device-card';
import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Device } from '@shared/interfaces/device';
import { Paginator} from '@shared/components/pagination/paginator';
import { paginate } from '@shared/utils/paginate';
import { TranslocoPipe } from '@jsverse/transloco';
import { mediaQuery } from '@shared/utils/media-query';



@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, DeviceCard, Paginator, TranslocoPipe],
  template: `
    @if (loading()) {
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1 animate-pulse">
        @for(i of [1, 2, 3, 4, 5, 6]; track i){
          <div class="flex flex-col gap-3 p-4 bg-container border border-outline rounded-sm">
            <div class="flex items-start justify-between gap-1">
              <div class="bg-neutral/10 w-30 h-6 rounded"> </div>
              <div class="bg-neutral/10 h-6 w-30 max-w-full rounded-full"></div>
            </div>

            <div class="bg-neutral/10 h-4 w-40 max-w-full rounded"></div>
            <div class="bg-neutral/10 h-3 w-60 max-w-full rounded"></div>
            <div class="bg-neutral/10 h-4 w-50 max-w-full rounded"></div>

            <div class="border-t border-outline pt-2">
              <div class="flex justify-end items-center">
                <div class="bg-neutral/10 h-5 w-10 rounded"></div>
              </div>
            </div>
          </div>
        }
      </div>
    } @else if (devices().length === 0) {
      <p class="text-neutral text-lg">
        {{'DEVICES.LIST.EMPTY' | transloco}}
      </p>
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
        @for (device of pagination.pagedItems(); track device.id) {
          <app-device-card
            [device]="device"
            [locationName]="locationNameFor(device)"
          ></app-device-card>
        }
      </div>

      <app-paginator
        [(pageIndex)]="pagination.pageIndex"
        [totalPages]="pagination.totalPages()"
      />
    }
  `,
  host: {
    class: 'contents',
  },
})
export class DeviceList {
  devices = input.required<Device[]>();
  loading = input(false);

  pageSize = input(9);
  private isMid     = mediaQuery('(max-width: 1279px)');

  effectivePageSize = computed(() => {
    if (this.isMid()) return Math.min(6, this.pageSize());
    return this.pageSize();
  });

  pagination = paginate(this.devices, this.effectivePageSize);

  resolveLocationName = input<(device: Device) => string | undefined>();

  locationNameFor(device: Device): string | undefined {
    return this.resolveLocationName()?.(device);
  }
}
