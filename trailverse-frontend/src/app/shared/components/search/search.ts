import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

const RETARDO_MS = 300;

@Component({
  selector: 'app-search',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.html'
})
export class Search {
  readonly valor = input('');
  readonly placeholder = input('Buscar por nombre…');
  readonly buscar = output<string>();

  readonly texto = signal('');
  private ultimoEmitido = '';
  private readonly entrada = new Subject<string>();

  constructor() {
    effect(() => {
      const valor = this.valor();
      if (valor === this.ultimoEmitido) return;
      this.ultimoEmitido = valor;
      this.texto.set(valor);
    });

    this.entrada
      .pipe(debounceTime(RETARDO_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((termino) => {
        this.ultimoEmitido = termino;
        this.buscar.emit(termino);
      });
  }

  alEscribir(valor: string): void {
    this.texto.set(valor);
    this.entrada.next(valor.trim());
  }
}
