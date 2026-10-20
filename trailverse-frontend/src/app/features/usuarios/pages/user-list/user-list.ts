import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UsersStore } from '../../../../core/stores/users.store';
import { User } from '../../../../core/models/user.model';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.html'
})
export class UserList implements OnInit {
  readonly store = inject(UsersStore);

  ngOnInit(): void {
    this.store.cargar().catch(() => undefined);
  }

  reintentar(): void {
    this.store.cargar({ forzar: true }).catch(() => undefined);
  }

  async cambiarEstado(user: User): Promise<void> {
    const activar = !user.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar el usuario?' : '¿Desactivar el usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.cambiarEstado(user, activar);
    } catch {}
  }

  async eliminar(user: User): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar este usuario?',
      text: `"${user.name}" se borrará de forma lógica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(user);
    } catch {}
  }
}
