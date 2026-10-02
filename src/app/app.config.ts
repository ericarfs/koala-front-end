import { authInterceptor } from './core/auth/interceptors/auth';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { CORE_ROUTES } from './app.routes';
import { provideHttpClient, withInterceptors,  } from '@angular/common/http';
import { ExtensionRegistryService } from './core/extensions/extension-registry';
import { MainLayoutComponent } from './core/layout/main/main-layout';
import { provideKoalaModule } from './core/extensions/koala-module-extensions.token';
import { mffModuleDefinition } from './domains/mff/mff.module-definition';
import { AuthService } from './core/auth/services/auth';
import { PERMISSIONS } from './shared/tokens/permissions';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: PERMISSIONS, useExisting: AuthService },
    provideBrowserGlobalErrorListeners(),
    provideRouter(CORE_ROUTES),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideKoalaModule(mffModuleDefinition),

    provideAppInitializer(() => {
      const router = inject(Router);
      const registry = inject(ExtensionRegistryService);

      const mainLayoutRoute = CORE_ROUTES.find((r) => r.component === MainLayoutComponent);

      if (mainLayoutRoute && mainLayoutRoute.children) {
        mainLayoutRoute.children = [
          ...mainLayoutRoute.children,
          ...registry.buildRoutes(),
          { path: '**', redirectTo: '/' },
        ];
      }

      router.resetConfig([...CORE_ROUTES]);
    }),
  ]
};
