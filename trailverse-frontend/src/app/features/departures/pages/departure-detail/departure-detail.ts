import { Component, inject, signal, computed, type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { DeparturesStore } from '../../../../core/stores/departures.store';
import { Departure, DepartureStatus, ESTATUSES } from '../../../../core/models/departure.model';
import { DeparturesApiService } from '../../../../core/services/departures-api.service';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-departure-detail',
  imports: [RouterLink],
  templateUrl: './departure-detail.html'
})
export class DepartureDetail {
  private readonly store = inject(DeparturesStore);
  private readonly api = inject(DeparturesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly recarga = signal(0);
  private readonly params = toSignal(this.route.paramMap);
  private readonly departureId: Signal<string> = computed(() => this.params()?.get('id') ?? '');

  readonly departure = toSignal(
    combineLatest([toObservable(this.departureId), toObservable(this.recarga)]).pipe(
      switchMap(([id]) => (id ? this.api.porId(id) : of(null)))
    )
  );

  readonly statuses = ESTATUSES;
  readonly formatFecha = formatFecha;

  nombreRuta(d: Departure): string {
    const r = d.rutaId;
    if (typeof r === 'object' && r !== null) return r.nombre;
    return '—';
  }

  etiquetaStatus(status: DepartureStatus): string {
    return this.statuses.find((s) => s.valor === status)?.etiqueta ?? status;
  }

  async cambiarEstado(d: Departure): Promise<void> {
    const activar = !d.isActive;
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
      if (activar) await this.store.cambiarEstado(d, true);
      else await this.store.cambiarEstado(d, false);
      this.recarga.update((v) => v + 1);
    } catch { /* interceptor */ }
  }

  async eliminar(d: Departure): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta salida?',
      text: `"${d.sku}" se borrará de forma lógica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(d);
      this.router.navigate(['/admin/departures']);
    } catch { /* interceptor */ }
  }
}
