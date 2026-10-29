import { environment } from './../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MetricBucket, MetricsQuery } from '../models/metrics-api';
import { AuthService } from '@core/auth/services/auth';

type MetricBucketDto = Omit<MetricBucket, 'time_interval'> & { time_interval: string };

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}datastream`;

  private readonly auth = inject(AuthService);

  query(query: MetricsQuery): Observable<MetricBucket[]> {
    const url = this.auth.isGuest()
      ? `${environment.apiUrl}guest/filter`
      : `${this.url}/filter`;

    return this.http
      .post<MetricBucketDto[]>(url, query)
      .pipe(map(rows => rows.map(r => ({ ...r, time_interval: new Date(r.time_interval) }))));
  }
}
