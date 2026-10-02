import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DEVICE_MAPPINGS_MOCK } from '../../../../mocks/device-mapping';
import { DEVICE_TYPES_MOCK } from '../../../../mocks/device-types';
import { DeviceMapping } from '@shared/interfaces/device-mapping';
import { DeviceType } from '@shared/interfaces/device-type';

@Injectable({ providedIn: 'root' })
export class DeviceMappingService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}deviceTypeMapping`;

  private typeByDevice = new Map<number, number[]>();
  private typeNameById = new Map<number, string>();
  private deviceByType = new Map<number, number[]>();


  private loaded = false;
  private loading?: Promise<void>;

  /** Garante que os Maps estão populados (uma vez só). */
  private ensureLoaded(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    if (this.loading) return this.loading;

    this.loading = firstValueFrom(
      of({
        mappings: DEVICE_MAPPINGS_MOCK,
        types: DEVICE_TYPES_MOCK,
      })
    ).then(({ mappings, types }) => {
      console.log('[Mapping] carregou:', mappings.length, 'types:', types.length);
      // Se aparecer "carregou: 4 mappings, 8 types" → funcionou 🎉
      this.index(mappings, types);
      this.loaded = true;
      this.loading = undefined;
    });

    return this.loading;
  }

  index(mappings: DeviceMapping[], types: DeviceType[]): void {
    this.typeByDevice.clear();
    this.typeNameById.clear();
    this.deviceByType.clear();
    for (const t of types) this.typeNameById.set(t.id, t.name);
    for (const m of mappings) {
      const list = this.typeByDevice.get(m.device_id) ?? [];
      list.push(m.type_id);
      this.typeByDevice.set(m.device_id, list);

      const devices = this.deviceByType.get(m.type_id) ?? [];
      devices.push(m.device_id);
      this.deviceByType.set(m.type_id, devices);
    }
    this.loaded = true;
  }

  /** 👈 Retorna Observable — carrega se ainda não carregou. */
  getTypesForDevice(deviceId: number): Observable<DeviceType[]> {
    return new Observable(sub => {
      this.ensureLoaded().then(() => {
        sub.next(this.readFromMaps(deviceId));
        sub.complete();
      });
    });   // 👈 ASSÍNCRONO
  }

  /** Ids de dispositivo que possuem esse tipo de sensor */
  getDevicesForType(typeId: number): Observable<number[]> {
    return new Observable(sub => {
      this.ensureLoaded().then(() => {
        sub.next(this.deviceByType.get(typeId) ?? []);
        sub.complete();
      });
    });
  }

  private readFromMaps(deviceId: number): DeviceType[] {
    const typeIds = this.typeByDevice.get(deviceId) ?? [];
    return typeIds
      .map(id => ({ id, name: this.typeNameById.get(id) ?? '' }))
      .filter(t => t.name !== '');
  }
}
