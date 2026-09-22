import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../service/auth';
import { toast } from '@spartan-ng/brain/sonner';

/**
 * Intercepta respuestas 401 (sesión expirada o no autenticado)
 * y redirige automáticamente al login, limpiando el estado local.
 */
export const authExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(Auth);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        // Limpiar estado sin hacer petición al servidor (ya no hay sesión)
        toast.error('Tu sesión ha expirado');
        auth.clearSession();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
