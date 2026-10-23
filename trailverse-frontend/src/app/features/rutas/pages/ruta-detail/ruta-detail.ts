import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { RutasStore } from '../../../../core/stores/rutas.store';
import { ETIQUETAS_DIFICULTAD, ETIQUETAS_ESTADO, Ruta } from '../../../../core/models/ruta.model';
import { capitalizar, formatDuracion, formatFecha, formatKm, formatMetros } from '../../../../shared/utils/formatos';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-ruta-detail',
  imports: [RouterLink, ErrorState],
  templateUrl: './ruta-detail.html'
})
export class RutaDetail {
  readonly store = inject(RutasStore);
  readonly ruta = this.store.seleccionada;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  private readonly slug = computed(() => this.params()?.get('slug') ?? '');

  readonly etiquetasDificultad = ETIQUETAS_DIFICULTAD;
  readonly etiquetasEstado = ETIQUETAS_ESTADO;
  readonly formatKm = formatKm;
  readonly formatMetros = formatMetros;
  readonly formatDuracion = formatDuracion;
  readonly formatFecha = formatFecha;
  readonly capitalizar = capitalizar;

  nombreUbicacion(ruta: Ruta): string {
    const loc = ruta.locationId;
    if (typeof loc === 'object' && loc !== null) {
      return `${loc.nombre} · ${loc.provincia}`;
    }
    return '';
  }

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (slug) {
        this.store.cargarPorSlug(slug).catch(() => undefined);
      }
    });
  }

  reintentar(): void {
    this.store.cargarPorSlug(this.slug(), { forzar: true }).catch(() => undefined);
  }

  async cambiarEstado(rutaActual: Ruta): Promise<void> {
    const activar = !rutaActual.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar la ruta?' : '¿Desactivar la ruta?',
      text: activar
        ? 'La ruta volverá a estar activa y completamente visible.'
        : 'La ruta dejará de estar activa y se mostrará en gris.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      await this.store.cambiarEstado(rutaActual, activar);
    } catch {
      // El interceptor ya informa del error al usuario.
    }
  }

  async eliminar(rutaActual: Ruta): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta ruta?',
      text: `"${rutaActual.nombre}" se borrará de forma lógica y desaparecerá del listado.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      await this.store.eliminar(rutaActual);
      this.router.navigate(['/rutas']);
    } catch {
      // El interceptor ya informa del error al usuario.
    }
  }
}
