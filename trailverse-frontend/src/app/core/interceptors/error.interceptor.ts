import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

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
 * Los 401 los gestiona refreshInterceptor (renovar sesión o expulsar al login),
 * así que aquí no muestran aviso. Las peticiones de autenticación gestionan su propio error.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const esAuth = ['/auth/login', '/auth/register', '/auth/logout', '/auth/me'].some((ruta) => req.url.endsWith(ruta));

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return throwError(() => error);
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
