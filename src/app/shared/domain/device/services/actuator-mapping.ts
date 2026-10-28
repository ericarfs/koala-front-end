import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { DeviceType } from '@shared/interfaces/device-type';
import { ActuatorService } from '@shared/domain/actuator/services/actuator';
import { ActuatorMapping } from '@shared/interfaces/actuator-mapping';

@Injectable({ providedIn: 'root' })
export class ActuatorMappingService {
  protected readonly http = inject(HttpClient);
  protected readonly actuatorService = inject(ActuatorService);
  protected readonly url = `${environment.apiUrl}actuatorMapping`;

  getMappingsForDevice(deviceId: number): Observable<ActuatorMapping[]> {
    return this.http.get<ActuatorMapping[]>(`${this.url}/${deviceId}`);
  }

  getAllMappings(): Observable<ActuatorMapping[]> {
    return this.http.get<ActuatorMapping[]>(this.url);
  }

  saveAll(id: number, mappings: ActuatorMapping[]): Observable<ActuatorMapping[]> {
    return this.http.post<ActuatorMapping[]>(`${this.url}/${id}`, mappings);
  }

  getActuatorsForDevice(deviceId: number): Observable<DeviceType[]> {
    return forkJoin({
      mappings: this.getMappingsForDevice(deviceId),
      actuators: this.actuatorService.findAll(),
    }).pipe(
      map(({ mappings, actuators }) => {
        const ids = new Set(mappings.map(m => m.actuator_id));
        return actuators.filter(t => ids.has(t.id));
      }),
    );
  }
}
