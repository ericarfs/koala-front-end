import { Inject, Injectable, Optional } from '@angular/core';
import { Route } from '@angular/router';
import { KoalaModuleDefinition } from './koala-module-definition';
import { KOALA_MODULE_EXTENSIONS } from './koala-module-extensions.token';

export interface MenuItem {
  id: string;
  labelKey: string;
  routerLink: string;
  icon: string;
  subItems: MenuItem[];
}

@Injectable({ providedIn: 'root' })
export class ExtensionRegistryService {
  private readonly modules: KoalaModuleDefinition[];

  // Grupo fixo, sempre o primeiro item do menu.
  private readonly monitoringGroup: MenuItem = {
    id: 'monitoring',
    labelKey: 'MENU.MONITORING',
    routerLink: '',
    icon: 'fa-solid fa-chart-line',
    subItems: [
      { id: 'location',    labelKey: 'MENU.LOCATIONS',    routerLink: '/location',    icon: 'fa-solid fa-map-location-dot', subItems: [] },
      { id: 'sensores',    labelKey: 'MENU.SENSORS',      routerLink: '/device-type', icon: 'fa-solid fa-tower-broadcast',  subItems: [] },
      { id: 'dashboard',   labelKey: 'MENU.DASHBOARD',    routerLink: '/dashboard',   icon: 'fa-solid fa-gauge-high',       subItems: [] },
      { id: 'dispositivos',labelKey: 'MENU.DEVICES',      routerLink: '/devices',     icon: 'fa-solid fa-microchip',        subItems: [] },
    ],
};

  // Grupo fixo, sempre o último item do menu.
  private readonly settingsGroup: MenuItem = {
    id: 'settings',
    labelKey: 'MENU.SETTINGS',
    routerLink: '',
    icon: 'fa-solid fa-gear',
    subItems: [
      { id: 'users', labelKey: 'MENU.USERS', routerLink: '/users', icon: 'fa-solid fa-user', subItems: [] },
    ],
  };

  constructor(
    @Optional() @Inject(KOALA_MODULE_EXTENSIONS) extensions: KoalaModuleDefinition[] | null
  ) {
    this.modules = extensions ?? [];
  }

  getModules(): readonly KoalaModuleDefinition[] {
    return this.modules;
  }

  getMenuItems(): MenuItem[] {
    const sortedModules = [...this.modules].sort(
      (a, b) => (a.order ?? 100) - (b.order ?? 100)
    );

    const pluginItems: MenuItem[] = sortedModules.map((m) => ({
      id: m.id,
      labelKey: m.label,
      routerLink: `/${m.routePath}`,
      icon: m.icon ?? 'fa-solid fa-puzzle-piece',
      subItems: (m.subItems ?? []).map((s) => ({
        id: s.id,
        labelKey: s.label,
        routerLink: `/${s.routePath}`,
        icon: s.icon ?? 'fa-solid fa-circle',
        subItems: [],
      })),
    }));

    return [this.monitoringGroup, ...pluginItems, this.settingsGroup];
  }

  buildRoutes(): Route[] {
    return this.modules
      .map((m): Route | null => {
        try {
          if (m.loadChildren) {
            return { path: m.routePath, loadChildren: m.loadChildren };
          }
          if (m.loadComponent) {
            return { path: m.routePath, loadComponent: m.loadComponent };
          }
          console.warn(`Módulo "${m.id}" não define loadChildren nem loadComponent.`);
          return null;
        } catch (e) {
          console.error(`Falha ao registrar módulo "${m.id}":`, e);
          return null;
        }
      })
      .filter((r): r is Route => r !== null);
  }
}
