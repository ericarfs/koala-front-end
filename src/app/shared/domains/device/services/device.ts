import { CrudService } from '@shared/domains/crud/crud.service';
import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { Device } from '@shared/interfaces/device';

export interface DeviceUpdate {
  id: number;
  available?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class DeviceService extends CrudService<Device>{
  protected readonly basePath = 'device';
  protected readonly ngZone = inject(NgZone);

  getDeviceUpdates(): Observable<DeviceUpdate> {
    return new Observable<DeviceUpdate>((observer) => {
      const source = new EventSource(`${this.url}/stream`);

      source.onmessage = (event) => {
        this.ngZone.run(() => {
          observer.next(JSON.parse(event.data) as DeviceUpdate);
        });
      };

      source.onerror = (error) => {
        this.ngZone.run(() => observer.error(error));
        source.close();
      };

      return () => source.close();
    });
  }
}
