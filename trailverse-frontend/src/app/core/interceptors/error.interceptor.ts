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

    if (error.status === 408) {
      return { titulo: 'La petición ha tardado demasiado. Inténtalo de nuevo.', icono: 'warning' };
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
 * Captura errores de red, timeout y respuestas de error del backend y
 * los muestra al usuario con SweetAlert2 (toast no bloqueante).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
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