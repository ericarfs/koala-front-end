import { CommonModule, Location } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { delay, forkJoin, map, of } from 'rxjs';
import { ContentLayoutComponent } from '@shared/layouts/content/content';
import { ChartSeriesData, DeviceChartComponent } from '@shared/domain/device/components/device-chart';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { DashboardFilterInterface, DashboardResponseInterface, DashboardService } from '@shared/domain/device/services/device-metrics';
import { DeviceWithTypes } from '@shared/interfaces/device';
import { DEVICES_MOCK } from '../../../../mocks/devices';
import { TranslatePipe } from '@ngx-translate/core';



@Component({
  selector: 'app-device-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentLayoutComponent, DeviceChartComponent, TranslatePipe],
  templateUrl: './device-details.html',
})
export class DeviceDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly mappingService = inject(DeviceMappingService);
  private readonly dashboardService = inject(DashboardService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('id')))),
    { initialValue: NaN }
  );

  readonly loading = signal(false);
  readonly device = signal<DeviceWithTypes | null>(null);

  constructor(private location: Location) {
    effect(() => {
      const id = this.id();
      const found = DEVICES_MOCK.find(d => d.id === id);
      if (!found) {
        this.device.set(null);
        return;
      }

      // Popula com types vazio primeiro (pra renderizar nome/descrição já)
      this.device.set({ ...found, types: [] });

      // Depois complementa com os types (podem vir do cache ou da API)
      this.mappingService.getTypesForDevice(found.id!).subscribe(types => {
        this.device.set({ ...found, types });
      });
    });
  }

  selectedTypes = signal<number[]>([]);

  filterForm = new FormGroup({
    timeBucket: new FormControl('5 minutes', { nonNullable: true, validators: Validators.required }),
    fromDate: new FormControl<string | null>(null, Validators.required),
    toDate: new FormControl<string | null>(null),
  });

  intervalOptions = [
    { id: '30 seconds', text: '30s' },
    { id: '1 minute', text: '1min' },
    { id: '5 minutes', text: '5min' },
    { id: '15 minutes', text: '15min' },
    { id: '30 minutes', text: '30min' },
    { id: '1 hour', text: '1h' },
    { id: '2 hours', text: '2h' },
  ];

  fields = signal<Date[]>([]);
  primaryValues = signal<ChartSeriesData>({ title: '', values: [] });
  secondaryValues = signal<ChartSeriesData>({ title: '', values: [] });

  isTypeSelected(id: number): boolean {
    return this.selectedTypes().includes(id);
  }

  toggleType(id: number): void {
    this.selectedTypes.update(list => {
      const isSelected = list.includes(id);

      if (isSelected) {
        return list.filter(t => t !== id);
      }

      if (list.length >= 2) {
        return list;
      }

      return [...list, id];
    });
  }

  setTimeBucket(value: string): void {
    this.filterForm.patchValue({ timeBucket: value });
  }

  search(): void {
    const device = this.device();
    const types = this.selectedTypes();
    if (!device || types.length === 0 || this.filterForm.invalid) return;

    this.loading.set(true);

    const { timeBucket, fromDate, toDate } = this.filterForm.getRawValue();
    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59);

    const baseFilter = {
      idEnviroment: device.id_enviroment!,
      idDevice: device.id!,
      startDate: start,
      endDate: end,
      timeBucket,
    };

    const primaryType = device.types.find(t => t.id === types[0]);
    const secondaryType = types[1] != null ? device.types.find(t => t.id === types[1]) : undefined;

    const primaryReq = this.dashboardService.filter({ ...baseFilter, idDeviceType: types[0] } as DashboardFilterInterface);
    const secondaryReq = types[1] != null
      ? this.dashboardService.filter({ ...baseFilter, idDeviceType: types[1] } as DashboardFilterInterface)
      : of([] as DashboardResponseInterface[]);

    forkJoin([primaryReq, secondaryReq])
    .pipe(delay(300))
    .subscribe(([primaryRes, secondaryRes]) => {
      this.fields.set(primaryRes.map(r => r.time_interval));
      this.primaryValues.set({ title: primaryType?.name ?? '', values: primaryRes.map(r => r.avg_value) });
      this.secondaryValues.set({
        title: secondaryType?.name ?? '',
        values: secondaryRes.map(r => r.avg_value),
      });
      this.loading.set(false);
    });
  }

  goBack(){
    this.location.back();
  }
}
