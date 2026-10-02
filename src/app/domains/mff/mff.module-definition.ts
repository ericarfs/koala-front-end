import { KoalaModuleDefinition } from '../../core/extensions/koala-module-definition';


export const mffModuleDefinition: KoalaModuleDefinition = {
  id: 'mff',
  label: 'MFF',
  routePath: 'mff',
  icon: 'fa-solid fa-leaf',
  loadChildren: () =>
    import('./mff.routes').then((m) => m.MFF_ROUTES),
  subItems: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      routePath: 'mff/dashboard',
      icon: 'fa-solid fa-gauge',
    },
    {
      id: 'resources',
      label: 'Recursos',
      routePath: 'mff/resources',
      icon: 'fa-solid fa-list',
    },
  ],
  meta: { contractVersion: '1.0' },
};
