import { MenuItem } from '../../../extensions/extension-registry';
import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'li[app-nav-group]',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, TranslatePipe],
  template:`
  <button
    type="button"
    (click)="toggle()"
    class="relative group flex items-center rounded-md text-default hover:bg-neutral/20 w-full transition"
    [ngClass]="collapsed() ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'"
    [attr.aria-expanded]="expanded()"
    >
    <i [ngClass]="icon()" class="text-lg w-5 text-center shrink-0"></i>

    @if (!collapsed()) {
      <span class="flex-1 text-left whitespace-nowrap">{{ labelKey() | translate }}</span>
      <i
        class="fa-solid fa-chevron-down text-xs transition-transform duration-200"
        [class.rotate-180]="expanded()"
      ></i>
    }
  </button>

  @if (expanded() && !collapsed()) {
    <ul class="flex flex-col gap-0.5 mt-1 ml-4">
      @for (sub of subItems(); track sub.id) {
        <li>
          <a
            [routerLink]="sub.routerLink"
            routerLinkActive="bg-primary text-primary-foreground font-medium hover:bg-primary"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-3 py-1.5 rounded-md text-neutral hover:bg-neutral/15 transition"
          >
            <i [ngClass]="sub.icon" class="w-4 text-center"></i>
            <span>{{ sub.labelKey | translate }}</span>
          </a>
        </li>
      }
    </ul>
  }`,
  styles: `
  :host {
    display: block;
  }
  .rotate-180 {
    transform: rotate(180deg);
  }
  `
})
export class NavGroup {
  labelKey = input.required<string>();
  icon = input.required<string>();
  subItems = input.required<MenuItem[]>();
  expanded = input(false);
  collapsed = input(false);

  toggled = output<void>();

  toggle(): void {
    this.toggled.emit();
  }
}
