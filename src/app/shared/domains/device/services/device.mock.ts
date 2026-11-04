import { Injectable } from '@angular/core';
import { delay, interval, map, Observable, of, throwError } from 'rxjs';
import { DeviceService, DeviceUpdate } from './device';
import { Device } from '@shared/interfaces/device';
import { DEVICES_MOCK } from '../../../../mocks/devices';

const FAKE_LATENCY_MS = 3000;

@Injectable()
export class MockDeviceService extends DeviceService {
  private items: Device[] = DEVICES_MOCK.map((d) => ({ ...d }));

  override findAll(): Observable<Device[]> {
    return of(this.items.map((d) => ({ ...d }))).pipe(delay(FAKE_LATENCY_MS));
  }

  override findById(id: number): Observable<Device> {
    const found = this.items.find((d) => d.id === id);
    return found
      ? of({ ...found }).pipe(delay(FAKE_LATENCY_MS))
      : throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
  }

  override save(body: Omit<Device, 'id'>): Observable<Device> {
    const created: Device = { ...body, id: this.nextId() } as Device;
    this.items = [...this.items, created];
    return of({ ...created }).pipe(delay(FAKE_LATENCY_MS));
  }

  override update(id: number, body: Partial<Device>): Observable<Device> {
    const current = this.items.find((d) => d.id === id);
    if (!current) {
      return throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
    }
    const updated: Device = { ...current, ...body };
    this.items = this.items.map((d) => (d.id === id ? updated : d));
    return of({ ...updated }).pipe(delay(FAKE_LATENCY_MS));
  }

  override remove(id: number): Observable<void> {
    this.items = this.items.filter((d) => d.id !== id);
    return of(void 0).pipe(delay(FAKE_LATENCY_MS));
  }

  override getDeviceUpdates(): Observable<DeviceUpdate> {
    // Emite um update a cada 10s alternando disponibilidade
    return interval(10_000).pipe(
      map((i) => {
        const target = this.items[i % this.items.length];
        return {
          id: target.id ?? i,
          available: Math.random() > 0.3,
        } as DeviceUpdate;
      }),
    );
  }

  private nextId(): number {
    const ids = this.items.map((d) => d.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
