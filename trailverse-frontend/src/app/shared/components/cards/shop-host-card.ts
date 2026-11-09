import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopEntidad } from '../../../core/models/shop.model';

@Component({
  selector: 'app-shop-host-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-host-card.html'
})
export class ShopHostCard {
  readonly opcion = input.required<ShopEntidad>();
}
