import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { ActuatorMapping } from '@shared/interfaces/actuator-mapping';
import { ACTUATOR_MAPPINGS_MOCK } from '../../../../mocks/actuator-mapping';
import { ActuatorMappingService } from './actuator-mapping';

const FAKE_LATENCY_MS = 300;

@Injectable()
export class MockActuatorMappingService extends ActuatorMappingService {
  private mappings: ActuatorMapping[] = ACTUATOR_MAPPINGS_MOCK.map(m => ({ ...m }));

  override getMappingsForDevice(deviceId: number): Observable<ActuatorMapping[]> {
    return of(this.mappings.filter(m => m.actuator_id === deviceId))
      .pipe(delay(FAKE_LATENCY_MS));
  }

  override getAllMappings(): Observable<ActuatorMapping[]> {
    return of([...this.mappings]).pipe(delay(FAKE_LATENCY_MS));
  }

  override saveAll(deviceId: number, mappings: ActuatorMapping[]): Observable<ActuatorMapping[]> {
    this.mappings = this.mappings.filter(m => m.device_id !== deviceId);
    this.mappings.push(...mappings);
    return of(mappings).pipe(delay(FAKE_LATENCY_MS));
  }
}
