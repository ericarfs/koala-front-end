import { Injectable, inject } from '@angular/core';
import { Route } from '@angular/router';
import { PERMISSIONS } from '@shared/tokens/permissions';
import { KoalaModuleDefinition } from './koala-module-definition';
import { KOALA_MODULE_EXTENSIONS } from './koala-module-extensions.token';
import { adminGuard } from '@core/auth/guards/admin.guard';

export interface MenuItem {
  id: string;
  labelKey: string;
  routerLink: string;
  icon: string;
  order?: number;
  subItems: MenuItem[];
}

@Injectable({ providedIn: 'root' })
export class ExtensionRegistryService {
  private readonly permissions = inject(PERMISSIONS);
  private readonly modules = this.validate(
    inject(KOALA_MODULE_EXTENSIONS, { optional: true }) ?? [],
  );

  private readonly monitoringBaseItems: MenuItem[] = [
    { id: 'location', labelKey: 'MENU.LOCATIONS', routerLink: '/location', icon: 'fa-solid fa-map-location-dot', order: 10, subItems: [] },
    { id: 'sensores', labelKey: 'MENU.SENSORS', routerLink: '/device-type', icon: 'fa-solid fa-tower-broadcast', order: 20, subItems: [] },
    { id: 'dashboard', labelKey: 'MENU.DASHBOARD', routerLink: '/dashboard', icon: 'fa-solid fa-gauge-high', order: 30, subItems: [] },
    { id: 'dispositivos', labelKey: 'MENU.DEVICES', routerLink: '/devices', icon: 'fa-solid fa-microchip', order: 40, subItems: [] },
  ];

  private readonly settingsBaseItems: MenuItem[] = [
    { id: 'users', labelKey: 'MENU.USERS', routerLink: '/users', icon: 'fa-solid fa-user', order: 10, subItems: [] },
  ];

  getModules(): readonly KoalaModuleDefinition[] {
    return this.modules;
  }

  getMenuItems(): MenuItem[] {
    const isAdmin = this.permissions.isAdmin();
    const sortedModules = [...this.modules]
      .filter((m) => !m.adminOnly || isAdmin)
      .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

    const topLevelItems: MenuItem[] = [];
    const groupContributions = new Map<string, MenuItem[]>();


    for (const m of sortedModules) {
      const item: MenuItem = {
        id: m.id,
        labelKey: m.label,
        routerLink: `/${m.routePath}`,
        icon: m.icon ?? 'fa-solid fa-puzzle-piece',
        order: m.order,
      subItems: (m.subItems ?? []).map((s) => ({
        id: s.id,
        labelKey: s.label,
        routerLink: `/${s.routePath}`,
        icon: s.icon ?? 'fa-solid fa-circle',
        subItems: [],
      })),
    };

    if (m.menuGroup) {
        const list = groupContributions.get(m.menuGroup) ?? [];
        list.push(item);
        groupContributions.set(m.menuGroup, list);
      } else {
        topLevelItems.push(item);
      }
    }

    const mergeGroup = (base: MenuItem[], groupId: string): MenuItem[] =>
      [...base, ...(groupContributions.get(groupId) ?? [])].sort(
        (a, b) => (a.order ?? 100) - (b.order ?? 100)
      );

    const monitoringGroup: MenuItem = {
      id: 'monitoring',
      labelKey: 'MENU.MONITORING',
      routerLink: '',
      icon: 'fa-solid fa-chart-line',
      subItems: mergeGroup(this.monitoringBaseItems, 'monitoring'),
    };

    const settingsGroup: MenuItem = {
      id: 'settings',
      labelKey: 'MENU.SETTINGS',
      routerLink: '',
      icon: 'fa-solid fa-gear',
      subItems: mergeGroup(this.settingsBaseItems, 'settings'),
    };

    const settings = this.permissions.isAdmin() ? [settingsGroup] : [];
    return [monitoringGroup, ...topLevelItems, ...settings];
  }

  buildRoutes(): Route[] {
    return this.modules.map((m): Route => ({
      path: m.routePath,
     ...(m.adminOnly ? { canActivate: [adminGuard] } : {}),
      ...(m.loadChildren
        ? { loadChildren: m.loadChildren }
        : { loadComponent: m.loadComponent }),
    }));
  }

  private validate(defs: KoalaModuleDefinition[]): KoalaModuleDefinition[] {
    const ids = new Set<string>();
    const paths = new Set<string>();
    return defs.filter((m) => {
      const hasLoader = !!(m.loadChildren || m.loadComponent);
      const duplicated = ids.has(m.id) || paths.has(m.routePath);
      if (!hasLoader || duplicated) {
        console.warn(`[koala] Módulo "${m.id}" ignorado: ${hasLoader ? 'id ou rota repetidos' : 'sem loadChildren nem loadComponent'}.`);
        return false;
      }
      ids.add(m.id);
      paths.add(m.routePath);
      return true;
    });
  }
}
