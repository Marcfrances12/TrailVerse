import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.html'
})
export class ErrorState {
  readonly mensaje = input('No se ha podido cargar la información.');
  readonly reintentar = output();

  intentarDeNuevo(): void {
    this.reintentar.emit();
  }
}