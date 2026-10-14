import { inject, Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { Device } from '@shared/interfaces/device';

export interface DeviceUpdate {
  id: number;
  available?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  protected readonly http = inject(HttpClient);
  protected readonly ngZone = inject(NgZone);
  protected readonly url = `${environment.apiUrl}device`;

  findAll(): Observable<Device[]> {
    return this.http.get<Device[]>(this.url);
  }

  findById(id: number): Observable<Device> {
    return this.http.get<Device>(`${this.url}/${id}`);
  }

  save(body: Omit<Device, 'id'>): Observable<Device> {
    return this.http.post<Device>(this.url, body);
  }

  update(id: number, body: Partial<Device>): Observable<Device> {
    return this.http.put<Device>(`${this.url}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

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
