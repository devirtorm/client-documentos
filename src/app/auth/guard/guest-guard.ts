import { Router, type CanActivateFn } from '@angular/router';
import { Auth } from '../service/auth';
import { inject } from '@angular/core';

export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.currentUser()) {
    return router.createUrlTree(['/clientes']);
  }

  return true;
};
