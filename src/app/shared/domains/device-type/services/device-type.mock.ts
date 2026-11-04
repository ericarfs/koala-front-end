import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { DeviceTypeService } from './device-type';
import { DeviceType } from '@shared/interfaces/device-type';
import { DEVICE_TYPES_MOCK } from '../../../../mocks/device-types';

const FAKE_LATENCY_MS = 300;

@Injectable()
export class MockDeviceTypeService extends DeviceTypeService {
  private items: DeviceType[] = DEVICE_TYPES_MOCK.map((t) => ({ ...t }));

  override findAll(): Observable<DeviceType[]> {
    return of(this.items.map((t) => ({ ...t }))).pipe(delay(FAKE_LATENCY_MS));
  }

  override findById(id: number): Observable<DeviceType> {
    const found = this.items.find((t) => t.id === id);
    return found
      ? of({ ...found }).pipe(delay(FAKE_LATENCY_MS))
      : throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
  }

  override save(body: Omit<DeviceType, 'id'>): Observable<DeviceType> {
    const created: DeviceType = { ...body, id: this.nextId() } as DeviceType;
    this.items = [...this.items, created];
    return of({ ...created }).pipe(delay(FAKE_LATENCY_MS));
  }

  override update(id: number, body: Partial<DeviceType>): Observable<DeviceType> {
    const current = this.items.find((t) => t.id === id);
    if (!current) {
      return throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
    }
    const updated: DeviceType = { ...current, ...body };
    this.items = this.items.map((t) => (t.id === id ? updated : t));
    return of({ ...updated }).pipe(delay(FAKE_LATENCY_MS));
  }

  override remove(id: number): Observable<void> {
    this.items = this.items.filter((t) => t.id !== id);
    return of(void 0).pipe(delay(FAKE_LATENCY_MS));
  }

  private nextId(): number {
    const ids = this.items.map((t) => t.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
