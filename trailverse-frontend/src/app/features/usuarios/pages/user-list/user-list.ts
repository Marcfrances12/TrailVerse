import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UsersStore } from '../../../../core/stores/users.store';
import { User } from '../../../../core/models/user.model';
import { AdminListShell } from '../../../../shared/components/admin-list-shell/admin-list-shell';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink, AdminListShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.html'
})
export class UserList implements OnInit {
  readonly store = inject(UsersStore);
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

  async restaurar(user: User): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Restaurar este usuario?',
      text: `"${user.name}" volverá a estar activo en el listado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      confirmButtonColor: '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.restaurar(user);
    } catch { /* interceptor */ }
  }

  async borrarDefinitivo(user: User): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: `"${user.name}" se borrará de forma permanente. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar para siempre',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.borrarDefinitivo(user);
    } catch { /* interceptor */ }
  }
}
