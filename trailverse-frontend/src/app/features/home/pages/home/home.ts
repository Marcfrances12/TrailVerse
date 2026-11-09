import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopStore } from '../../../../core/stores/shop.store';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { ShopCategoryCard } from '../../../../shared/components/cards/shop-category-card';
import { ShopHostCard } from '../../../../shared/components/cards/shop-host-card';
import { ShopLocationCard } from '../../../../shared/components/cards/shop-location-card';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    Carousel,
    ShopCategoryCard,
    ShopHostCard,
    ShopLocationCard,
    EmptyState,
    ErrorState
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html'
})
export class Home {
  readonly store = inject(ShopStore);

  constructor() {
    this.store.cargarHome();
    inject(DestroyRef).onDestroy(() => this.store.cancelar());
  }

  reintentar(): void {
    this.store.cargarHome();
  }
}
