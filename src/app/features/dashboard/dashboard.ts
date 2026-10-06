import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getDescendantIds, getPath } from '@shared/domain/location/location-tree';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { ContentLayout } from '@shared/layouts/content/content';
import { DEVICE_TYPES_MOCK } from '../../mocks/device-types';
import { DEVICES_MOCK } from '../../mocks/devices';
import { LOCATIONS_MOCK } from '../../mocks/locations';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ChipOption, ChipSelect } from '@shared/domain/monitoring/components/chip-select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartDataStore } from '@shared/domain/monitoring/stores/chart-data-store';
import { ChartPanel } from '@shared/domain/monitoring/components/chart-panel';
import { DEFAULT_TIME_BUCKET, TIME_BUCKET_OPTIONS, TimeBucket } from '@shared/domain/monitoring/models/time-bucket';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentLayout, LocationTreeSelect, TranslatePipe, ChipSelect, ChartPanel],
  providers: [ChartDataStore],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly mappingService = inject(DeviceMappingService);
  readonly store = inject(ChartDataStore);

  readonly deviceTypeOptions = DEVICE_TYPES_MOCK;
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

  readonly chartTitle = signal('');
  readonly chartSubtitle = signal('');

  private devicesSub?: Subscription;

  constructor() {
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
      return;
    }

    const descendantIds = getDescendantIds(location, LOCATIONS_MOCK);

    this.devicesSub = this.mappingService.getDevicesForType(types[0]).subscribe(deviceIds => {
      const devices: ChipOption[] = DEVICES_MOCK
        .filter(d =>
          d.id != null && deviceIds.includes(d.id) &&
          d.id_enviroment != null && descendantIds.has(d.id_enviroment))
        .map(d => ({ id: d.id!, name: d.name ?? '' }));

      this.availableDevices.set(devices);
      // remove seleções que não fazem mais sentido
      this.selectedDevices.update(list => list.filter(id => devices.some(d => d.id === id)));
    });
  }

  // ---------- Busca ----------

  search(): void {
    const { location, timeBucket, fromDate, toDate } = this.filterForm.getRawValue();
    const types = this.selectedTypes().map(id => ({ id, name: this.typeName(id) }));
    if (location == null || types.length === 0 || this.filterForm.invalid) return;

    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59);

    // Dispositivos só valem com 1 tipo (o store ignora com 2, mas aqui já fica explícito)
    const selected = this.selectedDevices();
    const devices = types.length === 1
      ? this.availableDevices().filter(d => selected.includes(d.id))
      : [];

    this.chartTitle.set(getPath(location, LOCATIONS_MOCK));
    this.chartSubtitle.set(this.buildSubtitle(types, devices));

    this.store.load({
      base: { idEnviroment: location, startDate: start, endDate: end, timeBucket },
      types,
      devices,
    });
  }

  private buildSubtitle(types: { name: string }[], devices: unknown[]): string {
    if (types.length > 1) return types.map(t => t.name).join(' × ');
    if (devices.length > 0) {
      return `${types[0].name} — ${devices.length} dispositivo${devices.length > 1 ? 's' : ''}`;
    }
    return types[0].name;
  }

  private typeName(id: number): string {
    return DEVICE_TYPES_MOCK.find(t => t.id === id)?.name ?? '';
  }
}
