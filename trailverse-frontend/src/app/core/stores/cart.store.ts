import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { CartApiService } from '../services/cart-api.service';
import { CARRITO_VACIO, Cart } from '../models/cart.model';
import { RecursoRespuesta } from '../models/api-response';

/**
 * Carrito del usuario con sesión.
 *
 * El carrito vive en el servidor (colecciones Cart y CartItem), no en localStorage:
 * al cerrar sesión solo se vacía la copia en memoria y al volver a entrar se recupera tal cual.
 * AuthStore llama a cargar() / limpiar() cada vez que cambia el usuario.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly api = inject(CartApiService);

  private readonly _carrito = signal<Cart>(CARRITO_VACIO);
  private readonly _cargando = signal(false);
  /** departureId de la línea que se está modificando, para desactivar sus botones. */
  private readonly _ocupado = signal<string | null>(null);
  private readonly _abierto = signal(false);
  /** Evita que una respuesta de un usuario anterior pise el carrito tras cambiar de sesión. */
  private version = 0;

  readonly carrito = this._carrito.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly ocupado = this._ocupado.asReadonly();
  readonly abierto = this._abierto.asReadonly();

  readonly items = computed(() => this._carrito().items);
  readonly total = computed(() => this._carrito().total);
  readonly totalItems = computed(() => this._carrito().total_items);
  readonly currency = computed(() => this._carrito().currency);
  readonly vacio = computed(() => this._carrito().items.length === 0);
  readonly hayNoDisponibles = computed(() => this._carrito().items.some((item) => !item.disponible));

  /** Plazas de una salida que ya están en el carrito (para limitar el selector del detalle). */
  cantidadDe(departureId: string): number {
    return this._carrito().items.find((item) => item.departureId === departureId)?.quantity ?? 0;
  }

  abrir(): void {
    this._abierto.set(true);
  }

  cerrar(): void {
    this._abierto.set(false);
  }

  async cargar(): Promise<void> {
    const version = ++this.version;
    this._cargando.set(true);
    try {
      const respuesta = await firstValueFrom(this.api.obtener());
      if (version === this.version) this._carrito.set(respuesta.data);
    } catch {
      // El interceptor ya avisa del error; el carrito se queda como estaba.
    } finally {
      if (version === this.version) this._cargando.set(false);
    }
  }

  /** Solo limpia la memoria: los datos siguen en el servidor para el próximo inicio de sesión. */
  limpiar(): void {
    this.version++;
    this._carrito.set(CARRITO_VACIO);
    this._cargando.set(false);
    this._ocupado.set(null);
    this._abierto.set(false);
  }

  /** Añade plazas. Si la salida ya estaba en el carrito, el servidor suma la cantidad. */
  async anadir(departureId: string, quantity = 1): Promise<boolean> {
    const ok = await this.ejecutar(departureId, this.api.anadir(departureId, quantity));
    if (ok) this.avisar(quantity === 1 ? 'Plaza añadida al carrito' : `${quantity} plazas añadidas al carrito`);
    return ok;
  }

  async cambiarCantidad(departureId: string, quantity: number): Promise<boolean> {
    if (quantity < 1) return this.quitar(departureId);
    return this.ejecutar(departureId, this.api.actualizar(departureId, quantity));
  }

  async quitar(departureId: string): Promise<boolean> {
    return this.ejecutar(departureId, this.api.quitar(departureId));
  }

  async vaciar(): Promise<boolean> {
    const resultado = await Swal.fire({
      title: '¿Vaciar el carrito?',
      text: 'Se quitarán todas las salidas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar',
      confirmButtonColor: '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return false;
    return this.ejecutar('*', this.api.vaciar());
  }

  private async ejecutar(clave: string, peticion: Observable<RecursoRespuesta<Cart>>): Promise<boolean> {
    if (this._ocupado()) return false;
    const version = this.version;
    this._ocupado.set(clave);
    try {
      const respuesta = await firstValueFrom(peticion);
      if (version === this.version) this._carrito.set(respuesta.data);
      return true;
    } catch {
      // El interceptor muestra el motivo (sin plazas, salida cancelada...). Se recupera el estado real.
      if (version === this.version) await this.cargar();
      return false;
    } finally {
      if (version === this.version) this._ocupado.set(null);
    }
  }

  private avisar(titulo: string): void {
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: titulo, showConfirmButton: false, timer: 2500, timerProgressBar: true });
  }
}
