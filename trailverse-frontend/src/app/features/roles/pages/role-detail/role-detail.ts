import { Component, inject, signal, computed, type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { RolesStore } from '../../../../core/stores/roles.store';
import { Role, PERMISOS } from '../../../../core/models/role.model';
import { RolesApiService } from '../../../../core/services/roles-api.service';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-role-detail',
  imports: [RouterLink],
  templateUrl: './role-detail.html'
})
export class RoleDetail {
  private readonly store = inject(RolesStore);
  private readonly api = inject(RolesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly recarga = signal(0);
  private readonly params = toSignal(this.route.paramMap);
  private readonly roleId: Signal<string> = computed(() => this.params()?.get('id') ?? '');

  readonly role = toSignal(
    combineLatest([toObservable(this.roleId), toObservable(this.recarga)]).pipe(
      switchMap(([id]) => (id ? this.api.porId(id) : of(null)))
    )
  );

  readonly permisos = PERMISOS;
  readonly formatFecha = formatFecha;

  etiquetaPermiso(permiso: string): string {
    return this.permisos.find((p) => p.valor === permiso)?.etiqueta ?? permiso;
  }

  async cambiarEstado(role: Role): Promise<void> {
    const activar = !role.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar?' : '¿Desactivar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      if (activar) await this.store.cambiarEstado(role, true);
      else await this.store.cambiarEstado(role, false);
      this.recarga.update((v) => v + 1);
    } catch { /* interceptor */ }
  }

  async eliminar(role: Role): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar este rol?',
      text: `"${role.name}" se borrará de forma lógica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(role);
      this.router.navigate(['/admin/roles']);
    } catch { /* interceptor */ }
  }
}
