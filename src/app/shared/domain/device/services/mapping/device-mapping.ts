import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MappingApiService } from './mapping';
import { DeviceMapping } from '@shared/interfaces/device-mapping';
import { DeviceType } from '@shared/interfaces/device-type';
import { DeviceTypeService } from '@shared/domain/device-type/services/device-type';
import { environment } from '../../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DeviceMappingService extends MappingApiService<DeviceMapping> {
  protected readonly url = `${environment.apiUrl}deviceTypeMapping`;
  private readonly deviceTypeService = inject(DeviceTypeService);

  getTypesForDevice(deviceId: number): Observable<DeviceType[]> {
    return this.joinByForeignKey(
      deviceId,
      this.deviceTypeService.findAll(),
      (m) => m.type_id,
    );
  }

  getDevicesForType(typeId: number): Observable<number[]> {
    return this.getAllMappings().pipe(
      map((ms) => ms.filter((m) => m.type_id === typeId).map((m) => m.device_id)),
    );
  }
}
