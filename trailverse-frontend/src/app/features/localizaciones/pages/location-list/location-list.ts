import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { LocationsStore } from '../../../../core/stores/locations.store';
import { Location } from '../../../../core/models/location.model';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-location-list',
  imports: [RouterLink, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-list.html'
})
export class LocationList implements OnInit {
  readonly store = inject(LocationsStore);
  readonly modoPapelera = signal(false);
  readonly formatFecha = formatFecha;

  ngOnInit(): void {
    this.store.cargar().catch(() => undefined);
  }

  reintentar(): void {
    this.store.cargar({ forzar: true }).catch(() => undefined);
  }

  reintentarPapelera(): void {
    this.store.cargarEliminados().catch(() => undefined);
  }

  alternarPapelera(): void {
    const activar = !this.modoPapelera();
    this.modoPapelera.set(activar);
    if (activar) {
      this.store.cargarEliminados().catch(() => undefined);
    }
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

  async restaurar(location: Location): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Restaurar esta localización?',
      text: `"${location.nombre}" volverá a estar activa en el listado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      confirmButtonColor: '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.restaurar(location);
    } catch { /* interceptor */ }
  }

  async borrarDefinitivo(location: Location): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: `"${location.nombre}" se borrará de forma permanente. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar para siempre',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.borrarDefinitivo(location);
    } catch { /* interceptor */ }
  }
}
