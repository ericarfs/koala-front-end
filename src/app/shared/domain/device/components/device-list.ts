import { DeviceCardComponent } from './device-card';
import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { PaginatorComponent } from '../../../components/pagination/paginator';
import { Device, DeviceWithTypes } from '@shared/interfaces/device';
import { paginate } from '@shared/utils/paginate';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';


@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, DeviceCardComponent, PaginatorComponent],
  template: `
    @if (devices().length === 0) {
      <p class="text-neutral">Nenhum dispositivo encontrado.</p>
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-3 gap-1">
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
export class DeviceListComponent {
  private readonly mappingService = inject(DeviceMappingService);

  devices = input.required<Device[]>();

  readonly enrichedDevices = toSignal(
    // Reage a mudanças no input
    toObservable(this.devices).pipe(
      // Para cada lista de devices, busca os types de todos em paralelo
      switchMap(devices => {
        if (devices.length === 0) return of([] as DeviceWithTypes[]);

        // Cria um Observable por device
        const observables = devices.map(device =>
          device.id != null
            ? this.mappingService.getTypesForDevice(device.id).pipe(
                map(types => ({ ...device, types } as DeviceWithTypes))
              )
            : of({ ...device, types: [] } as DeviceWithTypes)
        );

        // Combina todos num só array
        return combineLatest(observables);
      })
    ),
    { initialValue: [] as DeviceWithTypes[] }
  );

  pageSize = input(9);
  pagination = paginate(this.enrichedDevices, this.pageSize);

  resolveLocationName = input<(device: Device) => string | undefined>();

  locationNameFor(device: Device): string | undefined {
    return this.resolveLocationName()?.(device);
  }
}
