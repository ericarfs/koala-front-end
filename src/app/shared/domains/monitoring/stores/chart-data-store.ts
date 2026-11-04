import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { finalize, forkJoin, map, Observable, Subscription } from 'rxjs';
import { MetricsService } from '../services/metrics';
import { MetricBucket, MetricsQuery } from '../models/metrics-api';
import { ChartData, EMPTY_CHART_DATA } from '../models/chart-data';


export interface NamedItem {
  id: number;
  name: string;
}

export interface ChartRequest {
  /** Filtros comuns. Se `idDevice` vier aqui, vale para todas as consultas (device-details). */
  base: Omit<MetricsQuery, 'idDeviceType'>;
  /** 1 ou 2 tipos de sensor. */
  types: NamedItem[];
  /** Só vale com 1 tipo: plota a média do tipo + uma linha por dispositivo. */
  devices?: NamedItem[];
  /** Sufixo da série de média (use a tradução). */
  averageLabel?: string;
}


@Injectable()
export class ChartDataStore implements OnDestroy {
  private readonly metrics = inject(MetricsService);
  private subscription?: Subscription;

  readonly loading = signal(false);
  readonly error = signal(false);
  readonly data = signal<ChartData>(EMPTY_CHART_DATA);

  load(request: ChartRequest): void {
    if (request.types.length === 0) return;

    // Cancela a busca anterior: evita resposta antiga sobrescrever a nova.
    this.subscription?.unsubscribe();

    this.loading.set(true);
    this.error.set(false);

    this.subscription = this.resolve(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: data => this.data.set(data),
        error: () => {
          this.error.set(true);
          this.data.set(EMPTY_CHART_DATA);
        },
      });
  }

  reset(): void {
    this.subscription?.unsubscribe();
    this.loading.set(false);
    this.error.set(false);
    this.data.set(EMPTY_CHART_DATA);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // ---------- Regras ----------

  private resolve(req: ChartRequest): Observable<ChartData> {
    if (req.types.length > 1) return this.twoTypes(req);
    if (req.devices?.length) return this.typeWithDevices(req);
    return this.singleType(req);
  }

  /** Dois tipos: um em cada eixo Y. */
  private twoTypes(req: ChartRequest): Observable<ChartData> {
    const [first, second] = req.types;

    return forkJoin([
      this.query(req, first.id),
      this.query(req, second.id),
    ]).pipe(
      map(([r1, r2]) => ({
        timestamps: times(r1),
        primary: { title: first.name, values: averages(r1) },
        secondary: { title: second.name, values: averages(r2) },
        extraSeries: [],
      })),
    );
  }

  /** Um tipo + dispositivos: média tracejada + uma linha por dispositivo. */
  private typeWithDevices(req: ChartRequest): Observable<ChartData> {
    const [type] = req.types;
    const devices = req.devices ?? [];
    const averageLabel = req.averageLabel ?? 'Média';

    return forkJoin({
      average: this.query(req, type.id, null),
      perDevice: forkJoin(
        devices.map(device =>
          this.query(req, type.id, device.id).pipe(
            map(rows => ({ title: device.name, values: averages(rows) })),
          ),
        ),
      ),
    }).pipe(
      map(({ average, perDevice }) => ({
        timestamps: times(average),
        primary: {
          title: `${type.name} (${averageLabel})`,
          values: averages(average),
          dashed: true,
        },
        secondary: { title: '', values: [] },
        extraSeries: perDevice,
      })),
    );
  }

  /** Um tipo, sem dispositivos. */
  private singleType(req: ChartRequest): Observable<ChartData> {
    const [type] = req.types;

    return this.query(req, type.id).pipe(
      map(rows => ({
        timestamps: times(rows),
        primary: { title: type.name, values: averages(rows) },
        secondary: { title: '', values: [] },
        extraSeries: [],
      })),
    );
  }

  private query(
    req: ChartRequest,
    idDeviceType: number,
    idDevice: number | null = req.base.idDevice ?? null,
  ): Observable<MetricBucket[]> {
    return this.metrics.query({ ...req.base, idDeviceType, idDevice });
  }
}

const times = (rows: MetricBucket[]) => rows.map(r => r.time_interval);
const averages = (rows: MetricBucket[]) => rows.map(r => r.avg_value);
