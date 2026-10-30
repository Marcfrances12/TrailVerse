import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthStore } from '../stores/auth.store';

interface Aviso {
  titulo: string;
  icono: 'error' | 'warning';
}

function traducir(error: unknown): Aviso {
  if (error instanceof HttpErrorResponse) {
    const cuerpo = error.error as any;

    if (error.status === 0) {
      return {
        titulo: 'No se pudo conectar con el servidor. Comprueba que la API esté activa.',
        icono: 'error'
      };
    }

    if (error.status === 401) {
      return { titulo: 'Tu sesión ha caducado. Inicia sesión de nuevo.', icono: 'warning' };
    }

    if (error.status === 403) {
      return { titulo: 'Acceso denegado: no tienes permisos para esta acción.', icono: 'warning' };
    }

    if (error.status === 408) {
      return { titulo: 'La petición ha tardado demasiado. Inténtalo de nuevo.', icono: 'warning' };
    }

    if (error.status >= 200 && error.status < 300) {
      return { titulo: 'La respuesta del servidor no es válida.', icono: 'error' };
    }

    if (typeof cuerpo?.error === 'string' && cuerpo.error.trim().length > 0) {
      return { titulo: cuerpo.error, icono: error.status >= 500 ? 'error' : 'warning' };
    }

    if (error.status >= 500) {
      return { titulo: 'Error interno del servidor. Inténtalo más tarde.', icono: 'error' };
    }

    return { titulo: `La petición ha fallado (HTTP ${error.status}).`, icono: 'warning' };
  }

  const mensaje = (error as Error | null)?.message;

  if (mensaje?.includes('tiempo de espera')) {
    return { titulo: mensaje, icono: 'warning' };
  }

  return { titulo: mensaje || 'Se ha producido un error inesperado.', icono: 'error' };
}

/**
 * Captura errores de red, timeout y respuestas de error del backend.
 * Un 401 limpia la sesión y redirige a login. Las peticiones de login y
 * logout gestionan su propio error, así que no muestran aviso global.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const store = inject(AuthStore);
  const esAuth = ['/auth/login', '/auth/logout', '/auth/me'].some((ruta) => req.url.endsWith(ruta));
  const esComprobacionSesion = req.url.endsWith('/auth/me');

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !esComprobacionSesion && !req.url.endsWith('/auth/login')) {
        store.limpiar();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }

      if (esAuth) {
        return throwError(() => error);
      }

      const { titulo, icono } = traducir(error);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icono,
        title: titulo,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      });

      return throwError(() => error);
    })
  );
};
