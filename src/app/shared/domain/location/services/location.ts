import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { Location } from '@shared/interfaces/location';
import { AuthService } from '@core/auth/services/auth';

@Injectable({ providedIn: 'root' })
export class LocationService {
  protected readonly http = inject(HttpClient);
  protected readonly url = `${environment.apiUrl}enviroment`;

  private readonly auth = inject(AuthService);

  findAll(): Observable<Location[]> {
    const url = this.auth.isGuest()
      ? `${environment.apiUrl}guest/environment`
      : this.url;
    return this.http.get<Location[]>(url);
  }

  findById(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.url}/${id}`);
  }

  save(body: Omit<Location, 'id'>): Observable<Location> {
    return this.http.post<Location>(this.url, body);
  }

  update(id: number, body: Partial<Location>): Observable<Location> {
    return this.http.put<Location>(`${this.url}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
