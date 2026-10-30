import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@environments/environment';

/** Envía la cookie de sesión (HttpOnly) en las peticiones a la API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.API_URL)) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};
