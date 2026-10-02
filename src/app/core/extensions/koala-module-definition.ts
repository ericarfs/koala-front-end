import { Type } from '@angular/core';
import { Route } from '@angular/router';

export interface KoalaSubItem {
  id: string;
  label: string;
  routePath: string;
  icon?: string;
  subtitle?: string;
}

export interface KoalaModuleDefinition {
  id: string;
  label: string;
  routePath: string;
  icon?: string;

  loadChildren?: () => Promise<Route[]>;
  loadComponent?: () => Promise<Type<unknown>>;

  subItems?: KoalaSubItem[];

  meta?: Record<string, unknown>;
  order?: number;
}
