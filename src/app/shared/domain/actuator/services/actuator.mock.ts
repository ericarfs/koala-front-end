import { Injectable } from '@angular/core';
import { delay, interval, map, Observable, of, throwError } from 'rxjs';
import { Actuator } from '@shared/interfaces/actuator';
import { ACTUATORS_MOCK } from '../../../../mocks/actuators';
import { ActuatorService } from './actuator';
import { AirconParameters } from '@features/location/pages/location-list/control-dialog/control-form-dialog.types';

const FAKE_LATENCY_MS = 300;

@Injectable()
export class MockActuatorService extends ActuatorService {
  private items: Actuator[] = ACTUATORS_MOCK.map((a) => ({ ...a }));

  override findAll(): Observable<Actuator[]> {
    return of(this.items.map((a) => ({ ...a }))).pipe(delay(FAKE_LATENCY_MS));
  }

  override findById(id: number): Observable<Actuator> {
    const found = this.items.find((a) => a.id === id);
    return found
      ? of({ ...found }).pipe(delay(FAKE_LATENCY_MS))
      : throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
  }

  override save(body: Omit<Actuator, 'id'>): Observable<Actuator> {
    const created: Actuator = { ...body, id: this.nextId() };
    this.items = [...this.items, created];
    return of({ ...created }).pipe(delay(FAKE_LATENCY_MS));
  }

  override update(id: number, body: Partial<Actuator>): Observable<Actuator> {
    const current = this.items.find((a) => a.id === id);
    if (!current) {
      return throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
    }
    const updated: Actuator = { ...current, ...body };
    this.items = this.items.map((a) => (a.id === id ? updated : a));
    return of({ ...updated }).pipe(delay(FAKE_LATENCY_MS));
  }

  override sendAirconCommand(
    _enviromentId: string,
    _body: AirconParameters,
  ): Observable<unknown> {
    return of({ status: 'ok', message: 'Command sent' }).pipe(delay(FAKE_LATENCY_MS));
  }

  override getActuatorUpdates(): Observable<unknown> {
    return interval(5000).pipe(
      map(() => {
        const actuator = this.items[Math.floor(Math.random() * this.items.length)];
        return {
          actuatorId: actuator?.id,
          power: Math.random() > 0.5,
          temperature: 18 + Math.floor(Math.random() * 9),
        };
      }),
    );
  }

  private nextId(): number {
    const ids = this.items.map((a) => a.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
