import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

export abstract class MappingApiService<M> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly url: string;

  getAllMappings(): Observable<M[]> {
    return this.http.get<M[]>(this.url);
  }

  getMappingsForDevice(deviceId: number): Observable<M[]> {
    return this.http.get<M[]>(`${this.url}/${deviceId}`);
  }

  saveAll(id: number, mappings: M[]): Observable<M[]> {
    return this.http.post<M[]>(`${this.url}/${id}`, mappings);
  }

  protected joinByForeignKey<E extends { id: number }>(
    deviceId: number,
    entities$: Observable<E[]>,
    fk: (m: M) => number,
  ): Observable<E[]> {
    return forkJoin({
      mappings: this.getMappingsForDevice(deviceId),
      entities: entities$,
    }).pipe(
      map(({ mappings, entities }) => {
        const ids = new Set(mappings.map(fk));
        return entities.filter((e) => ids.has(e.id));
      }),
    );
  }
}
