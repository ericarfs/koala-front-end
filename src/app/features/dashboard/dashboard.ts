import { CommonModule } from '@angular/common';
import { Component, inject, signal, viewChildren } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChartSeriesData, DeviceChart } from '@shared/domain/device/components/device-chart';
import { getDescendantIds, getPath } from '@shared/domain/location/location-tree';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { Device } from '@shared/interfaces/device';
import { ContentLayout } from '@shared/layouts/content/content';
import { DEVICE_TYPES_MOCK } from '../../mocks/device-types';
import { DEVICES_MOCK } from '../../mocks/devices';
import { LOCATIONS_MOCK } from '../../mocks/locations';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { DashboardFilterInterface, DashboardService } from '@shared/domain/device/services/device-metrics';
import { forkJoin, map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { ChartExportItem, PdfExportService } from '@shared/services/pdf-export';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentLayout, DeviceChart, LocationTreeSelect, TranslatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly mappingService = inject(DeviceMappingService);
  private readonly dashboardService = inject(DashboardService);
  private readonly pdfService = inject(PdfExportService);

  readonly charts = viewChildren(DeviceChart);

  readonly locationName = signal('');
  readonly chartTitle = signal('');
  readonly chartSubtitle = signal('');
  readonly loading = signal(false);

  deviceTypeOptions = DEVICE_TYPES_MOCK;

  // ---------- Form ----------
  filterForm = new FormGroup({
    location: new FormControl<number | null>(null, Validators.required),
    timeBucket: new FormControl('5 minutes', { nonNullable: true, validators: Validators.required }),
    fromDate: new FormControl<string | null>(null, Validators.required),
    toDate: new FormControl<string | null>(null),
  });

  selectedTypes = signal<number[]>([]);
  selectedDevices = signal<number[]>([]);

  intervalOptions = [
    { id: '30 seconds', text: '30s' },
    { id: '1 minute', text: '1min' },
    { id: '5 minutes', text: '5min' },
    { id: '15 minutes', text: '15min' },
    { id: '30 minutes', text: '30min' },
    { id: '1 hour', text: '1h' },
    { id: '2 hours', text: '2h' },
  ];

  // ---------- Dispositivos disponíveis (dependem de location + type único) ----------
  availableDevices = signal<Device[]>([]);

  constructor() {
    this.filterForm.valueChanges.subscribe(() => this.updateAvailableDevices());
  }

  private updateAvailableDevices(): void {
    const locationId = this.filterForm.value.location;
    console.log(locationId)
    const types = this.selectedTypes();

    if (locationId == null || types.length !== 1) {
      this.availableDevices.set([]);
      this.selectedDevices.set([]);
      return;
    }

    const descendantIds = getDescendantIds(locationId, LOCATIONS_MOCK);

    this.mappingService.getDevicesForType(types[0]).subscribe(deviceIds => {
      const devices = DEVICES_MOCK.filter(
        d => d.id != null &&
             deviceIds.includes(d.id) &&
             d.id_enviroment != null &&
             descendantIds.has(d.id_enviroment)
      );
      this.availableDevices.set(devices);
      // remove seleções que não fazem mais sentido
      this.selectedDevices.update(list => list.filter(id => devices.some(d => d.id === id)));
    });
  }

  isTypeSelected(id: number): boolean {
    return this.selectedTypes().includes(id);
  }

  toggleType(id: number): void {
    this.selectedTypes.update(list => {
      if (list.includes(id)) return list.filter(t => t !== id);
      if (list.length >= 2) return list;
      return [...list, id];
    });
    this.updateAvailableDevices();
  }

  isDeviceSelected(id: number): boolean {
    return this.selectedDevices().includes(id);
  }

  toggleDevice(id: number): void {
    this.selectedDevices.update(list => {
      if (list.includes(id)) return list.filter(d => d !== id);
      if (list.length >= 5) return list;
      return [...list, id];
    });
  }

  setTimeBucket(value: string): void {
    this.filterForm.patchValue({ timeBucket: value });
  }

  // ---------- Gráfico ----------
  fields = signal<Date[]>([]);
  primaryValues = signal<ChartSeriesData>({ title: '', values: [] });
  secondaryValues = signal<ChartSeriesData>({ title: '', values: [] });
  deviceSeries = signal<ChartSeriesData[]>([]);

  private typeName(id: number): string {
    return DEVICE_TYPES_MOCK.find(t => t.id === id)?.name ?? '';
  }

  search(): void {
    const { location, timeBucket, fromDate, toDate } = this.filterForm.getRawValue();
    const types = this.selectedTypes();
    if (location == null || types.length === 0 || this.filterForm.invalid) return;

    this.loading.set(true);

    const locationId = this.filterForm.value.location;
    if (!locationId) return;

    const locName = getPath(locationId, LOCATIONS_MOCK)

    this.locationName.set(locName);

    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59);

    const baseFilter = {
      idEnviroment: location,
      startDate: start,
      endDate: end,
      timeBucket,
    };

    this.chartTitle.set(locName);

    // Regra 1: dois tipos de sensor
    if (types.length > 1) {
      const req1 = this.dashboardService.filter({ ...baseFilter, idDeviceType: types[0], idDevice: null } as DashboardFilterInterface);
      const req2 = this.dashboardService.filter({ ...baseFilter, idDeviceType: types[1], idDevice: null } as DashboardFilterInterface);

      this.chartSubtitle.set(`${this.typeName(types[0])} × ${this.typeName(types[1])}`);

      forkJoin([req1, req2]).subscribe(([r1, r2]) => {
        this.fields.set(r1.map(v => v.time_interval));
        this.primaryValues.set({ title: this.typeName(types[0]), values: r1.map(v => v.avg_value) });
        this.secondaryValues.set({ title: this.typeName(types[1]), values: r2.map(v => v.avg_value) });
        this.deviceSeries.set([]);
        this.loading.set(false);
      });
      return;
    }

    const devices = this.selectedDevices();

    // Regra 3: um tipo + dispositivos selecionados (média tracejada + cada dispositivo)
    if (devices.length > 0) {
      const avgReq = this.dashboardService.filter({ ...baseFilter, idDeviceType: types[0], idDevice: null } as DashboardFilterInterface);
      const deviceReqs = devices.map(deviceId =>
        this.dashboardService.filter({ ...baseFilter, idDeviceType: types[0], idDevice: deviceId } as DashboardFilterInterface).pipe(
          map(res => ({
            title: DEVICES_MOCK.find(d => d.id === deviceId)?.name ?? `Dispositivo ${deviceId}`,
            values: res.map(v => v.avg_value),
          }))
        )
      );

      const devCount = devices.length;
      this.chartSubtitle.set(
        `${this.typeName(types[0])} — ${devCount} dispositivo${devCount > 1 ? 's' : ''}`
      );

      forkJoin([avgReq, ...deviceReqs]).subscribe(([avgRes, ...deviceResults]) => {
        this.fields.set(avgRes.map(v => v.time_interval));
        this.primaryValues.set({
          title: `${this.typeName(types[0])} (Média)`,
          values: avgRes.map(v => v.avg_value),
          dashed: true,
        });
        this.secondaryValues.set({ title: '', values: [] });
        this.deviceSeries.set(deviceResults as ChartSeriesData[]);
        this.loading.set(false);
      });
      return;
    }

    this.chartSubtitle.set(this.typeName(types[0]));
    // Regra 2: um tipo, sem dispositivos
    this.dashboardService
      .filter({ ...baseFilter, idDeviceType: types[0], idDevice: null } as DashboardFilterInterface)
      .subscribe(res => {
        this.fields.set(res.map(v => v.time_interval));
        this.primaryValues.set({ title: this.typeName(types[0]), values: res.map(v => v.avg_value) });
        this.secondaryValues.set({ title: '', values: [] });
        this.deviceSeries.set([]);
        this.loading.set(false);
      });
  }

  async exportarPDF(): Promise<void> {
    const title = this.chartTitle();
    const subtitle = this.chartSubtitle();
    const locName = this.locationName();

    // Se nada foi buscado ainda, sai
    if (!title) return;

    const items: ChartExportItem[] = this.charts().flatMap(chart => {
      const dataUrl = chart.getImageDataURL();
      if (!dataUrl) return [];
      return [{
        title,
        subtitle,
        imageDataUrl: dataUrl,
      }];
    });

    if (items.length === 0) return;

    const fileName = `graficos-${locName || 'dashboard'}-${Date.now()}.pdf`;
    await this.pdfService.export(items, fileName);
  }
}
