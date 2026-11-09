import { Observable, take } from 'rxjs';

// Como firstValueFrom, pero al abortar la señal se desuscribe: HttpClient cancela la petición.
export function primerValorCancelable<T>(origen: Observable<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const suscripcion = origen.pipe(take(1)).subscribe({ next: resolve, error: reject });

    signal.addEventListener('abort', () => {
      suscripcion.unsubscribe();
      reject(new DOMException('Petición cancelada', 'AbortError'));
    }, { once: true });
  });
}
