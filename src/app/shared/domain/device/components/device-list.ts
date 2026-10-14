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
    @if (devices().length === 0) {
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
