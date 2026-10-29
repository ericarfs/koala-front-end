import { AuthService } from '../services/auth';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  if (auth.isGuest()) return router.createUrlTree(['/guest']);

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return router.createUrlTree(['/']);
  return true;
};
