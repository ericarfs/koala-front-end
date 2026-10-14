import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DeviceType } from '@shared/interfaces/device-type';

@Injectable({ providedIn: 'root' })
export class DeviceTypeService {
  protected readonly http = inject(HttpClient);
  protected readonly url = `${environment.apiUrl}deviceType`;

  findAll(): Observable<DeviceType[]> {
    return this.http.get<DeviceType[]>(this.url);
  }

  findById(id: number): Observable<DeviceType> {
    return this.http.get<DeviceType>(`${this.url}/${id}`);
  }

  save(body: Omit<DeviceType, 'id'>): Observable<DeviceType> {
    return this.http.post<DeviceType>(this.url, body);
  }

  update(id: number, body: Partial<DeviceType>): Observable<DeviceType> {
    return this.http.put<DeviceType>(`${this.url}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
