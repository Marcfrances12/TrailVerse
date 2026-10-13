import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html'
})
export class EmptyState {
  readonly titulo = input('No hay resultados');
  readonly mensaje = input('Aún no hay rutas que mostrar por aquí.');
}