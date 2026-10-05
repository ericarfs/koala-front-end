import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

const LEVELS = [100, 115, 130]; // porcentagem do font-size base
const LABEL_KEYS = [
  'COMMON.FONT_SIZE.NORMAL',
  'COMMON.FONT_SIZE.LARGE',
  'COMMON.FONT_SIZE.EXTRA_LARGE',
];
const STORAGE_KEY = 'font-scale';

@Component({
  selector: 'app-font-size-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      type="button"
      (click)="cycle()"
      [attr.aria-label]="'COMMON.FONT_SIZE.ARIA_LABEL' | translate: { size: (labelKeys[index] | translate) }"
      [title]="'COMMON.FONT_SIZE.TITLE' | translate: { size: (labelKeys[index] | translate) }"
      class="inline-flex items-center justify-center p-2 rounded-xl border border-outline bg-container text-default hover:bg-input transition-colors duration-200 cursor-pointer">
      <span aria-hidden="true" class="font-bold leading-none">
        <span class="text-sm">A</span><span class="text-xl">A</span>
      </span>
      <span class="sr-only">{{ 'COMMON.FONT_SIZE.SR_ONLY' | translate }}</span>
    </button>
  `,
})
export class FontSizeToggle implements OnInit {
  labelKeys = LABEL_KEYS;
  index = 0;

  ngOnInit() {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    const found = LEVELS.indexOf(saved);
    this.index = found >= 0 ? found : 0;
  }

  cycle() {
    this.index = (this.index + 1) % LEVELS.length;
    const value = LEVELS[this.index];

    if (value === 100) {
      localStorage.removeItem(STORAGE_KEY);
      document.documentElement.style.removeProperty('font-size');
    } else {
      localStorage.setItem(STORAGE_KEY, String(value));
      document.documentElement.style.fontSize = value + '%';
    }
  }
}
