import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { User, UserBasic } from '@shared/interfaces/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  protected readonly http = inject(HttpClient);
  protected readonly url = `${environment.apiUrl}user`;

  findAll(): Observable<UserBasic[]> {
    return this.http.get<UserBasic[]>(this.url);
  }

  findById(id: number): Observable<UserBasic> {
    return this.http.get<UserBasic>(`${this.url}/${id}`);
  }

  save(body: Omit<UserBasic, 'id'>): Observable<UserBasic> {
    return this.http.post<UserBasic>(this.url, body);
  }

  update(id: number, body: Partial<UserBasic>): Observable<UserBasic> {
    return this.http.put<UserBasic>(`${this.url}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  changePassword(id: number, body: User): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/password`, body);
  }
}
