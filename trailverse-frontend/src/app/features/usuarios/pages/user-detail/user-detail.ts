import { Component, inject, signal, computed, type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { UsersStore } from '../../../../core/stores/users.store';
import { User } from '../../../../core/models/user.model';
import { UsersApiService } from '../../../../core/services/users-api.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-user-detail',
  imports: [RouterLink],
  templateUrl: './user-detail.html'
})
export class UserDetail {
  private readonly store = inject(UsersStore);
  private readonly api = inject(UsersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly recarga = signal(0);
  private readonly params = toSignal(this.route.paramMap);
  private readonly userId: Signal<string> = computed(() => this.params()?.get('id') ?? '');

  readonly user = toSignal(
    combineLatest([toObservable(this.userId), toObservable(this.recarga)]).pipe(
      switchMap(([id]) => (id ? this.api.porId(id) : of(null)))
    )
  );

  readonly formatFecha = formatFecha;

  async cambiarEstado(user: User): Promise<void> {
    const activar = !user.isActive;
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
      if (activar) await this.store.cambiarEstado(user, true);
      else await this.store.cambiarEstado(user, false);
      this.recarga.update((v) => v + 1);
    } catch { /* interceptor */ }
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
      this.router.navigate(['/admin/usuarios']);
    } catch { /* interceptor */ }
  }
}
