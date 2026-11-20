import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, share, switchMap, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '@environments/environment';
import { AuthStore } from '../stores/auth.store';

const RUTAS_SIN_RENOVACION = ['/auth/login', '/auth/register', '/auth/refresh'];

// Una sola renovación en vuelo: varias peticiones con 401 a la vez comparten el mismo refresh.
let renovacion$: Observable<boolean> | null = null;

function renovarSesion(next: HttpHandlerFn): Observable<boolean> {
  renovacion$ ??= next(
    new HttpRequest<unknown>('POST', `${environment.API_URL}/auth/refresh`, {}, { withCredentials: true })
  ).pipe(
    map(() => true),
    catchError(() => of(false)),
    finalize(() => {
      renovacion$ = null;
    }),
    share()
  );
  return renovacion$;
}

function expirarSesion(store: AuthStore, router: Router): void {
  const estabaAutenticado = store.isAuthenticated();
  store.limpiar();
  if (!estabaAutenticado) return;

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'warning',
    title: 'Tu sesión ha expirado. Inicia sesión de nuevo.',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true
  });
  router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
}

/**
 * Ante un 401 de la API renueva la sesión con el refresh token y repite la petición.
 * Si la renovación falla, la sesión termina y el usuario vuelve a iniciar sesión.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const esApi = req.url.startsWith(environment.API_URL);
  if (!esApi || RUTAS_SIN_RENOVACION.some((ruta) => req.url.endsWith(ruta))) {
    return next(req);
  }

  const store = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return renovarSesion(next).pipe(
        switchMap((renovada) => {
          if (renovada) return next(req);

          if (!req.url.endsWith('/auth/logout')) {
            expirarSesion(store, router);
          }
          return throwError(() => error);
        })
      );
    })
  );
};
