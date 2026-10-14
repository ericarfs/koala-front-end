import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChartExportBasket } from '@shared/services/chart-export-basket';
import { PdfExportService } from '@shared/services/pdf-export';

@Component({
  selector: 'app-chart-basket',
  imports:[TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (basket.count() > 0) {
      <div class="fixed bottom-1 right-1 md:bottom-4 md:right-4 z-50 w-85 bg-container border border-outline rounded-md shadow-lg">
        <button type="button" class="w-full flex items-center justify-between px-4 py-3"
                (click)="open.set(!open())">
          <span class="font-semibold">
            <i class="fa-solid fa-file-pdf mr-2 text-primary"></i>+
            {{ 'MONITORING.REPORT.COUNT' | transloco:{
              count: basket.count()} }}
          </span>
          <i class="fa-solid" [class]="open() ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
        </button>

        @if (open()) {
          <ul class="max-h-80 overflow-y-auto border-t border-outline divide-y divide-outline">
            @for (item of basket.items(); track item.id; let i = $index; let last = $last) {
              <li class="flex items-center gap-2 p-2">
                <img [src]="item.imageDataUrl" alt="" class="w-16 h-10 object-cover rounded border border-outline" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ item.title }}</p>
                  <p class="text-xs text-neutral truncate">{{ item.subtitle }}</p>
                </div>
                <button type="button" [disabled]="i === 0" (click)="basket.move(item.id, -1)"
                        class="px-1 disabled:opacity-30"><i class="fa-solid fa-arrow-up"></i></button>
                <button type="button" [disabled]="last" (click)="basket.move(item.id, 1)"
                        class="px-1 disabled:opacity-30"><i class="fa-solid fa-arrow-down"></i></button>
                <button type="button" (click)="basket.remove(item.id)" class="px-1 text-destructive">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </li>
            }
          </ul>

          <div class="flex gap-2 p-3 border-t border-outline">
            <button type="button" (click)="exportAll()" [disabled]="exporting()"
                    class="btn bg-primary text-white px-3 py-2 rounded">
              @if(exporting() ){
                {{ 'COMMON.STATES.LOADING' | transloco}}
              } @else {
                {{ 'COMMON.ACTIONS.EXPORT' | transloco}}
              }
            </button>
            <button type="button" (click)="basket.clear()" class="btn border border-outline px-3 py-2 rounded">
              {{ 'COMMON.ACTIONS.CLEAR' | transloco}}
            </button>

          </div>
        }
      </div>
    }
  `,
})
export class ChartBasket {
  readonly basket = inject(ChartExportBasket);
  private readonly pdf = inject(PdfExportService);

  readonly open = signal(true);
  readonly exporting = signal(false);

  async exportAll(): Promise<void> {
    const items = this.basket.items();
    if (items.length === 0) return;

    this.exporting.set(true);
    try {
      await this.pdf.exportReport(items, `report-${Date.now()}.pdf`);
    } finally {
      this.exporting.set(false);
    }
  }
}
