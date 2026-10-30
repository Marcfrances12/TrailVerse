import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RutasStore } from '../../../../core/stores/rutas.store';
import { RutaGrid } from '../../components/ruta-grid/ruta-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';

@Component({
  selector: 'app-ruta-explore',
  imports: [RutaGrid, EmptyState, ErrorState, SkeletonGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruta-explore.html'
})
export class RutaExplore implements OnInit {
  readonly store = inject(RutasStore);

  ngOnInit(): void {
    this.cargar();
  }

  reintentar(): void {
    this.cargar();
  }

  private cargar(): void {
    this.store.cargar({ forzar: true }).catch(() => undefined);
  }
}
