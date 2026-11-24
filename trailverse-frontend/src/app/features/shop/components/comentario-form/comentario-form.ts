import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { ComentarioDatos } from '../../../../core/models/comment.model';
import { Estrellas } from '../../../../shared/components/estrellas/estrellas';

export const TEXTO_MIN = 3;
export const TEXTO_MAX = 1000;

// Formulario de comentario: se usa para publicar y para editar el propio comentario.
@Component({
  selector: 'app-comentario-form',
  imports: [Estrellas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comentario-form.html'
})
export class ComentarioForm {
  readonly inicial = input<ComentarioDatos | null>(null);
  readonly enviando = input(false);
  readonly textoBoton = input('Publicar');
  readonly cancelable = input(false);

  readonly enviar = output<ComentarioDatos>();
  readonly cancelar = output<void>();

  readonly valoracion = signal(0);
  readonly texto = signal('');
  readonly intentado = signal(false);

  readonly max = TEXTO_MAX;
  readonly longitud = computed(() => this.texto().trim().length);

  readonly errorValoracion = computed(() => (this.valoracion() < 1 ? 'Elige una valoración de 1 a 5 estrellas.' : null));
  readonly errorTexto = computed(() => {
    const largo = this.longitud();
    if (largo < TEXTO_MIN) return `Escribe al menos ${TEXTO_MIN} caracteres.`;
    if (largo > TEXTO_MAX) return `Máximo ${TEXTO_MAX} caracteres.`;
    return null;
  });

  constructor() {
    effect(() => {
      const datos = this.inicial();
      this.valoracion.set(datos?.valoracion ?? 0);
      this.texto.set(datos?.texto ?? '');
      this.intentado.set(false);
    });
  }

  alEscribir(evento: Event): void {
    this.texto.set((evento.target as HTMLTextAreaElement).value);
  }

  enviarFormulario(evento: Event): void {
    evento.preventDefault();
    this.intentado.set(true);
    if (this.enviando() || this.errorValoracion() || this.errorTexto()) return;
    this.enviar.emit({ texto: this.texto().trim(), valoracion: this.valoracion() });
  }

  /** Lo llama el padre tras publicar con éxito. */
  limpiar(): void {
    this.valoracion.set(0);
    this.texto.set('');
    this.intentado.set(false);
  }
}
