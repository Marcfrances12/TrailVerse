import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { DeparturesStore } from '../../../../core/stores/departures.store';
import { Departure, DepartureStatus, ESTATUSES } from '../../../../core/models/departure.model';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-departure-list',
  imports: [RouterLink, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './departure-list.html'
})
export class DepartureList implements OnInit {
  readonly store = inject(DeparturesStore);
  readonly modoPapelera = signal(false);
  readonly statuses = ESTATUSES;
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

  nombreRuta(d: Departure): string {
    const r = d.rutaId;
    if (typeof r === 'object' && r !== null) return r.nombre;
    return '—';
  }

  etiquetaStatus(status: DepartureStatus): string {
    return this.statuses.find((s) => s.valor === status)?.etiqueta ?? status;
  }

  clasesStatus(status: DepartureStatus): string {
    switch (status) {
      case 'open':
        return 'bg-bosque-100 text-bosque-800';
      case 'full':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-red-100 text-red-700';
    }
  }

  async cambiarEstado(d: Departure): Promise<void> {
    const activar = !d.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar la salida?' : '¿Desactivar la salida?',
      text: activar
        ? 'La salida volverá a estar activa y visible.'
        : 'La salida dejará de estar activa y se mostrará en gris.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.cambiarEstado(d, activar);
    } catch { /* interceptor */ }
  }

  async eliminar(d: Departure): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta salida?',
      text: `"${d.sku}" se borrará de forma lógica y desaparecerá del listado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(d);
    } catch { /* interceptor */ }
  }

  async restaurar(d: Departure): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Restaurar esta salida?',
      text: `"${d.sku}" volverá a estar activa en el listado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      confirmButtonColor: '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.restaurar(d);
    } catch { /* interceptor */ }
  }

  async borrarDefinitivo(d: Departure): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: `"${d.sku}" se borrará de forma permanente. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar para siempre',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.borrarDefinitivo(d);
    } catch { /* interceptor */ }
  }
}
