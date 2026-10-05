import { Component, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-paginator',
  imports:[TranslatePipe],
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-center text-center gap-3 mt-auto pt-4">
        <button
          type="button"
          class="btn px-3 py-1 disabled:opacity-40"
          [disabled]="pageIndex() === 0"
          (click)="pageIndex.set(pageIndex() - 1)"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <span class="w-full text-sm text-neutral">
          {{ 'COMMON.PAGINATION.PAGE_OF' | translate:{
              current: pageIndex() + 1, total: totalPages() } }}
        </span>

        <button
          type="button"
          class="btn px-3 py-1 disabled:opacity-40"
          [disabled]="pageIndex() >= totalPages() - 1"
          (click)="pageIndex.set(pageIndex() + 1)"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    }
  `,
  host:{
    class: 'contents',
  }
})
export class Paginator {
  pageIndex = model.required<number>();
  totalPages = input.required<number>();
}
