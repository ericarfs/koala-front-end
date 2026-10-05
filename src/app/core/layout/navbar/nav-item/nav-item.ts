import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'li[app-nav-item]',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, TranslatePipe],
  template: `
   <a
    [routerLink]="route()"
    routerLinkActive="active"
    [routerLinkActiveOptions]="{ exact: false }"
    class="flex items-center rounded-md text-red-100 hover:bg-white/10 transition"
    [ngClass]="collapsed() ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'"
    >
    <i [ngClass]="icon()" class="text-lg w-5 text-center shrink-0"></i>

    @if (!collapsed()) {
      <span class="text-sm whitespace-nowrap">{{ label() | translate}}</span>
    }
  </a>
  `
})
export class NavItem {
  route = input.required<string>();
  label = input.required<string>();
  icon = input.required<string>();
  collapsed = input(false);
}
