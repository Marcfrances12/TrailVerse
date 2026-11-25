import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartItem } from '../../../../core/models/cart.model';
import { CartStore } from '../../../../core/stores/cart.store';
import { formatFechaHora, formatPrecio } from '../../../../shared/utils/formatos';

/** Panel lateral con el carrito: líneas, +/−, quitar, vaciar y total. */
@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-drawer.html',
  host: { '(document:keydown.escape)': 'store.cerrar()' }
})
export class CartDrawer {
  readonly store = inject(CartStore);
  readonly formatPrecio = formatPrecio;
  readonly formatFechaHora = formatFechaHora;

  constructor() {
    // Al navegar (p. ej. al pulsar una ruta del carrito) el panel se cierra.
    inject(Router)
      .events.pipe(filter((evento) => evento instanceof NavigationStart), takeUntilDestroyed())
      .subscribe(() => this.store.cerrar());

    // Mientras el panel está abierto no se hace scroll en la página de fondo.
    effect(() => {
      document.body.style.overflow = this.store.abierto() ? 'hidden' : '';
    });
    inject(DestroyRef).onDestroy(() => (document.body.style.overflow = ''));
  }

  /** Se puede sumar mientras queden plazas libres en la salida. */
  puedeSumar(item: CartItem): boolean {
    return item.disponible && item.quantity < item.salida.stock;
  }

  plazas(n: number): string {
    return `${n} ${n === 1 ? 'plaza' : 'plazas'}`;
  }
}
