import { CommonModule, Location } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map, of } from 'rxjs';
import { ContentLayout } from '@shared/layouts/content/content';
import { DeviceMappingService } from '@shared/domains/device/services/mapping/device-mapping';
import { DeviceWithTypes } from '@shared/interfaces/device';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { getPath } from '@shared/domains/location/components/location-tree';
import { ChartDataStore } from '@shared/domains/monitoring/stores/chart-data-store';
import { ChartPanel } from '@shared/domains/monitoring/components/chart-panel';
import { ChipSelect } from '@shared/domains/monitoring/components/chip-select';
import { DEFAULT_TIME_BUCKET, TIME_BUCKET_OPTIONS, TimeBucket } from '@shared/domains/monitoring/models/time-bucket';
import { IntervalSelector } from '@shared/domains/monitoring/components/interval-selector';
import { SearchButton } from '@shared/domains/monitoring/components/search-button';
import { buildChartInfo } from '@shared/domains/monitoring/utils/chart-exports-info';
import { DeviceStore } from '@shared/domains/device/stores/device-store';
import { LocationStore } from '@shared/domains/location/stores/location-store';
import { DeviceType } from '@shared/interfaces/device-type';
import { DeviceTypesSkeleton } from '@shared/domains/device/components/device-types-skeleton';
import { buildChartSubtitle, ChartType, parseDateRange } from '@shared/domains/monitoring/utils/chart-form';
import { ChartExportInfo } from '@shared/services/pdf-export/pdf-expert.types';
import { localeFromLang } from '@shared/services/pdf-export/pdf-export.utils';


@Component({
  selector: 'app-device-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentLayout, TranslocoPipe, ChipSelect, ChartPanel, IntervalSelector, SearchButton, DeviceTypesSkeleton],
  providers: [ChartDataStore],
  templateUrl: './device-details.html',
})
export class DeviceDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly routerLocation = inject(Location);
  private readonly mappingService = inject(DeviceMappingService);
  private readonly transloco = inject(TranslocoService);
  private readonly locationStore = inject(LocationStore);

  readonly deviceStore = inject(DeviceStore);
  readonly store = inject(ChartDataStore);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('id')))),
    { initialValue: NaN },
  );

  readonly typesResource = rxResource({
    params: () => {
      const id = this.id();
      return Number.isNaN(id) ? undefined : id;
    },
    stream: ({ params }) =>
      params != null
        ? this.mappingService.getTypesForDevice(params)
        : of([] as DeviceType[]),
  });

  readonly deviceLoading = computed(() =>
    this.deviceStore.loading() || this.typesResource.isLoading(),
  );

  readonly intervalOptions = TIME_BUCKET_OPTIONS;

  private readonly loadedTypes = signal<DeviceType[]>([]);

  readonly device = computed<DeviceWithTypes | null>(() => {
    const id = this.id();
    if (Number.isNaN(id)) return null;

    const found = this.deviceStore.items().find((d) => d.id === id);
    if (!found) return null;

    return { ...found, types: this.typesResource.value() ?? [] };
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

      this.selectedTypes.set([]);
      this.loadedTypes.set([]);
      this.store.reset();

      if (Number.isNaN(id)) return;
    });
  }

  search(): void {
    const device = this.device();
    if (!device || this.filterForm.invalid) return;

    const types = this.getSelectedTypes(device);
    if (types.length === 0) return;

    const { timeBucket, fromDate, toDate } = this.filterForm.getRawValue();
    const { start, end } = parseDateRange(fromDate, toDate);

    const locName = device.id_enviroment != null
      ? getPath(device.id_enviroment, this.locationStore.items())
      : '-';

    this.updateChartDisplay(locName, device, types, timeBucket, start, end);

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

  private getSelectedTypes(device: DeviceWithTypes): ChartType[] {
    return this.selectedTypes().flatMap(id => {
      const type = device.types.find(t => t.id === id);
      return type ? [{ id: type.id, name: type.name }] : [];
    });
  }

  private updateChartDisplay(
    locName: string,
    device: DeviceWithTypes,
    types: ChartType[],
    timeBucket: TimeBucket,
    start: Date | null,
    end: Date
  ): void {
    this.chartTitle.set(`${locName} — ${device.name ?? ''}`);
    this.chartSubtitle.set(buildChartSubtitle(types));

    this.chartInfo.set(buildChartInfo({
      location: locName,
      sensors: types,
      devices: [device],
      timeBucket,
      start,
      end,
      locale: localeFromLang(this.transloco.getActiveLang()),
    }));
  }
}
