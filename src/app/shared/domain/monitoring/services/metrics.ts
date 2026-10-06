import { environment } from './../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MetricBucket, MetricsQuery } from '../models/metrics-api';

type MetricBucketDto = Omit<MetricBucket, 'time_interval'> & { time_interval: string };

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}datastream`;

  query(query: MetricsQuery): Observable<MetricBucket[]> {
    return this.http
      .post<MetricBucketDto[]>(`${this.url}/filter`, query)
      .pipe(
        map(rows => rows.map(r => ({ ...r, time_interval: new Date(r.time_interval) }))),
      );
  }
}
