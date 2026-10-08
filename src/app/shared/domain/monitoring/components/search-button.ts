import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-search-button',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      class="btn w-full md:w-fit px-4 py-2 gap-2 bg-primary text-primary-foreground"
      [disabled]="disabled() || loading()"
      (click)="clicked.emit()">
      @if (loading()) {
        <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span>{{ 'COMMON.STATES.SEARCHING' | translate }}</span>
      } @else {
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>{{ 'COMMON.ACTIONS.SEARCH' | translate }}</span>
      }
    </button>
  `,
})
export class SearchButton {
  loading = input(false);
  disabled = input(false);
  clicked = output<void>();
}
