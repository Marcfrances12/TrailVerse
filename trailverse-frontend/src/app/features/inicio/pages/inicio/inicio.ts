import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { AdminResumen } from '../../../../core/models/admin-resumen.model';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { capitalizar } from '../../../../shared/utils/formatos';

type TonoChip = 'verde' | 'azul' | 'ambar' | 'gris';

interface ChipResumen {
  etiqueta: string;
  valor: number;
  tono: TonoChip;
}

interface TarjetaResumen {
  id: 'rutas' | 'localizaciones' | 'categorias' | 'hosts' | 'usuarios' | 'salidas';
  titulo: string;
  total: number;
  progreso: number | null;
  chips: ChipResumen[];
}

const CLASES_CHIP: Record<TonoChip, string> = {
  verde: 'bg-bosque-100 text-bosque-800',
  azul: 'bg-sky-100 text-sky-800',
  ambar: 'bg-amber-100 text-amber-800',
  gris: 'bg-crema-200 text-tinta-suave'
};

@Component({
  selector: 'app-inicio',
  imports: [ErrorState, SkeletonGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html'
})
export class Inicio implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly hoy = capitalizar(
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  );
  readonly resumen = signal<AdminResumen | null>(null);
  readonly error = signal<string | null>(null);

  readonly tarjetas = computed<TarjetaResumen[]>(() => {
    const r = this.resumen();
    if (!r) return [];

    const entidad = (
      id: TarjetaResumen['id'],
      titulo: string,
      datos: { total: number; activas: number; eliminadas: number }
    ): TarjetaResumen => ({
      id,
      titulo,
      total: datos.total,
      progreso: datos.total ? Math.round((datos.activas / datos.total) * 100) : 0,
      chips: [
        { etiqueta: 'activas', valor: datos.activas, tono: 'verde' },
        { etiqueta: 'en papelera', valor: datos.eliminadas, tono: 'gris' }
      ]
    });

    return [
      entidad('rutas', 'Rutas', r.rutas),
      entidad('localizaciones', 'Localizaciones', r.localizaciones),
      entidad('categorias', 'Categorías', r.categorias),
      entidad('hosts', 'Hosts', r.hosts),
      entidad('usuarios', 'Usuarios', r.usuarios),
      {
        id: 'salidas',
        titulo: 'Salidas',
        total: r.salidas.total,
        progreso: null,
        chips: [
          { etiqueta: 'próximas', valor: r.salidas.proximas, tono: 'azul' },
          { etiqueta: 'abiertas', valor: r.salidas.abiertas, tono: 'verde' },
          { etiqueta: 'llenas', valor: r.salidas.llenas, tono: 'ambar' }
        ]
      }
    ];
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set(null);

    this.api.resumen().subscribe({
      next: (respuesta) => this.resumen.set(respuesta.data),
      error: () => this.error.set('No se ha podido cargar el resumen.')
    });
  }

  clasesChip(tono: TonoChip): string {
    return CLASES_CHIP[tono];
  }
}
