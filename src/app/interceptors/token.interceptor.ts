import { HttpInterceptorFn } from '@angular/common/http';
import { Observable, timeout, catchError, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned).pipe(
      timeout(15000),
      catchError(err => {
        if (err.status === 401) {
          localStorage.removeItem('access_token');
        }
        return throwError(() => err);
      })
    );
  }
  
  return next(req);
};
