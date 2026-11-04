import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { UserService } from './user';
import { User, UserBasic } from '@shared/interfaces/user';
import { USERS_MOCK } from '../../../../mocks/users';

const FAKE_LATENCY_MS = 300;

@Injectable()
export class MockUserService extends UserService {
  private items: UserBasic[] = USERS_MOCK.map(u => ({ ...u }));

  override findAll(): Observable<UserBasic[]> {
    return of(this.items.map(u => ({ ...u }))).pipe(delay(FAKE_LATENCY_MS));
  }

  override findById(id: number): Observable<UserBasic> {
    const found = this.items.find(u => u.id === id);
    return found
      ? of({ ...found }).pipe(delay(FAKE_LATENCY_MS))
      : throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
  }

  override save(body: Omit<UserBasic, 'id'>): Observable<UserBasic> {
    const created: UserBasic = { ...body, id: this.nextId() } as UserBasic;
    this.items = [...this.items, created];
    return of({ ...created }).pipe(delay(FAKE_LATENCY_MS));
  }

  override update(id: number, body: Partial<UserBasic>): Observable<UserBasic> {
    const current = this.items.find(u => u.id === id);
    if (!current) {
      return throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
    }
    const updated: UserBasic = { ...current, ...body };
    this.items = this.items.map(u => (u.id === id ? updated : u));
    return of({ ...updated }).pipe(delay(FAKE_LATENCY_MS));
  }

  override remove(id: number): Observable<void> {
    this.items = this.items.filter(u => u.id !== id);
    return of(void 0).pipe(delay(FAKE_LATENCY_MS));
  }

  override changePassword(id: number, _body: User): Observable<void> {
    const found = this.items.find(u => u.id === id);
    if (!found) {
      return throwError(() => new Error('NOT_FOUND')).pipe(delay(FAKE_LATENCY_MS));
    }
    return of(void 0).pipe(delay(FAKE_LATENCY_MS));
  }

  private nextId(): number {
    const ids = this.items.map(u => u.id ?? 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
