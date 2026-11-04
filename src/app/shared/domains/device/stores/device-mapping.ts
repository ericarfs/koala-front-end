import { inject, Injectable } from '@angular/core';
import { DeviceMappingService } from '../services/mapping/device-mapping';
import { MappingStore } from './mapping';
import { DeviceMapping } from '@shared/interfaces/device-mapping';

@Injectable({ providedIn: 'root' })
export class DeviceMappingStore extends MappingStore<DeviceMapping> {
  protected readonly service = inject(DeviceMappingService);
}
