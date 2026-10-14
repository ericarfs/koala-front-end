import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { DeviceMappingService } from './device-mapping';
import { DeviceMapping } from '@shared/interfaces/device-mapping';
import { DEVICE_MAPPINGS_MOCK } from '../../../../mocks/device-mapping';

const FAKE_LATENCY_MS = 300;

@Injectable()
export class MockDeviceMappingService extends DeviceMappingService {
  private mappings: DeviceMapping[] = DEVICE_MAPPINGS_MOCK.map(m => ({ ...m }));

  override getMappingsForDevice(deviceId: number): Observable<DeviceMapping[]> {
    return of(this.mappings.filter(m => m.device_id === deviceId))
      .pipe(delay(FAKE_LATENCY_MS));
  }

  override getAllMappings(): Observable<DeviceMapping[]> {
    return of([...this.mappings]).pipe(delay(FAKE_LATENCY_MS));
  }

  override saveAll(deviceId: number, mappings: DeviceMapping[]): Observable<DeviceMapping[]> {
    this.mappings = this.mappings.filter(m => m.device_id !== deviceId);
    this.mappings.push(...mappings);
    return of(mappings).pipe(delay(FAKE_LATENCY_MS));
  }
}
