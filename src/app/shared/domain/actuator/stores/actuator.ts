import { inject, Injectable} from '@angular/core';
import { ActuatorService } from '../services/actuator';
import { Actuator } from '@shared/interfaces/actuator';
import { CrudStore } from '@shared/domain/crud/crud.store';


export type MutationError = 'NOT_FOUND';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MutationError };

@Injectable({ providedIn: 'root' })
export class ActuatorStore extends CrudStore<Actuator> {
  protected readonly service = inject(ActuatorService);
  protected readonly logTag = 'ActuatorStore';
}
