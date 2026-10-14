import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { DeviceMapping } from '@shared/interfaces/device-mapping';
import { DeviceType } from '@shared/interfaces/device-type';
import { DeviceTypeService } from '@shared/domain/device-type/services/device-type';

@Injectable({ providedIn: 'root' })
export class DeviceMappingService {
  protected readonly http = inject(HttpClient);
  protected readonly deviceTypeService = inject(DeviceTypeService);
  protected readonly url = `${environment.apiUrl}deviceTypeMapping`;

  // ---- primitivos (mock sobrescreve) ----

  getMappingsForDevice(deviceId: number): Observable<DeviceMapping[]> {
    return this.http.get<DeviceMapping[]>(`${this.url}/${deviceId}`);
  }

  getAllMappings(): Observable<DeviceMapping[]> {
    return this.http.get<DeviceMapping[]>(this.url);
  }

  saveAll(deviceId: number, mappings: DeviceMapping[]): Observable<DeviceMapping[]> {
    return this.http.post<DeviceMapping[]>(`${this.url}/${deviceId}`, mappings);
  }

  // ---- query composta  ----

  getTypesForDevice(deviceId: number): Observable<DeviceType[]> {
    return forkJoin({
      mappings: this.getMappingsForDevice(deviceId),
      types: this.deviceTypeService.findAll(),
    }).pipe(
      map(({ mappings, types }) => {
        const ids = new Set(mappings.map(m => m.type_id));
        return types.filter(t => ids.has(t.id));
      }),
    );
  }

  getDevicesForType(typeId: number): Observable<number[]> {
    return this.getAllMappings().pipe(
      map(mappings =>
        mappings
          .filter(m => m.type_id === typeId)
          .map(m => m.device_id),
      ),
    );
  }
}
