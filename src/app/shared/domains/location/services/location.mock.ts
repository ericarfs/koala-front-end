import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { LocationService } from './location';
import { Location } from '@shared/interfaces/location';
import { LOCATIONS_MOCK } from '../../../../mocks/locations';

const FAKE_LATENCY_MS = 2000;

@Injectable()
export class MockLocationService extends LocationService {
  // Clone raso: não muta o array original do mock
  private items: Location[] = LOCATIONS_MOCK.map((l) => ({ ...l }));

  override findAll(): Observable<Location[]> {
    return of(this.items.map((l) => ({ ...l }))).pipe(delay(FAKE_LATENCY_MS));
  }

  override findById(id: number): Observable<Location> {
    const found = this.items.find((l) => l.id === id);
    return found
      ? of({ ...found }).pipe(delay(FAKE_LATENCY_MS))
      : throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
  }

  override save(body: Omit<Location, 'id'>): Observable<Location> {
    const created: Location = {
      ...body,
      id: this.nextId(),
    } as Location;

    this.items = [...this.items, created];
    return of({ ...created }).pipe(delay(FAKE_LATENCY_MS));
  }

  override update(id: number, body: Partial<Location>): Observable<Location> {
    const current = this.items.find((l) => l.id === id);
    if (!current) {
      return throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
    }

    const updated: Location = { ...current, ...body };
    this.items = this.items.map((l) => (l.id === id ? updated : l));
    return of({ ...updated }).pipe(delay(FAKE_LATENCY_MS));
  }

  override remove(id: number): Observable<void> {
    this.items = this.items.filter((l) => l.id !== id);
    return of(void 0).pipe(delay(FAKE_LATENCY_MS));
  }

  private nextId(): number {
    const ids = this.items.map((l) => l.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
