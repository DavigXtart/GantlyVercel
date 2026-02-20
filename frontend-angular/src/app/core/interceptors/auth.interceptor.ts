import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          return authService.refreshToken(refreshToken).pipe(
            switchMap((res) => {
              const newToken = res.accessToken || res.token;
              if (newToken) {
                localStorage.setItem('token', newToken);
                if (res.refreshToken) {
                  localStorage.setItem('refreshToken', res.refreshToken);
                }
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next(retryReq);
              }
              authService.logout();
              return throwError(() => error);
            }),
            catchError((refreshError) => {
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        }
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
