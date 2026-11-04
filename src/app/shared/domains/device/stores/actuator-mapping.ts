import { inject, Injectable } from '@angular/core';
import { ActuatorMappingService } from '../services/mapping/actuator-mapping';
import { MappingStore } from './mapping';
import { ActuatorMapping } from '@shared/interfaces/actuator-mapping';

@Injectable({ providedIn: 'root' })
export class ActuatorMappingStore extends MappingStore<ActuatorMapping> {
  protected readonly service = inject(ActuatorMappingService);
}
