import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const toast = inject(MessageService);
  const router = inject(Router);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned).pipe(
      timeout(15000),
      catchError(err => {
        if (err.status === 401) {
          localStorage.removeItem('access_token');
          toast.add({
            severity: 'warn',
            summary: 'Sesión expirada',
            detail: 'Tu sesión expiró. Redirigiendo al login...',
            life: 4000,
          });
          router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
  
  return next(req);
};
