import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { ValoracionIA } from '../../../../core/models/comment.model';
import { AgentValoracionService } from '../../../../core/services/agent-valoracion.service';

// Resumen de las opiniones generado por el agente IA. Si el agente no responde, no se muestra.
@Component({
  selector: 'app-resumen-valoracion-ia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resumen-valoracion-ia.html'
})
export class ResumenValoracionIa {
  private readonly servicio = inject(AgentValoracionService);

  readonly rutaId = input.required<string>();
  /** El padre lo incrementa cuando cambian los comentarios. */
  readonly version = input(0);

  readonly datos = signal<ValoracionIA | null>(null);
  readonly cargando = signal(false);

  private controlador: AbortController | null = null;

  constructor() {
    effect(() => {
      const id = this.rutaId();
      this.version();
      untracked(() => void this.cargar(id));
    });
    inject(DestroyRef).onDestroy(() => this.controlador?.abort());
  }

  private async cargar(id: string): Promise<void> {
    this.controlador?.abort();
    const controlador = new AbortController();
    this.controlador = controlador;
    this.cargando.set(true);

    try {
      const datos = await this.servicio.obtener(id, controlador.signal);
      if (!controlador.signal.aborted) this.datos.set(datos);
    } catch {
      if (!controlador.signal.aborted) this.datos.set(null);
    } finally {
      if (!controlador.signal.aborted) this.cargando.set(false);
    }
  }
}
