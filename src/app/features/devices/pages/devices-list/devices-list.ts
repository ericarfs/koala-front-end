import { ContentLayout } from '@shared/layouts/content/content';
import { Component, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DeviceList } from '@shared/domain/device/components/device-list';
import { Input } from '@shared/components/input/input';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { DEVICES_MOCK } from '../../../../mocks/devices';
import { Device } from '@shared/interfaces/device';
import { getDescendantIds, getPath } from '@shared/domain/location/location-tree';
import { LOCATIONS_MOCK } from '../../../../mocks/locations';
import { TranslatePipe } from '@ngx-translate/core';



@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [ReactiveFormsModule, ContentLayout, DeviceList, Input, LocationTreeSelect, TranslatePipe],
  styleUrl: './devices-list.css',
  templateUrl: './devices-list.html',
  host: {
    class: 'block flex-1',
  },
})
export class DevicesList {
  locationList = new Map<number, string>();

  private readonly allDevices = toSignal(of(DEVICES_MOCK), {
    initialValue: [] as Device[],
  });

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
    let filtered = this.allDevices();

    if (name?.trim()) {
      filtered = filtered.filter(d =>
        d.name?.toLowerCase().includes(name.trim().toLowerCase())
      );
    }
    if (deviceLocation) {
      const ids = getDescendantIds(Number(deviceLocation), LOCATIONS_MOCK);
      filtered = filtered.filter(
        d => d.id_enviroment != null && ids.has(d.id_enviroment)
      );
    }
    if (deviceStatus === '1') {
      filtered = filtered.filter(d => d.available);
    } else if (deviceStatus === '2') {
      filtered = filtered.filter(d => !d.available);
    }

    return filtered;
  });

  setStatus(value: string): void {
    this.searchForms.patchValue({ deviceStatus: value });
  }

  getLocationName = (device: Device) =>
  device.id_enviroment != null ? getPath(device.id_enviroment, LOCATIONS_MOCK) : undefined;
}
