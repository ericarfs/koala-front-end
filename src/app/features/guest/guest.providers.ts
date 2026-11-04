import { Provider, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DATA_SCOPE } from '@shared/tokens/data-scope';
import { LocationService } from '@shared/domains/location/services/location';
import { MockLocationService } from '@shared/domains/location/services/location.mock';
import { DeviceTypeService } from '@shared/domains/device-type/services/device-type';
import { MockDeviceTypeService } from '@shared/domains/device-type/services/device-type.mock';
import { MetricsService } from '@shared/domains/monitoring/services/metrics';
import { MockMetricsService } from '@shared/domains/monitoring/services/metrics.mock';
import { LocationStore } from '@shared/domains/location/stores/location-store';
import { DeviceTypeStore } from '@shared/domains/device-type/stores/device-type';
import { ChartDataStore } from '@shared/domains/monitoring/stores/chart-data-store';
import { GuestLocationService } from './services/location';
import { GuestDeviceTypeService } from './services/device-type';
import { GuestMetricsService } from './services/metrics';

const mock = environment.useMock;

export const GUEST_PROVIDERS: Provider[] = [
  { provide: DATA_SCOPE, useFactory: () => signal<string | null>('guest') },
  { provide: LocationService, useClass: mock ? MockLocationService : GuestLocationService },
  { provide: DeviceTypeService, useClass: mock ? MockDeviceTypeService : GuestDeviceTypeService },
  { provide: MetricsService, useClass: mock ? MockMetricsService : GuestMetricsService },
  LocationStore,
  DeviceTypeStore,
  ChartDataStore,
];
