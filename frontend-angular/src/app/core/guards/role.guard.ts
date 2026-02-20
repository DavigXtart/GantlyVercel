import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as string;

  if (authService.currentUser) {
    if (authService.currentUser.role === requiredRole) {
      return true;
    }
    router.navigate(['/']);
    return false;
  }

  return authService.me().pipe(
    map(user => {
      if (user.role === requiredRole) {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
