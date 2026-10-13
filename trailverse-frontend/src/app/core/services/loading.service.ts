import { Injectable, computed, signal } from '@angular/core';

/**
 * Estado global de carga: lo incrementan los interceptores y lo leen
 * el loader global. Es un servicio plano (sin HttpClient) para poder
 * inyectarlo desde un interceptor sin crear ciclos de dependencias.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly peticiones = signal(0);

  readonly activas = this.peticiones.asReadonly();
  readonly visible = computed(() => this.peticiones() > 0);

  iniciar(): void {
    this.peticiones.update((valor) => valor + 1);
  }

  finalizar(): void {
    this.peticiones.update((valor) => Math.max(0, valor - 1));
  }
}
