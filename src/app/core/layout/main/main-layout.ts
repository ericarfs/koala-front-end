import { Navbar } from '../navbar/navbar';
import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ExtensionRegistryService, MenuItem } from '../../extensions/extension-registry';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, NgClass, TranslocoPipe],
  template: `
    <div class="flex h-screen w-full max-w-[2560px] mx-auto overflow-hidden">
      <app-navbar/>
      <main class="flex-1 pt-14 overflow-auto md:pt-0 flex flex-col">
        <section class="w-full max-w-[1920px] min-w-0 p-4 md:p-6 flex-1 flex flex-col">

          @if (currentGroup(); as g) {
            <div class="flex items-center gap-2 text-sm text-neutral mb-2 break-all">
              <i [ngClass]="g.icon" class="text-xs"></i>
              <span>{{ g.label | transloco }}</span>
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
  private readonly registry = inject(ExtensionRegistryService);

  private readonly menuItems = computed(() => this.registry.getMenuItems());

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly currentGroup = computed(() => {
    return this.findCurrentGroup(this.url(), this.menuItems());
  });

  private findCurrentGroup(url: string, menuItems: MenuItem[]): { label: string; icon: string } | null {
    const allSubItems = menuItems.flatMap(item =>
      item.subItems.map(sub => ({ sub, parent: item }))
    );

    const bestMatch = allSubItems
      .filter(({ sub }) => sub.routerLink && (url === sub.routerLink || url.startsWith(sub.routerLink + '/')))
      .sort((a, b) => b.sub.routerLink.length - a.sub.routerLink.length)[0];

    return bestMatch
      ? { label: bestMatch.parent.labelKey, icon: bestMatch.parent.icon }
      : null;
  }
}
