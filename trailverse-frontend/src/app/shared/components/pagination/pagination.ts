import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

const VENTANA = 5;

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html'
})
export class Pagination {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly cambiar = output<number>();

  readonly numeros = computed(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();
    const inicio = Math.max(1, Math.min(actual - Math.floor(VENTANA / 2), total - VENTANA + 1));
    const fin = Math.min(total, inicio + VENTANA - 1);

    return Array.from({ length: Math.max(0, fin - inicio + 1) }, (_, indice) => inicio + indice);
  });

  irA(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas() || pagina === this.pagina()) return;
    this.cambiar.emit(pagina);
  }
}
