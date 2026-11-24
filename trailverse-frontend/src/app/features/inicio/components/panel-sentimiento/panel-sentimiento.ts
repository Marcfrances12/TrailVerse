import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SentimientoResumen } from '../../../../core/models/comment.model';
import { CommentsApiService } from '../../../../core/services/comments-api.service';
import { Estrellas } from '../../../../shared/components/estrellas/estrellas';

type Orden = 'alerta' | 'negativo' | 'positivo' | 'total';

const MAX_RUTAS_VISIBLES = 8;

// Sentimiento de los clientes por ruta (producto), según el análisis con IA de cada comentario.
@Component({
  selector: 'app-panel-sentimiento',
  imports: [RouterLink, Estrellas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel-sentimiento.html'
})
export class PanelSentimiento implements OnInit {
  private readonly api = inject(CommentsApiService);

  readonly datos = signal<SentimientoResumen | null>(null);
  readonly error = signal<string | null>(null);
  readonly orden = signal<Orden>('alerta');
  readonly verTodas = signal(false);

  readonly rutasOrdenadas = computed(() => {
    const rutas = [...(this.datos()?.rutas ?? [])];
    switch (this.orden()) {
      case 'negativo':
        rutas.sort((a, b) => b.porcentajes.negativo - a.porcentajes.negativo || b.total - a.total);
        break;
      case 'positivo':
        rutas.sort((a, b) => b.porcentajes.positivo - a.porcentajes.positivo || b.total - a.total);
        break;
      case 'total':
        rutas.sort((a, b) => b.total - a.total);
        break;
      // 'alerta': el backend ya las devuelve con las rutas en alerta primero
    }
    return this.verTodas() ? rutas : rutas.slice(0, MAX_RUTAS_VISIBLES);
  });

  readonly hayMas = computed(() => (this.datos()?.rutas.length ?? 0) > MAX_RUTAS_VISIBLES);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set(null);
    this.api.sentimiento().subscribe({
      next: (respuesta) => this.datos.set(respuesta.data),
      error: () => this.error.set('No se ha podido cargar el sentimiento de los clientes.')
    });
  }

  cambiarOrden(evento: Event): void {
    this.orden.set((evento.target as HTMLSelectElement).value as Orden);
  }

  formatoMedia(media: number | null): string {
    return media === null ? '–' : media.toFixed(1).replace('.', ',');
  }
}
