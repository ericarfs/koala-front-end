
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterfacePreferences } from '@shared/components/interface-preferences/interface-preferences';
import { ContentLayout } from '@shared/layouts/content/content';
import { DEVICE_TYPES_MOCK } from '../../mocks/device-types';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getPath } from '@shared/domain/location/location-tree';
import { LOCATIONS_MOCK } from '../../mocks/locations';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { LocationTreeSelect } from '@shared/domain/location/location-tree-select';
import { ChartDataStore } from '@shared/domain/monitoring/stores/chart-data-store';
import { ChartPanel } from '@shared/domain/monitoring/components/chart-panel';
import { ChipSelect } from '@shared/domain/monitoring/components/chip-select';
import { DEFAULT_TIME_BUCKET, TIME_BUCKET_OPTIONS, TimeBucket } from '@shared/domain/monitoring/models/time-bucket';
import { IntervalSelector } from '@shared/domain/monitoring/components/interval-selector';
import { SearchButton } from '@shared/domain/monitoring/components/search-button';
import { ChartExportInfo, localeFromLang } from '@shared/services/pdf-export';
import { buildChartInfo } from '@shared/utils/chart-exports-info';

@Component({
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ContentLayout, LocationTreeSelect, InterfacePreferences ,TranslocoPipe, ChartPanel, ChipSelect, IntervalSelector, SearchButton],
  providers: [ChartDataStore],
  selector: 'app-guest',
  styleUrl: './guest.css',
  templateUrl: './guest.html',
})
export class Guest {
  private readonly transloco = inject(TranslocoService);
  readonly store = inject(ChartDataStore);

  readonly deviceTypeOptions = DEVICE_TYPES_MOCK;
  readonly intervalOptions = TIME_BUCKET_OPTIONS;

  readonly filterForm = new FormGroup({
    location: new FormControl<number | null>(null, Validators.required),
    timeBucket: new FormControl<TimeBucket>(DEFAULT_TIME_BUCKET, {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  readonly selectedTypes = signal<number[]>([]);
  readonly chartTitle = signal('');
  readonly chartSubtitle = signal('');

  readonly chartInfo = signal<ChartExportInfo | undefined>(undefined);

  search(): void {
    const { location, timeBucket } = this.filterForm.getRawValue();
    const types = this.selectedTypes().map(id => ({ id, name: this.typeName(id) }));
    if (location == null || types.length === 0 || this.filterForm.invalid) return;

    const locationPath = getPath(location, LOCATIONS_MOCK);

    // Textos do cabeçalho do gráfico (não dependem da resposta da API)
    this.chartTitle.set(locationPath);
    this.chartSubtitle.set(types.map(t => t.name).join(' × '));

    this.chartInfo.set(buildChartInfo({
      location: locationPath,
      sensors: types,
      timeBucket,
      locale: localeFromLang(this.transloco.getActiveLang()),
    }));

    // O store decide quantas consultas fazer e monta as séries
    this.store.load({ base: { idEnviroment: location, timeBucket }, types });
  }

  private typeName(id: number): string {
    return DEVICE_TYPES_MOCK.find(t => t.id === id)?.name ?? '';
  }
}
