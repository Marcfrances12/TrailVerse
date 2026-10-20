import { Component, inject, signal, computed, type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { LocationsStore } from '../../../../core/stores/locations.store';
import { LocationsApiService } from '../../../../core/services/locations-api.service';
import { Location } from '../../../../core/models/location.model';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-location-detail',
  imports: [RouterLink],
  templateUrl: './location-detail.html'
})
export class LocationDetail {
  private readonly store = inject(LocationsStore);
  private readonly api = inject(LocationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly recarga = signal(0);
  private readonly params = toSignal(this.route.paramMap);
  private readonly locationId: Signal<string> = computed(() => this.params()?.get('id') ?? '');

  readonly location = toSignal(
    combineLatest([toObservable(this.locationId), toObservable(this.recarga)]).pipe(
      switchMap(([id]) => (id ? this.api.porId(id) : of(null)))
    )
  );

  readonly formatFecha = formatFecha;

  async cambiarEstado(loc: Location): Promise<void> {
    const activar = !loc.isActive;
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
      if (activar) await this.store.cambiarEstado(loc, true);
      else await this.store.cambiarEstado(loc, false);
      this.recarga.update((v) => v + 1);
    } catch { /* interceptor */ }
  }

  async eliminar(loc: Location): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta localización?',
      text: `"${loc.nombre}" se borrará de forma lógica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(loc);
      this.router.navigate(['/admin/localizaciones']);
    } catch { /* interceptor */ }
  }
}
