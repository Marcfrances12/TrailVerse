import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopEntidad } from '../../../core/models/shop.model';

@Component({
  selector: 'app-shop-location-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-location-card.html'
})
export class ShopLocationCard {
  readonly opcion = input.required<ShopEntidad>();
}
