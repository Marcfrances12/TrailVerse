import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ETIQUETAS_DIFICULTAD, Dificultad } from '../../../../core/models/ruta.model';
import { CategoryMode, ShopFiltros, ShopFiltrosOpciones } from '../../../../core/models/shop.model';
import { ShopStore } from '../../../../core/stores/shop.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { FilterPanel, FiltroCambio, FiltroGrupo } from '../../../../shared/components/filter-panel/filter-panel';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { ShopRutaCard } from '../../components/shop-ruta-card/shop-ruta-card';

function construirGrupos(filtros: ShopFiltros, opciones: ShopFiltrosOpciones | null): FiltroGrupo[] {
  if (!opciones) return [];

  const todas = { valor: '', etiqueta: 'Todas' };

  return [
    {
      clave: 'categoryId',
      titulo: 'Categorías',
      tipo: 'multiple',
      opciones: opciones.categories.map((c) => ({ valor: c.slug, etiqueta: c.nombre, total: c.total })),
      seleccion: filtros.categoryId
    },
    {
      clave: 'categoryMode',
      titulo: 'Coincidencia de categorías',
      tipo: 'segmento',
      opciones: [
        { valor: 'any', etiqueta: 'Cualquiera' },
        { valor: 'all', etiqueta: 'Todas' }
      ],
      seleccion: [filtros.categoryMode],
      padre: 'categoryId'
    },
    {
      clave: 'hostId',
      titulo: 'Host',
      tipo: 'unica',
      opciones: [todas, ...opciones.hosts.map((h) => ({ valor: h.slug, etiqueta: h.nombre, total: h.total }))],
      seleccion: [filtros.hostId]
    },
    {
      clave: 'locationId',
      titulo: 'Localización',
      tipo: 'unica',
      opciones: [todas, ...opciones.locations.map((l) => ({ valor: l.slug, etiqueta: l.nombre, total: l.total }))],
      seleccion: [filtros.locationId]
    },
    {
      clave: 'dificultad',
      titulo: 'Dificultad',
      tipo: 'unica',
      opciones: [
        todas,
        ...opciones.dificultades.map((d: Dificultad) => ({ valor: d, etiqueta: ETIQUETAS_DIFICULTAD[d] }))
      ],
      seleccion: [filtros.dificultad]
    }
  ];
}

@Component({
  selector: 'app-shop-list',
  imports: [FilterPanel, Pagination, ShopRutaCard, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-list.html'
})
export class ShopList {
  readonly store = inject(ShopStore);
  readonly grupos = computed(() => construirGrupos(this.store.filtros(), this.store.opciones()));

  constructor() {
    this.store.cargarOpciones();

    inject(ActivatedRoute).queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.store.sincronizarDesdeUrl(params));

    inject(DestroyRef).onDestroy(() => this.store.cancelar());
  }

  alCambiarFiltro(cambio: FiltroCambio): void {
    const valor = cambio.seleccion[0] ?? '';

    switch (cambio.clave) {
      case 'categoryId':
        this.store.actualizarFiltros({ categoryId: cambio.seleccion });
        break;
      case 'categoryMode':
        this.store.actualizarFiltros({ categoryMode: valor as CategoryMode });
        break;
      case 'hostId':
        this.store.actualizarFiltros({ hostId: valor });
        break;
      case 'locationId':
        this.store.actualizarFiltros({ locationId: valor });
        break;
      case 'dificultad':
        this.store.actualizarFiltros({ dificultad: valor as Dificultad | '' });
        break;
    }
  }
}
