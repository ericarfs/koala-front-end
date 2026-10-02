import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
//import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const apiUrl = "http://localhost:8080";

  const isApiCall = req.url.startsWith(apiUrl);
  const isAuthCall = req.url.startsWith(`${apiUrl}/auth/`);

  const token = auth.accessToken;
  const authReq =
    token && isApiCall && !isAuthCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isApiCall && !isAuthCall) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
