import { AuthService } from '../services/auth';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';


export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isGuest()) return router.createUrlTree(['/guest']);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (!auth.isAdmin()) {
    return router.url === '/' ? router.createUrlTree(['/location']) : false;
  }

  return auth.isAdmin() || router.createUrlTree(['/dashboard']);
};
