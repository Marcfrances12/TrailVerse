import { ChangeDetectionStrategy, Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { ShopImagen } from '../../../core/models/shop.model';

// Galería con imagen principal (flechas y arrastre) y miniaturas que la controlan.
@Component({
  selector: 'app-galeria',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './galeria.html'
})
export class Galeria {
  readonly imagenes = input.required<ShopImagen[]>();
  readonly indice = signal(0);

  private readonly pista = viewChild.required<ElementRef<HTMLElement>>('pista');

  irA(indice: number): void {
    const maximo = this.imagenes().length - 1;
    const destino = Math.min(Math.max(indice, 0), maximo);
    const elemento = this.pista().nativeElement;

    elemento.scrollTo({ left: destino * elemento.clientWidth, behavior: 'smooth' });
    this.indice.set(destino);
  }

  desplazar(sentido: 1 | -1): void {
    this.irA(this.indice() + sentido);
  }

  // Al arrastrar o usar las flechas del navegador, la miniatura activa sigue a la imagen visible.
  alDesplazar(): void {
    const elemento = this.pista().nativeElement;
    if (elemento.clientWidth === 0) return;

    const indice = Math.round(elemento.scrollLeft / elemento.clientWidth);
    if (indice !== this.indice()) this.indice.set(indice);
  }
}
