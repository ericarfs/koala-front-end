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
      id: 'device-control',
      label: 'DEVICE_CONTROL.TITLE',
      routePath: 'aircon/device-control',
      icon: 'fa-solid fa-temperature-half',
    },
  ],
  order: 2,
  meta: { contractVersion: '1.0' },
};
