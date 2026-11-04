import { ContentLayout } from '@shared/layouts/content/content';
import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DeviceList } from '@shared/domains/device/components/device-list';
import { Input } from '@shared/components/input/input';
import { LocationTreeSelect } from '@shared/domains/location/components/location-tree-select';
import { Device } from '@shared/interfaces/device';
import { getDescendantIds, getPath } from '@shared/domains/location/components/location-tree';
import { TranslocoPipe } from '@jsverse/transloco';
import { DeviceStore } from '@shared/domains/device/stores/device-store';
import { LocationStore } from '@shared/domains/location/stores/location-store';
import { Location } from '@shared/interfaces/location';


@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [ReactiveFormsModule, ContentLayout, DeviceList, Input, LocationTreeSelect, TranslocoPipe],
  styleUrl: './devices-list.css',
  templateUrl: './devices-list.html',
  host: {
    class: 'block flex-1',
  },
})
export class DevicesList {
  private readonly locationStore = inject(LocationStore);

  readonly deviceStore = inject(DeviceStore);

  searchForms = new FormGroup({
    name: new FormControl(''),
    deviceLocation: new FormControl<number | null>(null),
    deviceStatus: new FormControl(''),
  });

  statusOptions = [
    { value: '',   labelKey: 'ENUMS.STATUS.ALL'     },
    { value: '1',  labelKey: 'ENUMS.STATUS.ONLINE'  },
    { value: '2',  labelKey: 'ENUMS.STATUS.OFFLINE' },
  ];

  private filters = toSignal(this.searchForms.valueChanges, {
    initialValue: this.searchForms.value,
  });

  devices = computed(() => {
    const { name, deviceLocation, deviceStatus } = this.filters();
    const locations = this.locationStore.items();

    let filtered = this.deviceStore.items();
    filtered = this.filterByName(filtered, name);
    filtered = this.filterByLocation(filtered, deviceLocation, locations);
    filtered = this.filterByStatus(filtered, deviceStatus);

    return filtered;
  });

  private filterByName(devices: Device[], term: string | null | undefined): Device[] {
    if (!term?.trim()) return devices;
    const needle = term.trim().toLowerCase();
    return devices.filter((d) => d.name?.toLowerCase().includes(needle));
  }

  private filterByLocation(devices: Device[], locationId: number | null | undefined, locations: Location[]): Device[] {
    if (!locationId) return devices;
    const ids = getDescendantIds(Number(locationId), locations);
    return devices.filter((d) => d.id_enviroment != null && ids.has(d.id_enviroment));
  }

  private filterByStatus(devices: Device[], status: string | null | undefined): Device[] {
    if (status === '1') return devices.filter((d) => d.available);
    if (status === '2') return devices.filter((d) => !d.available);
    return devices;
  }

  setStatus(value: string): void {
    this.searchForms.patchValue({ deviceStatus: value });
  }

  getLocationName = (device: Device) => {
    const locations = this.locationStore.items();
    return device.id_enviroment != null
      ? getPath(device.id_enviroment, locations)
      : undefined;
  };
}
