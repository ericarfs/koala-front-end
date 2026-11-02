import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getDescendantIds, getPath } from '@shared/domain/location/components/location-tree';
import { LocationTreeSelect } from '@shared/domain/location/components/location-tree-select';
import { ContentLayout } from '@shared/layouts/content/content';
import { DeviceMappingService } from '@shared/domain/device/services/mapping/device-mapping';
import { Subscription } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChipOption, ChipSelect } from '@shared/domain/monitoring/components/chip-select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartDataStore } from '@shared/domain/monitoring/stores/chart-data-store';
import { ChartPanel } from '@shared/domain/monitoring/components/chart-panel';
import { DEFAULT_TIME_BUCKET, TIME_BUCKET_OPTIONS, TimeBucket } from '@shared/domain/monitoring/models/time-bucket';
import { IntervalSelector } from '@shared/domain/monitoring/components/interval-selector';
import { SearchButton } from '@shared/domain/monitoring/components/search-button';
import { buildChartInfo } from '@shared/domain/monitoring/utils/chart-exports-info';
import { DeviceStore } from '@shared/domain/device/stores/device-store';
import { LocationStore } from '@shared/domain/location/stores/location-store';
import { DeviceTypeStore } from '@shared/domain/device-type/stores/device-type';
import { buildChartSubtitle, ChartType, parseDateRange } from '@shared/domain/monitoring/utils/chart-form';
import { ChartExportInfo } from '@shared/services/pdf-export/pdf-expert.types';
import { localeFromLang } from '@shared/services/pdf-export/pdf-export.utils';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentLayout, LocationTreeSelect, TranslocoPipe, ChipSelect, ChartPanel, IntervalSelector, SearchButton],
  providers: [ChartDataStore],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly transloco = inject(TranslocoService);
  private readonly mappingService = inject(DeviceMappingService);
  private readonly deviceTypeStore = inject(DeviceTypeStore);
  private readonly deviceStore = inject(DeviceStore);
  private readonly locationStore = inject(LocationStore);

  readonly store = inject(ChartDataStore);

  readonly deviceTypeLoading = this.deviceTypeStore.loading;
  readonly deviceTypeOptions = this.deviceTypeStore.items;
  readonly intervalOptions = TIME_BUCKET_OPTIONS;

  readonly filterForm = new FormGroup({
    location: new FormControl<number | null>(null, Validators.required),
    timeBucket: new FormControl<TimeBucket>(DEFAULT_TIME_BUCKET, {
      nonNullable: true,
      validators: Validators.required,
    }),
    fromDate: new FormControl<string | null>(null, Validators.required),
    toDate: new FormControl<string | null>(null),
  });

  readonly selectedTypes = signal<number[]>([]);
  readonly selectedDevices = signal<number[]>([]);
  readonly availableDevices = signal<ChipOption[]>([]);

  private readonly _devicesLoading = signal(false);
  readonly devicesLoading = this._devicesLoading.asReadonly();

  readonly chartInfo = signal<ChartExportInfo | undefined>(undefined);

  readonly chartTitle = signal('');
  readonly chartSubtitle = signal('');

  private devicesSub?: Subscription;

  constructor() {
    this.deviceTypeStore.load();
    // Só o campo "location" interessa (antes qualquer mudança do form recalculava).
    this.filterForm.controls.location.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateAvailableDevices());
  }

  // ---------- Filtros ----------

  onTypesChange(types: number[]): void {
    this.selectedTypes.set(types);
    this.updateAvailableDevices();
  }

  /** Dispositivos só aparecem com 1 tipo selecionado e uma localização escolhida. */
  private updateAvailableDevices(): void {
    this.devicesSub?.unsubscribe();

    const location = this.filterForm.controls.location.value;
    const types = this.selectedTypes();

    if (location == null || types.length !== 1) {
      this.availableDevices.set([]);
      this.selectedDevices.set([]);
      this._devicesLoading.set(false);
      return;
    }

    const locations = this.locationStore.items();
    const allDevices = this.deviceStore.items();
    const descendantIds = getDescendantIds(location, locations);

    this._devicesLoading.set(true);

    this.devicesSub = this.mappingService.getDevicesForType(types[0]).subscribe({
      next: (deviceIds) => {
        const devices: ChipOption[] = allDevices
          .filter(d =>
            d.id != null && deviceIds.includes(d.id) &&
            d.id_enviroment != null && descendantIds.has(d.id_enviroment))
          .map(d => ({ id: d.id!, name: d.name ?? '' }));

        this.availableDevices.set(devices);
        this.selectedDevices.update(list => list.filter(id => devices.some(d => d.id === id)));
        this._devicesLoading.set(false);
      },
      error: () => this._devicesLoading.set(false),
    });
  }

  // ---------- Busca ----------

  search(): void {
    const { location, timeBucket, fromDate, toDate } = this.filterForm.getRawValue();
    const types = this.getSelectedTypes();

    if (location == null || types.length === 0 || this.filterForm.invalid) return;

    const { start, end } = parseDateRange(fromDate, toDate);
    const devices = this.getSelectedDevices(types);
    const locationPath = getPath(location, this.locationStore.items());

    this.updateChartDisplay(locationPath, types, devices, timeBucket, start, end);

    this.store.load({
      base: { idEnviroment: location, startDate: start, endDate: end, timeBucket },
      types,
      devices,
    });
  }

  private getSelectedTypes(): ChartType[] {
    return this.selectedTypes().map(id => ({ id, name: this.typeName(id) }));
  }

  private getSelectedDevices(types: ChartType[]): ChipOption[] {
    if (types.length !== 1) return [];
    const selected = this.selectedDevices();
    return this.availableDevices().filter(d => selected.includes(d.id));
  }

  private updateChartDisplay(
    locationPath: string,
    types: ChartType[],
    devices: ChipOption[],
    timeBucket: TimeBucket,
    start: Date | null,
    end: Date
  ): void {
    this.chartTitle.set(locationPath);
    this.chartSubtitle.set(buildChartSubtitle(types, devices));

    this.chartInfo.set(buildChartInfo({
      location: locationPath,
      sensors: types,
      devices: devices,
      timeBucket,
      start,
      end,
      locale: localeFromLang(this.transloco.getActiveLang()),
    }));
  }

  private typeName(id: number): string {
    return this.deviceTypeStore.items().find(t => t.id === id)?.name ?? '';
  }
}
