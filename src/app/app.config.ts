import { authInterceptor } from './core/auth/interceptors/auth';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { CORE_ROUTES } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ExtensionRegistryService } from './core/extensions/extension-registry';
import { MainLayout } from './core/layout/main/main-layout';
import { provideKoalaModule } from './core/extensions/koala-module-extensions.token';
import { mffModuleDefinition } from './domains/mff/mff.module-definition';
import { AuthService } from './core/auth/services/auth';
import { PERMISSIONS } from './shared/tokens/permissions';

import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';

import { environment } from '../environments/environment';
import { MetricsService } from '@shared/domain/monitoring/services/metrics';
import { MockMetricsService } from '@shared/domain/monitoring/services/metrics.mock';
import { airconModuleDefinition } from './domains/aircon/aircon.module-definition';
import { LocationService } from '@shared/domain/location/services/location';
import { MockLocationService } from '@shared/domain/location/services/location.mock';
import { DeviceService } from '@shared/domain/device/services/device';
import { MockDeviceService } from '@shared/domain/device/services/device.mock';
import { DeviceTypeService } from '@shared/domain/device-type/services/device-type';
import { MockDeviceTypeService } from '@shared/domain/device-type/services/device-type.mock';
import { FirmwareService } from '@shared/domain/device/services/firmware';
import { MockFirmwareService } from '@shared/domain/device/services/firmware.mock';
import { DeviceMappingService } from '@shared/domain/device/services/device-mapping';
import { MockDeviceMappingService } from '@shared/domain/device/services/device-mapping.mock';
import { UserService } from '@shared/domain/user/services/user';
import { MockUserService } from '@shared/domain/user/services/user.mock';
import { MockAuthService } from '@core/auth/services/auth.mock';
import { ActuatorService } from '@shared/domain/actuator/services/actuator';
import { MockActuatorService } from '@shared/domain/actuator/services/actuator.mock';
import { ActuatorMappingService } from '@shared/domain/device/services/actuator-mapping';
import { MockActuatorMappingService } from '@shared/domain/device/services/actuator-mapping.mock';
import { DATA_SCOPE } from '@shared/tokens/data-scope';
import { CURRENT_USER } from '@shared/tokens/current-user';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: PERMISSIONS, useExisting: AuthService },
    { provide: CURRENT_USER, useExisting: AuthService },
    { provide: DATA_SCOPE, useFactory: () => inject(AuthService).dataScope },
    provideBrowserGlobalErrorListeners(),
    provideRouter(CORE_ROUTES),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideKoalaModule(mffModuleDefinition),
    provideKoalaModule(airconModuleDefinition),

    provideAppInitializer(() => {
      const router = inject(Router);
      const registry = inject(ExtensionRegistryService);

      const mainLayoutRoute = CORE_ROUTES.find((r) => r.component === MainLayout);

      if (mainLayoutRoute && mainLayoutRoute.children) {
        mainLayoutRoute.children = [
          ...mainLayoutRoute.children,
          ...registry.buildRoutes(),
          { path: '**', redirectTo: '/' },
        ];
      }

      router.resetConfig([...CORE_ROUTES]);
    }),
    (environment.useMock
      ? [
          { provide: MetricsService, useClass: MockMetricsService },
          { provide: LocationService, useClass: MockLocationService },
          { provide: DeviceService, useClass: MockDeviceService },
          { provide: DeviceTypeService, useClass: MockDeviceTypeService },
          { provide: FirmwareService, useClass: MockFirmwareService },
          { provide: ActuatorService, useClass: MockActuatorService },
          { provide: DeviceMappingService, useClass: MockDeviceMappingService },
          { provide: ActuatorMappingService, useClass: MockActuatorMappingService },
          { provide: UserService, useClass: MockUserService },
          { provide: AuthService, useClass: MockAuthService },
        ]
      : []),
    provideTransloco({
      config: {
        availableLangs: ['en', 'pt'],
        defaultLang: 'pt',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
