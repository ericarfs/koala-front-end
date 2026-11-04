import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MappingApiService } from './mapping';
import { ActuatorMapping } from '@shared/interfaces/actuator-mapping';
import { Actuator } from '@shared/interfaces/actuator';
import { ActuatorService } from '@shared/domains/actuator/services/actuator';
import { environment } from '../../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActuatorMappingService extends MappingApiService<ActuatorMapping> {
  protected readonly url = `${environment.apiUrl}actuatorMapping`;
  private readonly actuatorService = inject(ActuatorService);

  getActuatorsForDevice(deviceId: number): Observable<Actuator[]> {
    return this.joinByForeignKey(
      deviceId,
      this.actuatorService.findAll(),
      (m) => m.actuator_id,
    );
  }
}
