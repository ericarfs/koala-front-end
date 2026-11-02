import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export abstract class CrudService<T extends { id: number }, TCreate = Omit<T, 'id'>> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly basePath: string;

  protected get url(): string {
    return `${environment.apiUrl}${this.basePath}`;
  }

  findAll(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  findById(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  save(body: TCreate): Observable<T> {
    return this.http.post<T>(this.url, body);
  }

  update(id: number, body: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.url}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
