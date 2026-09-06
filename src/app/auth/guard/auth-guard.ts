import { Router, type CanActivateFn } from '@angular/router';
import { Auth } from '../service/auth';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.currentUser()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
