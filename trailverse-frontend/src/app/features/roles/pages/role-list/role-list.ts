import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { RolesStore } from '../../../../core/stores/roles.store';
import { Role, PERMISOS } from '../../../../core/models/role.model';
import { AdminListShell } from '../../../../shared/components/admin-list-shell/admin-list-shell';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-role-list',
  imports: [RouterLink, AdminListShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-list.html'
})
export class RoleList implements OnInit {
  readonly store = inject(RolesStore);
  readonly modoPapelera = signal(false);
  readonly permisos = PERMISOS;
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

  etiquetaPermiso(permiso: string): string {
    return this.permisos.find((p) => p.valor === permiso)?.etiqueta ?? permiso;
  }

  async cambiarEstado(role: Role): Promise<void> {
    const activar = !role.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar el rol?' : '¿Desactivar el rol?',
      text: activar
        ? 'El rol volverá a estar activo y visible.'
        : 'El rol dejará de estar activo y se mostrará en gris.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.cambiarEstado(role, activar);
    } catch { /* interceptor */ }
  }

  async eliminar(role: Role): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar este rol?',
      text: `"${role.name}" se borrará de forma lógica y desaparecerá del listado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(role);
    } catch { /* interceptor */ }
  }

  async restaurar(role: Role): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Restaurar este rol?',
      text: `"${role.name}" volverá a estar activo en el listado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      confirmButtonColor: '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.restaurar(role);
    } catch { /* interceptor */ }
  }

  async borrarDefinitivo(role: Role): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: `"${role.name}" se borrará de forma permanente. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar para siempre',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.borrarDefinitivo(role);
    } catch { /* interceptor */ }
  }
}
