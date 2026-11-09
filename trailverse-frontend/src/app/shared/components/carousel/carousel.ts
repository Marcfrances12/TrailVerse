import { ChangeDetectionStrategy, Component, ElementRef, computed, input, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';

/**
 * tarjetas: cada hijo ocupa un ancho fijo (listas de cards).
 * completo: cada hijo ocupa todo el ancho (galerías).
 */
export type CarouselVariante = 'tarjetas' | 'completo';

// Carrusel genérico: flechas y arrastre, sin barra de scroll visible.
@Component({
  selector: 'app-carousel',
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './carousel.html'
})
export class Carousel {
  readonly titulo = input.required<string>();
  readonly variante = input<CarouselVariante>('tarjetas');

  private readonly pista = viewChild.required<ElementRef<HTMLElement>>('pista');

  readonly clasesHijos = computed(() =>
    this.variante() === 'completo' ? '[&>*]:w-full' : '[&>*]:w-80'
  );

  desplazar(sentido: 1 | -1): void {
    const elemento = this.pista().nativeElement;
    elemento.scrollBy({ left: sentido * elemento.clientWidth * 0.8, behavior: 'smooth' });
  }
}
