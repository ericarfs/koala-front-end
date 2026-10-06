import { CommonModule, Location } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ContentLayout } from '@shared/layouts/content/content';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { DeviceWithTypes } from '@shared/interfaces/device';
import { DEVICES_MOCK } from '../../../../mocks/devices';
import { TranslatePipe } from '@ngx-translate/core';
import { LOCATIONS_MOCK } from '../../../../mocks/locations';
import { getPath } from '@shared/domain/location/location-tree';
import { ChartDataStore } from '@shared/domain/monitoring/stores/chart-data-store';
import { ChartPanel } from '@shared/domain/monitoring/components/chart-panel';
import { ChipSelect } from '@shared/domain/monitoring/components/chip-select';
import { DEFAULT_TIME_BUCKET, TIME_BUCKET_OPTIONS, TimeBucket } from '@shared/domain/monitoring/models/time-bucket';



@Component({
  selector: 'app-device-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ContentLayout, TranslatePipe, ChipSelect, ChartPanel],
  providers: [ChartDataStore],
  templateUrl: './device-details.html',
})
export class DeviceDetails {
   private readonly route = inject(ActivatedRoute);
  private readonly routerLocation = inject(Location);
  private readonly mappingService = inject(DeviceMappingService);
  readonly store = inject(ChartDataStore);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('id')))),
    { initialValue: NaN },
  );

  readonly intervalOptions = TIME_BUCKET_OPTIONS;
  readonly device = signal<DeviceWithTypes | null>(null);

  readonly filterForm = new FormGroup({
    timeBucket: new FormControl<TimeBucket>(DEFAULT_TIME_BUCKET, {
      nonNullable: true,
      validators: Validators.required,
    }),
    fromDate: new FormControl<string | null>(null, Validators.required),
    toDate: new FormControl<string | null>(null),
  });

  readonly selectedTypes = signal<number[]>([]);
  readonly chartTitle = signal('');
  readonly chartSubtitle = signal('');

  constructor() {
    effect(() => {
      const found = DEVICES_MOCK.find(d => d.id === this.id());

      // Trocou de dispositivo (mesma rota, outro id): limpa seleção e gráfico
      this.selectedTypes.set([]);
      this.store.reset();

      if (!found) {
        this.device.set(null);
        return;
      }

      // Renderiza nome/descrição já, e completa com os tipos quando chegarem
      this.device.set({ ...found, types: [] });
      this.mappingService.getTypesForDevice(found.id!).subscribe(types => {
        this.device.set({ ...found, types });
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

    const locName = device.id_enviroment != null ? getPath(device.id_enviroment, LOCATIONS_MOCK) : '-';
    this.chartTitle.set(`${locName} — ${device.name ?? ''}`);
    this.chartSubtitle.set(types.map(t => t.name).join(' × '));

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
