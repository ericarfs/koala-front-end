import { inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { Actuator } from '@shared/interfaces/actuator';
import { CrudService } from '@shared/domain/crud/crud.service';
import { SseService } from '@shared/services/sse';

@Injectable({ providedIn: 'root' })
export class ActuatorService extends CrudService<Actuator> {
  protected readonly basePath = 'actuator';
  private readonly sse = inject(SseService);
  protected readonly ngZone = inject(NgZone);

  sendAirconCommand(enviromentId: string, body: object): Observable<unknown> {
    return this.http.post<unknown>(`${this.url}/aircon/${enviromentId}`, body);
  }

  getActuatorUpdates(): Observable<unknown> {
    return this.sse.connect(
      `${this.url}/stream`,
      (data) => JSON.parse(data),
      { withCredentials: true }
    );
  }
}
