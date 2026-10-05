import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      (click)="toggleTheme()"
      [attr.aria-label]="(isDark ? 'COMMON.THEME.TOGGLE_TO_LIGHT' : 'COMMON.THEME.TOGGLE_TO_DARK') | translate"
      [attr.aria-pressed]="isDark"
      class="inline-flex items-center justify-center p-2 rounded-xl border border-outline bg-container text-default hover:bg-input transition-colors duration-200 cursor-pointer"
      [title]="(isDark ? 'COMMON.THEME.ACTIVATE_LIGHT' : 'COMMON.THEME.ACTIVATE_DARK') | translate">

      <span aria-hidden="true" class="text-md">
        {{ isDark ? '☀️' : '🌙' }}
      </span>

      <span class="sr-only">
        {{ (isDark ? 'COMMON.THEME.LIGHT_MODE' : 'COMMON.THEME.DARK_MODE') | translate }}
      </span>
    </button>
  `
})
export class ThemeToggle implements OnInit {
  isDark = false;

  // Guardamos a query de escuta do sistema operacional
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  ngOnInit() {
    this.syncFromDOM();
    this.mediaQuery.addEventListener('change', this.syncFromDOM);
  }

  private syncFromDOM = () => {
    // o script do index.html já aplicou a classe; só espelhamos no estado
    this.isDark = document.documentElement.classList.contains('dark');
  };

  toggleTheme() {
    this.isDark = !this.isDark;

    if (this.isDark === this.mediaQuery.matches) {
      localStorage.removeItem('theme'); // igual ao sistema: volta a seguir o SO
    } else {
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    }

    this.updateDOM();
  }

  private updateDOM() {
    const root = document.documentElement;
    root.classList.toggle('dark', this.isDark);
    root.style.colorScheme = this.isDark ? 'dark' : 'light';
  }
}
