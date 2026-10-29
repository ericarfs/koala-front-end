import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DeviceType } from '@shared/interfaces/device-type';
import { AuthService } from '@core/auth/services/auth';

@Injectable({ providedIn: 'root' })
export class DeviceTypeService {
  protected readonly http = inject(HttpClient);
  protected readonly url = `${environment.apiUrl}deviceType`;

  private readonly auth = inject(AuthService);

  findAll(): Observable<DeviceType[]> {
    const url = this.auth.isGuest()
      ? `${environment.apiUrl}guest/deviceTypes`
      : this.url;
    return this.http.get<DeviceType[]>(url);
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
