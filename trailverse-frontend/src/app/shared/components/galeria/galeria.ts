import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { ShopImagen } from '../../../core/models/shop.model';

const MAX_MOSAICO = 5;

/**
 * Galería de la ruta.
 * - Escritorio: mosaico (foto grande + hasta 4 pequeñas) que abre un visor a pantalla completa.
 * - Móvil: carrusel deslizable con contador.
 */
@Component({
  selector: 'app-galeria',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './galeria.html',
  host: { class: 'block' }
})
export class Galeria {
  private readonly documento = inject(DOCUMENT);

  readonly imagenes = input.required<ShopImagen[]>();

  /** Imagen visible en el carrusel móvil. */
  readonly indiceMovil = signal(0);
  /** Imagen abierta en el visor; null = cerrado. */
  readonly indiceVisor = signal<number | null>(null);

  readonly mosaico = computed(() => this.imagenes().slice(0, MAX_MOSAICO));
  readonly restantes = computed(() => Math.max(0, this.imagenes().length - MAX_MOSAICO));
  readonly imagenVisor = computed(() => {
    const indice = this.indiceVisor();
    return indice === null ? null : this.imagenes()[indice] ?? null;
  });

  private readonly pista = viewChild<ElementRef<HTMLElement>>('pista');
  private readonly cerrarBtn = viewChild<ElementRef<HTMLButtonElement>>('cerrarVisor');
  private elementoPrevio: HTMLElement | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.bloquearScroll(false));
  }

  /** Clases de cada celda del mosaico según cuántas fotos hay. */
  claseCelda(indice: number): string {
    const total = this.mosaico().length;
    if (indice === 0) {
      return total === 1 ? 'col-span-4 row-span-2' : 'col-span-2 row-span-2';
    }
    if (total === 2) return 'col-span-2 row-span-2';
    if (total === 3) return 'col-span-2 row-span-1';
    if (total === 4) return indice === 3 ? 'col-span-2 row-span-1' : 'col-span-1 row-span-1';
    return 'col-span-1 row-span-1';
  }

  // ---------- Visor ----------

  abrir(indice: number): void {
    this.elementoPrevio = this.documento.activeElement as HTMLElement | null;
    this.indiceVisor.set(indice);
    this.bloquearScroll(true);
    queueMicrotask(() => this.cerrarBtn()?.nativeElement.focus());
  }

  cerrar(): void {
    this.indiceVisor.set(null);
    this.bloquearScroll(false);
    this.elementoPrevio?.focus();
  }

  moverVisor(sentido: 1 | -1): void {
    const indice = this.indiceVisor();
    if (indice === null) return;
    const total = this.imagenes().length;
    this.indiceVisor.set((indice + sentido + total) % total);
  }

  @HostListener('document:keydown', ['$event'])
  teclado(evento: KeyboardEvent): void {
    if (this.indiceVisor() === null) return;
    if (evento.key === 'Escape') this.cerrar();
    else if (evento.key === 'ArrowRight') this.moverVisor(1);
    else if (evento.key === 'ArrowLeft') this.moverVisor(-1);
  }

  // ---------- Carrusel móvil ----------

  desplazarMovil(sentido: 1 | -1): void {
    const elemento = this.pista()?.nativeElement;
    if (!elemento) return;
    const destino = Math.min(Math.max(this.indiceMovil() + sentido, 0), this.imagenes().length - 1);
    elemento.scrollTo({ left: destino * elemento.clientWidth, behavior: 'smooth' });
    this.indiceMovil.set(destino);
  }

  alDesplazarMovil(): void {
    const elemento = this.pista()?.nativeElement;
    if (!elemento || elemento.clientWidth === 0) return;
    const indice = Math.round(elemento.scrollLeft / elemento.clientWidth);
    if (indice !== this.indiceMovil()) this.indiceMovil.set(indice);
  }

  private bloquearScroll(bloquear: boolean): void {
    this.documento.body.style.overflow = bloquear ? 'hidden' : '';
  }
}
