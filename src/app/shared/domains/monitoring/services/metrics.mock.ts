import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { MetricsService } from './metrics';
import { MetricBucket, MetricsQuery } from '../models/metrics-api';
import { DEFAULT_TIME_BUCKET, TIME_BUCKET_MS } from '../models/time-bucket';

interface MockProfile {
  base: number;
  variance: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PROFILE: MockProfile = { base: 20, variance: 5 };

const PROFILES: Record<number, MockProfile> = {
  1: { base: 24, variance: 4 },     // Temperature
  2: { base: 60, variance: 15 },    // Humidity
  3: { base: 400, variance: 300 },  // Brightness
  4: { base: 1.5, variance: 0.8 },  // Energy
  5: { base: 0.5, variance: 0.5 },  // Presence
  6: { base: 45, variance: 10 },    // Umidade de solo
  7: { base: 22, variance: 3 },     // Temperatura de solo
  8: { base: 10, variance: 3 },     // Fluxo
};

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class MockMetricsService extends MetricsService {
  override query(query: MetricsQuery): Observable<MetricBucket[]> {
    const profile = PROFILES[query.idDeviceType] ?? DEFAULT_PROFILE;

    const end = query.endDate ?? new Date();
    const start = query.startDate ?? new Date(end.getTime() - DAY_MS);
    const stepMs = TIME_BUCKET_MS[query.timeBucket ?? DEFAULT_TIME_BUCKET];

    const startMs = start.getTime();
    const points = Math.max(1, Math.floor((end.getTime() - startMs) / stepMs));
    const spread = profile.variance * 0.2;

    const result: MetricBucket[] = [];
    for (let i = 0; i < points; i++) {
      const t = startMs + i * stepMs;
      const value = this.generateValue(profile, t);
      result.push({
        time_interval: new Date(t),
        avg_value: value,
        min_value: round2(value - spread),
        max_value: round2(value + spread),
      });
    }

    return of(result).pipe(delay(500)); // latência simulada
  }

  private generateValue(profile: MockProfile, timestampMs: number): number {
    const hour = new Date(timestampMs).getHours();
    const dailyCycle = Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const noise = (Math.random() - 0.5) * profile.variance * 0.4;
    return round2(profile.base + dailyCycle * profile.variance + noise);
  }
}
