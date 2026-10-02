import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface DashboardFilterInterface {
  idEnviroment: number;
  idDeviceType: number;
  idDevice?: number | null;
  startDate: Date | null;
  endDate: Date | null;
  timeBucket?: string;
}

export interface DashboardResponseInterface {
  time_interval: Date;
  avg_value: number;
  min_value: number;
  max_value: number;
}

// 👇 Perfil de mock por idDeviceType (não sai daqui)
interface MockProfile {
  base: number;
  variance: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  url: string = `${environment.apiUrl}datastream`;

  // 👇 Chave: quando o backend real existir, vire para false
  private readonly USE_MOCK = true;

  // 👇 Config de mock por tipo de sensor
  private readonly profiles: Record<number, MockProfile> = {
    1: { base: 24,  variance: 4 },    // Temperature
    2: { base: 60,  variance: 15 },   // Humidity
    3: { base: 400, variance: 300 },  // Brightness
    4: { base: 1.5, variance: 0.8 },  // Energy
    5: { base: 0.5, variance: 0.5 },  // Presence
    6: { base: 45,  variance: 10 },   // Umidade de Solo
    7: { base: 22,  variance: 3 },    // Temperatura de Solo
    8: { base: 10,  variance: 3 },    // Sensor de Fluxo
  };

  constructor(private http: HttpClient) {}

  filter(filter: DashboardFilterInterface): Observable<Array<DashboardResponseInterface>> {
    if (this.USE_MOCK) {
      return this.mockFilter(filter);
    }
    return this.http.post<Array<DashboardResponseInterface>>(`${this.url}/filter`, filter);
  }

  // ==========================================================================
  // MOCK
  // ==========================================================================

  private mockFilter(filter: DashboardFilterInterface): Observable<Array<DashboardResponseInterface>> {
    const profile = this.profiles[filter.idDeviceType] ?? { base: 20, variance: 5 };

    const end = filter.endDate ?? new Date();
    const start = filter.startDate ?? new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const stepMs = this.bucketToMs(filter.timeBucket);

    const startMs = start.getTime();
    const endMs = end.getTime();
    const points = Math.max(1, Math.floor((endMs - startMs) / stepMs));

    const result: DashboardResponseInterface[] = [];

    for (let i = 0; i < points; i++) {
      const t = startMs + i * stepMs;
      const value = this.generateValue(profile, t);

      // min/max simulam variação em torno do avg
      const spread = profile.variance * 0.2;

      result.push({
        time_interval: new Date(t),
        avg_value: value,
        min_value: Math.round((value - spread) * 100) / 100,
        max_value: Math.round((value + spread) * 100) / 100,
      });
    }

    return of(result).pipe(delay(500)); // simula latência de rede
  }

  /**
   * Valor fake = base + ciclo diário (seno) + ruído aleatório
   */
  private generateValue(profile: MockProfile, timestampMs: number): number {
    const hour = new Date(timestampMs).getHours();
    const dailyCycle = Math.sin(((hour - 6) / 24) * Math.PI * 2);
    const noise = (Math.random() - 0.5) * profile.variance * 0.4;
    const value = profile.base + dailyCycle * profile.variance + noise;
    return Math.round(value * 100) / 100;
  }

  /**
   * Converte o timeBucket textual em milissegundos.
   * Aceita os valores usados no device-details.ts.
   */
  private bucketToMs(bucket?: string): number {
    const s = 1000;
    const m = 60 * s;
    const h = 60 * m;
    const d = 24 * h;

    switch (bucket) {
      case '30 seconds': return 30 * s;
      case '1 minute':   return m;
      case '5 minutes':  return 5 * m;
      case '15 minutes': return 15 * m;
      case '30 minutes': return 30 * m;
      case '1 hour':     return h;
      case '2 hours':    return 2 * h;
      case '1 day':      return d;
      default:           return 5 * m;
    }
  }
}
