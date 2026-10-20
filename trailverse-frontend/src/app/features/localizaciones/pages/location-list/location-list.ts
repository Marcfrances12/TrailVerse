import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { LocationsStore } from '../../../../core/stores/locations.store';
import { Location } from '../../../../core/models/location.model';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-location-list',
  imports: [RouterLink, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-list.html'
})
export class LocationList implements OnInit {
  readonly store = inject(LocationsStore);

  ngOnInit(): void {
    this.store.cargar().catch(() => undefined);
  }

  reintentar(): void {
    this.store.cargar({ forzar: true }).catch(() => undefined);
  }

  async cambiarEstado(location: Location): Promise<void> {
    const activar = !location.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar la localización?' : '¿Desactivar la localización?',
      text: activar
        ? 'La localización volverá a estar activa y completamente visible.'
        : 'La localización dejará de estar activa y se mostrará en gris.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      await this.store.cambiarEstado(location, activar);
    } catch {
    }
  }

  async eliminar(location: Location): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta localización?',
      text: `"${location.nombre}" se borrará de forma lógica y desaparecerá del listado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      await this.store.eliminar(location);
    } catch {
    }
  }
}
