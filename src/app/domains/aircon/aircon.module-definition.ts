import { KoalaModuleDefinition } from '../../core/extensions/koala-module-definition';


export const airconModuleDefinition: KoalaModuleDefinition = {
  id: 'aircon',
  label: 'AirCon',
  routePath: 'aircon',
  icon: 'fa-solid fa-fan',
  loadChildren: () =>
    import('./aircon.routes').then((m) => m.AIRCON_ROUTES),
  subItems: [
    {
      id: 'ota',
      label: 'Atualização OTA',
      routePath: 'aircon/ota',
      icon: 'fa-solid fa-file-arrow-up',
    },
  ],
  order: 2,
  meta: { contractVersion: '1.0' },
};
