import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked
} from '@angular/core';
import { AgentGuiaService } from '../../../../core/services/agent-guia.service';
import { GuiaCategoria, GuiaGrupoLugares, GuiaRuta } from '../../../../core/models/guia.model';
import { MapaRuta, MarcadorMapa } from '../../../../shared/components/mapa-ruta/mapa-ruta';

const CATEGORIAS: GuiaCategoria[] = ['restaurant', 'lodging', 'transport', 'parking'];

function distanciaLegible(metros: number): string {
  return metros < 1000 ? `${metros} m` : `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

// Solo muestra lo que existe: si una parte no tiene datos, no aparece y no se muestra ningún aviso.
@Component({
  selector: 'app-guia-ruta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MapaRuta],
  templateUrl: './guia-ruta.html',
  host: { class: 'block' }
})
export class GuiaRutaComponent {
  readonly rutaId = input.required<string>();

  private readonly servicio = inject(AgentGuiaService);
  private controlador: AbortController | null = null;

  readonly guia = signal<GuiaRuta | null>(null);
  readonly categoriasActivas = signal<GuiaCategoria[]>([...CATEGORIAS]);

  readonly gruposConDatos = computed<GuiaGrupoLugares[]>(() =>
    (this.guia()?.lugares ?? []).filter((grupo) => grupo.resultados.length > 0)
  );

  readonly gruposVisibles = computed(() =>
    this.gruposConDatos().filter((grupo) => this.categoriasActivas().includes(grupo.categoria))
  );

  readonly marcadores = computed<MarcadorMapa[]>(() =>
    this.gruposVisibles().flatMap((grupo) =>
      grupo.resultados.map((lugar) => ({
        nombre: lugar.nombre,
        etiqueta: grupo.etiqueta,
        categoria: grupo.categoria,
        lat: lugar.lat,
        lng: lugar.lng,
        distanciaM: lugar.distanciaM
      }))
    )
  );

  readonly hayContenido = computed(() => {
    const datos = this.guia();
    if (!datos) return false;
    return datos.consejos.length > 0 || Boolean(datos.resumen) || this.gruposConDatos().length > 0;
  });

  readonly distancia = distanciaLegible;

  constructor() {
    effect(() => {
      const id = this.rutaId();
      untracked(() => void this.cargar(id));
    });

    inject(DestroyRef).onDestroy(() => this.controlador?.abort());
  }

  alternarCategoria(categoria: GuiaCategoria): void {
    this.categoriasActivas.update((activas) =>
      activas.includes(categoria) ? activas.filter((c) => c !== categoria) : [...activas, categoria]
    );
  }

  estaActiva(categoria: GuiaCategoria): boolean {
    return this.categoriasActivas().includes(categoria);
  }

  private async cargar(id: string): Promise<void> {
    this.controlador?.abort();
    const controlador = new AbortController();
    this.controlador = controlador;
    this.guia.set(null);

    try {
      const datos = await this.servicio.obtener(id, controlador.signal);
      if (!controlador.signal.aborted) this.guia.set(datos);
    } catch {
      // Si la guía no carga, la sección simplemente no se muestra.
    }
  }
}
