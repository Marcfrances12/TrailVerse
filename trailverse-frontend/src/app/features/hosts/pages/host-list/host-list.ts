import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { HostsStore } from '../../../../core/stores/hosts.store';
import { Host } from '../../../../core/models/host.model';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-host-list',
  imports: [RouterLink, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './host-list.html'
})
export class HostList implements OnInit {
  readonly store = inject(HostsStore);

  ngOnInit(): void {
    this.store.cargar().catch(() => undefined);
  }

  reintentar(): void {
    this.store.cargar({ forzar: true }).catch(() => undefined);
  }

  async cambiarEstado(host: Host): Promise<void> {
    const activar = !host.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar el host?' : '¿Desactivar el host?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.cambiarEstado(host, activar);
    } catch {}
  }

  async eliminar(host: Host): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar este host?',
      text: `"${host.name}" se borrará de forma lógica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(host);
    } catch {}
  }
}
