import { Component, inject, signal, computed, type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { HostsStore } from '../../../../core/stores/hosts.store';
import { Host } from '../../../../core/models/host.model';
import { HostsApiService } from '../../../../core/services/hosts-api.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-host-detail',
  imports: [RouterLink],
  templateUrl: './host-detail.html'
})
export class HostDetail {
  private readonly store = inject(HostsStore);
  private readonly api = inject(HostsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly recarga = signal(0);
  private readonly params = toSignal(this.route.paramMap);
  private readonly hostId: Signal<string> = computed(() => this.params()?.get('id') ?? '');

  readonly host = toSignal(
    combineLatest([toObservable(this.hostId), toObservable(this.recarga)]).pipe(
      switchMap(([id]) => (id ? this.api.porId(id) : of(null)))
    )
  );

  readonly formatFecha = formatFecha;

  async cambiarEstado(host: Host): Promise<void> {
    const activar = !host.isActive;
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
      if (activar) await this.store.cambiarEstado(host, true);
      else await this.store.cambiarEstado(host, false);
      this.recarga.update((v) => v + 1);
    } catch { /* interceptor */ }
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
      this.router.navigate(['/admin/hosts']);
    } catch { /* interceptor */ }
  }
}
