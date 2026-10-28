import { inject, Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Actuator } from '@shared/interfaces/actuator';
import { AirconParameters } from '@features/location/pages/location-list/control-dialog/control-form-dialog.types';

@Injectable({ providedIn: 'root' })
export class ActuatorService {
  protected readonly http = inject(HttpClient);
  protected readonly ngZone = inject(NgZone);
  protected readonly url = `${environment.apiUrl}actuator`;

  findAll(): Observable<Actuator[]> {
    return this.http.get<Actuator[]>(this.url);
  }

  findById(id: number): Observable<Actuator> {
    return this.http.get<Actuator>(`${this.url}/${id}`);
  }

  save(body: Omit<Actuator, 'id'>): Observable<Actuator> {
    return this.http.post<Actuator>(this.url, body);
  }

  update(id: number, body: Partial<Actuator>): Observable<Actuator> {
    return this.http.put<Actuator>(`${this.url}/${id}`, body);
  }

  sendAirconCommand(enviromentId: string, body: AirconParameters): Observable<unknown> {
    return this.http.post<unknown>(`${this.url}/aircon/${enviromentId}`, body);
  }

  getActuatorUpdates(): Observable<unknown> {
    return this.openSse<unknown>(`${this.url}/stream`, (data) => JSON.parse(data));
  }

  private openSse<T>(url: string, parse: (data: string) => T): Observable<T> {
    return new Observable<T>((observer) => {
      const source = new EventSource(url, { withCredentials: true });

      source.onmessage = (event) => {
        this.ngZone.run(() => observer.next(parse(event.data)));
      };

      source.onerror = (error) => {
        this.ngZone.run(() => observer.error(error));
        source.close();
      };

      return () => source.close();
    });
  }
}
