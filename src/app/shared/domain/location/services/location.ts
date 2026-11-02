import { Injectable } from '@angular/core';
import { Location } from '@shared/interfaces/location';
import { CrudService } from '@shared/domain/crud/crud.service';

@Injectable({ providedIn: 'root' })
export class LocationService extends CrudService<Location> {
  protected readonly basePath = 'enviroment';
}
