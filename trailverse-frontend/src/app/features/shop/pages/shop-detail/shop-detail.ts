import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ETIQUETAS_DIFICULTAD } from '../../../../core/models/ruta.model';
import { ShopStore } from '../../../../core/stores/shop.store';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { ShopCategoryCard } from '../../../../shared/components/cards/shop-category-card';
import { ShopHostCard } from '../../../../shared/components/cards/shop-host-card';
import { ShopLocationCard } from '../../../../shared/components/cards/shop-location-card';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import {
  formatDuracion,
  formatFechaHora,
  formatKm,
  formatMetros,
  formatPrecio
} from '../../../../shared/utils/formatos';
import { Galeria } from '../../../../shared/components/galeria/galeria';
import { ShopRutaCard } from '../../components/shop-ruta-card/shop-ruta-card';
import { RouteChat } from '../../../../shared/components/route-chat/route-chat';

@Component({
  selector: 'app-shop-detail',
  imports: [
    RouterLink,
    Carousel,
    ShopCategoryCard,
    ShopHostCard,
    ShopLocationCard,
    ShopRutaCard,
    Galeria,
    EmptyState,
    ErrorState,
    RouteChat
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-detail.html'
})
export class ShopDetail {
  readonly store = inject(ShopStore);
  readonly etiquetas = ETIQUETAS_DIFICULTAD;
  readonly formatKm = formatKm;
  readonly formatMetros = formatMetros;
  readonly formatDuracion = formatDuracion;
  readonly formatFechaHora = formatFechaHora;
  readonly formatPrecio = formatPrecio;

  readonly imagenes = computed(() => {
    const ruta = this.store.detalle();
    if (!ruta) return [];

    const galeria = ruta.images.filter((imagen) => imagen.url);
    if (galeria.length) return galeria;
    return ruta.coverImage.url ? [ruta.coverImage] : [];
  });

  constructor() {
    inject(ActivatedRoute).paramMap
      .pipe(map((params) => params.get('slug') ?? ''), takeUntilDestroyed())
      .subscribe((slug) => this.store.cargarDetalle(slug));

    inject(DestroyRef).onDestroy(() => this.store.cancelar());
  }

  seleccionar(salidaId: string): void {
    this.store.seleccionarSalida(salidaId);
  }
}
