import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Estrellas de valoración (1..5).
 * - Solo lectura: [valor]="4.5"
 * - Editable: [(valor)]="valoracion" [editable]="true"
 */
@Component({
  selector: 'app-estrellas',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estrellas.html'
})
export class Estrellas {
  readonly valor = model<number>(0);
  readonly editable = input(false);
  readonly tamano = input<'sm' | 'md' | 'lg'>('sm');

  readonly posiciones = [1, 2, 3, 4, 5];

  readonly clasesTamano = computed(() => ({ sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-7 w-7' })[this.tamano()]);

  readonly etiqueta = computed(() => {
    const valor = this.valor();
    return valor ? `${String(valor).replace('.', ',')} de 5 estrellas` : 'Sin valorar';
  });

  /** Proporción rellena de cada estrella (0..1), para medias como 4,5. */
  relleno(posicion: number): number {
    return Math.max(0, Math.min(1, this.valor() - (posicion - 1)));
  }

  elegir(posicion: number): void {
    if (this.editable()) this.valor.set(posicion);
  }

  teclado(evento: KeyboardEvent): void {
    if (!this.editable()) return;
    const actual = this.valor() || 0;
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowUp') {
      this.valor.set(Math.min(5, actual + 1));
      evento.preventDefault();
    } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowDown') {
      this.valor.set(Math.max(1, actual - 1));
      evento.preventDefault();
    }
  }
}
