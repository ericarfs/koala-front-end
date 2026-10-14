import { CommonModule, Location } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ContentLayout } from '@shared/layouts/content/content';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { DeviceWithTypes } from '@shared/interfaces/device';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { getPath } from '@shared/domain/location/location-tree';
import { ChartDataStore } from '@shared/domain/monitoring/stores/chart-data-store';
import { ChartPanel } from '@shared/domain/monitoring/components/chart-panel';
import { ChipSelect } from '@shared/domain/monitoring/components/chip-select';
import { DEFAULT_TIME_BUCKET, TIME_BUCKET_OPTIONS, TimeBucket } from '@shared/domain/monitoring/models/time-bucket';
import { IntervalSelector } from '@shared/domain/monitoring/components/interval-selector';
import { SearchButton } from '@shared/domain/monitoring/components/search-button';
import { ChartExportInfo, localeFromLang } from '@shared/services/pdf-export';
import { buildChartInfo } from '@shared/utils/chart-exports-info';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { LocationStore } from '@shared/domain/location/location-store';
import { DeviceType } from '@shared/interfaces/device-type';


@Component({
  selector: 'app-device-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentLayout, TranslocoPipe, ChipSelect, ChartPanel, IntervalSelector, SearchButton],
  providers: [ChartDataStore],
  templateUrl: './device-details.html',
})
export class DeviceDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly routerLocation = inject(Location);
  private readonly mappingService = inject(DeviceMappingService);
  private readonly transloco = inject(TranslocoService);
  private readonly deviceStore = inject(DeviceStore);
  private readonly locationStore = inject(LocationStore);

  readonly store = inject(ChartDataStore);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('id')))),
    { initialValue: NaN },
  );

  readonly intervalOptions = TIME_BUCKET_OPTIONS;

  private readonly loadedTypes = signal<DeviceType[]>([]);

  readonly device = computed<DeviceWithTypes | null>(() => {
    const id = this.id();
    if (Number.isNaN(id)) return null;

    const found = this.deviceStore.items().find((d) => d.id === id);
    if (!found) return null;

    return { ...found, types: this.loadedTypes() };
  });

  readonly filterForm = new FormGroup({
    timeBucket: new FormControl<TimeBucket>(DEFAULT_TIME_BUCKET, {
      nonNullable: true,
      validators: Validators.required,
    }),
    fromDate: new FormControl<string | null>(null, Validators.required),
    toDate: new FormControl<string | null>(null),
  });

  readonly chartInfo = signal<ChartExportInfo | undefined>(undefined);

  readonly selectedTypes = signal<number[]>([]);
  readonly chartTitle = signal('');
  readonly chartSubtitle = signal('');

  constructor() {
    effect(() => {
      const id = this.id();

      // Reset em qualquer troca de id
      this.selectedTypes.set([]);
      this.loadedTypes.set([]);
      this.store.reset();

      if (Number.isNaN(id)) return;

      this.mappingService.getTypesForDevice(id).subscribe((types) => {
        this.loadedTypes.set(types);
      });
    });
  }

  search(): void {
    const device = this.device();
    if (!device || this.filterForm.invalid) return;

    // Mantém a ordem de seleção: o primeiro vai no eixo esquerdo
    const types = this.selectedTypes().flatMap(id => {
      const type = device.types.find(t => t.id === id);
      return type ? [{ id: type.id, name: type.name }] : [];
    });
    if (types.length === 0) return;

    const { timeBucket, fromDate, toDate } = this.filterForm.getRawValue();
    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59);

    const locName = device.id_enviroment != null
      ? getPath(device.id_enviroment, this.locationStore.items())
      : '-';
    this.chartTitle.set(`${locName} — ${device.name ?? ''}`);
    this.chartSubtitle.set(types.map(t => t.name).join(' × '));

    this.chartInfo.set(buildChartInfo({
      location: locName,
      sensors: types,
      devices: device ? [device] : [],
      timeBucket,
      start,
      end,
      locale: localeFromLang(this.transloco.getActiveLang()),
    }));

    // idDevice vai no "base": vale para todas as consultas (1 ou 2 tipos)
    this.store.load({
      base: {
        idEnviroment: device.id_enviroment!,
        idDevice: device.id!,
        startDate: start,
        endDate: end,
        timeBucket,
      },
      types,
    });
  }

  goBack(): void {
    this.routerLocation.back();
  }
}
