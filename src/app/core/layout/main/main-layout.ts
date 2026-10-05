import { Navbar } from '../navbar/navbar';
import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ExtensionRegistryService } from '../../extensions/extension-registry';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, NgClass, TranslatePipe],
  template: `
    <div class="flex h-screen w-full max-w-[2560px] mx-auto overflow-hidden">
      <app-navbar></app-navbar>
      <main class="flex-1 pt-14 overflow-auto md:pt-0 flex flex-col">
        <section class="w-full max-w-[1920px] min-w-0 p-4 md:p-6 flex-1 flex flex-col">

          @if (currentGroup(); as g) {
            <div class="flex items-center gap-2 text-sm text-neutral mb-2 break-all">
              <i [ngClass]="g.icon" class="text-xs"></i>
              <span>{{ g.label | translate }}</span>
            </div>
          }

          <router-outlet></router-outlet>
        </section>
      </main>
    </div>
  `,
})
export class MainLayout {
  private readonly router = inject(Router);
  private readonly menuItems = inject(ExtensionRegistryService).getMenuItems();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly currentGroup = computed(() => {
    const url = this.url();
    let best: { label: string; icon: string; len: number } | null = null;

    for (const item of this.menuItems) {
      for (const sub of item.subItems) {
        const hit = url === sub.routerLink || url.startsWith(sub.routerLink + '/');
        if (hit && (!best || sub.routerLink.length > best.len)) {
          best = { label: item.labelKey, icon: item.icon, len: sub.routerLink.length };
        }
      }
    }
    return best;
  });
}
