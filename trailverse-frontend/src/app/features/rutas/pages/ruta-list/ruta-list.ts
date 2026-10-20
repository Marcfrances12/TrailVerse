import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { RutasStore } from '../../../../core/stores/rutas.store';
import { AdminTable } from '../../../../shared/components/admin-table/admin-table';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Ruta } from '../../../../core/models/ruta.model';

@Component({
  selector: 'app-ruta-list',
  imports: [RouterLink, AdminTable, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruta-list.html'
})
export class RutaList implements OnInit {
  readonly store = inject(RutasStore);

  ngOnInit(): void {
    this.store.cargar().catch(() => undefined);
  }

  reintentar(): void {
    this.store.cargar({ forzar: true }).catch(() => undefined);
  }

  async cambiarEstado(ruta: Ruta): Promise<void> {
    const activar = !ruta.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar la ruta?' : '¿Desactivar la ruta?',
      text: activar
        ? 'La ruta volverá a estar activa y completamente visible.'
        : 'La ruta dejará de estar activa y se mostrará en gris.',
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
      await this.store.cambiarEstado(ruta, activar);
    } catch {
    }
  }

  async eliminar(ruta: Ruta): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta ruta?',
      text: `"${ruta.nombre}" se borrará de forma lógica y desaparecerá del listado.`,
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
      await this.store.eliminar(ruta);
    } catch {
    }
  }
}
