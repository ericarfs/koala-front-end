import { Injectable } from '@angular/core';
import { DeviceType } from '@shared/interfaces/device-type';
import { CrudService } from '@shared/domains/crud/crud.service';

@Injectable({ providedIn: 'root' })
export class DeviceTypeService extends CrudService<DeviceType> {
  protected readonly basePath = 'deviceType';
}
