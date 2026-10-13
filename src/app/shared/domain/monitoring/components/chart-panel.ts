import { ChangeDetectionStrategy, Component, computed, inject, input, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChartExportInfo, computeSensorStats, PdfExportService, SensorStats } from '@shared/services/pdf-export';
import { TimeSeriesChart } from './time-series-chart';
import { ChartData } from '../models/chart-data';

@Component({
  selector: 'app-chart-panel',
  standalone: true,
  imports: [TimeSeriesChart, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-container border border-outline rounded-md p-4 relative min-h-96">
      @if (loading()) {
        <div class="absolute inset-0 bg-container/80 backdrop-blur-sm rounded-md
                    flex flex-col items-center justify-center gap-3 z-10">
          <div class="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span class="text-sm text-neutral">{{ 'COMMON.STATES.SEARCHING' | transloco }}</span>
        </div>
      }

      @if (error() && !loading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-3 text-neutral">
          <i class="fa-solid fa-triangle-exclamation text-5xl opacity-20"></i>
          <p class="text-sm">{{ 'COMMON.STATES.ERROR' | transloco }}</p>
        </div>
      } @else if (isEmpty() && !loading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-3 text-neutral">
          <i class="fa-solid fa-chart-line text-5xl opacity-20"></i>
          <p class="text-sm">{{ emptyKey() | transloco }}</p>
        </div>
      } @else {
        <app-time-series-chart
          [timestamps]="data().timestamps"
          [primary]="data().primary"
          [secondary]="data().secondary"
          [extraSeries]="data().extraSeries"
          [title]="title()"
          [subtitle]="subtitle()"
        />
        <button
          type="button"
          (click)="exportPdf()"
          [disabled]="!title() || loading()"
          class="btn bg-primary text-white px-4 py-2 rounded max-w-40"
        >
          <i class="fa-solid fa-file-pdf mr-2"></i>
          {{ 'COMMON.ACTIONS.SAVE' | transloco }} PDF
        </button>
      }
    </div>
  `,
})
export class ChartPanel {
  private readonly pdf = inject(PdfExportService);
  private readonly chart = viewChild(TimeSeriesChart);

  readonly data = input.required<ChartData>();
  readonly title = input('');
  readonly subtitle = input('');
  readonly loading = input(false);
  readonly error = input(false);

  readonly emptyKey = input('MONITORING.EMPTY.DASHBOARD');

  readonly isEmpty = computed(() => this.data().timestamps.length === 0);

  readonly info = input<ChartExportInfo>();
  readonly stats = computed<SensorStats[]>(() => {
    const d = this.data();
    const series = [d.primary, d.secondary, ...(d.extraSeries ?? [])].filter(Boolean);

    return series
      .map(s => computeSensorStats(s.title, s.values))
      .filter((s): s is SensorStats => s !== null);
  });

  async exportPdf(): Promise<void> {
    const title = this.title();
    const imageDataUrl = this.chart()?.getImageDataURL();
    if (!title || !imageDataUrl) return;

    const safe = title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
    const logoDataUrl = await this.pdf.loadImageAsDataUrl('assets/logo-white.png');

    await this.pdf.export(
      [{
        title,
        subtitle: this.subtitle(),
        imageDataUrl,
        info: this.info(),
        stats: this.stats(),
      }],
      {
        fileName: `graficos-${safe || 'dashboard'}-${Date.now()}.pdf`,
        appName: 'Smart Lab',
        reportTitle: 'Relatório de Monitoramento',
        generatedBy: 'Nome do usuário',
        logoDataUrl: logoDataUrl ?? undefined,
      },
    );
  }
}
