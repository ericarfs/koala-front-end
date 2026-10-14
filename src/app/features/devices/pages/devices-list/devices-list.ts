import { ContentLayout } from '@shared/layouts/content/content';
import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DeviceList } from '@shared/domain/device/components/device-list';
import { Input } from '@shared/components/input/input';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { Device } from '@shared/interfaces/device';
import { getDescendantIds, getPath } from '@shared/domain/location/location-tree';
import { TranslocoPipe } from '@jsverse/transloco';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { LocationStore } from '@shared/domain/location/location-store';


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
  private readonly deviceStore = inject(DeviceStore);
  private readonly locationStore = inject(LocationStore);

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

    if (name?.trim()) {
      const needle = name.trim().toLowerCase();
      filtered = filtered.filter((d) => d.name?.toLowerCase().includes(needle));
    }

    if (deviceLocation) {
      const ids = getDescendantIds(Number(deviceLocation), locations);
      filtered = filtered.filter(
        (d) => d.id_enviroment != null && ids.has(d.id_enviroment),
      );
    }

    if (deviceStatus === '1') {
      filtered = filtered.filter((d) => d.available);
    } else if (deviceStatus === '2') {
      filtered = filtered.filter((d) => !d.available);
    }

    return filtered;
  });

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
