import { Component, input, output } from '@angular/core';

export interface IntervalOption<T extends string = string> {
  id: T;
  text: string;
}

@Component({
  selector: 'app-interval-selector',
  standalone: true,
  template: `
    <div class="flex flex-wrap border border-outline rounded-md min-h-10 overflow-hidden">
      @for (opt of options(); track opt.id) {
        <button
          type="button"
          class="flex-1 basis-1/4 md:basis-1/7 cursor-pointer px-4 py-2 text-sm transition-colors"
          [class.bg-primary]="value() === opt.id"
          [class.font-medium]="value() === opt.id"
          [class.text-primary-foreground]="value() === opt.id"
          (click)="valueChange.emit(opt.id)">
          {{ opt.text }}
        </button>
      }
    </div>
  `,
})
export class IntervalSelector<T extends string = string> {
  options = input.required<IntervalOption<T>[]>();
  value = input<T | null | undefined>();
  valueChange = output<T>();
}
