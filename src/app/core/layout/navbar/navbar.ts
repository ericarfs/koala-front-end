import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExtensionRegistryService, MenuItem } from '@core/extensions/extension-registry';
import { SidebarStateService } from '@core/services/sidebar-state';
import { NavItem } from './nav-item/nav-item';
import { NavGroup } from './nav-group/nav-group';
import { UserMenu } from './user-menu/user-menu';
import { InterfacePreferences } from '@shared/components/interface-preferences/interface-preferences';
import { TranslocoPipe } from '@jsverse/transloco';

interface FlatMenuItem {
  label: string;
  routerLink: string;
  groupId?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgClass, NavItem, NavGroup, UserMenu, InterfacePreferences, TranslocoPipe],
  templateUrl:'./navbar.html'
})
export class Navbar {
  private readonly registry = inject(ExtensionRegistryService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sidebar = inject(SidebarStateService);
  protected readonly menuItems = computed(() => this.registry.getMenuItems());
  protected readonly expandedId = signal<string | null>(null);
  protected readonly activeLabel = signal<string>('Smart Lab');

  constructor() {
    this.expandedId.set('monitoring');

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => this.updateActiveState(e.urlAfterRedirects));
  }

  toggleGroup(id: string): void {
    if (this.sidebar.collapsed()) {
      this.sidebar.peekOpen();
      this.expandedId.set(id);
      return;
    }
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  private updateActiveState(url: string): void {
    const flatItems = this.flattenMenu(this.menuItems());
    const match = flatItems.find((f) => this.matchesRoute(url, f.routerLink));

    if (match?.groupId) {
      this.expandedId.set(match.groupId);
    }
    this.activeLabel.set(match?.label ?? 'Smart Lab');

    this.sidebar.peekClose();
    this.sidebar.closeMobile();
  }

  private flattenMenu(items: MenuItem[]): FlatMenuItem[] {
    return items
      .flatMap(item => {
        if (item.subItems.length > 0) {
          return item.subItems.map(sub => ({
            label: sub.labelKey,
            routerLink: sub.routerLink,
            groupId: item.id
          }));
        }
        return [{ label: item.labelKey, routerLink: item.routerLink }];
      })
      .sort((a, b) => b.routerLink.length - a.routerLink.length);
  }

  private matchesRoute(url: string, route: string): boolean {
    if (!route) return false;
    return url === route || url.startsWith(route + '/');
  }
}
