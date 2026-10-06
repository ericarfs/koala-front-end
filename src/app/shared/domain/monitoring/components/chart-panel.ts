import { ChangeDetectionStrategy, Component, computed, inject, input, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PdfExportService } from '@shared/services/pdf-export';
import { TimeSeriesChart } from './time-series-chart';
import { ChartData } from '../models/chart-data';

@Component({
  selector: 'app-chart-panel',
  standalone: true,
  imports: [TimeSeriesChart, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-container border border-outline rounded-md p-4 relative min-h-96">
      @if (loading()) {
        <div class="absolute inset-0 bg-container/80 backdrop-blur-sm rounded-md
                    flex flex-col items-center justify-center gap-3 z-10">
          <div class="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span class="text-sm text-neutral">{{ 'COMMON.STATES.SEARCHING' | translate }}</span>
        </div>
      }

      @if (error() && !loading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-3 text-neutral">
          <i class="fa-solid fa-triangle-exclamation text-5xl opacity-20"></i>
          <p class="text-sm">{{ 'COMMON.STATES.ERROR' | translate }}</p>
        </div>
      } @else if (isEmpty() && !loading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-3 text-neutral">
          <i class="fa-solid fa-chart-line text-5xl opacity-20"></i>
          <p class="text-sm">{{ emptyKey() | translate }}</p>
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
          {{ 'COMMON.ACTIONS.SAVE' | translate }} PDF
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

  async exportPdf(): Promise<void> {
    const title = this.title();
    const imageDataUrl = this.chart()?.getImageDataURL();
    if (!title || !imageDataUrl) return;

    const safe = title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

    await this.pdf.export(
      [{ title, subtitle: this.subtitle(), imageDataUrl }],
      `graficos-${safe || 'dashboard'}-${Date.now()}.pdf`,
    );
  }
}
