import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Mantiene el indicador global de carga mientras hay peticiones en vuelo.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);

  loading.iniciar();
  return next(req).pipe(finalize(() => loading.finalizar()));
};
