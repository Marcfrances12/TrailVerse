import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../../../core/models/cart.model';
import { CartStore } from '../../../../core/stores/cart.store';
import { formatFechaHora, formatPrecio } from '../../../../shared/utils/formatos';

/** Página completa de la cesta: líneas con detalle de la salida y resumen del pedido. */
@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.html'
})
export class CartPage {
  readonly store = inject(CartStore);
  readonly formatPrecio = formatPrecio;
  readonly formatFechaHora = formatFechaHora;

  constructor() {
    // Al entrar se recargan los datos para ver precios y plazas al día.
    this.store.cerrar();
    void this.store.cargar();
  }

  puedeSumar(item: CartItem): boolean {
    return item.disponible && item.quantity < item.salida.stock;
  }

  plazas(n: number): string {
    return `${n} ${n === 1 ? 'plaza' : 'plazas'}`;
  }
}
