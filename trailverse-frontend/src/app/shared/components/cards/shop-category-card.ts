import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopEntidad } from '../../../core/models/shop.model';

@Component({
  selector: 'app-shop-category-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-category-card.html'
})
export class ShopCategoryCard {
  readonly opcion = input.required<ShopEntidad>();
}
