import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface ChipOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-chip-select',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1 w-full">
      <div class="flex flex-wrap items-center justify-between mb-1.5 break-all">
        <span class="text-sm text-neutral font-medium">{{ label() | translate }}</span>
        <span class="text-xs text-neutral">
          {{ 'MONITORING.FILTERS.SELECTED_COUNT' | translate: { selected: selected().length, total: max() } }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        @for (opt of options(); track opt.id) {
          <button
            type="button"
            (click)="toggle(opt.id)"
            [disabled]="isDisabled(opt.id)"
            [attr.aria-pressed]="isSelected(opt.id)"
            [class]="isSelected(opt.id)
              ? 'bg-secondary text-secondary-foreground border-secondary font-medium'
              : 'bg-container text-default border-outline hover:border-secondary hover:text-secondary'"
            class="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border
                   transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                   disabled:hover:border-outline disabled:hover:text-default break-all max-w-full"
          >
            @if (isSelected(opt.id)) {
              <i class="fa-solid fa-check text-xs"></i>
            }
            {{ opt.name }}
          </button>
        }
      </div>
    </div>
  `,
})
export class ChipSelect {
  readonly label = input.required<string>();
  readonly options = input.required<readonly ChipOption[]>();
  readonly max = input(2);

  readonly selected = model<number[]>([]);

  private readonly selectedSet = computed(() => new Set(this.selected()));

  isSelected(id: number): boolean {
    return this.selectedSet().has(id);
  }

  isDisabled(id: number): boolean {
    return !this.isSelected(id) && this.selected().length >= this.max();
  }

  toggle(id: number): void {
    this.selected.update(list => {
      if (list.includes(id)) return list.filter(i => i !== id);
      if (list.length >= this.max()) return list;
      return [...list, id];
    });
  }
}
