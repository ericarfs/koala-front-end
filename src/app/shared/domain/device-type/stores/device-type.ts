import { inject, Injectable } from '@angular/core';
import { DeviceTypeService } from '../services/device-type';
import { DeviceType } from '@shared/interfaces/device-type';
import { reloadOnScope } from '@shared/utils/reload-on-scope';
import { DATA_SCOPE } from '@shared/tokens/data-scope';
import { CrudStore } from '@shared/domain/crud/crud.store';

export type MutationError = 'NOT_FOUND';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: MutationError };

@Injectable({ providedIn: 'root' })
export class DeviceTypeStore extends CrudStore<DeviceType> {
  protected readonly service = inject(DeviceTypeService);
  protected readonly logTag = 'DeviceTypeStore';

  constructor() {
    super();
    reloadOnScope(inject(DATA_SCOPE), {
      load: () => this.load(),
      reset: () => this.reset(),
    });
  }
}
