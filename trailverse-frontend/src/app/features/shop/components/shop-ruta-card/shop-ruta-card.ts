import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ETIQUETAS_DIFICULTAD } from '../../../../core/models/ruta.model';
import { ShopRuta } from '../../../../core/models/shop.model';
import { formatDuracion, formatKm, formatPrecio } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-shop-ruta-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-ruta-card.html'
})
export class ShopRutaCard {
  readonly ruta = input.required<ShopRuta>();
  readonly etiquetas = ETIQUETAS_DIFICULTAD;
  readonly formatKm = formatKm;
  readonly formatDuracion = formatDuracion;
  readonly formatPrecio = formatPrecio;
}
